import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Computer } from "@/types";

type ComputerContextType = {
  computers: Computer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Add any additional actions here (e.g., reserveComputer, releaseComputer)
};

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComputers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("computers")
        .select("*");
      if (error) {
        setError(error.message);
        setComputers([]);
      } else {
        setComputers(
          (data ?? []).map((item) => ({
            ...item,
            id: String(item.id),
          })) as Computer[]
        );
      }
    } catch (err: any) {
      setError(err.message || "Unexpected error fetching computers");
      setComputers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputers();
  }, []);

  return (
    <ComputerContext.Provider value={{ computers, loading, error, refetch: fetchComputers }}>
      {children}
    </ComputerContext.Provider>
  );
};

export const useComputerContext = () => {
  const context = useContext(ComputerContext);
  if (!context) {
    throw new Error("useComputerContext must be used within a ComputerProvider");
  }
  return context;
};

export { useComputerContext as useComputers };
