import React from "react";
import { Computer } from "@/types";

interface ComputerCardProps {
  computer: Computer;
}

export function ComputerCard({ computer }: ComputerCardProps) {
  return (
    <div className="flex flex-col justify-between p-4 border rounded-lg shadow-sm bg-white w-full h-32 md:h-40">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 truncate">{computer.name}</h3>
        <p className="text-sm text-gray-600">{computer.location}</p>
      </div>
      <div>
        <p
          className={`text-sm font-medium ${
            computer.status === "available" ? "text-green-600" : "text-red-600"
          }`}
        >
          {computer.status === "available" ? "Available" : "Unavailable"}
        </p>
      </div>
    </div>
  );
}
