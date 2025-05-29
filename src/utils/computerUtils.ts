import { Computer, ComputerStatus } from "@/types";
import { isPublicHoliday, getPublicHolidayMessage } from "./dateUtils";
import { supabase } from "@/integrations/supabase/client";

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
export const isWithinBookingHours = (): boolean => {
  const now = new Date();
  
  // Check if it's a public holiday
  if (isPublicHoliday(now).isHoliday) {
    return false;
  }
  
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
  
  // Check for public holiday first
  const holidayMessage = getPublicHolidayMessage(now);
  if (holidayMessage) {
    return holidayMessage;
  }
  
  const dayOfWeek = now.getDay();
  
  if (dayOfWeek === 0) {
    return "Booking is closed on Sundays.";
  }
  
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    return "Booking is available from 8:00 AM to 10:00 PM.";
  }
  
  return "Booking is available from 8:00 AM to 4:00 PM.";
};

export const initializeComputers = async () => {
  const computers = [
    {
      name: "PC-001",
      location: "Lab A",
      status: "available",
      specs: {
        cpu: "Intel i7",
        ram: "16GB",
        storage: "512GB SSD",
        gpu: "NVIDIA RTX 3060"
      }
    },
    {
      name: "PC-002",
      location: "Lab A",
      status: "available",
      specs: {
        cpu: "Intel i7",
        ram: "16GB",
        storage: "512GB SSD",
        gpu: "NVIDIA RTX 3060"
      }
    },
    {
      name: "PC-003",
      location: "Lab B",
      status: "available",
      specs: {
        cpu: "Intel i9",
        ram: "32GB",
        storage: "1TB SSD",
        gpu: "NVIDIA RTX 3080"
      }
    },
    {
      name: "PC-004",
      location: "Lab B",
      status: "available",
      specs: {
        cpu: "Intel i9",
        ram: "32GB",
        storage: "1TB SSD",
        gpu: "NVIDIA RTX 3080"
      }
    },
    {
      name: "PC-005",
      location: "Lab C",
      status: "available",
      specs: {
        cpu: "AMD Ryzen 9",
        ram: "32GB",
        storage: "1TB SSD",
        gpu: "NVIDIA RTX 3090"
      }
    }
  ];

  try {
    // Insert computers into the database
    const { data, error } = await supabase
      .from('computers')
      .insert(computers)
      .select();

    if (error) {
      console.error("Error initializing computers:", error);
      return false;
    }

    console.log("Successfully initialized computers:", data);
    return true;
  } catch (error) {
    console.error("Error in initializeComputers:", error);
    return false;
  }
};
