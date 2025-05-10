
import React from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { Computer } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface MyReservationsTabProps {
  myReservations: Computer[];
  refreshReservations: () => void;
}

export function MyReservationsTab({ 
  myReservations, 
  refreshReservations 
}: MyReservationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshReservations}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <ComputerGrid 
        computers={myReservations} 
        emptyMessage="You don't have any active reservations."
        onReservationSuccess={refreshReservations}
      />
    </div>
  );
}
