-- CRITICAL SECURITY FIXES - Phase 1: RLS and Policy Updates (Corrected)

-- 1. Enable RLS on all tables that don't have it enabled
ALTER TABLE public.registered ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Fix the critical role escalation vulnerability in registered table
-- Drop the existing policy that allows users to change their own role
DROP POLICY IF EXISTS "Users can update their own profile data" ON public.registered;

-- Create new secure policy that prevents role changes
CREATE POLICY "Users can update their own profile data (no role changes)" 
ON public.registered 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM registered WHERE id = auth.uid())
);

-- 3. Add missing critical RLS policies for tables without proper coverage

-- Secure user_sessions table
CREATE POLICY "Users can only access their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Secure maintenance_logs table (only technicians/admins can modify)
CREATE POLICY "Only technicians and admins can manage maintenance logs"
ON public.maintenance_logs
FOR ALL
USING (get_current_user_role() IN ('admin', 'technician'))
WITH CHECK (get_current_user_role() IN ('admin', 'technician'));

-- Secure profiles table
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Add database constraints for data integrity and security
ALTER TABLE public.registered 
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('student', 'admin', 'technician'));

ALTER TABLE public.reservations 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('active', 'completed', 'cancelled'));

ALTER TABLE public.computers 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('available', 'reserved', 'maintenance', 'faulty'));

-- 5. Create secure function for role checking to prevent SQL injection
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM registered WHERE id = user_uuid AND is_deleted = false;
$$;

-- 6. Fix the incomplete email and add input validation constraints
-- First fix the invalid email
UPDATE public.registered 
SET email = 'mashaisharonmotsatsi@gmail.com' 
WHERE email = 'mashaisharonmotsatsi@gmail';

-- Now add the email format constraint
ALTER TABLE public.registered 
ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add staff number format constraint
ALTER TABLE public.registered 
ADD CONSTRAINT check_staff_num_format 
CHECK (staff_num ~ '^[A-Za-z0-9]{6,20}$');

-- 7. Create audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    metadata,
    ip_address
  ) VALUES (
    p_user_id,
    p_event_type,
    'security',
    p_user_id::text,
    p_details,
    inet_client_addr()
  );
END;
$$;

-- 8. Create function to validate reservation times securely
CREATE OR REPLACE FUNCTION public.validate_reservation_time(
  p_computer_id bigint,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Check for time conflicts
  SELECT COUNT(*) INTO conflict_count
  FROM reservations
  WHERE computer_id = p_computer_id
    AND status = 'active'
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
  
  RETURN conflict_count = 0;
END;
$$;

-- 9. Update reserve_computer function with better security
CREATE OR REPLACE FUNCTION public.reserve_computer_secure(
  p_computer_id bigint,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_result json;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'UNAUTHORIZED');
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role FROM registered WHERE id = v_user_id;
  IF v_user_role IS NULL THEN
    RETURN json_build_object('error', 'USER_NOT_REGISTERED');
  END IF;
  
  -- Validate reservation time
  IF NOT validate_reservation_time(p_computer_id, p_start_time, p_end_time, v_user_id) THEN
    RETURN json_build_object('error', 'TIME_CONFLICT');
  END IF;
  
  -- Create reservation
  INSERT INTO reservations (
    computer_id,
    user_id,
    start_time,
    end_time,
    status
  ) VALUES (
    p_computer_id,
    v_user_id,
    p_start_time,
    p_end_time,
    'active'
  );
  
  -- Update computer status
  UPDATE computers 
  SET status = 'reserved',
      reserved_by = v_user_id::text,
      reserved_until = p_end_time
  WHERE id = p_computer_id;
  
  -- Log the security event
  PERFORM log_security_event(
    v_user_id,
    'computer_reserved',
    json_build_object('computer_id', p_computer_id, 'start_time', p_start_time, 'end_time', p_end_time)::jsonb
  );
  
  RETURN json_build_object('success', true);
  
EXCEPTION WHEN OTHERS THEN
  -- Log security event for failed attempts
  PERFORM log_security_event(
    v_user_id,
    'reservation_failed',
    json_build_object('computer_id', p_computer_id, 'error', SQLERRM)::jsonb
  );
  RETURN json_build_object('error', 'RESERVATION_FAILED');
END;
$$;