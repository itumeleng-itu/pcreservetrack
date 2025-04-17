
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ComputerStatus } from "@/types";

interface StatusBadgeProps {
  status: ComputerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "faulty":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Badge className={getStatusColor(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
