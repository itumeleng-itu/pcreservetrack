-- CRITICAL SECURITY FIXES - PHASE 1: DATABASE SECURITY

-- 1. Enable RLS on all tables that don't have it enabled
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faults ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT role FROM public.registered WHERE id = auth.uid();
$$;

-- 3. Create comprehensive RLS policies for all tables

-- QUEUES table policies
CREATE POLICY "Users can manage their own queue entries" 
ON public.queues 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all queue entries" 
ON public.queues 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- FAULTS table policies  
CREATE POLICY "Users can view all faults" 
ON public.faults 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can report faults" 
ON public.faults 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and technicians can update faults" 
ON public.faults 
FOR UPDATE 
USING (public.get_current_user_role() IN ('admin', 'technician'));

-- COMPUTERS table - enhance existing policies
DROP POLICY IF EXISTS "Computers can only be reserved when available" ON public.computers;

CREATE POLICY "Students can reserve available computers" 
ON public.computers 
FOR UPDATE 
USING (status = 'available' AND public.get_current_user_role() = 'student');

CREATE POLICY "Admins and technicians can update any computer" 
ON public.computers 
FOR UPDATE 
USING (public.get_current_user_role() IN ('admin', 'technician'));

-- RESERVATIONS table - enhance existing policies
CREATE POLICY "Technicians can view all reservations" 
ON public.reservations 
FOR SELECT 
USING (public.get_current_user_role() = 'technician');

-- USER_SESSIONS table policies
CREATE POLICY "Users can only manage their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- PROFILES table - fix missing SELECT policy
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- REGISTERED table - enhance policies for better security
CREATE POLICY "Users can update their own profile data" 
ON public.registered 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.registered WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own profile during registration" 
ON public.registered 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Fix database functions security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_name text;
  new_role text;
  new_staff_num text;
BEGIN
  new_name := new.raw_user_meta_data->>'name';
  new_role := new.raw_user_meta_data->>'role';
  new_staff_num := new.raw_user_meta_data->>'staff_num';
  
  -- Validate role is one of the allowed values
  IF new_role NOT IN ('student', 'admin', 'technician') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  INSERT INTO public.registered (id, name, email, role, staff_num)
  VALUES (new.id, new_name, new.email, new_role, new_staff_num);
  
  RETURN new;
END;
$$;

-- 5. Add constraints for data integrity
ALTER TABLE public.registered 
ADD CONSTRAINT valid_role_check 
CHECK (role IN ('student', 'admin', 'technician'));

ALTER TABLE public.computers 
ADD CONSTRAINT valid_status_check 
CHECK (status IN ('available', 'reserved', 'faulty', 'maintenance', 'pending_approval'));

ALTER TABLE public.reservations 
ADD CONSTRAINT valid_reservation_status_check 
CHECK (status IN ('active', 'completed', 'cancelled'));

-- 6. Add NOT NULL constraints for security-critical fields
ALTER TABLE public.registered 
ALTER COLUMN role SET NOT NULL;

-- 7. Add indexes for performance on security queries
CREATE INDEX IF NOT EXISTS idx_registered_role ON public.registered(role);
CREATE INDEX IF NOT EXISTS idx_computers_status ON public.computers(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON public.reservations(user_id, status);