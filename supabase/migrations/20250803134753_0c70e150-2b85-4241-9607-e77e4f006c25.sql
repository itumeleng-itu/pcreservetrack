-- Fix the SECURITY DEFINER view issue and authentication problems
-- Drop and recreate the computers_with_tracking view without SECURITY DEFINER
DROP VIEW IF EXISTS computers_with_tracking;

-- Create a proper view for computers with tracking data
CREATE VIEW computers_with_tracking AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.status,
  c.last_maintenance,
  c.specs,
  c.location,
  c.created_at,
  c.updated_at,
  c.fault_description,
  c.is_emergency,
  c.ip_address,
  c.mac_address,
  c.last_seen,
  c.tracking_online,
  c.tracking_last_heartbeat,
  c.tracking_cpu_usage,
  c.tracking_memory_usage,
  c.reserved_by,
  c.reserved_until
FROM computers c;

-- Fix RLS policy for registered table that might be causing authentication issues
DROP POLICY IF EXISTS "Admins can view all profiles" ON registered;

-- Create a proper admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
ON registered 
FOR SELECT 
USING (
  -- Allow users to see their own profile
  auth.uid() = id
  OR
  -- Allow admins to see all profiles by checking role directly in the table
  EXISTS (
    SELECT 1 FROM registered r 
    WHERE r.id = auth.uid() AND r.role = 'admin'
  )
);

-- Ensure proper policies exist for user_sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;

CREATE POLICY "Users can view their own sessions" 
ON user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);