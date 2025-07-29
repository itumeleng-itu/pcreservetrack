
import React, { createContext, useContext, ReactNode } from "react";
import { ComputerContextType } from "../types/computerContext";
import { useComputerActions } from "../hooks/useComputerActions";

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  const {
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
  } = useComputerActions();

  return (
    <ComputerContext.Provider
      value={{
        computers,
        reserveComputer,
        releaseComputer,
        reportFault,
        fixComputer,
        approveFix,
        getAvailableComputers,
        getReservedComputers,
        getFaultyComputers,
        hasActiveReservation,
        isComputerAlreadyReserved,
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
