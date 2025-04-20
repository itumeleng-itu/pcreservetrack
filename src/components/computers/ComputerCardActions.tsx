
import React from "react";
import { Button } from "@/components/ui/button";
import { ReservationDialog } from "./ReservationDialog";
import { ReportIssueDialog } from "./ReportIssueDialog";
import { Computer } from "@/types";
import { User } from "@/types";

interface ComputerCardActionsProps {
  computer: Computer;
  currentUser: User | null;
  onReserve: (hours: number) => void;
  onRelease: () => void;
  onReportFault: (description: string, isEmergency: boolean) => void;
  onFix: () => void;
}

export function ComputerCardActions({
  computer,
  currentUser,
  onReserve,
  onRelease,
  onReportFault,
  onFix
}: ComputerCardActionsProps) {
  if (!currentUser) return null;

  const isStudent = currentUser.role === "student";
  const isAdmin = currentUser.role === "admin";
  const isTechnician = currentUser.role === "technician";
  const isReservedByCurrentUser = computer.reservedBy === currentUser.id;
  const isOnline = computer.tracking?.online;

  return (
    <>
      {isStudent && computer.status === "available" && isOnline && (
        <ReservationDialog onReserve={onReserve} />
      )}
      
      {isStudent && computer.status === "available" && !isOnline && (
        <Button size="sm" variant="outline" disabled>
          Offline
        </Button>
      )}
      
      {isStudent && isReservedByCurrentUser && (
        <Button size="sm" onClick={onRelease}>Release</Button>
      )}
      
      {isStudent && computer.status === "reserved" && !isReservedByCurrentUser && (
        <Button size="sm" variant="outline" disabled>
          Reserved
        </Button>
      )}
      
      {isStudent && computer.status !== "faulty" && (
        <ReportIssueDialog onReportIssue={onReportFault} />
      )}
      
      {isAdmin && computer.status === "reserved" && (
        <Button size="sm" onClick={onRelease}>Force Release</Button>
      )}
      
      {isTechnician && computer.status === "faulty" && (
        <Button size="sm" onClick={onFix}>Mark as Fixed</Button>
      )}
    </>
  );
}
