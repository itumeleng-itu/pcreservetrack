
import { Computer, ComputerStatus } from "@/types";
import { mockReservations, mockAdminLogs, addNotification } from "@/services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useFaultActions = (computers: Computer[], setComputers: (cb: (prev: Computer[]) => Computer[]) => void, updateComputerInDB?: (computerId: string, updates: Partial<Computer>) => Promise<boolean>) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getFaultyComputers = () => {
    return computers.filter(c => c.status === "faulty");
  };

  const reportFault = async (computerId: string, description: string, isEmergency: boolean = false) => {
    const updates = {
      status: "faulty" as ComputerStatus,
      faultDescription: description,
      isEmergency,
      reservedBy: undefined,
      reservedUntil: undefined,
      reportedBy: currentUser?.id,
    };

    // Update local state
    setComputers(prevComputers =>
      prevComputers.map(computer => {
        if (computer.id === computerId) {
          if (computer.status === "reserved") {
            const reservation = mockReservations.find(
              r => r.computerId === computerId && r.status === "active"
            );
            if (reservation) {
              reservation.status = "cancelled";
            }
          }
          return { ...computer, ...updates };
        }
        return computer;
      })
    );

    // Update database if function is available
    if (updateComputerInDB) {
      updateComputerInDB(computerId, updates);
    }

    const computer = computers.find(c => c.id === computerId);
    if (computer && currentUser) {
      // Insert into faults table
      await supabase.from('faults').insert({
        computer_id: parseInt(computerId),
        reported_by: parseInt(currentUser.id),
        description,
        status: 'reported'
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: currentUser.id,
        action_type: 'fault_reported',
        entity_type: 'computer',
        entity_id: computerId,
        old_data: { status: computer.status },
        new_data: { status: 'faulty', fault_description: description },
        metadata: { is_emergency: isEmergency, computer_name: computer.name, location: computer.location }
      });

      mockAdminLogs.push({
        id: `${Date.now()}-${Math.random()}`,
        eventType: "fault_reported",
        computerId: computer.id,
        computerName: computer.name,
        location: computer.location,
        reporteeName: currentUser.name,
        timeReported: new Date(),
        createdAt: new Date(),
        details: description,
        status: "not fixed",
      });
    }

    const emergencyText = isEmergency ? "emergency " : "";
    toast({
      title: `${isEmergency ? "Emergency " : ""}Fault reported`,
      description: `The ${emergencyText}issue has been reported to technicians`,
      variant: isEmergency ? "destructive" : "default",
    });
  };

  const fixComputer = async (computerId: string) => {
    if (!currentUser || currentUser.role !== "technician") {
      toast({
        title: "Permission denied",
        description: "Only technicians can fix computers",
        variant: "destructive",
      });
      return;
    }
    
    setComputers(prevComputers =>
      prevComputers.map(computer => {
        if (computer.id === computerId && computer.status === "faulty") {
          return {
            ...computer,
            status: "pending_approval" as ComputerStatus,
            fixedBy: currentUser.id,
          };
        }
        return computer;
      })
    );
    
    const computer = computers.find(c => c.id === computerId);
    if (computer && currentUser) {
      // Update fault status in database
      await supabase.from('faults')
        .update({ status: 'fixed' })
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'reported');

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: currentUser.id,
        action_type: 'computer_fixed',
        entity_type: 'computer',
        entity_id: computerId,
        old_data: { status: 'faulty' },
        new_data: { status: 'pending_approval' },
        metadata: { computer_name: computer.name, technician_name: currentUser.name }
      });

      // Send real-time message to admins
      const { data: admins } = await supabase
        .from('registered')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        for (const admin of admins) {
          await supabase.from('real_time_messages').insert({
            sender_id: currentUser.id,
            recipient_id: admin.id,
            message_type: 'notification',
            title: 'Computer Fix Needs Approval',
            content: `${currentUser.name} has marked ${computer.name} as fixed. Please approve.`,
            data: {
              computerName: computer.name,
              technicianName: currentUser.name,
              fixedAt: new Date().toISOString(),
              computerId
            }
          });
        }
      }

      // Add notification for admin to approve the fix
      addNotification({
        id: `fix-approval-${computerId}-${Date.now()}`,
        type: "fix_approval_needed",
        title: "Computer Fix Needs Approval",
        message: `${currentUser.name} has marked ${computer.name} as fixed. Please approve.`,
        recipientId: "admin",
        computerId: computerId,
        data: {
          computerName: computer.name,
          technicianName: currentUser.name,
          fixedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        read: false
      });

      mockAdminLogs.push({
        id: `${Date.now()}-${Math.random()}`,
        eventType: "fix_pending_approval",
        computerId: computer.id,
        computerName: computer.name,
        location: computer.location,
        technicianName: currentUser.name,
        timeFixed: new Date(),
        createdAt: new Date(),
        details: "Marked as fixed by technician, pending admin approval",
        status: "pending approval",
      });
    }
    
    toast({
      title: "Fix reported",
      description: "Computer marked as fixed, waiting for admin approval",
    });
  };

  const approveFix = async (computerId: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      toast({
        title: "Permission denied",
        description: "Only admins can approve fixes",
        variant: "destructive",
      });
      return;
    }

    const computer = computers.find(c => c.id === computerId);
    if (!computer) return;

    setComputers(prevComputers =>
      prevComputers.map(comp => {
        if (comp.id === computerId && comp.status === "pending_approval") {
          return {
            ...comp,
            status: "available" as ComputerStatus,
            faultDescription: undefined,
            isEmergency: undefined,
            fixedBy: undefined,
            reportedBy: undefined,
          };
        }
        return comp;
      })
    );

    // Update fault status to approved in database
    await supabase.from('faults')
      .update({ status: 'approved' })
      .eq('computer_id', parseInt(computerId))
      .eq('status', 'fixed');

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: currentUser.id,
      action_type: 'fix_approved',
      entity_type: 'computer',
      entity_id: computerId,
      old_data: { status: 'pending_approval' },
      new_data: { status: 'available' },
      metadata: { computer_name: computer.name, approved_by: currentUser.name }
    });

    // Notify the student who reported the fault
    if (computer.reportedBy) {
      await supabase.from('real_time_messages').insert({
        sender_id: currentUser.id,
        recipient_id: computer.reportedBy,
        message_type: 'notification',
        title: 'Computer Fixed',
        content: `${computer.name} has been fixed and is now available for use!`,
        data: {
          computerName: computer.name,
          approvedBy: currentUser.name,
          computerId
        }
      });

      addNotification({
        id: `fix-approved-${computerId}-${Date.now()}`,
        type: "computer_fixed",
        title: "Computer Fixed",
        message: `${computer.name} has been fixed and is now available for use!`,
        recipientId: computer.reportedBy,
        computerId: computerId,
        data: {
          computerName: computer.name,
          approvedBy: currentUser.name
        },
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    if (currentUser) {
      mockAdminLogs.push({
        id: `${Date.now()}-${Math.random()}`,
        eventType: "fix_approved",
        computerId: computer.id,
        computerName: computer.name,
        location: computer.location,
        technicianName: currentUser.name,
        timeFixed: new Date(),
        createdAt: new Date(),
        details: "Fix approved by admin",
        status: "fixed",
      });
    }

    toast({
      title: "Fix approved",
      description: "The computer is now available for use",
    });
  };

  return {
    getFaultyComputers,
    reportFault,
    fixComputer,
    approveFix,
  };
};
