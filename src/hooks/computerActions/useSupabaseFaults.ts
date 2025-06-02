
import { Computer, ComputerStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useSupabaseFaults = (
  computers: Computer[],
  updateComputer: (id: string, updates: Partial<Computer>) => Promise<Computer>
) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const getFaultyComputers = () => {
    return computers.filter(c => c.status === "faulty");
  };

  const reportFault = async (computerId: string, description: string, isEmergency: boolean = false) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please login to report an issue",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create fault record in database
      const { data: faultRecord, error: faultError } = await supabase
        .from('faults')
        .insert({
          computer_id: parseInt(computerId),
          description: description,
          reported_by: parseInt(currentUser.id), // Note: This assumes reported_by is integer
          status: 'reported'
        })
        .select()
        .single();

      if (faultError) {
        console.error("Error creating fault record:", faultError);
        // Continue with computer update even if fault record fails
      }

      // Cancel any active reservation for this computer
      await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'active');

      // Update computer status
      await updateComputer(computerId, {
        status: "faulty" as ComputerStatus,
        faultDescription: description,
        isEmergency,
        reservedBy: undefined,
        reservedUntil: undefined,
      });

      const emergencyText = isEmergency ? "emergency " : "";
      toast({
        title: `${isEmergency ? "Emergency " : ""}Fault reported`,
        description: `The ${emergencyText}issue has been reported to technicians`,
        variant: isEmergency ? "destructive" : "default",
      });

      console.log("Fault reported successfully:", faultRecord);
    } catch (error) {
      console.error("Error reporting fault:", error);
      toast({
        title: "Error",
        description: "Failed to report fault. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fixComputer = async (computerId: string) => {
    if (!currentUser || currentUser.role !== "technician") {
      toast({
        title: "Permission denied",
        description: "Only technicians can fix computers",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update fault status in database
      await supabase
        .from('faults')
        .update({ status: 'resolved' })
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'reported');

      await updateComputer(computerId, {
        status: "available" as ComputerStatus,
        faultDescription: undefined,
        isEmergency: undefined,
      });

      toast({
        title: "Computer fixed",
        description: "The computer is now available for use",
      });
    } catch (error) {
      console.error("Error fixing computer:", error);
      toast({
        title: "Error",
        description: "Failed to mark computer as fixed",
        variant: "destructive",
      });
    }
  };

  return {
    getFaultyComputers,
    reportFault,
    fixComputer,
  };
};
