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
      // Find the computer to confirm it exists and is reserved
      const computerToRelease = computers.find(c => c.id === computerId);
      
      if (!computerToRelease) {
        console.error(`Computer with ID ${computerId} not found`);
        toast({
          title: "Release failed",
          description: "Computer not found",
          variant: "destructive",
        });
        return;
      }
      
      if (computerToRelease.status !== "reserved") {
        console.error(`Computer with ID ${computerId} is not reserved`);
        toast({
          title: "Release failed",
          description: "This computer is not currently reserved",
          variant: "destructive",
        });
        return;
      }

      console.log(`Releasing computer ${computerId} from reservation`);
      
      setComputers(prevComputers => {
        const updatedComputers = prevComputers.map(computer => {
          if (computer.id === computerId && computer.status === "reserved") {
            const reservation = mockReservations.find(
              r => r.computerId === computerId && r.status === "active"
            );
            if (reservation) {
              console.log(`Completing reservation ${reservation.id}`);
              reservation.status = "completed";
            }
            
            console.log(`Updating computer ${computerId} status to available`);
            return {
              ...computer,
              status: "available" as ComputerStatus,
              reservedBy: undefined,
              reservedUntil: undefined,
            };
          }
          return computer;
        });
        
        // Log the updated state for debugging
        console.log("Updated computers after release:", 
          updatedComputers
            .filter(c => c.id === computerId || c.status === "reserved")
            .map(c => `${c.id} (${c.status})`)
        );
        
        return updatedComputers;
      });

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
      
      console.log(`Computer ${computerId} successfully released`);
      return true;
    } catch (error) {
      console.error("Error releasing computer:", error);
      toast({
        title: "Release failed",
        description: "There was an error processing your request",
        variant: "destructive",
      });
      return false;
    }
  };

  return { releaseComputer };
};
