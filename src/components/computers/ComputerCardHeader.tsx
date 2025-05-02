
import React from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Computer } from "@/types";

interface ComputerCardHeaderProps {
  computer: Computer;
}

export function ComputerCardHeader({ computer }: ComputerCardHeaderProps) {
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center">
            <Monitor className="mr-2" size={18} />
            {computer.name}
          </CardTitle>
          <CardDescription>{computer.location}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <StatusBadge status={computer.status} />
        </div>
      </div>
    </CardHeader>
  );
}
