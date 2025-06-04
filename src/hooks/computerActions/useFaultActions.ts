
import { Computer, ComputerStatus } from "@/types";
import { mockReservations, mockAdminLogs, mockUsers } from "@/services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export const useFaultActions = (computers: Computer[], setComputers: (cb: (prev: Computer[]) => Computer[]) => void) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  const getFaultyComputers = () => {
    return computers.filter(c => c.status === "faulty");
  };

  const reportFault = (computerId: string, description: string, isEmergency: boolean = false) => {
    // Don't change computer status immediately - wait for admin confirmation
    const computer = computers.find(c => c.id === computerId);
    if (computer && currentUser) {
      // Send notification to admin users for fault confirmation
      const adminUsers = mockUsers.filter(user => user.role === "admin");
      
      for (const admin of adminUsers) {
        addNotification({
          type: isEmergency ? 'error' : 'action_required',
          title: `${isEmergency ? 'EMERGENCY: ' : ''}Fault Report Needs Confirmation`,
          message: `${currentUser.name} reported an issue with ${computer.name} (${computer.location}): "${description}". Please confirm if this computer should be marked as faulty.`,
          data: {
            type: 'fault_confirmation',
            computerId: computer.id,
            reporterId: currentUser.id,
            reporterName: currentUser.name,
            computerName: computer.name,
            location: computer.location,
            description: description,
            isEmergency: isEmergency
          }
        });
      }

      // Log the fault report as pending confirmation
      mockAdminLogs.push({
        id: `${Date.now()}-${Math.random()}`,
        eventType: "fault_reported",
        computerId: computer.id,
        computerName: computer.name,
        location: computer.location,
        reporteeName: currentUser.name,
        timeReported: new Date(),
        createdAt: new Date(),
        details: `${description} - Pending admin confirmation`,
        status: "pending confirmation",
      });
    }

    const emergencyText = isEmergency ? "emergency " : "";
    toast({
      title: `${isEmergency ? "Emergency " : ""}Fault reported`,
      description: `The ${emergencyText}issue has been reported to administrators for confirmation`,
      variant: isEmergency ? "destructive" : "default",
    });
  };

  const confirmFaultReport = async (computerId: string, confirmed: boolean, adminReason?: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      toast({
        title: "Permission denied",
        description: "Only admins can confirm fault reports",
        variant: "destructive",
      });
      return;
    }

    const computer = computers.find(c => c.id === computerId);
    if (!computer) return;

    if (confirmed) {
      // Mark computer as faulty and cancel any active reservations
      setComputers(prevComputers =>
        prevComputers.map(comp => {
          if (comp.id === computerId) {
            if (comp.status === "reserved") {
              const reservation = mockReservations.find(
                r => r.computerId === computerId && r.status === "active"
              );
              if (reservation) {
                reservation.status = "cancelled";
              }
            }
            return {
              ...comp,
              status: "faulty" as ComputerStatus,
              faultDescription: comp.faultDescription || "Confirmed by admin",
              reservedBy: undefined,
              reservedUntil: undefined,
            };
          }
          return comp;
        })
      );

      // Update log entry
      const logEntry = mockAdminLogs.find(log => 
        log.computerId === computerId && log.status === "pending confirmation"
      );
      if (logEntry) {
        logEntry.status = "confirmed faulty";
        logEntry.details = `Fault confirmed by admin ${currentUser.name}. Computer marked as faulty.`;
      }

      // Notify technicians about the confirmed fault
      const technicianUsers = mockUsers.filter(user => user.role === "technician");
      
      for (const technician of technicianUsers) {
        addNotification({
          type: 'action_required',
          title: 'Fault Confirmed - Action Required',
          message: `Admin confirmed fault on ${computer.name} (${computer.location}). Please investigate and repair.`,
          data: {
            type: 'repair_needed',
            computerId: computer.id,
            computerName: computer.name,
            location: computer.location,
            faultDescription: computer.faultDescription
          }
        });
      }

      toast({
        title: "Fault confirmed",
        description: "Computer marked as faulty. Technicians have been notified.",
      });
    } else {
      // Fault denied - computer remains operational
      const logEntry = mockAdminLogs.find(log => 
        log.computerId === computerId && log.status === "pending confirmation"
      );
      if (logEntry) {
        logEntry.status = "fault denied";
        logEntry.details = `Fault report denied by admin ${currentUser.name}. ${adminReason || "Computer remains operational."}`;
      }

      toast({
        title: "Fault report denied",
        description: "Computer remains operational",
      });
    }
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

    // Technician can directly fix the computer - no admin confirmation needed for repairs
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
    mockAdminLogs.push({
      id: `${Date.now()}-${Math.random()}`,
      eventType: "fixed",
      computerId: computer.id,
      computerName: computer.name,
      location: computer.location,
      technicianName: currentUser.name,
      timeFixed: new Date(),
      createdAt: new Date(),
      details: "Computer repaired and returned to service",
      status: "fixed",
    });

    // Notify students who might be interested
    const reservedUsers = mockReservations
      .filter(r => r.computerId === computerId && r.status === "cancelled")
      .map(r => r.userId);

    for (const userId of reservedUsers) {
      const user = mockUsers.find(u => u.id === userId);
      if (user) {
        addNotification({
          type: 'success',
          title: 'Computer Fixed and Available',
          message: `Good news! ${computer.name} (${computer.location}) has been repaired and is now available for reservation.`,
          data: {
            type: 'computer_fixed',
            computerId: computer.id,
            computerName: computer.name,
            location: computer.location
          }
        });
      }
    }

    toast({
      title: "Computer fixed",
      description: "Computer is now available for use",
    });
  };

  return {
    getFaultyComputers,
    reportFault,
    confirmFaultReport,
    fixComputer,
  };
};
