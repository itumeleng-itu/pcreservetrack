-- Enable real-time functionality on all tables (fixed version)
-- Set REPLICA IDENTITY FULL for complete row data capture

ALTER TABLE public.computers REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.registered REPLICA IDENTITY FULL;
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.maintenance_logs REPLICA IDENTITY FULL;
ALTER TABLE public.faults REPLICA IDENTITY FULL;
ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER TABLE public.lab_queue REPLICA IDENTITY FULL;
ALTER TABLE public.user_badges REPLICA IDENTITY FULL;
ALTER TABLE public.usage_statistics REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication (skip if already exists)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.computers;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Table already in publication
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.registered;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.faults;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_queue;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_statistics;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

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