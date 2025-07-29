
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Computer } from "@/types";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { ComputerCardHeader } from "./ComputerCardHeader";
import { ComputerSpecs } from "./ComputerSpecs";
import { ComputerCardActions } from "./ComputerCardActions";
import { RealtimeComputerStatus } from "../realtime/RealtimeComputerStatus";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ComputerCardProps {
  computer: Computer;
  onReservationSuccess?: (updatedComputer: Computer) => void;
}

export function ComputerCard({ computer, onReservationSuccess }: ComputerCardProps) {
  const { reserveComputer, releaseComputer, reportFault, fixComputer, approveFix } = useComputers();
  const { currentUser } = useAuth();
  
  const handleReserve = async (startTime: Date, duration: number): Promise<boolean> => {
    const [success, updatedComputer] = await reserveComputer(computer.id, startTime, duration);
    if (success && updatedComputer && onReservationSuccess) {
      onReservationSuccess(updatedComputer);
    }
    return success;
  };

  const handleRelease = () => {
    console.log(`Releasing computer ${computer.id}`);
    releaseComputer(computer.id);
    
    if (onReservationSuccess) {
      console.log("Triggering onReservationSuccess callback after release");
      onReservationSuccess({...computer, status: "available", reservedBy: undefined, reservedUntil: undefined});
    }
  };

  const handleReportFault = (description: string, isEmergency: boolean) => {
    reportFault(computer.id, description, isEmergency);
  };

  const handleFix = () => {
    fixComputer(computer.id);
  };

  const handleApproveFix = () => {
    approveFix(computer.id);
  };

  const isReservedByCurrentUser = computer.reservedBy === currentUser?.id;
  const isOnline = computer.tracking?.online;
  
  const reservationTimeRemaining = computer.reservedUntil ? 
    formatDistanceToNow(computer.reservedUntil, { addSuffix: true }) : "";

  return (
    <Card 
      className={cn(
        "w-full transition-all duration-200 relative",
        isOnline ? "bg-white" : "bg-gray-100 opacity-75",
        computer.status === "faulty" && "border-red-400",
        computer.status === "pending_approval" && "border-yellow-400",
        computer.status === "reserved" && !isReservedByCurrentUser && "border-blue-400",
        isReservedByCurrentUser && "border-green-500 shadow-md"
      )}
    >
      {isReservedByCurrentUser && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-green-500">Your Reservation</Badge>
        </div>
      )}
      <ComputerCardHeader computer={computer} />
      <div className="px-4 pb-2">
        <RealtimeComputerStatus computerId={computer.id} />
      </div>
      <CardContent className="relative">
        {!isOnline && (
          <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="outline" className="bg-white">Inactive</Badge>
          </div>
        )}
        {computer.isEmergency && (
          <Badge className="mb-2" variant="destructive">Emergency</Badge>
        )}
        {computer.status === "pending_approval" && (
          <Badge className="mb-2" variant="outline">Pending Admin Approval</Badge>
        )}
        <ComputerSpecs 
          computer={computer} 
          isCurrentUser={isReservedByCurrentUser} 
        />
        
        {computer.status === "reserved" && computer.reservedUntil && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="flex items-center">
              Reserved until: {reservationTimeRemaining}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <ComputerCardActions
          computer={computer}
          currentUser={currentUser}
          onReserve={handleReserve}
          onRelease={handleRelease}
          onReportFault={handleReportFault}
          onFix={handleFix}
          onApproveFix={handleApproveFix}
          onReservationSuccess={onReservationSuccess}
        />
      </CardFooter>
    </Card>
  );
}
