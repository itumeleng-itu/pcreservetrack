
import { Computer, ComputerStatus } from "@/types";
import { mockReservations } from "@/services/mockData";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReservationActions = (computers: Computer[], setComputers: (cb: (prev: Computer[]) => Computer[]) => void) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getAvailableComputers = () => {
    return computers.filter(c => c.status === "available");
  };

  const getReservedComputers = () => {
    return computers.filter(c => c.status === "reserved");
  };

  const hasActiveReservation = (userId: string) => {
    return mockReservations.some(
      r => r.userId === userId && r.status === "active"
    ) || computers.some(
      c => c.status === "reserved" && c.reservedBy === userId
    );
  };

  const reserveComputer = async (computerId: string, hours: number) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to reserve a computer",
        variant: "destructive",
      });
      return;
    }

    if (!isWithinBookingHours()) {
      toast({
        title: "Outside booking hours",
        description: getBookingHoursMessage(),
        variant: "destructive",
      });
      return;
    }

    const computerToReserve = computers.find(c => c.id === computerId);
    if (!computerToReserve) {
      toast({
        title: "Reservation failed",
        description: "Computer not found",
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

    try {
      const reservedUntil = new Date();
      reservedUntil.setHours(reservedUntil.getHours() + hours);

      // Make sure we're passing the correct data types to the Supabase function
      const numericComputerId = parseInt(computerId);
      
      // First check if the computer is still available
      const { data: computerData, error: checkError } = await supabase
        .from('computers')
        .select('status')
        .eq('id', numericComputerId)
        .single();
      
      if (checkError) {
        console.error('Computer check error:', checkError);
        throw checkError;
      }
      
      if (!computerData || computerData.status !== 'available') {
        toast({
          title: "Reservation failed",
          description: "This computer is no longer available",
          variant: "destructive",
        });
        return;
      }
      
      // Now call the reserve_computer function
      const { data, error } = await supabase.rpc(
        'reserve_computer',
        {
          p_computer_id: numericComputerId,
          p_user_id: currentUser.id,
          p_reserved_until: reservedUntil.toISOString()
        }
      );

      if (error) {
        console.error('Reservation error:', error);
        throw error;
      }

      // Check if the reservation was successful
      if (data === true) {
        // Update local state only if the database update was successful
        setComputers(prevComputers =>
          prevComputers.map(computer => {
            if (computer.id === computerId) {
              return {
                ...computer,
                status: "reserved" as ComputerStatus,
                reservedBy: currentUser.id,
                reservedUntil: reservedUntil
              };
            }
            return computer;
          })
        );

        toast({
          title: "Computer reserved",
          description: `You have reserved a computer for ${hours} hour${hours > 1 ? 's' : ''}`,
        });
      } else {
        toast({
          title: "Reservation failed",
          description: "Failed to reserve the computer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Reservation error:', error);
      toast({
        title: "Reservation failed",
        description: "An error occurred while trying to reserve the computer",
        variant: "destructive",
      });
    }
  };

  const releaseComputer = async (computerId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to release a computer",
        variant: "destructive",
      });
      return;
    }

    try {
      // Make sure we're passing a numeric ID
      const numericComputerId = parseInt(computerId);
      
      // Update the computer status in Supabase
      const { error } = await supabase
        .from('computers')
        .update({
          status: 'available',
          reserved_by: null,
          reserved_until: null
        })
        .eq('id', numericComputerId);

      if (error) {
        console.error('Release error:', error);
        throw error;
      }

      // Update local state
      setComputers(prevComputers => prevComputers.map(computer => {
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
            reservedUntil: undefined,
          };
        }
        return computer;
      }));
      
      toast({
        title: "Computer released",
        description: "The computer is now available for other users",
      });
    } catch (error) {
      console.error('Release error:', error);
      toast({
        title: "Release failed",
        description: "An error occurred while trying to release the computer",
        variant: "destructive",
      });
    }
  };

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

  return {
    getAvailableComputers,
    getReservedComputers,
    hasActiveReservation,
    reserveComputer,
    releaseComputer,
    checkExpiredReservations,
  };
};
