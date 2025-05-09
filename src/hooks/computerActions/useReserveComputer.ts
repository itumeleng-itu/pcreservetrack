
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

  const reserveComputer = async (computerId: string, hours: number): Promise<[boolean, Computer | null]> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to reserve a computer",
        variant: "destructive",
      });
      return [false, null];
    }

    if (!isWithinBookingHours()) {
      toast({
        title: "Outside booking hours",
        description: getBookingHoursMessage(),
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

    // Check again if the computer is still available to prevent race conditions
    if (computerToReserve.status !== "available") {
      toast({
        title: "Reservation failed",
        description: "This computer is no longer available",
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
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + hours);
      
      console.log(`Creating reservation for computer ${computerId} until ${endTime.toISOString()}`);
      
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
      
      let updatedComputer: Computer | null = null;
      
      // Update computers state to reflect the reservation
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
      
      console.log("Reservation successful, returning updated computer");
      return [true, updatedComputer]; // Return success status and updated computer
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
