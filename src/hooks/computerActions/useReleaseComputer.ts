import { Computer, ComputerStatus } from "@/types";
import { mockAdminLogs } from "@/services/mockData";
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
      
      // Update reservation status in database
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('computer_id', parseInt(computerId))
        .eq('user_id', currentUser?.id)
        .eq('status', 'active');

      if (reservationError) {
        console.error("Error updating reservation:", reservationError);
        toast({
          title: "Release failed",
          description: "Failed to update reservation in database",
          variant: "destructive",
        });
        return false;
      }

      // Update computer status in database
      const { error: computerError } = await supabase
        .from('computers')
        .update({ 
          status: 'available',
          reserved_by: null,
          reserved_until: null
        })
        .eq('id', parseInt(computerId));

      if (computerError) {
        console.error("Error updating computer:", computerError);
        // Continue anyway as reservation was updated
      }
      
      setComputers(prevComputers => {
        const updatedComputers = prevComputers.map(computer => {
          if (computer.id === computerId && computer.status === "reserved") {
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

      const computer = computers.find(c => c.id === computerId);
      if (computer && currentUser) {
        mockAdminLogs.push({
          id: `${Date.now()}-${Math.random()}`,
          eventType: "reservation_cancelled",
          computerId: computer.id,
          computerName: computer.name,
          location: computer.location,
          reporteeName: currentUser.name,
          cancellationTime: new Date(),
          createdAt: new Date(),
          details: "Reservation cancelled by student",
          status: "computer released",
        });
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
