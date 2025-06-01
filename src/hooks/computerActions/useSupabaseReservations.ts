
import { Computer, ComputerStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { userService } from "@/services/supabaseServices";

export const useSupabaseReservations = (
  computers: Computer[],
  updateComputer: (id: string, updates: Partial<Computer>) => Promise<Computer>
) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const hasActiveReservation = (userId: string) => {
    return computers.some(c => c.status === "reserved" && c.reservedBy === userId);
  };

  const isComputerAlreadyReserved = (computerId: string) => {
    return computers.some(c => c.id === computerId && c.status === "reserved");
  };

  const reserveComputer = async (computerId: string, startTime: Date, duration: number): Promise<[boolean, Computer | null]> => {
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

    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation failed",
        description: "Students can only reserve one computer at a time",
        variant: "destructive",
      });
      return [false, null];
    }

    try {
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      // Create reservation in database
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          computer_id: parseInt(computerId),
          user_id: currentUser.id,
          reserved_at: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Update computer status
      const updatedComputer = await updateComputer(computerId, {
        status: "reserved" as ComputerStatus,
        reservedBy: currentUser.id,
        reservedUntil: endTime
      });

      toast({
        title: "Computer reserved",
        description: `You have reserved a computer from ${startTime.toLocaleString()} for ${duration} hour${duration > 1 ? 's' : ''}`,
      });

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

  const releaseComputer = async (computerId: string) => {
    try {
      // Update reservation status
      await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'active');

      // Update computer status
      await updateComputer(computerId, {
        status: "available" as ComputerStatus,
        reservedBy: undefined,
        reservedUntil: undefined
      });

      // Update user stats
      if (currentUser) {
        await userService.updateUserStats(currentUser.id, 'success');
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

  return {
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer
  };
};
