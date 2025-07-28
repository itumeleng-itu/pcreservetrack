-- Fix remaining critical security issues

-- 1. Enable RLS on remaining tables
ALTER TABLE public.lab_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Fix all database functions to have proper search_path
CREATE OR REPLACE FUNCTION public.generate_reservation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code text := '';
    i integer;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_computer_status_on_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE computers 
        SET status = 'reserved'
        WHERE id = NEW.computer_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
        IF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
            UPDATE computers 
            SET status = 'available'
            WHERE id = NEW.computer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_queue_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE queues
  SET position = subquery.position
  FROM (
    SELECT id, row_number() OVER (PARTITION BY lab_id ORDER BY joined_at) as position
    FROM queues
  ) as subquery
  WHERE queues.id = subquery.id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_computer_status_on_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    UPDATE computers
    SET status = 'maintenance',
        updated_at = now()
    WHERE id = NEW.computer_id;
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE computers
    SET status = 'available',
        last_maintenance = NEW.completed_at,
        updated_at = now()
    WHERE id = NEW.computer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_user(email text, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM registered WHERE email = register_user.email) THEN
    UPDATE registered
    SET is_deleted = false
    WHERE email = register_user.email;
  ELSE
    INSERT INTO registered (user_id, email, is_deleted)
    VALUES (register_user.user_id, register_user.email, false);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_computer(p_computer_id bigint, p_user_id uuid, p_reserved_until timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE computers
  SET 
    status = 'reserved', 
    reserved_by = p_user_id, 
    reserved_until = p_reserved_until
  WHERE 
    id = p_computer_id 
    AND status = 'available';
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_computer(p_computer_id integer, p_user_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSON;
  v_conflict BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM reservations 
    WHERE computer_id = p_computer_id
    AND status = 'active'
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    FOR UPDATE SKIP LOCKED
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN json_build_object('error', 'COMPUTER_ALREADY_RESERVED');
  END IF;

  INSERT INTO reservations (
    computer_id, 
    user_id, 
    start_time, 
    end_time, 
    status
  ) VALUES (
    p_computer_id,
    p_user_id,
    p_start_time,
    p_end_time,
    'active'
  );

  UPDATE computers 
  SET status = 'reserved',
      reserved_by = p_user_id,
      reserved_until = p_end_time
  WHERE id = p_computer_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;