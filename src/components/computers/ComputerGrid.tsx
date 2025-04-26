import React from "react";
import { ComputerCard } from "./ComputerCard";
import { Computer } from "@/types";

interface ComputerGridProps {
  computers: Computer[];
  onReserve: (computerId: string) => void; // Callback for reserving a computer
  emptyMessage?: string;
}

export function ComputerGrid({ computers, onReserve, emptyMessage = "No computers available" }: ComputerGridProps) {
  if (computers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50">
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
        <div key={rowIndex} className="grid grid-cols-9 gap-6 items-start">
          {/* Left side: 4 computers */}
          {row.slice(0, 4).map((computer) => (
            <ComputerCard key={computer.id} computer={computer} onReserve={onReserve} />
          ))}

          {/* Aisle space */}
          <div className="col-span-1"></div>

          {/* Right side: 4 computers */}
          {row.slice(4).map((computer) => (
            <ComputerCard key={computer.id} computer={computer} onReserve={onReserve} />
          ))}
        </div>
      ))}
    </div>
  );
}
