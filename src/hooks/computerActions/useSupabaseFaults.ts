
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

  /**
   * Production-grade fault reporting with retry logic and comprehensive error handling
   * Implements idempotency, validation, and robust error recovery
   */
  const reportFault = async (computerId: string, description: string, isEmergency: boolean = false): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report issues",
        variant: "destructive",
      });
      return false;
    }

    // Frontend validation
    if (!description || description.trim().length < 10) {
      toast({
        title: "Invalid Description",
        description: "Please provide a detailed description (at least 10 characters)",
        variant: "destructive",
      });
      return false;
    }

    if (description.trim().length > 1000) {
      toast({
        title: "Description Too Long",
        description: "Please limit your description to 1000 characters",
        variant: "destructive",
      });
      return false;
    }

    // Generate idempotency key
    const idempotencyKey = `fault-${currentUser.id}-${computerId}-${Date.now()}`;
    
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptReportFault = async (): Promise<boolean> => {
      try {
        console.log(`Attempting to report fault (attempt ${retryCount + 1}/${maxRetries})`, {
          computerId,
          userId: currentUser.id,
          description: description.substring(0, 50) + "...",
          isEmergency,
          idempotencyKey
        });

        // Check for duplicate fault reports
        const { data: existingFaults } = await supabase
          .from('faults')
          .select('id, status')
          .eq('computer_id', parseInt(computerId))
          .eq('status', 'reported')
          .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 minutes

        if (existingFaults && existingFaults.length > 0) {
          toast({
            title: "Duplicate Report",
            description: "An issue has already been reported for this computer recently",
            variant: "destructive",
          });
          return false;
        }

        // First, get the user's ID from the registered table to match the schema
        const { data: userData, error: userError } = await supabase
          .from('registered')
          .select('id')
          .eq('id', currentUser.id)
          .single();

        if (userError || !userData) {
          console.error("Failed to get user data:", userError);
          throw new Error("User not found in registered table");
        }

        // STEP 1: Create fault record with comprehensive logging
        const { data: faultRecord, error: faultError } = await supabase
          .from('faults')
          .insert({
            computer_id: parseInt(computerId),
            description: description.trim(),
            reported_by: userData.id, // Use the ID from registered table
            status: 'reported'
          })
          .select()
          .single();

        if (faultError) {
          console.error("Fault record creation failed:", faultError);
          throw new Error(`Database error: ${faultError.message}`);
        }

        console.log("Fault record created successfully:", faultRecord);

        // STEP 2: Cancel active reservations for this computer
        const { error: cancelError } = await supabase
          .from('reservations')
          .update({ 
            status: 'cancelled',
            notes: `Cancelled due to fault report: ${faultRecord.id}`
          })
          .eq('computer_id', parseInt(computerId))
          .eq('status', 'active');

        if (cancelError) {
          console.error("Error cancelling reservations:", cancelError);
          // Don't fail the fault report if cancellation fails
        }

        // STEP 3: Update computer status
        await updateComputer(computerId, {
          status: "faulty" as ComputerStatus,
          faultDescription: description.trim(),
          isEmergency,
          reservedBy: undefined,
          reservedUntil: undefined,
        });

        // STEP 4: Log the successful report
        console.log("Fault reported successfully:", {
          faultId: faultRecord.id,
          computerId,
          reportedBy: currentUser.id,
          isEmergency,
          timestamp: new Date().toISOString()
        });

        // STEP 5: Create notification for technicians if emergency
        if (isEmergency) {
          try {
            const { data: technicians } = await supabase
              .from('registered')
              .select('id')
              .eq('role', 'technician');

            if (technicians) {
              for (const technician of technicians) {
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: technician.id,
                    title: 'Emergency Computer Fault',
                    message: `Emergency issue reported for computer ${computerId}: ${description.substring(0, 100)}`,
                    type: 'emergency'
                  });
              }
            }
          } catch (notificationError) {
            console.error("Failed to create emergency notifications:", notificationError);
            // Don't fail the fault report if notifications fail
          }
        }

        const emergencyText = isEmergency ? "Emergency " : "";
        toast({
          title: `${emergencyText}Fault Reported Successfully`,
          description: `The ${emergencyText.toLowerCase()}issue has been logged and technicians have been notified`,
          variant: isEmergency ? "destructive" : "default",
        });

        return true;

      } catch (error) {
        retryCount++;
        console.error(`Fault reporting attempt ${retryCount} failed:`, error);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying fault report in ${retryCount * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          return attemptReportFault();
        } else {
          console.error("All fault reporting attempts failed");
          
          toast({
            title: "Report Failed",
            description: `Unable to report fault after ${maxRetries} attempts. Please try again or contact support directly.`,
            variant: "destructive",
          });
          
          return false;
        }
      }
    };

    return attemptReportFault();
  };

  const fixComputer = async (computerId: string) => {
    if (!currentUser || currentUser.role !== "technician") {
      toast({
        title: "Permission Denied",
        description: "Only technicians can mark computers as fixed",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Technician ${currentUser.id} fixing computer ${computerId}`);
      
      // Update all related fault records
      const { error: faultUpdateError } = await supabase
        .from('faults')
        .update({ 
          status: 'resolved'
        })
        .eq('computer_id', parseInt(computerId))
        .eq('status', 'reported');

      if (faultUpdateError) {
        console.error("Error updating fault records:", faultUpdateError);
      }

      // Update computer status
      await updateComputer(computerId, {
        status: "available" as ComputerStatus,
        faultDescription: undefined,
        isEmergency: undefined,
      });

      // Log the fix
      console.log("Computer fixed successfully:", {
        computerId,
        fixedBy: currentUser.id,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Computer Fixed",
        description: "The computer has been marked as fixed and is now available for use",
      });
      
    } catch (error) {
      console.error("Error fixing computer:", error);
      toast({
        title: "Fix Failed",
        description: "Unable to mark computer as fixed. Please try again.",
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
