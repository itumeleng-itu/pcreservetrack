
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
      return false;
    }

    if (!isWithinBookingHours()) {
      toast({
        title: "Outside booking hours",
        description: getBookingHoursMessage(),
        variant: "destructive",
      });
      return false;
    }

    // Perform a fresh check of the computer's status to prevent race conditions
    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve) {
      toast({
        title: "Reservation failed",
        description: "Computer not found",
        variant: "destructive",
      });
      return false;
    }

    if (computerToReserve.status !== "available") {
      toast({
        title: "Reservation failed",
        description: "This computer is no longer available. It may have been reserved by another student.",
        variant: "destructive",
      });
      return false;
    }

    // Check if student already has a reservation (to prevent multiple reservations)
    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation limit reached",
        description: "Students can only reserve one computer at a time. Please release your current reservation first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Implementation of an optimistic concurrency control pattern:
      // 1. First mark the computer as "in_transition" to prevent race conditions
      let reservationSuccessful = false;
      
      setComputers(prevComputers => {
        const updatedComputers = prevComputers.map(computer => {
          if (computer.id === computerId && computer.status === "available") {
            console.log(`Marking computer ${computerId} as in transition`);
            return {
              ...computer,
              status: "reserved" as ComputerStatus,
              reservedBy: currentUser.id,
            };
          }
          return computer;
        });
        
        // Check if we were able to update the computer (wasn't already taken)
        const wasUpdated = updatedComputers.some(c => 
          c.id === computerId && 
          c.status === "reserved" && 
          c.reservedBy === currentUser.id
        );
        
        reservationSuccessful = wasUpdated;
        return updatedComputers;
      });

      if (!reservationSuccessful) {
        toast({
          title: "Reservation failed",
          description: "This computer is no longer available. It may have been reserved by another student.",
          variant: "destructive",
        });
        return false;
      }

      // Calculate reservation end time
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + hours);
      
      // Create a new reservation record in mockReservations
      const newReservation = {
        id: String(mockReservations.length + 1),
        computerId,
        userId: currentUser.id,
        startTime: new Date(),
        endTime,
        status: "active" as const
      };
      
      // Add to mock reservations
      mockReservations.push(newReservation);
      console.log("Reservation created:", newReservation);
      console.log("All reservations:", mockReservations);
      
      // Update computers state to finalize the reservation with the end time
      setComputers(prevComputers => {
        return prevComputers.map(computer => {
          if (computer.id === computerId && computer.reservedBy === currentUser.id) {
            console.log(`Finalizing reservation for computer ${computerId} by ${currentUser.id} until ${endTime}`);
            return {
              ...computer,
              status: "reserved" as ComputerStatus,
              reservedBy: currentUser.id,
              reservedUntil: endTime
            };
          }
          return computer;
        });
      });

      // Update the device session to show user is active
      try {
        await supabase.from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .match({ user_id: currentUser.id });
      } catch (error) {
        console.error("Error updating user session:", error);
        // Don't fail the reservation if this fails
      }

      toast({
        title: "Computer reserved",
        description: `You have reserved a computer for ${hours} hour${hours > 1 ? 's' : ''}`,
      });
      
      return true; // Return success status
    } catch (error) {
      console.error("Error reserving computer:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error processing your reservation",
        variant: "destructive",
      });
      
      // Revert the computer status on error
      setComputers(prevComputers => {
        return prevComputers.map(computer => {
          if (computer.id === computerId && computer.reservedBy === currentUser.id) {
            return {
              ...computer,
              status: "available" as ComputerStatus,
              reservedBy: undefined,
              reservedUntil: undefined
            };
          }
          return computer;
        });
      });
      
      return false;
    }
  };

  return { reserveComputer };
};
