
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Computer } from '@/types';

interface ReservationRequest {
  computerId: string;
  startTime: Date;
  duration: number;
}

interface ReservationResult {
  success: boolean;
  computer?: Computer;
  error?: string;
  reservationId?: string;
}

/**
 * Production-grade atomic reservation system
 * Implements ACID transactions with rollback capability
 */
export const useAtomicReservation = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  /**
   * Creates a reservation using atomic database transaction
   * Includes automatic rollback on any failure
   */
  const createReservation = useCallback(async (
    request: ReservationRequest
  ): Promise<ReservationResult> => {
    if (!currentUser) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const { computerId, startTime, duration } = request;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    const idempotencyKey = `${currentUser.id}-${computerId}-${startTime.getTime()}`;

    console.log('Starting atomic reservation process:', {
      computerId,
      userId: currentUser.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      idempotencyKey
    });

    try {
      // Use the enhanced reserve_computer function with atomic operations
      const { data: reservationResult, error: reservationError } = await supabase
        .rpc('atomic_reserve_computer', {
          p_computer_id: parseInt(computerId),
          p_user_id: currentUser.id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
          p_idempotency_key: idempotencyKey
        });

      if (reservationError) {
        console.error('Atomic reservation failed:', reservationError);
        
        // Handle specific error types
        if (reservationError.message?.includes('COMPUTER_ALREADY_RESERVED')) {
          return {
            success: false,
            error: "This computer was just reserved by another user. Please try a different time slot."
          };
        }
        
        if (reservationError.message?.includes('USER_LIMIT_EXCEEDED')) {
          return {
            success: false,
            error: "You already have an active reservation. Students can only reserve one computer at a time."
          };
        }

        return {
          success: false,
          error: `Reservation failed: ${reservationError.message}`
        };
      }

      if (!reservationResult?.success) {
        return {
          success: false,
          error: reservationResult?.error || "Unknown reservation error"
        };
      }

      // Update user session activity
      await supabase
        .from('user_sessions')
        .upsert({
          user_id: currentUser.id,
          device_id: navigator.userAgent.substring(0, 50),
          email: currentUser.email,
          last_active: new Date().toISOString()
        });

      console.log('Reservation created successfully:', reservationResult);

      toast({
        title: "Reservation Confirmed",
        description: `Computer reserved from ${startTime.toLocaleString()} for ${duration} hour${duration > 1 ? 's' : ''}`,
      });

      return {
        success: true,
        reservationId: reservationResult.reservation_id,
        computer: {
          id: computerId,
          status: "reserved",
          reservedBy: currentUser.id,
          reservedUntil: endTime
        } as Computer
      };

    } catch (error) {
      console.error('Critical error in atomic reservation:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "System error occurred"
      };
    }
  }, [currentUser, toast]);

  /**
   * Releases a reservation with proper cleanup
   */
  const releaseReservation = useCallback(async (computerId: string): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to release reservations",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log(`Releasing reservation for computer ${computerId}`);

      const { data: releaseResult, error: releaseError } = await supabase
        .rpc('atomic_release_reservation', {
          p_computer_id: parseInt(computerId),
          p_user_id: currentUser.id
        });

      if (releaseError) {
        console.error('Release failed:', releaseError);
        toast({
          title: "Release Failed",
          description: "Unable to release reservation. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (!releaseResult?.success) {
        toast({
          title: "Release Failed",
          description: releaseResult?.error || "Unknown error occurred",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Reservation Released",
        description: "The computer is now available for other users",
      });

      return true;

    } catch (error) {
      console.error('Error releasing reservation:', error);
      toast({
        title: "System Error",
        description: "An unexpected error occurred. Please contact support.",
        variant: "destructive",
      });
      return false;
    }
  }, [currentUser, toast]);

  return {
    createReservation,
    releaseReservation
  };
};
