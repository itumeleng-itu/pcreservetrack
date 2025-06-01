
import { Computer, ComputerTracking } from "@/types";
import { useSupabaseComputers } from "./computerActions/useSupabaseComputers";
import { useSupabaseReservations } from "./computerActions/useSupabaseReservations";
import { useSupabaseFaults } from "./computerActions/useSupabaseFaults";

export const useSupabaseComputerActions = () => {
  const { computers, loading, updateComputer, refreshComputers } = useSupabaseComputers();

  const {
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer
  } = useSupabaseReservations(computers, updateComputer);

  const {
    getFaultyComputers,
    reportFault,
    fixComputer
  } = useSupabaseFaults(computers, updateComputer);

  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => c.status === "reserved");
  };

  const updateComputersFromTracking = async (trackingData: ComputerTracking[]) => {
    try {
      for (const tracking of trackingData) {
        const computer = computers.find(c => c.id === tracking.computerId);
        if (computer) {
          await updateComputer(tracking.computerId, {
            lastSeen: tracking.lastHeartbeat,
            tracking: {
              online: tracking.online,
              lastHeartbeat: tracking.lastHeartbeat,
              cpuUsage: tracking.cpuUsage,
              memoryUsage: tracking.memoryUsage,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error updating computers from tracking:", error);
    }
  };

  return {
    computers,
    loading,
    getAvailableComputers,
    getReservedComputers,
    getFaultyComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer,
    reportFault,
    fixComputer,
    updateComputersFromTracking,
    refreshComputers
  };
};
