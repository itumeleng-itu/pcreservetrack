
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Computer, ComputerTracking } from "../types";
import { useSupabaseComputers } from "./SupabaseComputerContext";
import { useToast } from "@/hooks/use-toast";

interface TrackingContextType {
  trackingData: ComputerTracking[];
  lastSync: Date | null;
  syncComputers: () => void;
  isLoading: boolean;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export const TrackingProvider = ({ children }: { children: ReactNode }) => {
  const [trackingData, setTrackingData] = useState<ComputerTracking[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { computers, updateComputersFromTracking } = useSupabaseComputers();
  const { toast } = useToast();

  // Simulated fetch to get computer tracking data
  const fetchTrackingData = async (): Promise<ComputerTracking[]> => {
    // In a real application, this would be an API call to your tracking server
    // For demonstration, we'll generate random data for existing computers
    return computers.map(computer => ({
      computerId: computer.id,
      online: Math.random() > 0.2, // 80% chance of being online
      lastHeartbeat: new Date(),
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100)
    }));
  };

  const syncComputers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTrackingData();
      setTrackingData(data);
      setLastSync(new Date());
      
      // Update computer status in SupabaseComputerContext based on tracking data
      updateComputersFromTracking(data);
      
      toast({
        title: "Computers synchronized",
        description: `Successfully synced ${data.length} computers from the tracking system.`,
      });
    } catch (error) {
      console.error("Failed to sync computers:", error);
      toast({
        title: "Sync failed",
        description: "Could not retrieve computer tracking data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial sync when the application loads
  useEffect(() => {
    syncComputers();
    // Set up regular syncing every 5 minutes
    const interval = setInterval(syncComputers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TrackingContext.Provider
      value={{
        trackingData,
        lastSync,
        syncComputers,
        isLoading
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
};
