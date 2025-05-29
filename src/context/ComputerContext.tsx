import React, { createContext, useContext, useState, ReactNode } from "react";
import { Computer, ComputerStatus, ComputerTracking } from "@/types";
import { mockComputers, mockReservations } from "@/services/mockData";

interface ComputerContextType {
  computers: Computer[];
  reservations: typeof mockReservations;
  reserveComputer: (computerId: string, hours: number, userId: string) => Promise<[boolean, Computer | null]>;
  releaseComputer: (computerId: string) => void;
  reportFault: (computerId: string, description: string, isEmergency: boolean) => void;
  fixComputer: (computerId: string) => void;
  getAvailableComputers: () => Computer[];
  getReservedComputers: () => Computer[];
  getFaultyComputers: () => Computer[];
  hasActiveReservation: (userId: string) => boolean;
  isComputerAlreadyReserved: (computerId: string) => boolean;
  getUserReservations: (userId: string) => typeof mockReservations;
  updateComputersFromTracking: (trackingData: ComputerTracking[]) => void;
}

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider = ({ children }: { children: ReactNode }) => {
  const [computers, setComputers] = useState<Computer[]>(mockComputers);
  const [reservations, setReservations] = useState<typeof mockReservations>(mockReservations);

  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => c.status === "reserved");
  };

  const getFaultyComputers = () => {
    return computers.filter(c => c.status === "faulty");
  };

  const hasActiveReservation = (userId: string) => {
    return computers.some(c => c.status === "reserved" && c.reservedBy === userId);
  };

  const isComputerAlreadyReserved = (computerId: string) => {
    return computers.some(c => c.id === computerId && c.status === "reserved");
  };

  const getUserReservations = (userId: string) => {
    return reservations.filter(r => r.userId === userId && r.status === "active");
  };

  const reserveComputer = async (computerId: string, hours: number, userId: string): Promise<[boolean, Computer | null]> => {
    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve) {
      return [false, null];
    }

    if (computerToReserve.status !== "available") {
      return [false, null];
    }

    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hours);

    // Create new reservation
    const newReservation = {
      id: String(reservations.length + 1),
      computerId,
      userId,
      startTime: new Date(),
      endTime,
      status: "active" as const
    };

    // Update reservations
    setReservations(prev => [...prev, newReservation]);

    // Update computer
    const updatedComputer: Computer = {
      ...computerToReserve,
      status: "reserved",
      reservedBy: userId,
      reservedUntil: endTime
    };

    setComputers(prevComputers =>
      prevComputers.map(c => c.id === computerId ? updatedComputer : c)
    );

    return [true, updatedComputer];
  };

  const releaseComputer = (computerId: string) => {
    // Update reservations
    setReservations(prev =>
      prev.map(r => {
        if (r.computerId === computerId && r.status === "active") {
          return { ...r, status: "completed" };
        }
        return r;
      })
    );

    // Update computer
    setComputers(prevComputers =>
      prevComputers.map(c => {
        if (c.id === computerId) {
          return {
            ...c,
            status: "available",
            reservedBy: undefined,
            reservedUntil: undefined
          };
        }
        return c;
      })
    );
  };

  const reportFault = (computerId: string, description: string, isEmergency: boolean) => {
    // Update reservations if computer was reserved
    setReservations(prev =>
      prev.map(r => {
        if (r.computerId === computerId && r.status === "active") {
          return { ...r, status: "cancelled" };
        }
        return r;
      })
    );

    // Update computer
    setComputers(prevComputers =>
      prevComputers.map(c => {
        if (c.id === computerId) {
          return {
            ...c,
            status: "faulty",
            faultDescription: description,
            isEmergency,
            reservedBy: undefined,
            reservedUntil: undefined
          };
        }
        return c;
      })
    );
  };

  const fixComputer = (computerId: string) => {
    setComputers(prevComputers =>
      prevComputers.map(c => {
        if (c.id === computerId) {
          return {
            ...c,
            status: "available",
            faultDescription: undefined,
            isEmergency: undefined
          };
        }
        return c;
      })
    );
  };

  const updateComputersFromTracking = (trackingData: ComputerTracking[]) => {
    setComputers(prevComputers =>
      prevComputers.map(computer => {
        const tracking = trackingData.find(t => t.computerId === computer.id);
        if (tracking) {
          return {
            ...computer,
            tracking: {
              online: tracking.online,
              lastHeartbeat: new Date(),
              cpuUsage: tracking.cpuUsage,
              memoryUsage: tracking.memoryUsage
            },
            lastSeen: new Date()
          };
        }
        return computer;
      })
    );
  };

  return (
    <ComputerContext.Provider
      value={{
        computers,
        reservations,
        reserveComputer,
        releaseComputer,
        reportFault,
        fixComputer,
        getAvailableComputers,
        getReservedComputers,
        getFaultyComputers,
        hasActiveReservation,
        isComputerAlreadyReserved,
        getUserReservations,
        updateComputersFromTracking
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
