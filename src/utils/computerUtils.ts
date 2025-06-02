
import { Computer } from "@/types";

export const generateExtendedComputers = (): Computer[] => {
  // This function is no longer needed since we're using Supabase
  // Keeping it for backward compatibility but returning empty array
  console.warn("generateExtendedComputers is deprecated. Use Supabase data instead.");
  return [];
};

export const isWithinBookingHours = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if it's a weekday (Monday-Friday) and within hours
  const isWeekday = day >= 1 && day <= 5;
  const isWithinHours = hour >= 8 && hour < 22; // 8 AM to 10 PM
  
  return isWeekday && isWithinHours;
};

export const getBookingHoursMessage = (): string => {
  return "Computer reservations are only available Monday to Friday between 8:00 AM and 10:00 PM.";
};

export const getComputerById = (computers: Computer[], id: string): Computer | undefined => {
  return computers.find(computer => computer.id === id);
};

export const getComputersByLocation = (computers: Computer[], location: string): Computer[] => {
  return computers.filter(computer => computer.location === location);
};

export const getAvailableComputersCount = (computers: Computer[]): number => {
  return computers.filter(computer => computer.status === "available").length;
};

export const getReservedComputersCount = (computers: Computer[]): number => {
  return computers.filter(computer => computer.status === "reserved").length;
};

export const getFaultyComputersCount = (computers: Computer[]): number => {
  return computers.filter(computer => computer.status === "faulty").length;
};

export const isValidReservationTime = (startTime: Date, duration: number): boolean => {
  const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  const endMinutes = endTime.getMinutes();
  
  // Check if start time is within booking hours
  if (startHour < 8 || startHour >= 22) {
    return false;
  }
  
  // Check if end time is within booking hours (must end by 10 PM)
  if (endHour > 22 || (endHour === 22 && endMinutes > 0)) {
    return false;
  }
  
  return true;
};

export const formatReservationTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
