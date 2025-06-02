
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

    // Check if reservation start time is within booking hours
    const reservationHour = startTime.getHours();
    if (reservationHour < 8 || reservationHour >= 22) {
      toast({
        title: "Outside booking hours",
        description: "Reservations can only be made between 8:00 AM and 10:00 PM",
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
      
      // Check if end time exceeds booking hours
      if (endTime.getHours() >= 22 && endTime.getMinutes() > 0) {
        toast({
          title: "Reservation exceeds booking hours",
          description: "Reservations must end by 10:00 PM",
          variant: "destructive",
        });
        return [false, null];
      }
      
      // First, check if computer is still available
      const { data: computerCheck } = await supabase
        .from('computers')
        .select('status, reserved_by, reserved_until')
        .eq('id', parseInt(computerId))
        .single();

      if (computerCheck?.status !== 'available') {
        toast({
          title: "Reservation failed",
          description: "This computer is no longer available",
          variant: "destructive",
        });
        return [false, null];
      }

      // Create reservation record first with proper start_time and end_time
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          computer_id: parseInt(computerId),
          user_id: currentUser.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reserved_at: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (reservationError) {
        console.error("Reservation creation error:", reservationError);
        throw reservationError;
      }

      // Update computer status using the database function
      const { data: reserveResult, error: reserveError } = await supabase
        .rpc('reserve_computer', {
          p_computer_id: parseInt(computerId),
          p_user_id: currentUser.id,
          p_reserved_until: endTime.toISOString()
        });

      if (reserveError || !reserveResult) {
        // If computer update fails, clean up the reservation
        await supabase
          .from('reservations')
          .delete()
          .eq('id', reservation.id);
        
        throw new Error("Failed to reserve computer - it may have been taken by another user");
      }

      // Update local computer state
      const updatedComputer = await updateComputer(computerId, {
        status: "reserved" as ComputerStatus,
        reservedBy: currentUser.id,
        reservedUntil: endTime
      });

      // Update user session to keep them active
      await supabase.from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', currentUser.id);

      toast({
        title: "Computer reserved",
        description: `Computer reserved from ${startTime.toLocaleString()} for ${duration} hour${duration > 1 ? 's' : ''}`,
      });

      console.log("Reservation successful in database:", reservation);
      return [true, updatedComputer];
    } catch (error) {
      console.error("Error reserving computer:", error);
      toast({
        title: "Reservation failed",
        description: error instanceof Error ? error.message : "There was an error processing your reservation",
        variant: "destructive",
      });
      return [false, null];
    }
  };

  const releaseComputer = async (computerId: string) => {
    try {
      // Update reservation status in database
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'active');

      if (reservationError) {
        console.error("Error updating reservation:", reservationError);
      }

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

      // Update user session
      await supabase.from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', currentUser.id);

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
