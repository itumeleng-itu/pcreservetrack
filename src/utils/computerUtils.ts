import { Computer } from "../types";
import { isPublicHoliday, getPublicHolidayMessage } from "./dateUtils";

// Generate 80 mock computers with iCentre1 and iCentre2 locations (40 each)
export const generateExtendedComputers = (): Computer[] => {
  const locations = ["iCentre1", "iCentre2"];
  const computers: Computer[] = [];
  
  // Generate 80 computers (40 per location)
  for (let i = 1; i <= 80; i++) {
    const computerNumber = i.toString().padStart(3, '0');
    const locationIndex = i <= 40 ? 0 : 1; // First 40 in iCentre1, next 40 in iCentre2
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
export const isWithinBookingHours = (date: Date): boolean => {
  // Check if it's a public holiday
  if (isPublicHoliday(date).isHoliday) {
    return false;
  }
  
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const hour = date.getHours();
  
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
export const getBookingHoursMessage = (date: Date): string => {
  // Check for public holiday first
  const holidayMessage = getPublicHolidayMessage(date);
  if (holidayMessage) {
    return holidayMessage;
  }
  
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) {
    return "Booking is closed on Sundays.";
  }
  
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    return "Booking is available from 8:00 AM to 10:00 PM.";
  }
  
  return "Booking is available from 8:00 AM to 4:00 PM.";
};
