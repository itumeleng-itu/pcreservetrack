import { Computer, ComputerStatus } from "@/types";
import { mockReservations } from "@/services/mockData";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReserveComputer = ( // This hook is used to reserve a computer
  computers: Computer[], 
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void,
  hasActiveReservation: (userId: string) => boolean
) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const reserveComputer = async (computerId: string, startTime: Date, duration: number): Promise<[boolean, Computer | null]> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to reserve a computer",
        variant: "destructive",
      });
      return [false, null];
    }

    // Validate the selected time slot is within reservation hours
    if (!isWithinBookingHours(startTime)) {
      toast({
        title: "Invalid reservation time",
        description: `The selected time is outside booking hours. ${getBookingHoursMessage(startTime)}`,
        variant: "destructive",
      });
      return [false, null];
    }

    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve) {
      toast({
        title: "Reservation failed",
        description: "Computer not found",
        variant: "destructive",
      });
      return [false, null];
    }

    // Check again if the computer is still available for the requested time slot
    // Find all reservations for this computer
    const overlapping = mockReservations.some(r =>
      r.computerId === computerId &&
      r.status === "active" &&
      ((startTime < r.endTime && startTime >= r.startTime) || // starts during another reservation
       (new Date(startTime.getTime() + duration * 60 * 60 * 1000) > r.startTime && new Date(startTime.getTime() + duration * 60 * 60 * 1000) <= r.endTime) || // ends during another reservation
       (startTime <= r.startTime && new Date(startTime.getTime() + duration * 60 * 60 * 1000) >= r.endTime)) // fully overlaps
    );
    if (overlapping) {
      toast({
        title: "Reservation conflict",
        description: "This computer is already reserved for the selected time slot.",
        variant: "destructive",
      });
      return [false, null];
    }

    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation failed",
        description: "Students can only reserve one computer at a time",
        variant: "destructive",
      });
      return [false, null];
    }

    try {
      // Calculate reservation end time
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      console.log(`Creating reservation for computer ${computerId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
      
      // Create a new reservation record in mockReservations
      const newReservation = {
        id: String(mockReservations.length + 1),
        computerId,
        userId: currentUser.id,
        startTime,
        endTime,
        status: "active" as const
      };
      
      // Add to mock reservations
      mockReservations.push(newReservation);
      console.log("Reservation created:", newReservation);
      console.log("All reservations:", mockReservations);
      
      let updatedComputer: Computer | null = null;
      
      // Update computers state to reflect the reservation if it is for now or in the future
      setComputers(prevComputers => {
        const updatedComputers = prevComputers.map(computer => {
          if (computer.id === computerId) {
            console.log(`Marking computer ${computerId} as reserved by ${currentUser.id}`);
            updatedComputer = {
              ...computer,
              status: "reserved" as ComputerStatus,
              reservedBy: currentUser.id,
              reservedUntil: endTime
            };
            return updatedComputer;
          }
          return computer;
        });
        return updatedComputers;
      });

      // Make sure to update the user session
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
        description: `You have reserved a computer from ${startTime.toLocaleString()} for ${duration} hour${duration > 1 ? 's' : ''}`,
      });
      
      console.log("Reservation successful, returning updated computer:", updatedComputer);
      return [true, updatedComputer]; 
    } catch (error) {
      console.error("Error reserving computer:", error);
      toast({
        title: "Reservation failed",
        description: "There was an error processing your reservation",
        variant: "destructive",
      });
      return [false, null];
    }
  };

  return { reserveComputer };
};
