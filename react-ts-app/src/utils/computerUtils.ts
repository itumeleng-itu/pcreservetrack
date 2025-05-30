import { Computer } from "../types/computerContext";

export const generateExtendedComputers = (): Computer[] => {
  const computers: Computer[] = [
    { id: 1, name: "Computer 1", status: "available" },
    { id: 2, name: "Computer 2", status: "reserved" },
    { id: 3, name: "Computer 3", status: "faulty" },
    // Add more computers as needed
  ];

  return computers.map(computer => ({
    ...computer,
    extendedInfo: `Extended info for ${computer.name}`
  }));
};