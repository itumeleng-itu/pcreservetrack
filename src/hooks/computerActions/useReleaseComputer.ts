import { Computer, ComputerStatus } from "@/types";
import { mockReservations } from "@/services/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useReleaseComputer = (
  computers: Computer[],
  setComputers: (cb: (prev: Computer[]) => Computer[]) => void
) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const releaseComputer = async (computerId: string) => {
    try {
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

      // Update user's last active timestamp to keep session fresh
      if (currentUser) {
        await supabase.from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .match({ user_id: currentUser.id });
      }

      toast({
        title: "Computer released",
        description: "The computer is now available for other users",
      });
    } catch (error) {
      console.error("Error releasing computer:", error);
      toast({
        title: "Release failed",
        description: "There was an error processing your request",
        variant: "destructive",
      });
    }
  };

  return { releaseComputer };
};
