
import React from "react";
import { Clock, AlertTriangle, Cpu, HardDrive } from "lucide-react";
import { Computer } from "@/types";

interface ComputerSpecsProps {
  computer: Computer;
  isCurrentUser: boolean;
}

export function ComputerSpecs({ computer, isCurrentUser }: ComputerSpecsProps) {
  const cpuUsage = computer.tracking?.cpuUsage;
  const memoryUsage = computer.tracking?.memoryUsage;

  return (
    <div className="text-sm">
      <p className="font-medium text-gray-700">Specifications</p>
      <p className="text-gray-600">{computer.specs}</p>
      
      {computer.status === "reserved" && computer.reservedUntil && (
        <div className="mt-2 flex items-center text-blue-600">
          <Clock className="mr-1" size={14} />
          <span className="text-xs">
            Reserved until {new Date(computer.reservedUntil).toLocaleString()}
            {computer.reservedBy && isCurrentUser && " (by you)"}
          </span>
        </div>
      )}
      
      {computer.status === "faulty" && computer.faultDescription && (
        <div className="mt-2 flex items-center text-red-600">
          <AlertTriangle className="mr-1" size={14} />
          <span className="text-xs">{computer.faultDescription}</span>
        </div>
      )}
      
      {computer.tracking && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {cpuUsage !== undefined && (
            <div className="flex items-center text-gray-600">
              <Cpu className="mr-1" size={14} />
              <span className="text-xs">CPU: {cpuUsage}%</span>
            </div>
          )}
          {memoryUsage !== undefined && (
            <div className="flex items-center text-gray-600">
              <HardDrive className="mr-1" size={14} />
              <span className="text-xs">Memory: {memoryUsage}%</span>
            </div>
          )}
        </div>
      )}

      {computer.lastSeen && (
        <div className="mt-1 text-xs text-gray-500">
          Last seen: {new Date(computer.lastSeen).toLocaleString()}
        </div>
      )}
    </div>
  );
}
