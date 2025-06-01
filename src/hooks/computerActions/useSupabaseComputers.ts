
import { useState, useEffect } from "react";
import { Computer } from "@/types";
import { computerService } from "@/services/supabaseServices";
import { useToast } from "@/hooks/use-toast";

export const useSupabaseComputers = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadComputers = async () => {
    try {
      setLoading(true);
      const data = await computerService.getAllComputers();
      setComputers(data);
    } catch (error) {
      console.error("Error loading computers:", error);
      toast({
        title: "Error",
        description: "Failed to load computers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateComputer = async (computerId: string, updates: Partial<Computer>) => {
    try {
      const updatedComputer = await computerService.updateComputer(computerId, updates);
      setComputers(prev => 
        prev.map(comp => comp.id === computerId ? updatedComputer : comp)
      );
      return updatedComputer;
    } catch (error) {
      console.error("Error updating computer:", error);
      toast({
        title: "Error",
        description: "Failed to update computer",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reserveComputer = async (computerId: string, userId: string, endTime: Date): Promise<[boolean, Computer | null]> => {
    try {
      const success = await computerService.reserveComputer(computerId, userId, endTime);
      if (success) {
        const updatedComputer = await computerService.updateComputer(computerId, {
          status: "reserved",
          reservedBy: userId,
          reservedUntil: endTime
        });
        return [true, updatedComputer];
      }
      return [false, null];
    } catch (error) {
      console.error("Error reserving computer:", error);
      return [false, null];
    }
  };

  useEffect(() => {
    loadComputers();
  }, []);

  return {
    computers,
    loading,
    updateComputer,
    reserveComputer,
    refreshComputers: loadComputers
  };
};
