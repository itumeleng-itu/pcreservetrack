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
  return hour >= 8 && hour < 22; // 8 AM to 10 PM
};

export const getBookingHoursMessage = (): string => {
  return "Computer reservations are only available between 8:00 AM and 10:00 PM.";
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
