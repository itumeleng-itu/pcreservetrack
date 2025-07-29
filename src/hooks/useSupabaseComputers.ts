import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Computer } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useSupabaseComputers = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchComputers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('computers')
        .select('*')
        .order('location')
        .order('name');

      if (error) {
        console.error('Error fetching computers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch computers from database",
          variant: "destructive",
        });
        return;
      }

      // Transform database data to match frontend Computer interface
      const transformedComputers: Computer[] = (data || []).map((dbComputer) => ({
        id: dbComputer.id.toString(),
        name: dbComputer.name,
        location: dbComputer.location,
        status: dbComputer.status as Computer['status'],
        specs: dbComputer.specs || '',
        reservedBy: dbComputer.reserved_by,
        reservedUntil: dbComputer.reserved_until ? new Date(dbComputer.reserved_until) : undefined,
        faultDescription: dbComputer.fault_description,
        isEmergency: dbComputer.is_emergency || false,
        reportedBy: undefined, // This would need to be tracked separately
        lastSeen: dbComputer.last_seen ? new Date(dbComputer.last_seen) : undefined,
        ipAddress: dbComputer.ip_address,
        macAddress: dbComputer.mac_address,
        tracking: {
          online: dbComputer.tracking_online ?? true,
          lastHeartbeat: dbComputer.tracking_last_heartbeat 
            ? new Date(dbComputer.tracking_last_heartbeat) 
            : new Date(),
          cpuUsage: dbComputer.tracking_cpu_usage,
          memoryUsage: dbComputer.tracking_memory_usage,
        }
      }));

      setComputers(transformedComputers);
    } catch (error) {
      console.error('Error fetching computers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch computers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateComputerInDB = async (computerId: string, updates: Partial<Computer>) => {
    try {
      const dbUpdates: any = {};
      
      // Map frontend fields to database fields
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.reservedBy !== undefined) dbUpdates.reserved_by = updates.reservedBy;
      if (updates.reservedUntil !== undefined) {
        dbUpdates.reserved_until = updates.reservedUntil?.toISOString();
      }
      if (updates.faultDescription !== undefined) {
        dbUpdates.fault_description = updates.faultDescription;
      }
      if (updates.isEmergency !== undefined) {
        dbUpdates.is_emergency = updates.isEmergency;
      }
      if (updates.tracking) {
        if (updates.tracking.online !== undefined) {
          dbUpdates.tracking_online = updates.tracking.online;
        }
        if (updates.tracking.lastHeartbeat) {
          dbUpdates.tracking_last_heartbeat = updates.tracking.lastHeartbeat.toISOString();
        }
        if (updates.tracking.cpuUsage !== undefined) {
          dbUpdates.tracking_cpu_usage = updates.tracking.cpuUsage;
        }
        if (updates.tracking.memoryUsage !== undefined) {
          dbUpdates.tracking_memory_usage = updates.tracking.memoryUsage;
        }
      }

      // Update the database
      const { error } = await supabase
        .from('computers')
        .update(dbUpdates)
        .eq('id', parseInt(computerId));

      if (error) {
        console.error('Error updating computer:', error);
        toast({
          title: "Error",
          description: "Failed to update computer",
          variant: "destructive",
        });
        return false;
      }

      // Update local state
      setComputers(prev => prev.map(computer => 
        computer.id === computerId 
          ? { ...computer, ...updates }
          : computer
      ));

      return true;
    } catch (error) {
      console.error('Error updating computer:', error);
      toast({
        title: "Error",
        description: "Failed to update computer",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchComputers();

    // Set up real-time subscription for computer updates
    const subscription = supabase
      .channel('computers')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'computers' },
        () => {
          // Refetch computers when any computer is updated
          fetchComputers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    computers,
    isLoading,
    refetchComputers: fetchComputers,
    updateComputer: updateComputerInDB,
  };
};