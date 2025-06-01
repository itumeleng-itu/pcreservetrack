
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useRealtimeUpdates = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Update user's last active timestamp
  const updateLastActive = useCallback(async () => {
    if (currentUser) {
      try {
        await supabase
          .from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', currentUser.id);
      } catch (error) {
        console.error('Error updating last active:', error);
      }
    }
  }, [currentUser]);

  // Set up real-time listeners
  useEffect(() => {
    if (!currentUser) return;

    // Update last active on mount
    updateLastActive();

    // Update last active every 30 seconds
    const activeInterval = setInterval(updateLastActive, 30000);

    // Listen to computer status changes
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
          console.log('Computer status changed:', payload);
          // The useSupabaseComputers hook will handle the state updates
        }
      )
      .subscribe();

    // Listen to reservation changes
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
          console.log('Reservation changed:', payload);
          
          // Show notifications for relevant reservation changes
          if (payload.eventType === 'INSERT' && payload.new?.user_id !== currentUser.id) {
            // Another user made a reservation
            toast({
              title: "New Reservation",
              description: "A computer has been reserved by another user",
            });
          }
        }
      )
      .subscribe();

    // Listen to user sessions for detecting conflicts
    const sessionsChannel = supabase
      .channel('user-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && 
              payload.new?.email === currentUser.email && 
              payload.new?.device_id !== localStorage.getItem('device_id')) {
            // Same user logged in from another device
            toast({
              title: "Multiple Login Detected",
              description: "You have logged in from another device",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      clearInterval(activeInterval);
      supabase.removeChannel(computersChannel);
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [currentUser, updateLastActive, toast]);

  // Handle visibility change to update activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        updateLastActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, updateLastActive]);

  return {
    updateLastActive
  };
};
