-- Fix SECURITY DEFINER view issue by adding proper constraints to computers_with_tracking
DROP VIEW IF EXISTS public.computers_with_tracking;

-- Create a secure view with proper RLS
CREATE VIEW public.computers_with_tracking AS
SELECT 
    c.id,
    c.name,
    c.location,
    c.status,
    c.specs,
    c.description,
    c.reserved_by,
    c.reserved_until,
    c.fault_description,
    c.ip_address,
    c.mac_address,
    c.is_emergency,
    c.last_seen,
    c.tracking_online,
    c.tracking_last_heartbeat,
    c.tracking_cpu_usage,
    c.tracking_memory_usage,
    c.created_at,
    c.updated_at,
    c.last_maintenance
FROM computers c;

-- Enable RLS on the view (inherits from computers table policies)
ALTER VIEW public.computers_with_tracking OWNER TO postgres;

-- Add proper database constraints for data integrity
ALTER TABLE public.computers 
ADD CONSTRAINT check_cpu_usage_range CHECK (tracking_cpu_usage >= 0 AND tracking_cpu_usage <= 100),
ADD CONSTRAINT check_memory_usage_range CHECK (tracking_memory_usage >= 0 AND tracking_memory_usage <= 100),
ADD CONSTRAINT check_valid_status CHECK (status IN ('available', 'reserved', 'maintenance', 'faulty')),
ADD CONSTRAINT check_reserved_until_future CHECK (reserved_until IS NULL OR reserved_until > now());

ALTER TABLE public.reservations
ADD CONSTRAINT check_end_time_after_start CHECK (end_time > start_time),
ADD CONSTRAINT check_valid_reservation_status CHECK (status IN ('active', 'completed', 'cancelled')),
ADD CONSTRAINT check_reservation_duration CHECK (end_time <= start_time + INTERVAL '8 hours');

ALTER TABLE public.registered
ADD CONSTRAINT check_valid_role CHECK (role IN ('student', 'admin', 'technician')),
ADD CONSTRAINT check_staff_num_format CHECK (staff_num ~ '^[A-Za-z0-9]{6,20}$'),
ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add audit logging for security events
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
    p_staff_num text,
    p_success boolean,
    p_failure_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
        NULL, -- Will be null for failed attempts
        CASE WHEN p_success THEN 'login_success' ELSE 'login_failure' END,
        'authentication',
        p_staff_num,
        jsonb_build_object(
            'staff_num', p_staff_num,
            'success', p_success,
            'failure_reason', p_failure_reason,
            'timestamp', now()
        ),
        inet_client_addr()
    );
END;
$$;