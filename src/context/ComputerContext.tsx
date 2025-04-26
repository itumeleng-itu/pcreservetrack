
import React, { createContext, useContext, ReactNode } from "react";
import { ComputerContextType } from "../types/computerContext";
import { generateExtendedComputers } from "../utils/computerUtils";
import { useComputerActions } from "../hooks/useComputerActions";

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  // This will now generate 80 computers instead of 200
  const initialComputers = generateExtendedComputers();
  
  const {
    computers,
    getAvailableComputers,
    getReservedComputers,
    getFaultyComputers,
    hasActiveReservation,
    reserveComputer,
    releaseComputer,
    reportFault,
    fixComputer,
    updateComputersFromTracking
  } = useComputerActions(initialComputers);

  return (
    <ComputerContext.Provider
      value={{
        computers,
        reserveComputer,
        releaseComputer,
        reportFault,
        fixComputer,
        getAvailableComputers,
        getReservedComputers,
        getFaultyComputers,
        hasActiveReservation,
        updateComputersFromTracking
      }}
    >
      {children}
    </ComputerContext.Provider>
  );
};

export const useComputers = () => {
  const context = useContext(ComputerContext);
  if (context === undefined) {
    throw new Error("useComputers must be used within a ComputerProvider");
  }
  return context;
};
