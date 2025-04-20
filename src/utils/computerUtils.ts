
import { Computer } from "../types";

// Generate 200 mock computers with iCentre1 and iCentre2 locations (100 each)
export const generateExtendedComputers = (): Computer[] => {
  const locations = ["iCentre1", "iCentre2"];
  const computers: Computer[] = [];
  
  // Generate 200 computers (100 per location)
  for (let i = 1; i <= 200; i++) {
    const computerNumber = i.toString().padStart(3, '0');
    const locationIndex = i <= 100 ? 0 : 1; // First 100 in iCentre1, next 100 in iCentre2
    const location = locations[locationIndex];
    
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

// Utility function to check if the current time is within booking hours
export const isWithinBookingHours = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const hour = now.getHours();
  
  // Check if it's Sunday (closed)
  if (dayOfWeek === 0) {
    return false;
  }
  
  // Monday to Thursday (8am - 10pm)
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    return hour >= 8 && hour < 22;
  }
  
  // Friday and Saturday (8am - 4pm)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return hour >= 8 && hour < 16;
  }
  
  return false;
};

// Get formatted booking hours message based on the current day
export const getBookingHoursMessage = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  if (dayOfWeek === 0) {
    return "Booking is closed on Sundays.";
  }
  
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    return "Booking is available from 8:00 AM to 10:00 PM.";
  }
  
  return "Booking is available from 8:00 AM to 4:00 PM.";
};
