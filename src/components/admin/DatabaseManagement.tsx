import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { populateDatabase } from "@/scripts/populateDatabase";
import { useToast } from "@/hooks/use-toast";

export function DatabaseManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePopulateDatabase = async () => {
    try {
      setIsLoading(true);
      await populateDatabase();
      toast({
        title: "Success",
        description: "Database has been populated with mock data",
      });
    } catch (error) {
      console.error("Error populating database:", error);
      toast({
        title: "Error",
        description: "Failed to populate database. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>Manage database content and populate with mock data</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handlePopulateDatabase}
          disabled={isLoading}
        >
          {isLoading ? "Populating..." : "Populate with Mock Data"}
        </Button>
      </CardContent>
    </Card>
  );
} 