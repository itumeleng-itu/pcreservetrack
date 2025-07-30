
import { Computer } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useReservationQueries = (computers: Computer[]) => {
  const getAvailableComputers = () => {
    // Make sure we only return computers that are actually available
    const available = computers.filter(c => c.status === "available");
    console.log(`Found ${available.length} available computers`);
    return available;
  };

  const getReservedComputers = () => {
    // Make sure we return all reserved computers
    console.log("Fetching reserved computers...");
    const reservedComputers = computers.filter(c => c.status === "reserved");
    console.log("Reserved computers:", reservedComputers.map(c => c.id));
    return reservedComputers;
  };

  const hasActiveReservation = (userId: string) => {
    // Check computers state for immediate feedback
    const hasComputerReservation = computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
    
    console.log(`User ${userId} has reservation: computer=${hasComputerReservation}`);
    return hasComputerReservation;
  };

  // Async version for database checking
  const hasActiveReservationAsync = async (userId: string) => {
    try {
      // Check database for active reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      const hasDbReservation = reservations && reservations.length > 0;
      
      // Also check computers state for immediate feedback
      const hasComputerReservation = computers.some(
        c => c.status === "reserved" && c.reservedBy === userId
      );
      
      console.log(`User ${userId} has reservation: db=${hasDbReservation}, computer=${hasComputerReservation}`);
      return hasDbReservation || hasComputerReservation;
    } catch (error) {
      console.error('Error checking active reservations:', error);
      // Fallback to checking computer state
      return computers.some(c => c.status === "reserved" && c.reservedBy === userId);
    }
  };

  // Check if a computer is already reserved
  const isComputerAlreadyReserved = (computerId: string) => {
    const isReserved = computers.some(
      c => c.id === computerId && c.status === "reserved"
    );
    console.log(`Computer ${computerId} is reserved: ${isReserved}`);
    return isReserved;
  };

  // Async version for time-based checking
  const isComputerReservedForTime = async (computerId: string, startTime: Date, endTime: Date) => {
    try {
      // Check for conflicts in the database
      const { data: conflictingReservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'active')
        .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);
      
      const hasTimeConflict = conflictingReservations && conflictingReservations.length > 0;
      console.log(`Computer ${computerId} time conflict check: ${hasTimeConflict}`);
      return hasTimeConflict;
    } catch (error) {
      console.error('Error checking computer reservation status:', error);
      return computers.some(c => c.id === computerId && c.status === "reserved");
    }
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    hasActiveReservationAsync,
    isComputerAlreadyReserved,
    isComputerReservedForTime
  };
};
