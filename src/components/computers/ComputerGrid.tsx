
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

  // Group computers by location
  const computersByLocation: Record<string, Computer[]> = {};
  computers.forEach(computer => {
    if (!computersByLocation[computer.location]) {
      computersByLocation[computer.location] = [];
    }
    computersByLocation[computer.location].push(computer);
  });

  return (
    <div className="space-y-8">
      {Object.entries(computersByLocation).map(([location, locationComputers]) => (
        <div key={location} className="space-y-4">
          <h3 className="text-xl font-bold">{location}</h3>
          <div className="space-y-6 overflow-x-auto pb-4">
            {/* Split into rows of 20 computers with a gap in the middle */}
            {Array.from({ length: Math.ceil(locationComputers.length / 20) }).map((_, rowIndex) => {
              const rowComputers = locationComputers.slice(rowIndex * 20, (rowIndex + 1) * 20);
              
              // Split the row into two halves for the middle gap
              const firstHalf = rowComputers.slice(0, 10);
              const secondHalf = rowComputers.slice(10);
              
              return (
                <div key={rowIndex} className="flex flex-col">
                  <div className="text-sm text-gray-500 mb-2">Row {rowIndex + 1}</div>
                  <div className="flex space-x-8">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {firstHalf.map((computer) => (
                        <div key={computer.id} className="min-w-[220px]">
                          <ComputerCard computer={computer} />
                        </div>
                      ))}
                    </div>
                    <div className="w-8 border-l border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-400 rotate-90">Aisle</span>
                    </div>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {secondHalf.map((computer) => (
                        <div key={computer.id} className="min-w-[220px]">
                          <ComputerCard computer={computer} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
