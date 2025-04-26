import React from "react";
import { Computer } from "@/types";

interface ComputerCardProps {
  computer: Computer;
  onReserve: (computerId: string) => void; // Add a callback for reserving
}

export function ComputerCard({ computer, onReserve }: ComputerCardProps) {
  return (
    <div className="flex flex-col justify-between p-4 border rounded-lg shadow-sm bg-white w-full h-48 md:h-56">
      {/* Computer Name and Location */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 truncate">{computer.name}</h3>
        <p className="text-sm text-gray-600">{computer.location}</p>
      </div>

      {/* Computer Specs */}
      <div className="mt-2">
        <p className="text-sm text-gray-700">
          <strong>Specs:</strong> {computer.specs || "Not available"}
        </p>
      </div>

      {/* Status and Reserve Button */}
      <div className="flex items-center justify-between mt-4">
        <p
          className={`text-sm font-medium ${
            computer.status === "available" ? "text-green-600" : "text-red-600"
          }`}
        >
          {computer.status === "available" ? "Available" : "Unavailable"}
        </p>
        {computer.status === "available" && (
          <button
            onClick={() => onReserve(computer.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Reserve
          </button>
        )}
      </div>
    </div>
  );
}
