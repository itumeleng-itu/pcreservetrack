
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface AvailabilityCheck {
  available: boolean;
  conflictingReservations?: any[];
  error?: string;
}

/**
 * Production-grade reservation validation hook with atomic operations
 * Implements row-level locking and real-time conflict detection
 */
export const useReservationValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  /**
   * Atomic availability check with row-level locking
   * Uses SKIP LOCKED for high concurrency scenarios
   */
  const checkAvailability = useCallback(async (
    computerId: string,
    timeSlot: TimeSlot
  ): Promise<AvailabilityCheck> => {
    setIsValidating(true);
    
    try {
      console.log('Checking availability with row locking for:', {
        computerId,
        start: timeSlot.start.toISOString(),
        end: timeSlot.end.toISOString()
      });

      // Use database function for atomic overlap detection with row locking
      const { data: conflictData, error: conflictError } = await supabase
        .rpc('check_reservation_conflicts', {
          p_computer_id: parseInt(computerId),
          p_start_time: timeSlot.start.toISOString(),
          p_end_time: timeSlot.end.toISOString()
        });

      if (conflictError) {
        console.error('Conflict check failed:', conflictError);
        return {
          available: false,
          error: `Availability check failed: ${conflictError.message}`
        };
      }

      const hasConflicts = conflictData && conflictData.length > 0;
      
      if (hasConflicts) {
        console.log('Conflicts detected:', conflictData);
        return {
          available: false,
          conflictingReservations: conflictData
        };
      }

      // Additional check: Ensure computer is not faulty
      const { data: computerData, error: computerError } = await supabase
        .from('computers')
        .select('status, name')
        .eq('id', parseInt(computerId))
        .single();

      if (computerError) {
        return {
          available: false,
          error: `Computer status check failed: ${computerError.message}`
        };
      }

      if (computerData.status === 'faulty') {
        return {
          available: false,
          error: `${computerData.name} is currently out of service`
        };
      }

      return { available: true };

    } catch (error) {
      console.error('Availability check error:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Pre-validates a time slot before showing reservation dialog
   * Provides instant feedback to users
   */
  const preValidateSlot = useCallback(async (
    computerId: string,
    timeSlot: TimeSlot
  ): Promise<boolean> => {
    const result = await checkAvailability(computerId, timeSlot);
    
    if (!result.available) {
      if (result.conflictingReservations?.length) {
        toast({
          title: "Time Slot Unavailable",
          description: "This computer is already reserved for the selected time",
          variant: "destructive"
        });
      } else if (result.error) {
        toast({
          title: "Validation Error",
          description: result.error,
          variant: "destructive"
        });
      }
      return false;
    }

    return true;
  }, [checkAvailability, toast]);

  /**
   * Validates business hours for reservations
   */
  const validateBusinessHours = useCallback((timeSlot: TimeSlot): boolean => {
    const startHour = timeSlot.start.getHours();
    const endHour = timeSlot.end.getHours();
    const dayOfWeek = timeSlot.start.getDay();
    
    // Check if it's a weekday (Monday = 1, Friday = 5)
    if (dayOfWeek < 1 || dayOfWeek > 5) {
      toast({
        title: "Outside Business Hours",
        description: "Reservations are only allowed on weekdays",
        variant: "destructive"
      });
      return false;
    }

    // Check if within 8 AM - 10 PM window
    if (startHour < 8 || endHour > 22) {
      toast({
        title: "Outside Business Hours",
        description: "Reservations must be between 8:00 AM and 10:00 PM",
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [toast]);

  return {
    checkAvailability,
    preValidateSlot,
    validateBusinessHours,
    isValidating
  };
};
