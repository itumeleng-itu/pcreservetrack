
import { Computer, ComputerStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useReservationExpiry = (
  computers: Computer[],
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void
) => {
  // Expiry logic, runs every minute
  const checkExpiredReservations = async () => {
    const now = new Date();
    
    // Check database for expired reservations and update them
    const { data: expiredReservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now.toISOString());

    if (expiredReservations && expiredReservations.length > 0) {
      // Update expired reservations in database
      await supabase
        .from('reservations')
        .update({ status: 'expired' })
        .in('id', expiredReservations.map(r => r.id));

      // Update computers that had expired reservations
      for (const reservation of expiredReservations) {
        await supabase
          .from('computers')
          .update({ 
            status: 'available',
            reserved_by: null,
            reserved_until: null
          })
          .eq('id', reservation.computer_id);
      }
    }

    // Also check local state for expired reservations
    const expired = computers.some(
      computer =>
        computer.status === "reserved" &&
        computer.reservedUntil &&
        computer.reservedUntil < now
    );
    
    if (expired) {
      setComputers(prevComputers =>
        prevComputers.map(computer => {
          if (
            computer.status === "reserved" &&
            computer.reservedUntil &&
            computer.reservedUntil < now
          ) {
            return {
              ...computer,
              status: "available" as ComputerStatus,
              reservedBy: undefined,
              reservedUntil: undefined,
            };
          }
          return computer;
        })
      );
    }
  };

  return { checkExpiredReservations };
};
