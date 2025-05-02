
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
    <div className="space-y-12">
      {Object.entries(computersByLocation).map(([location, locationComputers]) => (
        <div key={location} className="space-y-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-bold">{location}</h3>
            <div className="text-sm text-gray-500">
              ({locationComputers.length} computers)
            </div>
          </div>
          
          <div className="relative">
            {/* Left entrance indicator */}
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 bg-cyan-500 h-32 w-20 flex items-center justify-center text-white font-medium rounded-l-lg">
              Entrance
            </div>
            
            <div className="space-y-8">
              {/* Split into rows of 8 computers (4 on each side) */}
              {Array.from({ length: Math.ceil(locationComputers.length / 8) }).map((_, rowIndex) => {
                const rowComputers = locationComputers.slice(rowIndex * 8, (rowIndex + 1) * 8);
                const firstHalf = rowComputers.slice(0, 4);
                const secondHalf = rowComputers.slice(4);
                
                return (
                  <div key={rowIndex} className="relative">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-gray-500">Row {rowIndex + 1}</div>
                        {rowIndex === 0 && (
                          <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-green-500 h-32 w-20 flex items-center justify-center text-white font-medium rounded-r-lg">
                            Exit
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-8">
                        {/* Left side computers */}
                        <div className="flex space-x-4 bg-gray-100 p-4 rounded-lg">
                          {firstHalf.map((computer) => (
                            <div key={computer.id} className="w-[180px]">
                              <ComputerCard computer={computer} />
                            </div>
                          ))}
                        </div>
                        
                        {/* Center aisle */}
                        <div className="w-8 border-l border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-400 rotate-90">Aisle</span>
                        </div>
                        
                        {/* Right side computers */}
                        <div className="flex space-x-4 bg-gray-100 p-4 rounded-lg">
                          {secondHalf.map((computer) => (
                            <div key={computer.id} className="w-[180px]">
                              <ComputerCard computer={computer} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
