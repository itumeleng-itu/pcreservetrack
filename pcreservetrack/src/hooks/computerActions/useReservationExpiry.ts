
import { Computer, ComputerStatus } from "@/types";

export const useReservationExpiry = (
  computers: Computer[],
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void
) => {
  // Expiry logic, runs every minute
  const checkExpiredReservations = () => {
    const now = new Date();
    const expired = computers.some(
      computer =>
        computer.status === "reserved" &&
        computer.reservedUntil &&
        computer.reservedUntil < now
    );
    if (expired) {
      setComputers(prevComputers =>
        prevComputers.map(computer => {
          if (
            computer.status === "reserved" &&
            computer.reservedUntil &&
            computer.reservedUntil < now
          ) {
            return {
              ...computer,
              status: "available" as ComputerStatus,
              reservedBy: undefined,
              reservedUntil: undefined,
            };
          }
          return computer;
        })
      );
    }
  };

  return { checkExpiredReservations };
};
