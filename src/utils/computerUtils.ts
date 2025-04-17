
import { Computer } from "../types";

// Generate 50 mock computers with iCentre1 and iCentre2 locations
export const generateExtendedComputers = (): Computer[] => {
  const locations = ["iCentre1", "iCentre2"];
  const computers: Computer[] = [];
  
  // Generate 50 computers
  for (let i = 1; i <= 50; i++) {
    const computerNumber = i.toString().padStart(3, '0');
    const location = locations[i % 2]; // Alternate between iCentre1 and iCentre2
    
    computers.push({
      id: `pc-${computerNumber}`,
      name: `PC-${computerNumber}`,
      location,
      status: "available",
      specs: "Intel i5, 16GB RAM, 512GB SSD",
      tracking: {
        online: true,
        lastHeartbeat: new Date(),
        cpuUsage: Math.floor(Math.random() * 20),
        memoryUsage: Math.floor(Math.random() * 30)
      },
      lastSeen: new Date()
    });
  }
  
  return computers;
};
