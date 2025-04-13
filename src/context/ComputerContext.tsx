
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Computer, ComputerStatus } from "../types";
import { mockComputers, mockReservations } from "../services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";

interface ComputerContextType {
  computers: Computer[];
  reserveComputer: (computerId: string, hours: number) => void;
  releaseComputer: (computerId: string) => void;
  reportFault: (computerId: string, description: string) => void;
  fixComputer: (computerId: string) => void;
  getAvailableComputers: () => Computer[];
  getReservedComputers: () => Computer[];
  getFaultyComputers: () => Computer[];
  hasActiveReservation: (userId: string) => boolean;
}

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  const [computers, setComputers] = useState<Computer[]>(mockComputers);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => c.status === "reserved");
  };

  const getFaultyComputers = () => {
    return computers.filter(c => c.status === "faulty");
  };

  // Check if a user has an active reservation
  const hasActiveReservation = (userId: string) => {
    return mockReservations.some(
      r => r.userId === userId && r.status === "active"
    ) || computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
  };

  const reserveComputer = (computerId: string, hours: number) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to reserve a computer",
        variant: "destructive",
      });
      return;
    }

    // Check if user is a student and already has a reservation
    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation failed",
        description: "Students can only reserve one computer at a time",
        variant: "destructive",
      });
      return;
    }

    const updatedComputers = computers.map(computer => {
      if (computer.id === computerId && computer.status === "available") {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + hours);
        
        // Create a new reservation
        const newReservation = {
          id: String(mockReservations.length + 1),
          computerId,
          userId: currentUser.id,
          startTime: new Date(),
          endTime,
          status: "active" as const
        };
        
        mockReservations.push(newReservation);
        
        return {
          ...computer,
          status: "reserved" as ComputerStatus,
          reservedBy: currentUser.id,
          reservedUntil: endTime
        };
      }
      return computer;
    });

    setComputers(updatedComputers);
    toast({
      title: "Computer reserved",
      description: `You have reserved a computer for ${hours} hour${hours > 1 ? 's' : ''}`,
    });
  };

  const releaseComputer = (computerId: string) => {
    const updatedComputers = computers.map(computer => {
      if (computer.id === computerId && computer.status === "reserved") {
        // Update the reservation status
        const reservation = mockReservations.find(
          r => r.computerId === computerId && r.status === "active"
        );
        
        if (reservation) {
          reservation.status = "completed";
        }
        
        return {
          ...computer,
          status: "available" as ComputerStatus,
          reservedBy: undefined,
          reservedUntil: undefined
        };
      }
      return computer;
    });

    setComputers(updatedComputers);
    toast({
      title: "Computer released",
      description: "The computer is now available for other users",
    });
  };

  const reportFault = (computerId: string, description: string) => {
    const updatedComputers = computers.map(computer => {
      if (computer.id === computerId) {
        // If the computer was reserved, cancel the reservation
        if (computer.status === "reserved") {
          const reservation = mockReservations.find(
            r => r.computerId === computerId && r.status === "active"
          );
          
          if (reservation) {
            reservation.status = "cancelled";
          }
        }
        
        return {
          ...computer,
          status: "faulty" as ComputerStatus,
          faultDescription: description,
          reservedBy: undefined,
          reservedUntil: undefined
        };
      }
      return computer;
    });

    setComputers(updatedComputers);
    toast({
      title: "Fault reported",
      description: "The issue has been reported to technicians",
    });
  };

  const fixComputer = (computerId: string) => {
    if (!currentUser || currentUser.role !== "technician") {
      toast({
        title: "Permission denied",
        description: "Only technicians can fix computers",
        variant: "destructive",
      });
      return;
    }

    const updatedComputers = computers.map(computer => {
      if (computer.id === computerId && computer.status === "faulty") {
        return {
          ...computer,
          status: "available" as ComputerStatus,
          faultDescription: undefined
        };
      }
      return computer;
    });

    setComputers(updatedComputers);
    toast({
      title: "Computer fixed",
      description: "The computer is now available for use",
    });
  };

  return (
    <ComputerContext.Provider
      value={{
        computers,
        reserveComputer,
        releaseComputer,
        reportFault,
        fixComputer,
        getAvailableComputers,
        getReservedComputers,
        getFaultyComputers,
        hasActiveReservation
      }}
    >
      {children}
    </ComputerContext.Provider>
  );
};

export const useComputers = () => {
  const context = useContext(ComputerContext);
  if (context === undefined) {
    throw new Error("useComputers must be used within a ComputerProvider");
  }
  return context;
};
