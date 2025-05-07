
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ComputerStatus } from "@/types";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: ComputerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          className: "bg-green-100 text-green-800 hover:bg-green-200",
          icon: <CheckCircle className="mr-1 h-3 w-3" />,
          label: "Available"
        };
      case "reserved":
        return {
          className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
          icon: <Clock className="mr-1 h-3 w-3" />,
          label: "Reserved"
        };
      case "faulty":
        return {
          className: "bg-red-100 text-red-800 hover:bg-red-200",
          icon: <AlertTriangle className="mr-1 h-3 w-3" />,
          label: "Faulty"
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
          icon: null,
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const { className, icon, label } = getStatusConfig(status);

  return (
    <Badge className={`flex items-center ${className}`} variant="outline">
      {icon}
      {label}
    </Badge>
  );
}
