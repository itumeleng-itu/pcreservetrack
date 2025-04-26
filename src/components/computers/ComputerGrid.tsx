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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {computers.map((computer) => (
        <ComputerCard key={computer.id} computer={computer} />
      ))}
    </div>
  );
}
