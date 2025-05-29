import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initializeComputers } from "@/utils/computerUtils";
import { useToast } from "@/hooks/use-toast";

export function InitializeDatabase() {
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeComputers();
      if (success) {
        toast({
          title: "Database initialized",
          description: "Computers have been added to the database",
        });
      } else {
        toast({
          title: "Initialization failed",
          description: "There was an error initializing the database",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      toast({
        title: "Initialization failed",
        description: "There was an error initializing the database",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Database Initialization</h2>
      <p className="text-sm text-gray-500 mb-4">
        Click the button below to initialize the database with sample computers.
        This will only work if the database is empty.
      </p>
      <Button
        onClick={handleInitialize}
        disabled={isInitializing}
      >
        {isInitializing ? "Initializing..." : "Initialize Database"}
      </Button>
    </div>
  );
} 