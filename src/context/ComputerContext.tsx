import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Computer } from "@/types";

type ComputerContextType = {
  computers: Computer[];
  loading: boolean;
  error: string | null;
  updateComputer: (computerId: string, updates: Partial<Computer>) => void;
  refreshComputers: () => Promise<void>;
  // Add any additional actions here (e.g., reserveComputer, releaseComputer)
};

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComputers = async () => {
    console.log("Fetching computers from Supabase...");
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("computers")
        .select("*");
      
      if (error) {
        console.error("Error fetching computers:", error);
        setError(error.message);
        setComputers([]);
      } else {
        console.log("Successfully fetched computers:", data);
        const transformedData = data.map(computer => ({
          ...computer,
          id: String(computer.id),
          reservedBy: computer.reserved_by,
          reservedUntil: computer.reserved_until ? new Date(computer.reserved_until) : undefined,
          specs: JSON.stringify(computer.specs)
        }));
        setComputers(transformedData as Computer[]);
      }
    } catch (err) {
      console.error("Exception while fetching computers:", err);
      setError("Failed to fetch computers");
      setComputers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputers();
  }, []);

  const updateComputer = (computerId: string, updates: Partial<Computer>) => {
    console.log("Updating computer:", computerId, "with updates:", updates);
    setComputers(prevComputers => 
      prevComputers.map(computer => 
        computer.id === computerId 
          ? { ...computer, ...updates }
          : computer
      )
    );
  };

  const refreshComputers = async () => {
    console.log("Manually refreshing computers...");
    await fetchComputers();
  };

  return (
    <ComputerContext.Provider value={{ 
      computers, 
      loading, 
      error,
      updateComputer,
      refreshComputers
    }}>
      {children}
    </ComputerContext.Provider>
  );
};

export const useComputers = () => {
  const context = useContext(ComputerContext);
  if (!context) {
    throw new Error("useComputers must be used within a ComputerProvider");
  }
  return context;
};
