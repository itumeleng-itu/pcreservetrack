import React from "react";
import { ComputerCard } from "./ComputerCard";
import { Computer } from "@/types";
import { AlertCircle } from "lucide-react";

interface ComputerGridProps {
  computers: Computer[];
  emptyMessage?: string;
}

export function ComputerGrid({ computers, emptyMessage = "No computers available" }: ComputerGridProps) {
  if (computers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Results</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Split computers into rows of 8
  const rows = [];
  for (let i = 0; i < computers.length; i += 8) {
    rows.push(computers.slice(i, i + 8));
  }

  return (
    <div className="space-y-8">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-9 gap-4 items-center">
          {/* Left side: 4 computers */}
          {row.slice(0, 4).map((computer) => (
            <ComputerCard key={computer.id} computer={computer} />
          ))}

          {/* Aisle space */}
          <div className="col-span-1"></div>

          {/* Right side: 4 computers */}
          {row.slice(4).map((computer) => (
            <ComputerCard key={computer.id} computer={computer} />
          ))}
        </div>
      ))}
    </div>
  );
}
