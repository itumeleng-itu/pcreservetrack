import { supabase } from "@/integrations/supabase/client";
import { Computer, ComputerStatus, ComputerTracking } from "@/types";

// Computer services with enterprise-grade error handling and validation
export const computerService = {
  async getAllComputers(): Promise<Computer[]> {
    try {
      const { data, error } = await supabase
        .from('computers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching computers:", error);
        throw new Error(`Failed to fetch computers: ${error.message}`);
      }
      
      return data.map(computer => ({
        id: computer.id.toString(),
        name: computer.name,
        location: computer.location || '',
        status: computer.status as ComputerStatus,
        specs: computer.specs || '',
        reservedBy: computer.reserved_by || undefined,
        reservedUntil: computer.reserved_until ? new Date(computer.reserved_until) : undefined,
        faultDescription: computer.fault_description || undefined,
        isEmergency: computer.is_emergency || false,
        lastSeen: computer.last_seen ? new Date(computer.last_seen) : undefined,
        ipAddress: computer.ip_address || undefined,
        macAddress: computer.mac_address || undefined,
        tracking: {
          online: computer.tracking_online || false,
          lastHeartbeat: computer.tracking_last_heartbeat ? new Date(computer.tracking_last_heartbeat) : new Date(),
          cpuUsage: computer.tracking_cpu_usage || undefined,
          memoryUsage: computer.tracking_memory_usage || undefined,
        }
      }));
    } catch (error) {
      console.error("Critical error in getAllComputers:", error);
      throw error;
    }
  },

  async updateComputer(computerId: string, updates: Partial<Computer>): Promise<Computer> {
    try {
      const dbUpdates: any = {
        ...(updates.status && { status: updates.status }),
        ...(updates.reservedBy !== undefined && { reserved_by: updates.reservedBy }),
        ...(updates.reservedUntil !== undefined && { reserved_until: updates.reservedUntil?.toISOString() }),
        ...(updates.faultDescription !== undefined && { fault_description: updates.faultDescription }),
        ...(updates.isEmergency !== undefined && { is_emergency: updates.isEmergency }),
        ...(updates.lastSeen && { last_seen: updates.lastSeen.toISOString() }),
        ...(updates.tracking && {
          tracking_online: updates.tracking.online,
          tracking_last_heartbeat: updates.tracking.lastHeartbeat?.toISOString(),
          tracking_cpu_usage: updates.tracking.cpuUsage,
          tracking_memory_usage: updates.tracking.memoryUsage,
        }),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('computers')
        .update(dbUpdates)
        .eq('id', parseInt(computerId))
        .select()
        .single();
      
      if (error) {
        console.error("Error updating computer:", error);
        throw new Error(`Failed to update computer: ${error.message}`);
      }
      
      return {
        id: data.id.toString(),
        name: data.name,
        location: data.location || '',
        status: data.status as ComputerStatus,
        specs: data.specs || '',
        reservedBy: data.reserved_by || undefined,
        reservedUntil: data.reserved_until ? new Date(data.reserved_until) : undefined,
        faultDescription: data.fault_description || undefined,
        isEmergency: data.is_emergency || false,
        lastSeen: data.last_seen ? new Date(data.last_seen) : undefined,
        ipAddress: data.ip_address || undefined,
        macAddress: data.mac_address || undefined,
        tracking: {
          online: data.tracking_online || false,
          lastHeartbeat: data.tracking_last_heartbeat ? new Date(data.tracking_last_heartbeat) : new Date(),
          cpuUsage: data.tracking_cpu_usage || undefined,
          memoryUsage: data.tracking_memory_usage || undefined,
        }
      };
    } catch (error) {
      console.error("Critical error in updateComputer:", error);
      throw error;
    }
  },

  async reserveComputer(computerId: string, userId: string, endTime: Date): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('reserve_computer', {
        p_computer_id: parseInt(computerId),
        p_user_id: userId,
        p_reserved_until: endTime.toISOString()
      });
      
      if (error) {
        console.error("Error in reserve_computer RPC:", error);
        throw new Error(`Reservation failed: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error("Critical error in reserveComputer:", error);
      return false;
    }
  }
};

// Lab queue services
export const queueService = {
  async getLabQueue(labName: string): Promise<{ userId: string; position: number; joinedAt: Date }[]> {
    const { data, error } = await supabase
      .from('lab_queue')
      .select('user_id, position, created_at')
      .eq('lab_name', labName)
      .order('position');
    
    if (error) throw error;
    
    return data.map(item => ({
      userId: item.user_id,
      position: item.position,
      joinedAt: new Date(item.created_at)
    }));
  },

  async joinQueue(labName: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_queue')
      .insert({
        lab_name: labName,
        user_id: userId,
        position: 0 // Will be updated by trigger
      });
    
    if (error) throw error;
  },

  async leaveQueue(labName: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_queue')
      .delete()
      .eq('lab_name', labName)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};

// User stats and badges services
export const userService = {
  async getUserStats(userId: string): Promise<{ noShowCount: number; lateReturnCount: number; successfulReservations: number }> {
    const { data, error } = await supabase
      .from('registered')
      .select('no_show_count, late_return_count, successful_reservations')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return {
      noShowCount: data.no_show_count || 0,
      lateReturnCount: data.late_return_count || 0,
      successfulReservations: data.successful_reservations || 0
    };
  },

  async updateUserStats(userId: string, outcome: 'noShow' | 'lateReturn' | 'success'): Promise<void> {
    const stats = await this.getUserStats(userId);
    
    const updates: any = {};
    if (outcome === 'noShow') {
      updates.no_show_count = stats.noShowCount + 1;
    } else if (outcome === 'lateReturn') {
      updates.late_return_count = stats.lateReturnCount + 1;
    } else if (outcome === 'success') {
      updates.successful_reservations = stats.successfulReservations + 1;
    }
    
    const { error } = await supabase
      .from('registered')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    
    // Assign badges based on updated stats
    await this.assignUserBadges(userId);
  },

  async assignUserBadges(userId: string): Promise<void> {
    const stats = await this.getUserStats(userId);
    
    // Frequent User badge (10+ successful reservations)
    if (stats.successfulReservations >= 10) {
      await supabase
        .from('user_badges')
        .upsert({
          user_id: userId,
          badge_name: 'Frequent User'
        });
    }
    
    // Check for Early Bird badge (3+ reservations before 9am)
    const { data: earlyReservations } = await supabase
      .from('reservations')
      .select('reserved_at')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (earlyReservations) {
      const earlyBirdCount = earlyReservations.filter(r => 
        new Date(r.reserved_at).getHours() < 9
      ).length;
      
      if (earlyBirdCount >= 3) {
        await supabase
          .from('user_badges')
          .upsert({
            user_id: userId,
            badge_name: 'Early Bird'
          });
      }
      
      // Night Owl badge (3+ reservations after 9pm)
      const nightOwlCount = earlyReservations.filter(r => 
        new Date(r.reserved_at).getHours() >= 21
      ).length;
      
      if (nightOwlCount >= 3) {
        await supabase
          .from('user_badges')
          .upsert({
            user_id: userId,
            badge_name: 'Night Owl'
          });
      }
    }
  },

  async getUserBadges(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_name')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data.map(badge => badge.badge_name);
  }
};

// Notification services
export const notificationService = {
  async createNotification(userId: string, title: string, message: string, type: string = 'info'): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type
      });
    
    if (error) throw error;
  },

  async getUserNotifications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
  }
};
