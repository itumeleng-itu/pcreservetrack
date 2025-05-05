
import { Computer } from "@/types";
import { mockReservations } from "@/services/mockData";

export const useReservationQueries = (computers: Computer[]) => {
  const getAvailableComputers = () => {
    // Make sure we only return computers that are actually available
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    // Make sure we return all reserved computers
    return computers.filter(c => c.status === "reserved");
  };

  const hasActiveReservation = (userId: string) => {
    // Check both the mock reservations and the computers state
    const hasMockReservation = mockReservations.some(
      r => r.userId === userId && r.status === "active"
    );
    
    const hasComputerReservation = computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
    
    console.log(`User ${userId} reservation check: mock=${hasMockReservation}, computer=${hasComputerReservation}`);
    
    // Return the combined result - if either is true, they have an active reservation
    return hasMockReservation || hasComputerReservation;
  };
  
  // New function to check if a specific computer is already reserved
  const isComputerAlreadyReserved = (computerId: string) => {
    // Check both local state and mock reservations
    const isReservedInState = computers.some(
      c => c.id === computerId && c.status === "reserved"
    );
    
    const hasActiveReservationInMock = mockReservations.some(
      r => r.computerId === computerId && r.status === "active"
    );
    
    return isReservedInState || hasActiveReservationInMock;
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved
  };
};
