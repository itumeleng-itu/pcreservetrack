
import { Computer } from "@/types";
import { useReservationQueries } from "./useReservationQueries";
import { useReserveComputer } from "./useReserveComputer";
import { useReleaseComputer } from "./useReleaseComputer";
import { useReservationExpiry } from "./useReservationExpiry";

export const useReservationActions = (
  computers: Computer[],
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void
) => {
  // Query-related functions
  const { getAvailableComputers, getReservedComputers, hasActiveReservation } = useReservationQueries(computers);
  
  // Reservation creation
  const { reserveComputer } = useReserveComputer(computers, setComputers, hasActiveReservation);
  
  // Reservation release
  const { releaseComputer } = useReleaseComputer(computers, setComputers);
  
  // Expiration checking
  const { checkExpiredReservations } = useReservationExpiry(computers, setComputers);

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    reserveComputer,
    releaseComputer,
    checkExpiredReservations,
  };
};
