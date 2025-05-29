import { Computer } from "@/types";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useComputers } from "@/context/ComputerContext";

export const useReserveComputer = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { 
    computers, 
    reserveComputer: contextReserveComputer,
    hasActiveReservation 
  } = useComputers();

  const reserveComputer = async (computerId: string, hours: number): Promise<[boolean, Computer | null]> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to reserve a computer",
        variant: "destructive",
      });
      return [false, null];
    }

    if (!isWithinBookingHours()) {
      toast({
        title: "Outside booking hours",
        description: getBookingHoursMessage(),
        variant: "destructive",
      });
      return [false, null];
    }

    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve) {
      toast({
        title: "Reservation failed",
        description: "Computer not found",
        variant: "destructive",
      });
      return [false, null];
    }

    if (computerToReserve.status !== "available") {
      toast({
        title: "Reservation failed",
        description: "This computer is no longer available",
        variant: "destructive",
      });
      return [false, null];
    }

    if (currentUser.role === "student" && hasActiveReservation(currentUser.id)) {
      toast({
        title: "Reservation failed",
        description: "Students can only reserve one computer at a time",
        variant: "destructive",
      });
      return [false, null];
    }

    try {
      const [success, updatedComputer] = await contextReserveComputer(computerId, hours, currentUser.id);
      
      if (success && updatedComputer) {
        toast({
          title: "Reservation successful",
          description: `Computer reserved until ${updatedComputer.reservedUntil?.toLocaleTimeString()}`,
        });
      } else {
        toast({
          title: "Reservation failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }

      return [success, updatedComputer];
    } catch (error) {
      console.error("Error reserving computer:", error);
      toast({
        title: "Reservation failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return [false, null];
    }
  };

  return { reserveComputer };
};
