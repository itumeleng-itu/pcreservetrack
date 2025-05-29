
import React, { useState, useEffect } from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { Computer } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
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

  const handleRefresh = () => {
    refreshReservations();
    setLastRefreshed(new Date());
  };

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
          onClick={handleRefresh}
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
          <p>Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
        </div>
      )}
      
      {localReservations.length === 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-4">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            If you've just made a reservation and don't see it here, try clicking the Refresh button above.
          </AlertDescription>
        </Alert>
      )}
      
      <ComputerGrid 
        computers={localReservations} 
        emptyMessage="You don't have any active reservations."
        onReservationSuccess={refreshReservations}
      />
    </div>
  );
}
