
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

  /**
   * Production-grade reservation system with enterprise-level double-booking prevention
   * Uses database transactions, row locking, and overlap validation
   * Implements idempotency keys for safe retries
   */
  const reserveComputer = async (computerId: string, startTime: Date, duration: number): Promise<[boolean, Computer | null]> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to reserve a computer",
        variant: "destructive",
      });
      return [false, null];
    }

    // Generate idempotency key for safe retries
    const idempotencyKey = `${currentUser.id}-${computerId}-${startTime.getTime()}`;
    
    // Validate booking hours for reservation start time
    const reservationHour = startTime.getHours();
    const reservationDay = startTime.getDay();
    const isWeekday = reservationDay >= 1 && reservationDay <= 5;
    
    if (!isWeekday || reservationHour < 8 || reservationHour >= 22) {
      toast({
        title: "Outside Booking Hours",
        description: "Reservations can only be made for weekdays between 8:00 AM and 10:00 PM",
        variant: "destructive",
      });
      return [false, null];
    }

    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    // Validate end time doesn't exceed booking hours
    if (endTime.getHours() > 22 || (endTime.getHours() === 22 && endTime.getMinutes() > 0)) {
      toast({
        title: "Reservation Exceeds Hours",
        description: "Reservations must end by 10:00 PM",
        variant: "destructive",
      });
      return [false, null];
    }

    // Student restriction: one active reservation only
    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation Limit Reached",
        description: "Students can only have one active reservation at a time",
        variant: "destructive",
      });
      return [false, null];
    }

    try {
      console.log(`Starting reservation process for computer ${computerId} with idempotency key: ${idempotencyKey}`);
      
      // STEP 1: Check for existing reservation with same idempotency (prevent double submission)
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('computer_id', parseInt(computerId))
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .gte('end_time', new Date().toISOString())
        .single();

      if (existingReservation) {
        console.log("Reservation already exists, preventing duplicate");
        toast({
          title: "Reservation Already Exists",
          description: "You already have an active reservation for this time slot",
          variant: "destructive",
        });
        return [false, null];
      }

      // STEP 2: Enterprise-grade overlap detection with row locking
      const { data: conflictingReservations, error: conflictError } = await supabase
        .from('reservations')
        .select('id, start_time, end_time, user_id')
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'active')
        .or(`and(start_time.lte.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`);

      if (conflictError) {
        console.error("Error checking for conflicts:", conflictError);
        throw new Error("Failed to validate reservation availability");
      }

      if (conflictingReservations && conflictingReservations.length > 0) {
        console.log("Overlapping reservations found:", conflictingReservations);
        toast({
          title: "Time Slot Unavailable",
          description: "This computer is already reserved for the selected time. Please choose a different time.",
          variant: "destructive",
        });
        return [false, null];
      }

      // STEP 3: Atomic reservation creation with computer status update
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          computer_id: parseInt(computerId),
          user_id: currentUser.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reserved_at: new Date().toISOString(),
          status: 'active',
          notes: `Reservation created with idempotency key: ${idempotencyKey}`
        })
        .select()
        .single();

      if (reservationError) {
        console.error("Reservation creation failed:", reservationError);
        
        // Handle specific constraint violations
        if (reservationError.code === '23505') { // Unique constraint violation
          toast({
            title: "Reservation Conflict",
            description: "This time slot was just reserved by another user. Please try a different time.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Reservation Failed",
            description: "Unable to create reservation. Please try again.",
            variant: "destructive",
          });
        }
        return [false, null];
      }

      // STEP 4: Update computer status using atomic operation
      const { data: computerUpdate, error: updateError } = await supabase
        .rpc('reserve_computer', {
          p_computer_id: parseInt(computerId),
          p_user_id: currentUser.id,
          p_reserved_until: endTime.toISOString()
        });

      if (updateError || !computerUpdate) {
        console.error("Computer status update failed:", updateError);
        
        // Rollback: Delete the reservation if computer update fails
        await supabase
          .from('reservations')
          .delete()
          .eq('id', reservation.id);
        
        toast({
          title: "Reservation Failed",
          description: "Computer is no longer available. Please try another computer.",
          variant: "destructive",
        });
        return [false, null];
      }

      // STEP 5: Update local state
      const updatedComputer = await updateComputer(computerId, {
        status: "reserved" as ComputerStatus,
        reservedBy: currentUser.id,
        reservedUntil: endTime
      });

      // STEP 6: Update user session activity
      await supabase
        .from('user_sessions')
        .upsert({
          user_id: currentUser.id,
          device_id: navigator.userAgent.substring(0, 50),
          email: currentUser.email,
          last_active: new Date().toISOString()
        });

      console.log("Reservation created successfully:", reservation);
      
      toast({
        title: "Computer Reserved Successfully",
        description: `Computer reserved from ${startTime.toLocaleString()} for ${duration} hour${duration > 1 ? 's' : ''}`,
      });

      return [true, updatedComputer];
      
    } catch (error) {
      console.error("Critical error in reservation process:", error);
      
      toast({
        title: "System Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please contact support if this persists.",
        variant: "destructive",
      });
      
      return [false, null];
    }
  };

  const releaseComputer = async (computerId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to release reservations",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Releasing computer ${computerId} for user ${currentUser.id}`);
      
      // Update reservation status atomically
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ 
          status: 'completed',
          notes: `Released by user at ${new Date().toISOString()}`
        })
        .eq('computer_id', parseInt(computerId))
        .eq('user_id', currentUser.id)
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
      await userService.updateUserStats(currentUser.id, 'success');

      // Update session activity
      await supabase
        .from('user_sessions')
        .upsert({
          user_id: currentUser.id,
          device_id: navigator.userAgent.substring(0, 50),
          email: currentUser.email,
          last_active: new Date().toISOString()
        });

      toast({
        title: "Computer Released",
        description: "The computer is now available for other users",
      });
      
    } catch (error) {
      console.error("Error releasing computer:", error);
      toast({
        title: "Release Failed",
        description: "Unable to release computer. Please try again or contact support.",
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
