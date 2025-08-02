import { Computer, ComputerStatus } from "@/types";
import { mockAdminLogs } from "@/services/mockData";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReserveComputer = ( // This hook is used to reserve a computer
  computers: Computer[], 
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void,
  hasActiveReservation: (userId: string) => Promise<boolean>
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

    // Calculate reservation end time
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    // Check for conflicts in the database
    const { data: conflictingReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('computer_id', parseInt(computerId))
      .eq('status', 'active')
      .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);

    if (conflictingReservations && conflictingReservations.length > 0) {
      toast({
        title: "Reservation conflict",
        description: "This computer is already reserved for the selected time slot.",
        variant: "destructive",
      });
      return [false, null];
    }

    // Check if student already has an active reservation
    if (currentUser.role === "student") {
      const { data: userReservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active');

      if (userReservations && userReservations.length > 0) {
        toast({
          title: "Reservation failed",
          description: "Students can only reserve one computer at a time",
          variant: "destructive",
        });
        return [false, null];
      }
    }

    try {
      console.log(`Creating reservation for computer ${computerId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
      
      // Create reservation in database using the secure function
      const { data: reservationResult, error } = await supabase.rpc('reserve_computer_secure', {
        p_computer_id: parseInt(computerId),
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString()
      });

      if (error) {
        console.error("Database reservation error:", error);
        toast({
          title: "Reservation failed",
          description: error.message || "Failed to create reservation",
          variant: "destructive",
        });
        return [false, null];
      }

      // Check if the function returned an error
      if (reservationResult) {
        const result = reservationResult as any;
        if (result && typeof result === 'object' && 'error' in result) {
          let errorMessage = "Failed to create reservation";
          
          switch (result.error) {
            case 'UNAUTHORIZED':
              errorMessage = "You are not authorized to make reservations";
              break;
            case 'USER_NOT_REGISTERED':
              errorMessage = "Your account is not properly registered";
              break;
            case 'TIME_CONFLICT':
              errorMessage = "This computer is already reserved for the selected time slot";
              break;
            case 'RESERVATION_FAILED':
              errorMessage = "Reservation failed. Please try again";
              break;
          }
          
          toast({
            title: "Reservation failed", 
            description: errorMessage,
            variant: "destructive",
          });
          return [false, null];
        }
      }
      
      console.log("Database reservation successful");
      
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

      // Make sure to update the user session
      try {
        await supabase.from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .match({ user_id: currentUser.id });
      } catch (error) {
        console.error("Error updating user session:", error);
        // Don't fail the reservation if this fails
      }

      // Log the admin event for the reservation
      if (computerToReserve && currentUser) {
        mockAdminLogs.push({
          id: `${Date.now()}-${Math.random()}`,
          eventType: "reserved",
          computerId: computerToReserve.id,
          computerName: computerToReserve.name,
          location: computerToReserve.location,
          reporteeName: currentUser.name,
          reserveTime: startTime,
          expirationTime: endTime,
          createdAt: new Date(),
          details: `Reserved from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`,
          status: "reserved",
        });
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
