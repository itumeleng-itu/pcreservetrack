
import { Computer } from "@/types";
import { mockReservations } from "@/services/mockData";

export const useReservationQueries = (computers: Computer[]) => {
  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => c.status === "reserved");
  };

  const hasActiveReservation = (userId: string) => {
    return mockReservations.some(
      r => r.userId === userId && r.status === "active"
    ) || computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation
  };
};
