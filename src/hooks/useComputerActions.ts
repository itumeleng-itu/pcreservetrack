
import { useState, useEffect } from "react";
import { Computer, ComputerStatus, ComputerTracking } from "../types";
import { mockReservations } from "../services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { isWithinBookingHours, getBookingHoursMessage } from "../utils/computerUtils";

export const useComputerActions = (initialComputers: Computer[]) => {
  const [computers, setComputers] = useState<Computer[]>(() => {
    // Try to load state from localStorage
    const savedComputers = localStorage.getItem("pcReserveTrack_computers");
    if (savedComputers) {
      try {
        // Parse date objects correctly
        const parsed = JSON.parse(savedComputers, (key, value) => {
          if (key === "reservedUntil" || key === "lastSeen" || key === "lastHeartbeat" && typeof value === "string") {
            return new Date(value);
          }
          return value;
        });
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved computers:", e);
      }
    }
    return initialComputers;
  });
  
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Save to localStorage whenever computers state changes
  useEffect(() => {
    localStorage.setItem("pcReserveTrack_computers", JSON.stringify(computers));
  }, [computers]);
  
  // Check for expired reservations every minute
  useEffect(() => {
    const checkExpiredReservations = () => {
      const now = new Date();
      const expired = computers.some(computer => 
        computer.status === "reserved" && 
        computer.reservedUntil && 
        computer.reservedUntil < now
      );
      
      if (expired) {
        setComputers(prevComputers => prevComputers.map(computer => {
          if (computer.status === "reserved" && 
              computer.reservedUntil && 
              computer.reservedUntil < now) {
            return {
              ...computer,
              status: "available" as ComputerStatus,
              reservedBy: undefined,
              reservedUntil: undefined
            };
          }
          return computer;
        }));
      }
    };
    
    const interval = setInterval(checkExpiredReservations, 60000);
    // Run once on mount
    checkExpiredReservations();
    
    return () => clearInterval(interval);
  }, [computers]);
  
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

    // Check if booking is allowed during current hours
    if (!isWithinBookingHours()) {
      toast({
        title: "Outside booking hours",
        description: getBookingHoursMessage(),
        variant: "destructive",
      });
      return;
    }

    // Check if the computer is still available (could have been reserved by another user)
    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve || computerToReserve.status !== "available") {
      toast({
        title: "Reservation failed",
        description: "This computer is no longer available",
        variant: "destructive",
      });
      return;
    }

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

  const reportFault = (computerId: string, description: string, isEmergency: boolean = false) => {
    const updatedComputers = computers.map(computer => {
      if (computer.id === computerId) {
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
          isEmergency,
          reservedBy: undefined,
          reservedUntil: undefined
        };
      }
      return computer;
    });

    setComputers(updatedComputers);
    
    const emergencyText = isEmergency ? "emergency " : "";
    toast({
      title: `${isEmergency ? "Emergency " : ""}Fault reported`,
      description: `The ${emergencyText}issue has been reported to technicians`,
      variant: isEmergency ? "destructive" : "default",
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
          faultDescription: undefined,
          isEmergency: undefined
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

  const updateComputersFromTracking = (trackingData: ComputerTracking[]) => {
    setComputers(prevComputers => {
      return prevComputers.map(computer => {
        const trackingInfo = trackingData.find(t => t.computerId === computer.id);
        
        if (trackingInfo) {
          return {
            ...computer,
            lastSeen: trackingInfo.lastHeartbeat,
            tracking: {
              online: trackingInfo.online,
              lastHeartbeat: trackingInfo.lastHeartbeat,
              cpuUsage: trackingInfo.cpuUsage,
              memoryUsage: trackingInfo.memoryUsage
            }
          };
        }
        
        return computer;
      });
    });
  };

  return {
    computers,
    getAvailableComputers,
    getReservedComputers,
    getFaultyComputers,
    hasActiveReservation,
    reserveComputer,
    releaseComputer,
    reportFault,
    fixComputer,
    updateComputersFromTracking
  };
};
