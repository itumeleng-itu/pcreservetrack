import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Computer, ComputerStatus } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

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
  const { toast } = useToast();
  const { currentUser } = useAuth();

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
          id: String(computer.id),
          name: computer.name,
          location: computer.location || "",
          status: (computer.reserved_by ? "reserved" : "available") as ComputerStatus,
          specs: JSON.stringify(computer.specs),
          reservedBy: computer.reserved_by || undefined,
          reservedUntil: computer.reserved_until ? new Date(computer.reserved_until) : undefined
        }));
        console.log("Transformed computers:", transformedData);
        setComputers(transformedData);
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

  const updateComputer = async (computerId: string, updates: Partial<Computer>) => {
    console.log("Updating computer:", computerId, "with updates:", updates);
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from("computers")
        .update({
          status: updates.status,
          reserved_by: updates.reservedBy,
          reserved_until: updates.reservedUntil?.toISOString()
        })
        .eq("id", parseInt(computerId));

      if (error) {
        console.error("Error updating computer in database:", error);
        toast({
          title: "Error",
          description: "Failed to update computer status",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setComputers(prevComputers => 
        prevComputers.map(computer => 
          computer.id === computerId 
            ? { ...computer, ...updates }
            : computer
        )
      );

      toast({
        title: "Success",
        description: "Computer status updated successfully"
      });
    } catch (err) {
      console.error("Error updating computer:", err);
      toast({
        title: "Error",
        description: "Failed to update computer status",
        variant: "destructive"
      });
    }
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
