
import React from "react";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "./ReservationDialog";
import { ReportIssueDialog } from "./ReportIssueDialog";
import { Computer } from "@/types";
import { User } from "@/types";
import { Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComputerCardActionsProps {
  computer: Computer;
  currentUser: User | null;
  onReserve: (hours: number) => Promise<boolean>;
  onRelease: () => void;
  onReportFault: (description: string, isEmergency: boolean) => void;
  onFix: () => void;
  onReservationSuccess?: (updatedComputer: Computer) => void;
}

export function ComputerCardActions({
  computer,
  currentUser,
  onReserve,
  onRelease,
  onReportFault,
  onFix,
  onReservationSuccess
}: ComputerCardActionsProps) {
  const { toast } = useToast();
  
  if (!currentUser) return null;

  const isStudent = currentUser.role === "student";
  const isAdmin = currentUser.role === "admin";
  const isTechnician = currentUser.role === "technician";
  const isReservedByCurrentUser = computer.reservedBy === currentUser.id;
  const isOnline = computer.tracking?.online;

  const handleReservationSuccess = (updatedComputer: Computer) => {
    if (onReservationSuccess) {
      console.log("Triggering onReservationSuccess callback from ComputerCardActions");
      onReservationSuccess(updatedComputer);
    }
  };

  const handleRelease = () => {
    onRelease();
    toast({
      title: "Reservation canceled",
      description: "The computer is now available for others",
    });
    
    // Also trigger the callback on release
    if (onReservationSuccess) {
      console.log("Triggering onReservationSuccess callback from ComputerCardActions after release");
      onReservationSuccess({...computer, status: "available", reservedBy: undefined, reservedUntil: undefined});
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {isStudent && computer.status === "available" && isOnline && (
        <ReservationDialog 
          onReserve={(hours) => onReserve(hours)}
          onReservationSuccess={handleReservationSuccess}
          computer={computer}
        />
      )}
      
      {isStudent && computer.status === "available" && !isOnline && (
        <Button size="sm" variant="outline" disabled className="flex items-center gap-1">
          <X className="h-4 w-4" /> Offline
        </Button>
      )}
      
      {isStudent && isReservedByCurrentUser && (
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={handleRelease}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" /> Cancel Reservation
        </Button>
      )}
      
      {isStudent && computer.status === "reserved" && !isReservedByCurrentUser && (
        <Button size="sm" variant="outline" disabled className="flex items-center gap-1">
          <Clock className="h-4 w-4" /> Reserved
        </Button>
      )}
      
      {isStudent && computer.status !== "faulty" && (
        <ReportIssueDialog onReportIssue={onReportFault} />
      )}
      
      {isAdmin && computer.status === "reserved" && (
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={onRelease}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" /> Force Release
        </Button>
      )}
      
      {isTechnician && computer.status === "faulty" && (
        <Button size="sm" onClick={onFix}>Mark as Fixed</Button>
      )}
    </div>
  );
}
