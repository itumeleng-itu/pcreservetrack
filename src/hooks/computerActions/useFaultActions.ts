import { Computer, ComputerStatus } from "@/types";
import { mockReservations, mockAdminLogs, mockUsers } from "@/services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useFaultActions = (computers: Computer[], setComputers: (cb: (prev: Computer[]) => Computer[]) => void) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getFaultyComputers = () => {
    return computers.filter(c => c.status === "faulty");
  };

  const reportFault = (computerId: string, description: string, isEmergency: boolean = false) => {
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
          return {
            ...computer,
            status: "faulty" as ComputerStatus,
            faultDescription: description,
            isEmergency,
            reservedBy: undefined,
            reservedUntil: undefined,
          };
        }
        return computer;
      })
    );

    const computer = computers.find(c => c.id === computerId);
    if (computer && currentUser) {
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

    const computer = computers.find(c => c.id === computerId);
    if (!computer) return;

    // Create notification for admin to confirm the fix
    const adminUsers = mockUsers.filter(user => user.role === "admin");
    
    for (const admin of adminUsers) {
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            type: 'action_required',
            title: 'Computer Fix Needs Confirmation',
            message: `Technician ${currentUser.name} has marked ${computer.name} (${computer.location}) as fixed. Please review and confirm.`,
            data: {
              type: 'fix_confirmation',
              computerId: computer.id,
              technicianId: currentUser.id,
              technicianName: currentUser.name,
              computerName: computer.name,
              location: computer.location,
              faultDescription: computer.faultDescription
            }
          });
      } catch (error) {
        console.error('Error creating admin notification:', error);
      }
    }

    // Add to admin logs with pending status
    mockAdminLogs.push({
      id: `${Date.now()}-${Math.random()}`,
      eventType: "fixed",
      computerId: computer.id,
      computerName: computer.name,
      location: computer.location,
      technicianName: currentUser.name,
      timeFixed: new Date(),
      createdAt: new Date(),
      details: "Marked as fixed by technician - pending admin confirmation",
      status: "pending confirmation",
    });

    toast({
      title: "Fix submitted for review",
      description: "Admin will review and confirm the fix",
    });
  };

  const confirmFix = async (computerId: string, confirmed: boolean, adminReason?: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      toast({
        title: "Permission denied",
        description: "Only admins can confirm fixes",
        variant: "destructive",
      });
      return;
    }

    const computer = computers.find(c => c.id === computerId);
    if (!computer) return;

    if (confirmed) {
      // Mark computer as available
      setComputers(prevComputers =>
        prevComputers.map(comp => {
          if (comp.id === computerId && comp.status === "faulty") {
            return {
              ...comp,
              status: "available" as ComputerStatus,
              faultDescription: undefined,
              isEmergency: undefined,
            };
          }
          return comp;
        })
      );

      // Update logs
      const logEntry = mockAdminLogs.find(log => 
        log.computerId === computerId && log.status === "pending confirmation"
      );
      if (logEntry) {
        logEntry.status = "confirmed and fixed";
        logEntry.details = `Fix confirmed by admin ${currentUser.name}. Computer is now available.`;
      }

      // Notify students who might be interested
      const reservedUsers = mockReservations
        .filter(r => r.computerId === computerId && r.status === "cancelled")
        .map(r => r.userId);

      for (const userId of reservedUsers) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'success',
              title: 'Computer Fixed and Available',
              message: `Good news! ${computer.name} (${computer.location}) has been fixed and is now available for reservation.`,
              data: {
                type: 'computer_fixed',
                computerId: computer.id,
                computerName: computer.name,
                location: computer.location
              }
            });
        } catch (error) {
          console.error('Error creating student notification:', error);
        }
      }

      toast({
        title: "Fix confirmed",
        description: "Computer is now available for use",
      });
    } else {
      // Keep computer as faulty
      const logEntry = mockAdminLogs.find(log => 
        log.computerId === computerId && log.status === "pending confirmation"
      );
      if (logEntry) {
        logEntry.status = "fix denied";
        logEntry.details = `Fix denied by admin ${currentUser.name}. ${adminReason || "Reason not provided"}`;
      }

      toast({
        title: "Fix denied",
        description: "Computer remains in faulty status",
        variant: "destructive",
      });
    }
  };

  return {
    getFaultyComputers,
    reportFault,
    fixComputer,
    confirmFix,
  };
};
