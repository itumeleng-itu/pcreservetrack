import { useEffect } from "react";
import { Computer, ComputerTracking } from "@/types";
import { useComputerState } from "./computerActions/useComputerState";
import { useReservationActions } from "./computerActions/useReservationActions";
import { useFaultActions } from "./computerActions/useFaultActions";
import { useTrackingUpdate } from "./computerActions/useTrackingUpdate";
import { useNotification } from "../context/NotificationContext";

export const useComputerActions = (initialComputers: Computer[]) => {
  const { computers, setComputers } = useComputerState(initialComputers);

  // Reservation logic
  const {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer: originalReleaseComputer,
    checkExpiredReservations,
  } = useReservationActions(computers, setComputers);

  // Fault logic
  const {
    getFaultyComputers,
    reportFault,
    fixComputer
  } = useFaultActions(computers, setComputers);

  // Tracking updates
  const { updateComputersFromTracking } = useTrackingUpdate(setComputers);
  const { setMessage } = useNotification();

  // Check for expired reservations every minute
  useEffect(() => {
    const interval = setInterval(checkExpiredReservations, 60000);
    checkExpiredReservations();
    return () => clearInterval(interval);
  }, [computers]);

  const releaseComputer = (id: string) => {
    originalReleaseComputer(id);
    setMessage("A PC is now available for reservation!");
  };

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
    updateComputersFromTracking
  };
};
