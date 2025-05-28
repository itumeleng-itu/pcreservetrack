import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { ComputerContextType } from "../types/computerContext";
import { generateExtendedComputers } from "../utils/computerUtils";
import { useComputerActions } from "../hooks/useComputerActions";
import { supabase } from "../utils/supabaseClient";

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  const initialComputers = generateExtendedComputers();
  
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
  } = useComputerActions(initialComputers);

  useEffect(() => {
    const channel = supabase
      .channel('computers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'computers' },
        (payload) => {
          fetchComputers(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComputers]);

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
async function fetchComputers() {
  const { data, error } = await supabase
    .from('computers')
    .select('*');
  if (error) {
    console.error("Failed to fetch computers:", error);
    return;
  }
  if (data) {
    updateComputersFromTracking(data);
  }
}
function updateComputersFromTracking(data: any[]) {
  // This function should update the computers state with the latest data from Supabase.
  // Since updateComputersFromTracking is also returned from useComputerActions,
  // we should call that version instead of defining a new one here.
  // So, this function is not needed and should be removed.
  // If you want to update computers here, you should lift the fetchComputers function
  // and use the updateComputersFromTracking from useComputerActions.

  // If you must keep this function, you could do:
  // (But this will not update the context state, just a placeholder)
  console.warn("updateComputersFromTracking should be provided by useComputerActions.");
}

