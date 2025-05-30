import { useState } from "react";
import { Computer } from "../types/computerContext";

export const useComputerActions = (initialComputers: Computer[]) => {
  const [computers, setComputers] = useState<Computer[]>(initialComputers);

  const getAvailableComputers = () => {
    return computers.filter(computer => !computer.isReserved);
  };

  const getReservedComputers = () => {
    return computers.filter(computer => computer.isReserved);
  };

  const getFaultyComputers = () => {
    return computers.filter(computer => computer.isFaulty);
  };

  const hasActiveReservation = (computerId: string) => {
    const computer = computers.find(comp => comp.id === computerId);
    return computer ? computer.isReserved : false;
  };

  const isComputerAlreadyReserved = (computerId: string) => {
    return computers.some(computer => computer.id === computerId && computer.isReserved);
  };

  const reserveComputer = (computerId: string) => {
    setComputers(prevComputers =>
      prevComputers.map(computer =>
        computer.id === computerId ? { ...computer, isReserved: true } : computer
      )
    );
  };

  const releaseComputer = (computerId: string) => {
    setComputers(prevComputers =>
      prevComputers.map(computer =>
        computer.id === computerId ? { ...computer, isReserved: false } : computer
      )
    );
  };

  const reportFault = (computerId: string) => {
    setComputers(prevComputers =>
      prevComputers.map(computer =>
        computer.id === computerId ? { ...computer, isFaulty: true } : computer
      )
    );
  };

  const fixComputer = (computerId: string) => {
    setComputers(prevComputers =>
      prevComputers.map(computer =>
        computer.id === computerId ? { ...computer, isFaulty: false } : computer
      )
    );
  };

  const updateComputersFromTracking = (updatedComputers: Computer[]) => {
    setComputers(updatedComputers);
  };

  return {
    computers,
    getAvailableComputers,
    getReservedComputers,
    getFaultyComputers,
    hasActiveReservation,
    isComputerAlreadyReserved,
    reserveComputer,
    releaseComputer,
    reportFault,
    fixComputer,
    updateComputersFromTracking
  };
};