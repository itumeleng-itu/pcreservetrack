
import { useEffect } from "react";
import { Computer, ComputerTracking } from "@/types";
import { useComputerState } from "./computerActions/useComputerState";
import { useReservationActions } from "./computerActions/useReservationActions";
import { useFaultActions } from "./computerActions/useFaultActions";
import { useTrackingUpdate } from "./computerActions/useTrackingUpdate";

export const useComputerActions = (initialComputers: Computer[]) => {
  const { computers, setComputers } = useComputerState(initialComputers);

  const {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer,
    checkExpiredReservations,
  } = useReservationActions(computers, setComputers);

  const {
    getFaultyComputers,
    reportFault,
    fixComputer,
    confirmFix
  } = useFaultActions(computers, setComputers);

  const { updateComputersFromTracking } = useTrackingUpdate(setComputers);

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
    confirmFix,
    updateComputersFromTracking
  };
};
