import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/context/RealtimeContext';
import { useAppLogging } from './useAppLogging';
import { supabase } from '@/integrations/supabase/client';

export const useDataSync = () => {
  const { currentUser } = useAuth();
  const { updatePresence } = useRealtime();
  const { updateUsageStatistics } = useAppLogging();

  // Sync user sessions and presence
  useEffect(() => {
    if (!currentUser) return;

    const updateSessionActivity = async () => {
      try {
        // Update user session activity
        await supabase.from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', currentUser.id);

        // Update presence
        await updatePresence('online', window.location.pathname);
      } catch (error) {
        console.error('Error updating session activity:', error);
      }
    };

    // Update immediately
    updateSessionActivity();

    // Update every 30 seconds
    const sessionInterval = setInterval(updateSessionActivity, 30000);

    // Update on page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away', window.location.pathname);
      } else {
        updatePresence('online', window.location.pathname);
        updateSessionActivity();
      }
    };

    // Update on page unload
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(sessionInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, [currentUser?.id, updatePresence]);

  // Update usage statistics daily
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const updateStats = () => {
      updateUsageStatistics();
    };

    // Update stats every hour for admins
    const statsInterval = setInterval(updateStats, 60 * 60 * 1000);

    return () => clearInterval(statsInterval);
  }, [currentUser?.role, updateUsageStatistics]);

  // Sync faults with computers
  useEffect(() => {
    if (!currentUser) return;

    const syncFaultsWithComputers = async () => {
      try {
        // Get all active faults
        const { data: faults } = await supabase
          .from('faults')
          .select('computer_id, status')
          .in('status', ['reported', 'fixed']);

        if (faults) {
          // Update computer statuses based on faults
          for (const fault of faults) {
            const status = fault.status === 'reported' ? 'faulty' : 'pending_approval';
            await supabase
              .from('computers')
              .update({ status })
              .eq('id', fault.computer_id);
          }
        }
      } catch (error) {
        console.error('Error syncing faults with computers:', error);
      }
    };

    // Sync on mount and every 5 minutes
    syncFaultsWithComputers();
    const syncInterval = setInterval(syncFaultsWithComputers, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [currentUser?.id]);
};