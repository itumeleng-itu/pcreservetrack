
import React from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { ComputerFilters } from "./ComputerFilters";
import { Computer } from "@/types";

interface AvailableComputersTabProps {
  availableComputers: Computer[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  locations: string[];
  onReservationSuccess: (computer: Computer) => void;
}

export function AvailableComputersTab({
  availableComputers,
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  locations,
  onReservationSuccess
}: AvailableComputersTabProps) {
  // Filter available computers by search term and location
  const filteredComputers = availableComputers.filter(computer => {
    const matchesSearch = computer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        computer.specs.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === "all" || computer.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="grid gap-4">
      <ComputerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        locations={locations}
      />
      
      <ComputerGrid 
        computers={filteredComputers} 
        emptyMessage="No available computers match your criteria."
        onReservationSuccess={onReservationSuccess}
      />
    </div>
  );
}
