import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Computer } from "@/types";
import { useSupabaseComputers } from "@/context/SupabaseComputerContext";
import { useAuth } from "@/context/AuthContext";
import { ComputerCardHeader } from "./ComputerCardHeader";
import { ComputerSpecs } from "./ComputerSpecs";
import { ComputerCardActions } from "./ComputerCardActions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ComputerCardProps {
  computer: Computer;
  onReservationSuccess?: (updatedComputer: Computer) => void;
}

export function ComputerCard({ computer, onReservationSuccess }: ComputerCardProps) {
  const { reserveComputer, releaseComputer, reportFault, fixComputer } = useSupabaseComputers();
  const { currentUser } = useAuth();
  
  const handleReserve = async (startTime: Date, duration: number): Promise<boolean> => {
    const [success, updatedComputer] = await reserveComputer(computer.id, startTime, duration);
    if (success && updatedComputer && onReservationSuccess) {
      onReservationSuccess(updatedComputer);
    }
    return success;
  };

  const handleRelease = () => {
    console.log(`Releasing computer ${computer.id}`);
    releaseComputer(computer.id);
    
    if (onReservationSuccess) {
      console.log("Triggering onReservationSuccess callback after release");
      onReservationSuccess({...computer, status: "available", reservedBy: undefined, reservedUntil: undefined});
    }
  };

  const handleReportFault = async (description: string, isEmergency: boolean): Promise<boolean | void> => {
    return await reportFault(computer.id, description, isEmergency);
  };

  const handleFix = () => {
    fixComputer(computer.id);
  };

  const isReservedByCurrentUser = computer.reservedBy === currentUser?.id;
  const isOnline = computer.tracking?.online;
  
  // Time remaining for reservation
  const reservationTimeRemaining = computer.reservedUntil ? 
    formatDistanceToNow(computer.reservedUntil, { addSuffix: true }) : "";

  return (
    <Card 
      className={cn(
        "w-full transition-all duration-300 relative",
        // Base styling
        isOnline ? "bg-white" : "bg-gray-100 opacity-75",
        // Fault styling
        computer.status === "faulty" && "border-red-400 bg-red-50/30",
        // Reserved by others styling
        computer.status === "reserved" && !isReservedByCurrentUser && "border-blue-400 bg-blue-50/20",
        // MY RESERVATION: Bold green styling with enhanced visibility
        isReservedByCurrentUser && "border-green-600 border-2 bg-green-50 shadow-lg ring-2 ring-green-200 ring-opacity-50"
      )}
    >
      {/* MY RESERVATION Badge - Prominent positioning and styling */}
      {isReservedByCurrentUser && (
        <div className="absolute -top-3 -right-3 z-10">
          <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 text-sm shadow-lg">
            MY RESERVATION
          </Badge>
        </div>
      )}
      
      {/* Emergency indicator for faulty computers */}
      {computer.isEmergency && (
        <div className="absolute -top-2 -left-2 z-10">
          <Badge variant="destructive" className="animate-pulse font-bold">
            EMERGENCY
          </Badge>
        </div>
      )}

      <ComputerCardHeader computer={computer} />
      
      <CardContent className="relative">
        {/* Offline overlay */}
        {!isOnline && (
          <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-sm flex items-center justify-center rounded-md">
            <Badge variant="outline" className="bg-white border-gray-400 text-gray-600 font-semibold">
              Computer Offline
            </Badge>
          </div>
        )}
        
        {/* Current user's reservation highlight */}
        {isReservedByCurrentUser && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-green-800 font-semibold text-sm">
                ✓ Your Active Reservation
              </div>
              {computer.reservedUntil && (
                <div className="text-green-700 text-xs font-medium">
                  Ends {reservationTimeRemaining}
                </div>
              )}
            </div>
          </div>
        )}
        
        <ComputerSpecs 
          computer={computer} 
          isCurrentUser={isReservedByCurrentUser} 
        />
        
        {/* Reservation details for all reservations */}
        {computer.status === "reserved" && computer.reservedUntil && !isReservedByCurrentUser && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Reserved by another user</p>
              <p className="text-xs">Until: {reservationTimeRemaining}</p>
            </div>
          </div>
        )}

        {/* Fault information */}
        {computer.status === "faulty" && computer.faultDescription && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">
              <p className="font-medium">Reported Issue:</p>
              <p className="text-xs">{computer.faultDescription}</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <ComputerCardActions
          computer={computer}
          currentUser={currentUser}
          onReserve={handleReserve}
          onRelease={handleRelease}
          onReportFault={handleReportFault}
          onFix={handleFix}
          onReservationSuccess={onReservationSuccess}
        />
      </CardFooter>
    </Card>
  );
}
