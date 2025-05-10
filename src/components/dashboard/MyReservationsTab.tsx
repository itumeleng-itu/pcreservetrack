
import React, { useState, useEffect } from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { Computer } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MyReservationsTabProps {
  myReservations: Computer[];
  refreshReservations: () => void;
}

export function MyReservationsTab({ 
  myReservations, 
  refreshReservations 
}: MyReservationsTabProps) {
  const { currentUser } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [localReservations, setLocalReservations] = useState<Computer[]>([]);
  
  useEffect(() => {
    console.log("MyReservationsTab received reservations:", myReservations.length);
    setLocalReservations(myReservations);
    
    // Debug logging
    if (myReservations.length === 0) {
      console.log("No reservations found for current user:", currentUser?.id);
    } else {
      console.log("Reservation IDs:", myReservations.map(r => r.id));
      console.log("Reservation statuses:", myReservations.map(r => r.status));
      console.log("Reservation users:", myReservations.map(r => r.reservedBy));
    }
  }, [myReservations, currentUser]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2"
        >
          {showDetails ? (
            <>Debug Info <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Debug Info <ChevronDown className="h-4 w-4" /></>
          )}
        </Button>
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
      
      {showDetails && (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-mono overflow-auto max-h-40">
          <p>User ID: {currentUser?.id || 'Not logged in'}</p>
          <p>Reservations Count: {localReservations.length}</p>
          <p>Reservation IDs: {localReservations.map(r => r.id).join(', ') || 'None'}</p>
        </div>
      )}
      
      <ComputerGrid 
        computers={localReservations} 
        emptyMessage="You don't have any active reservations."
        onReservationSuccess={refreshReservations}
      />
    </div>
  );
}
