
import { Computer } from "@/types";
import { useReservationQueries } from "./useReservationQueries";
import { useReserveComputer } from "./useReserveComputer";
import { useReleaseComputer } from "./useReleaseComputer";
import { useReservationExpiry } from "./useReservationExpiry";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useReservationActions = (
  computers: Computer[],
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void,
  updateComputerInDB?: (computerId: string, updates: Partial<Computer>) => Promise<boolean>
) => {
  const { currentUser } = useAuth();
  // Query-related functions
  const { 
    getAvailableComputers, 
    getReservedComputers, 
    hasActiveReservation,
    hasActiveReservationAsync,
    isComputerAlreadyReserved,
    isComputerReservedForTime
  } = useReservationQueries(computers);
  
  // Reservation creation
  const { reserveComputer: originalReserveComputer } = useReserveComputer(computers, setComputers, hasActiveReservationAsync);
  
  // Reservation release
  const { releaseComputer: originalReleaseComputer } = useReleaseComputer(computers, setComputers);
  
  // Expiration checking
  const { checkExpiredReservations } = useReservationExpiry(computers, setComputers);

  // Enhanced reservation with logging
  const reserveComputer = async (computerId: string, startTime: Date, duration: number) => {
    const result = await originalReserveComputer(computerId, startTime, duration);
    
    if (result && currentUser) {
      const computer = computers.find(c => c.id === computerId);
      if (computer) {
        // Log reservation activity
        await supabase.from('activity_logs').insert({
          user_id: currentUser.id,
          action_type: 'computer_reserved',
          entity_type: 'computer',
          entity_id: computerId,
          old_data: { status: 'available' },
          new_data: { status: 'reserved', reserved_by: currentUser.id },
          metadata: { 
            computer_name: computer.name, 
            location: computer.location,
            duration_minutes: duration 
          }
        });
      }
    }
    
    return result;
  };

  // Enhanced release with logging
  const releaseComputer = async (computerId: string) => {
    const computer = computers.find(c => c.id === computerId);
    const result = await originalReleaseComputer(computerId);
    
    if (result && currentUser && computer) {
      // Log release activity
      await supabase.from('activity_logs').insert({
        user_id: currentUser.id,
        action_type: 'computer_released',
        entity_type: 'computer',
        entity_id: computerId,
        old_data: { status: 'reserved', reserved_by: currentUser.id },
        new_data: { status: 'available' },
        metadata: { 
          computer_name: computer.name, 
          location: computer.location 
        }
      });
    }
    
    return result;
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer,
    checkExpiredReservations,
  };
};
