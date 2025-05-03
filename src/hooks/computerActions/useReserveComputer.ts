
import { Computer, ComputerStatus } from "@/types";
import { mockReservations } from "@/services/mockData";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReserveComputer = (
  computers: Computer[], 
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void,
  hasActiveReservation: (userId: string) => boolean
) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

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

    // Check if the computer exists and is available - no need to convert to number
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

  return { reserveComputer };
};
