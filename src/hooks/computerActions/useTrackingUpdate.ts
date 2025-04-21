
import { Computer, ComputerTracking } from "@/types";

export const useTrackingUpdate = (setComputers: (cb: (prev: Computer[]) => Computer[]) => void) => {
  const updateComputersFromTracking = (trackingData: ComputerTracking[]) => {
    setComputers(prevComputers =>
      prevComputers.map(computer => {
        const trackingInfo = trackingData.find(t => t.computerId === computer.id);
        if (trackingInfo) {
          return {
            ...computer,
            lastSeen: trackingInfo.lastHeartbeat,
            tracking: {
              online: trackingInfo.online,
              lastHeartbeat: trackingInfo.lastHeartbeat,
              cpuUsage: trackingInfo.cpuUsage,
              memoryUsage: trackingInfo.memoryUsage,
            },
          };
        }
        return computer;
      })
    );
  };

  return { updateComputersFromTracking };
};
