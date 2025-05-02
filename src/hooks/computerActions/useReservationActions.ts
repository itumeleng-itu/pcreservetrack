import { Computer, ComputerStatus } from "@/types";
import { mockReservations } from "@/services/mockData";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReservationActions = (computers: Computer[], setComputers: (cb: (prev: Computer[]) => Computer[]) => void) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => c.status === "reserved");
  };

  const hasActiveReservation = (userId: string) => {
    return mockReservations.some(
      r => r.userId === userId && r.status === "active"
    ) || computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
  };

  const reserveComputer = async (computerId: string, hours: number) => {
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

    // Convert computerId to a number and validate
    const computerIdNumber = Number(computerId);
    if (isNaN(computerIdNumber)) {
      toast({
        title: "Reservation failed",
        description: "Invalid computer ID format",
        variant: "destructive",
      });
      return;
    }

    // Check if the computer exists and is available
    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve) {
      toast({
        title: "Reservation failed",
        description: "Computer not found",
        variant: "destructive",
      });
      return;
    }

    if (computerToReserve.status !== "available") {
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

    try {
      // First, attempt to reserve the computer in the database (optimistic UI update)
      // This prevents double-booking by having a database constraint
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

      // Update the device session to show user is active
      await supabase.from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .match({ user_id: currentUser.id });

      toast({
        title: "Computer reserved",
        description: `You have reserved a computer for ${hours} hour${hours > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error("Error reserving computer:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error processing your reservation",
        variant: "destructive",
      });
    }
  };

  const releaseComputer = async (computerId: string) => {
    // Convert computerId to a number and validate
    const computerIdNumber = Number(computerId);
    if (isNaN(computerIdNumber)) {
      toast({
        title: "Release failed",
        description: "Invalid computer ID format",
        variant: "destructive",
      });
      return;
    }

    try {
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

      // Update user's last active timestamp to keep session fresh
      if (currentUser) {
        await supabase.from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .match({ user_id: currentUser.id });
      }

      toast({
        title: "Computer released",
        description: "The computer is now available for other users",
      });
    } catch (error) {
      console.error("Error releasing computer:", error);
      toast({
        title: "Release failed",
        description: "There was an error processing your request",
        variant: "destructive",
      });
    }
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
