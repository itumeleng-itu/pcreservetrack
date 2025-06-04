import { Computer, ComputerStatus } from "@/types";
import { mockReservations, mockAdminLogs } from "@/services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

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

  const fixComputer = (computerId: string) => {
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
            status: "available" as ComputerStatus,
            faultDescription: undefined,
            isEmergency: undefined,
          };
        }
        return computer;
      })
    );
    const computer = computers.find(c => c.id === computerId);
    if (computer && currentUser) {
      mockAdminLogs.push({
        id: `${Date.now()}-${Math.random()}`,
        eventType: "fixed",
        computerId: computer.id,
        computerName: computer.name,
        location: computer.location,
        technicianName: currentUser.name,
        timeFixed: new Date(),
        createdAt: new Date(),
        details: "Marked as fixed by technician",
        status: "fixed",
      });
    }
    toast({
      title: "Computer fixed",
      description: "The computer is now available for use",
    });
  };

  return {
    getFaultyComputers,
    reportFault,
    fixComputer,
  };
};
