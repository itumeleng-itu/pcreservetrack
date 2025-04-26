
import { Computer, ComputerStatus } from "@/types";
import { mockReservations } from "@/services/mockData";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const useReservationActions = (computers: Computer[], setComputers: (cb: (prev: Computer[]) => Computer[]) => void) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => 
      c.status === "reserved" && c.reservedBy === currentUser?.id
    );
  };

  const hasActiveReservation = (userId: string) => {
    return mockReservations.some(
      r => r.userId === userId && r.status === "active"
    ) || computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
  };

  const reserveComputer = (computerId: string, hours: number) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to reserve a computer",
        variant: "destructive",
      });
      return;
    }

    if (!isWithinBookingHours()) {
      toast({
        title: "Outside booking hours",
        description: getBookingHoursMessage(),
        variant: "destructive",
      });
      return;
    }

    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve || computerToReserve.status !== "available") {
      toast({
        title: "Reservation failed",
        description: "This computer is no longer available",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation failed",
        description: "Students can only reserve one computer at a time",
        variant: "destructive",
      });
      return;
    }

    setComputers(prevComputers =>
      prevComputers.map(computer => {
        if (computer.id === computerId && computer.status === "available") {
          const endTime = new Date();
          endTime.setHours(endTime.getHours() + hours);
          const newReservation = {
            id: String(mockReservations.length + 1),
            computerId,
            userId: currentUser.id,
            startTime: new Date(),
            endTime,
            status: "active" as const
          };
          mockReservations.push(newReservation);

          return {
            ...computer,
            status: "reserved" as ComputerStatus,
            reservedBy: currentUser.id,
            reservedUntil: endTime
          };
        }
        return computer;
      })
    );
    toast({
      title: "Computer reserved",
      description: `You have reserved a computer for ${hours} hour${hours > 1 ? 's' : ''}`,
    });
  };

  const releaseComputer = (computerId: string) => {
    setComputers(prevComputers => prevComputers.map(computer => {
      if (computer.id === computerId && computer.status === "reserved") {
        const reservation = mockReservations.find(
          r => r.computerId === computerId && r.status === "active"
        );
        if (reservation) {
          reservation.status = "completed";
        }
        return {
          ...computer,
          status: "available" as ComputerStatus,
          reservedBy: undefined,
          reservedUntil: undefined,
        };
      }
      return computer;
    }));
    toast({
      title: "Computer released",
      description: "The computer is now available for other users",
    });
  };

  // Expiry logic, runs every minute
  const checkExpiredReservations = () => {
    const now = new Date();
    const expired = computers.some(
      computer =>
        computer.status === "reserved" &&
        computer.reservedUntil &&
        computer.reservedUntil < now
    );
    if (expired) {
      setComputers(prevComputers =>
        prevComputers.map(computer => {
          if (
            computer.status === "reserved" &&
            computer.reservedUntil &&
            computer.reservedUntil < now
          ) {
            return {
              ...computer,
              status: "available" as ComputerStatus,
              reservedBy: undefined,
              reservedUntil: undefined,
            };
          }
          return computer;
        })
      );
    }
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    reserveComputer,
    releaseComputer,
    checkExpiredReservations,
  };
};
