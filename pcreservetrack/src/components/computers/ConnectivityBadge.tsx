
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectivityBadgeProps {
  isOnline: boolean;
}

export function ConnectivityBadge({ isOnline }: ConnectivityBadgeProps) {
  return (
    <Badge className={isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
      {isOnline ? <Wifi size={14} className="mr-1" /> : <WifiOff size={14} className="mr-1" />}
      {isOnline ? "Online" : "Offline"}
    </Badge>
  );
}
