
import { Computer } from "@/types";
import { mockReservations } from "@/services/mockData";

export const useReservationQueries = (computers: Computer[]) => {
  const getAvailableComputers = () => {
    // Make sure we only return computers that are actually available
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    // Make sure we return all reserved computers
    console.log("Fetching reserved computers...");
    const reservedComputers = computers.filter(c => c.status === "reserved");
    console.log("Reserved computers:", reservedComputers.map(c => c.id));
    return reservedComputers;
  };

  const hasActiveReservation = (userId: string) => {
    // Check both the mock reservations and the computers state
    const hasMockReservation = mockReservations.some(
      r => r.userId === userId && r.status === "active"
    );
    
    const hasComputerReservation = computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
    
    console.log(`User ${userId} has reservation: mock=${hasMockReservation}, computer=${hasComputerReservation}`);
    return hasMockReservation || hasComputerReservation;
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation
  };
};
