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
    console.log("=== MyReservationsTab Debug Info ===");
    console.log("Current User:", currentUser);
    console.log("Received Reservations:", myReservations);
    console.log("Reservations Count:", myReservations.length);
    
    if (myReservations.length === 0) {
      console.log("No reservations found for current user:", currentUser?.id);
    } else {
      console.log("Reservation Details:");
      myReservations.forEach(reservation => {
        console.log({
          id: reservation.id,
          status: reservation.status,
          reservedBy: reservation.reservedBy,
          reservedUntil: reservation.reservedUntil
        });
      });
    }
    
    setLocalReservations(myReservations);
  }, [myReservations, currentUser]);

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
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
          <p>User Role: {currentUser?.role || 'Not logged in'}</p>
          <p>Reservations Count: {localReservations.length}</p>
          <p>Reservation IDs: {localReservations.map(r => r.id).join(', ') || 'None'}</p>
          <p>Reservation Statuses: {localReservations.map(r => r.status).join(', ') || 'None'}</p>
          <p>Reserved By: {localReservations.map(r => r.reservedBy).join(', ') || 'None'}</p>
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
