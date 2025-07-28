-- Migrate computers from mock data to database
-- Insert 80 computers (40 in iCentre1, 40 in iCentre2)

-- Clear existing computers first (if any)
TRUNCATE TABLE public.computers RESTART IDENTITY CASCADE;

-- Generate computers data
DO $$
DECLARE
    i INTEGER;
    computer_number TEXT;
    location_name TEXT;
BEGIN
    -- Insert 80 computers
    FOR i IN 1..80 LOOP
        -- Format computer number with leading zeros
        computer_number := LPAD(i::TEXT, 3, '0');
        
        -- Assign location (first 40 to iCentre1, next 40 to iCentre2)
        IF i <= 40 THEN
            location_name := 'iCentre1';
        ELSE
            location_name := 'iCentre2';
        END IF;
        
        INSERT INTO public.computers (
            id,
            name,
            location,
            status,
            specs,
            description,
            tracking_online,
            tracking_last_heartbeat,
            tracking_cpu_usage,
            tracking_memory_usage,
            last_seen,
            created_at,
            updated_at
        ) VALUES (
            i,
            'PC-' || computer_number,
            location_name,
            'available',
            'Intel i5, 16GB RAM, 512GB SSD',
            'Standard lab computer',
            true,
            NOW(),
            FLOOR(RANDOM() * 20)::INTEGER,
            FLOOR(RANDOM() * 30)::INTEGER,
            NOW(),
            NOW(),
            NOW()
        );
    END LOOP;
    
    -- Add some variety to computer specs for realism
    UPDATE public.computers 
    SET specs = 'Intel i7, 32GB RAM, 1TB SSD'
    WHERE id % 10 = 0; -- Every 10th computer gets better specs
    
    UPDATE public.computers 
    SET specs = 'Intel i3, 8GB RAM, 256GB SSD'
    WHERE id % 15 = 0; -- Every 15th computer gets lower specs
    
    -- Set some computers to different statuses for testing
    UPDATE public.computers 
    SET status = 'maintenance', 
        fault_description = 'Scheduled maintenance'
    WHERE id IN (5, 25, 45, 65);
    
    UPDATE public.computers 
    SET status = 'faulty', 
        fault_description = 'Monitor flickering issue',
        is_emergency = false
    WHERE id IN (10, 30);
    
    -- Set some computers as reserved for testing
    UPDATE public.computers 
    SET status = 'reserved',
        reserved_by = (SELECT id::TEXT FROM public.registered WHERE role = 'student' LIMIT 1),
        reserved_until = NOW() + INTERVAL '2 hours'
    WHERE id IN (15, 35, 55);
    
END $$;

-- Add some IP and MAC addresses for realism
UPDATE public.computers 
SET 
    ip_address = '192.168.1.' || (id + 100)::TEXT,
    mac_address = '00:1A:2B:' || LPAD((id)::TEXT, 2, '0') || ':' || LPAD((id*2)::TEXT, 2, '0') || ':' || LPAD((id*3 % 256)::TEXT, 2, '0');

-- Create a view for easy computer queries with all tracking info
CREATE OR REPLACE VIEW public.computers_with_tracking AS
SELECT 
    id,
    name,
    location,
    status,
    specs,
    description,
    reserved_by,
    reserved_until,
    fault_description,
    is_emergency,
    last_seen,
    ip_address,
    mac_address,
    tracking_online,
    tracking_last_heartbeat,
    tracking_cpu_usage,
    tracking_memory_usage,
    created_at,
    updated_at,
    last_maintenance
FROM public.computers
ORDER BY location, name;