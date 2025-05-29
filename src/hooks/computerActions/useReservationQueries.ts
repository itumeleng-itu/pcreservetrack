import { Computer } from "@/types";
import { mockReservations } from "@/services/mockData";
import { useAuth } from "@/context/AuthContext";

export const useReservationQueries = (computers: Computer[]) => {
  const { currentUser } = useAuth();

  const getAvailableComputers = () => {
    // Make sure we only return computers that are actually available
    const available = computers.filter(c => c.status === "available");
    console.log(`Found ${available.length} available computers`);
    return available;
  };

  const getReservedComputers = () => {
    console.log("Fetching reserved computers for user:", currentUser?.id);
    const reservedComputers = computers.filter(c => 
      c.status === "reserved" && c.reservedBy === currentUser?.id
    );
    console.log("User's reserved computers:", reservedComputers.map(c => c.id));
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

  // Add a function to check if a computer is already reserved
  const isComputerAlreadyReserved = (computerId: string) => {
    const isReserved = computers.some(
      c => c.id === computerId && c.status === "reserved"
    );
    console.log(`Computer ${computerId} is reserved: ${isReserved}`);
    return isReserved;
  };

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    isComputerAlreadyReserved
  };
};
