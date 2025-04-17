
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Computer } from "@/types";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { ComputerCardHeader } from "./ComputerCardHeader";
import { ComputerSpecs } from "./ComputerSpecs";
import { ComputerCardActions } from "./ComputerCardActions";

interface ComputerCardProps {
  computer: Computer;
}

export function ComputerCard({ computer }: ComputerCardProps) {
  const { reserveComputer, releaseComputer, reportFault, fixComputer } = useComputers();
  const { currentUser } = useAuth();
  
  const handleReserve = (hours: number) => {
    reserveComputer(computer.id, hours);
  };

  const handleRelease = () => {
    releaseComputer(computer.id);
  };

  const handleReportFault = (description: string) => {
    reportFault(computer.id, description);
  };

  const handleFix = () => {
    fixComputer(computer.id);
  };

  const isReservedByCurrentUser = computer.reservedBy === currentUser?.id;

  return (
    <Card className="w-full">
      <ComputerCardHeader computer={computer} />
      <CardContent>
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
