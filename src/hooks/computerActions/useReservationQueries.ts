import { Computer } from "@/types";
import { mockReservations } from "@/services/mockData";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReservationQueries = (computers: Computer[]) => {
  const { currentUser } = useAuth();

  const getAvailableComputers = () => {
    // Make sure we only return computers that are actually available
    const available = computers.filter(c => c.status === "available");
    console.log(`Found ${available.length} available computers`);
    return available;
  };

  const getReservedComputers = async () => {
    console.log("Fetching reserved computers for user:", currentUser?.id);
    
    if (!currentUser) {
      console.log("No current user, returning empty array");
      return [];
    }

    // Fetch active reservations from the database
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*, computers(*)')
      .eq('user_id', currentUser.id)
      .eq('status', 'active');

    if (error) {
      console.error("Error fetching reservations:", error);
      return [];
    }

    // Map the database reservations to our Computer type
    const reservedComputers = reservations.map(r => ({
      ...r.computers,
      status: "reserved",
      reservedBy: currentUser.id,
      reservedUntil: new Date(r.end_time)
    }));

    console.log("User's reserved computers:", reservedComputers.map(c => c.id));
    return reservedComputers;
  };

  const hasActiveReservation = async (userId: string) => {
    // Check for active reservations in the database
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error("Error checking active reservations:", error);
      return false;
    }

    const hasReservation = reservations.length > 0;
    console.log(`User ${userId} has reservation: ${hasReservation}`);
    return hasReservation;
  };

  // Add a function to check if a computer is already reserved
  const isComputerAlreadyReserved = (computerId: string) => {
    const isReserved = computers.some(
      c => c.id === computerId && c.status === "reserved"
    );
    console.log(`Computer ${computerId} is reserved: ${isReserved}`);
    return isReserved;
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved
  };
};
