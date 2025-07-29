import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RealtimeActivity {
  id: string;
  user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_data?: any;
  new_data?: any;
  metadata?: any;
  created_at: string;
}

export interface UserPresence {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_page?: string;
  device_info?: any;
  updated_at: string;
}

export interface ComputerHeartbeat {
  id: string;
  computer_id: number;
  status: string;
  cpu_usage?: number;
  memory_usage?: number;
  network_latency?: number;
  active_user_id?: string;
  timestamp: string;
}

export const useRealtimeManager = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [userPresences, setUserPresences] = useState<UserPresence[]>([]);
  const [computerHeartbeats, setComputerHeartbeats] = useState<ComputerHeartbeat[]>([]);
  
  const channelsRef = useRef<any[]>([]);
  const lastHeartbeatRef = useRef<number>(Date.now());

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 Setting up real-time subscriptions for user:', currentUser.id);

    // Activity logs subscription
    const activityChannel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('📝 Activity log change:', payload);
          if (payload.eventType === 'INSERT') {
            setActivities(prev => [payload.new as RealtimeActivity, ...prev.slice(0, 99)]);
            
            // Show toast for important activities
            if (payload.new.action_type === 'fault_reported' || payload.new.action_type === 'computer_fixed') {
              toast({
                title: "Real-time Update",
                description: `${payload.new.action_type.replace('_', ' ')} - ${payload.new.entity_type} ${payload.new.entity_id}`,
              });
            }
          }
        }
      )
      .subscribe();

    // User presence subscription
    const presenceChannel = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          console.log('👥 User presence change:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setUserPresences(prev => {
              const filtered = prev.filter(p => p.user_id !== payload.new.user_id);
              return [...filtered, payload.new as UserPresence];
            });
          } else if (payload.eventType === 'DELETE') {
            setUserPresences(prev => prev.filter(p => p.user_id !== payload.old.user_id));
          }
        }
      )
      .subscribe();

    // Computer heartbeats subscription
    const heartbeatChannel = supabase
      .channel('computer-heartbeats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'computer_heartbeats'
        },
        (payload) => {
          console.log('💓 Computer heartbeat:', payload);
          setComputerHeartbeats(prev => {
            const filtered = prev.filter(h => h.computer_id !== payload.new.computer_id);
            return [...filtered, payload.new as ComputerHeartbeat].slice(0, 80); // Keep latest for each computer
          });
        }
      )
      .subscribe();

    // Computers table subscription
    const computersChannel = supabase
      .channel('computers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'computers'
        },
        (payload) => {
          console.log('💻 Computer change:', payload);
          // This will be handled by the useSupabaseComputers hook
        }
      )
      .subscribe();

    // Reservations subscription
    const reservationsChannel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log('📅 Reservation change:', payload);
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Reservation",
              description: `Computer reserved in real-time`,
            });
          }
        }
      )
      .subscribe();

    // Real-time messages subscription
    const messagesChannel = supabase
      .channel('realtime-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'real_time_messages'
        },
        (payload) => {
          console.log('💬 New message:', payload);
          if (payload.new.recipient_id === currentUser.id) {
            toast({
              title: payload.new.title || "New Message",
              description: payload.new.content,
              variant: payload.new.message_type === 'alert' ? 'destructive' : 'default',
            });
          }
        }
      )
      .subscribe();

    channelsRef.current = [
      activityChannel,
      presenceChannel,
      heartbeatChannel,
      computersChannel,
      reservationsChannel,
      messagesChannel
    ];

    // Monitor connection status
    const connectionInterval = setInterval(() => {
      const allConnected = channelsRef.current.every(channel => 
        channel.state === 'joined' || channel.state === 'joining'
      );
      setIsConnected(allConnected);
    }, 2000);

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions');
      clearInterval(connectionInterval);
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [currentUser?.id, toast]);

  // Update user presence
  const updatePresence = async (status: 'online' | 'away' | 'offline', currentPage?: string) => {
    if (!currentUser) return;

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      await supabase
        .from('user_presence')
        .upsert({
          user_id: currentUser.id,
          status,
          current_page: currentPage,
          device_info: deviceInfo,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Send computer heartbeat
  const sendComputerHeartbeat = async (computerId: number, status: string, metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkLatency?: number;
  }) => {
    try {
      await supabase
        .from('computer_heartbeats')
        .insert({
          computer_id: computerId,
          status,
          cpu_usage: metrics?.cpuUsage,
          memory_usage: metrics?.memoryUsage,
          network_latency: metrics?.networkLatency,
          active_user_id: currentUser?.id,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error sending computer heartbeat:', error);
    }
  };

  // Send real-time message
  const sendMessage = async (
    recipientId: string,
    messageType: 'notification' | 'alert' | 'system' | 'chat',
    content: string,
    title?: string,
    data?: any
  ) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('real_time_messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: recipientId,
          message_type: messageType,
          title,
          content,
          data
        });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Set up automatic presence updates
  useEffect(() => {
    if (!currentUser) return;

    // Update presence immediately
    updatePresence('online', window.location.pathname);

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      updatePresence('online', window.location.pathname);
    }, 30000);

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away', window.location.pathname);
      } else {
        updatePresence('online', window.location.pathname);
      }
    };

    // Update presence on page unload
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, [currentUser?.id]);

  return {
    isConnected,
    activities,
    userPresences,
    computerHeartbeats,
    updatePresence,
    sendComputerHeartbeat,
    sendMessage,
  };
};