-- Fix infinite recursion in RLS policies by dropping the problematic view
-- and fixing the policies that reference it

-- Drop the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS computers_with_tracking;

-- Recreate as a regular view without SECURITY DEFINER
CREATE VIEW computers_with_tracking AS
SELECT 
  c.*
FROM computers c;

-- Fix the policies on the registered table to avoid infinite recursion
-- Drop the problematic policy that might be causing recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON registered;

-- Create a simpler policy without recursive calls
CREATE POLICY "Admins can view all profiles" 
ON registered 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users u 
    WHERE u.id = auth.uid() 
    AND u.raw_user_meta_data->>'role' = 'admin'
  )
  OR auth.uid() = id
);

-- Ensure the get_current_user_role function is safe
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM registered WHERE id = auth.uid() LIMIT 1),
    'anonymous'::text
  );
$$;