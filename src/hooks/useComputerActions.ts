
import { useEffect } from "react";
import { Computer, ComputerTracking } from "@/types";
import { useComputerState } from "./computerActions/useComputerState";
import { useReservationActions } from "./computerActions/useReservationActions";
import { useFaultActions } from "./computerActions/useFaultActions";
import { useTrackingUpdate } from "./computerActions/useTrackingUpdate";
import { useSupabaseComputers } from "./useSupabaseComputers";

export const useComputerActions = () => {
  const { 
    computers: dbComputers, 
    isLoading, 
    updateComputer: updateComputerInDB,
    refetchComputers 
  } = useSupabaseComputers();
  
  const { computers, setComputers } = useComputerState(dbComputers);

  // Sync local state with database state
  useEffect(() => {
    setComputers(dbComputers);
  }, [dbComputers, setComputers]);

  // Reservation logic with database integration
  const {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer,
    checkExpiredReservations,
  } = useReservationActions(computers, setComputers, updateComputerInDB);

  // Fault logic with database integration
  const {
    getFaultyComputers,
    reportFault,
    fixComputer,
    approveFix
  } = useFaultActions(computers, setComputers, updateComputerInDB);

  // Tracking updates
  const { updateComputersFromTracking } = useTrackingUpdate(setComputers);

  // Check for expired reservations every minute
  useEffect(() => {
    const interval = setInterval(checkExpiredReservations, 60000);
    checkExpiredReservations();
    return () => clearInterval(interval);
  }, [computers]);

  return {
    computers,
    getAvailableComputers,
    getReservedComputers,
    getFaultyComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer,
    reportFault,
    fixComputer,
    approveFix,
    updateComputersFromTracking
  };
};
