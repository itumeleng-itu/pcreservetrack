
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Computer } from "@/types";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { ComputerCardHeader } from "./ComputerCardHeader";
import { ComputerSpecs } from "./ComputerSpecs";
import { ComputerCardActions } from "./ComputerCardActions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComputerCardProps {
  computer: Computer;
}

export function ComputerCard({ computer }: ComputerCardProps) {
  const { reserveComputer, releaseComputer, reportFault, fixComputer } = useComputers();
  const { currentUser } = useAuth();
  
  const handleReserve = async (hours: number) => {
    // Pass the computer ID and hours to the reserveComputer function
    await reserveComputer(computer.id, hours);
  };

  const handleRelease = () => {
    releaseComputer(computer.id);
  };

  const handleReportFault = (description: string, isEmergency: boolean) => {
    reportFault(computer.id, description, isEmergency);
  };

  const handleFix = () => {
    fixComputer(computer.id);
  };

  const isReservedByCurrentUser = computer.reservedBy === currentUser?.id;
  const isOnline = computer.tracking?.online;

  return (
    <Card 
      className={cn(
        "w-full transition-all duration-200",
        isOnline ? "bg-white" : "bg-gray-100 opacity-75",
        computer.status === "faulty" && "border-red-200",
        computer.status === "reserved" && "border-blue-200"
      )}
    >
      <ComputerCardHeader computer={computer} />
      <CardContent className="relative">
        {!isOnline && (
          <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="outline" className="bg-white">Inactive</Badge>
          </div>
        )}
        {computer.isEmergency && (
          <Badge className="mb-2" variant="destructive">Emergency</Badge>
        )}
        <ComputerSpecs 
          computer={computer} 
          isCurrentUser={isReservedByCurrentUser} 
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <ComputerCardActions
          computer={computer}
          currentUser={currentUser}
          onReserve={handleReserve}
          onRelease={handleRelease}
          onReportFault={handleReportFault}
          onFix={handleFix}
        />
      </CardFooter>
    </Card>
  );
}
