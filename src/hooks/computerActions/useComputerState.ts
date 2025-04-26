
import { useState, useEffect } from "react";
import { Computer, ComputerStatus } from "@/types";

export const useComputerState = (initialComputers: Computer[]) => {
  const [computers, setComputers] = useState<Computer[]>(() => {
    // Clear existing stored computers to ensure we get the new count of 80
    localStorage.removeItem("pcReserveTrack_computers");
    
    const savedComputers = localStorage.getItem("pcReserveTrack_computers");
    if (savedComputers) {
      try {
        const parsed = JSON.parse(savedComputers, (key, value) => {
          if (
            (key === "reservedUntil" ||
              key === "lastSeen" ||
              key === "lastHeartbeat") &&
            typeof value === "string"
          ) {
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

  useEffect(() => {
    localStorage.setItem("pcReserveTrack_computers", JSON.stringify(computers));
  }, [computers]);

  return { computers, setComputers };
};
