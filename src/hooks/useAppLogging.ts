import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface LogEntry {
  user_id?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_data?: any;
  new_data?: any;
  metadata?: any;
}

export const useAppLogging = () => {
  const { currentUser } = useAuth();

  const logActivity = async (entry: LogEntry) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: entry.user_id || currentUser?.id,
        action_type: entry.action_type,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        old_data: entry.old_data,
        new_data: entry.new_data,
        metadata: entry.metadata || {}
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const logSystemEvent = async (
    eventType: string,
    computerId: number,
    computerName: string,
    details: any = {}
  ) => {
    try {
      await supabase.from('system_logs').insert({
        type: eventType,
        computer_id: computerId,
        computer_name: computerName,
        reportee_name: currentUser?.name || 'System',
        technician_name: currentUser?.role === 'technician' ? currentUser.name : null,
        details: {
          user_id: currentUser?.id,
          timestamp: new Date().toISOString(),
          ...details
        }
      });
    } catch (error) {
      console.error('Error logging system event:', error);
    }
  };

  const trackMaintenanceActivity = async (
    computerId: number,
    issueDescription: string,
    solution?: string,
    status: 'pending' | 'in_progress' | 'completed' = 'pending'
  ) => {
    if (!currentUser || currentUser.role !== 'technician') return;

    try {
      await supabase.from('maintenance_logs').insert({
        computer_id: computerId,
        technician_id: currentUser.id,
        issue_description: issueDescription,
        solution,
        status,
        started_at: status === 'in_progress' ? new Date().toISOString() : null,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error tracking maintenance:', error);
    }
  };

  const sendNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) => {
    try {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        title,
        message,
        type
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const updateUsageStatistics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

      if (reservations) {
        const totalReservations = reservations.length;
        const uniqueUsers = new Set(reservations.map(r => r.user_id)).size;
        
        // Calculate peak hour (simplified)
        const hourCounts: { [hour: number]: number } = {};
        reservations.forEach(r => {
          const hour = new Date(r.created_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHour = Object.entries(hourCounts)
          .reduce((a, b) => hourCounts[parseInt(a[0])] > hourCounts[parseInt(b[0])] ? a : b)?.[0];

        await supabase.from('usage_statistics').upsert({
          date: today,
          total_reservations: totalReservations,
          unique_users: uniqueUsers,
          peak_hour: peakHour ? parseInt(peakHour) : null,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating usage statistics:', error);
    }
  };

  return {
    logActivity,
    logSystemEvent,
    trackMaintenanceActivity,
    sendNotification,
    updateUsageStatistics
  };
};