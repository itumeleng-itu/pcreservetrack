
import React, { createContext, useContext, ReactNode } from "react";
import { ComputerContextType } from "../types/computerContext";
import { useSupabaseComputerActions } from "../hooks/useSupabaseComputerActions";

const SupabaseComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const SupabaseComputerProvider = ({ children }: { children: ReactNode }) => {
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
    updateComputersFromTracking
  } = useSupabaseComputerActions();

  return (
    <SupabaseComputerContext.Provider
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
        isComputerAlreadyReserved,
        updateComputersFromTracking
      }}
    >
      {children}
    </SupabaseComputerContext.Provider>
  );
};

export const useSupabaseComputers = () => {
  const context = useContext(SupabaseComputerContext);
  if (context === undefined) {
    throw new Error("useSupabaseComputers must be used within a SupabaseComputerProvider");
  }
  return context;
};
