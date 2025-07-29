-- Enable real-time functionality on all tables
-- Set REPLICA IDENTITY FULL for complete row data capture

ALTER TABLE public.computers REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.registered REPLICA IDENTITY FULL;
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.maintenance_logs REPLICA IDENTITY FULL;
ALTER TABLE public.system_logs REPLICA IDENTITY FULL;
ALTER TABLE public.faults REPLICA IDENTITY FULL;
ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER TABLE public.lab_queue REPLICA IDENTITY FULL;
ALTER TABLE public.user_badges REPLICA IDENTITY FULL;
ALTER TABLE public.usage_statistics REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add all tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.computers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registered;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.faults;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_statistics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Create comprehensive real-time activity logs table
CREATE TABLE public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity logs
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Enable real-time on activity logs
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Create user presence tracking table
CREATE TABLE public.user_presence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
    status text NOT NULL CHECK (status IN ('online', 'away', 'offline')),
    last_seen timestamp with time zone DEFAULT now(),
    current_page text,
    device_info jsonb DEFAULT '{}',
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user presence
CREATE POLICY "Users can view all presence data" 
ON public.user_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR ALL 
USING (auth.uid() = user_id);

-- Enable real-time on user presence
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create real-time computer tracking table
CREATE TABLE public.computer_heartbeats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    computer_id bigint REFERENCES public.computers(id) NOT NULL,
    status text NOT NULL,
    cpu_usage integer,
    memory_usage integer,
    network_latency integer,
    active_user_id uuid REFERENCES auth.users(id),
    timestamp timestamp with time zone DEFAULT now()
);

-- Enable RLS and real-time on computer heartbeats
ALTER TABLE public.computer_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view computer heartbeats" 
ON public.computer_heartbeats 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert heartbeats" 
ON public.computer_heartbeats 
FOR INSERT 
WITH CHECK (true);

ALTER TABLE public.computer_heartbeats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.computer_heartbeats;

-- Create real-time chat/messaging table for notifications
CREATE TABLE public.real_time_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES auth.users(id),
    recipient_id uuid REFERENCES auth.users(id),
    message_type text NOT NULL CHECK (message_type IN ('notification', 'alert', 'system', 'chat')),
    title text,
    content text NOT NULL,
    data jsonb DEFAULT '{}',
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and real-time on messages
ALTER TABLE public.real_time_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" 
ON public.real_time_messages 
FOR SELECT 
USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Users can send messages" 
ON public.real_time_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark their messages as read" 
ON public.real_time_messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

ALTER TABLE public.real_time_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.real_time_messages;

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_action ON public.activity_logs(user_id, action_type, created_at);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_user_presence_status ON public.user_presence(status, last_seen);
CREATE INDEX idx_computer_heartbeats_computer_time ON public.computer_heartbeats(computer_id, timestamp);
CREATE INDEX idx_real_time_messages_recipient ON public.real_time_messages(recipient_id, created_at);
CREATE INDEX idx_real_time_messages_unread ON public.real_time_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Create function to automatically log activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action_type text,
    p_entity_type text, 
    p_entity_id text,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO public.activity_logs (
        user_id,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_old_data,
        p_new_data,
        p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Create triggers for automatic activity logging
CREATE OR REPLACE FUNCTION public.trigger_log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_activity(
            'CREATE',
            TG_TABLE_NAME,
            NEW.id::text,
            NULL,
            to_jsonb(NEW),
            jsonb_build_object('operation', 'INSERT')
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_activity(
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id::text,
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object('operation', 'UPDATE')
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_activity(
            'DELETE',
            TG_TABLE_NAME,
            OLD.id::text,
            to_jsonb(OLD),
            NULL,
            jsonb_build_object('operation', 'DELETE')
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Add activity logging triggers to key tables
CREATE TRIGGER computers_activity_log AFTER INSERT OR UPDATE OR DELETE ON public.computers
    FOR EACH ROW EXECUTE FUNCTION public.trigger_log_activity();

CREATE TRIGGER reservations_activity_log AFTER INSERT OR UPDATE OR DELETE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_log_activity();

CREATE TRIGGER faults_activity_log AFTER INSERT OR UPDATE OR DELETE ON public.faults
    FOR EACH ROW EXECUTE FUNCTION public.trigger_log_activity();