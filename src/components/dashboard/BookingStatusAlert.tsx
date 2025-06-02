
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { isWithinBookingHours } from "@/utils/computerUtils";
import { useSupabaseComputers } from "@/context/SupabaseComputerContext";

export function BookingStatusAlert() {
  const { computers, getAvailableComputers } = useSupabaseComputers();
  const isBookingOpen = isWithinBookingHours();
  const availableComputers = getAvailableComputers();
  const availableCount = availableComputers.length;
  const totalComputers = computers.length;

  console.log("BookingStatusAlert debug:", {
    totalComputers,
    availableCount,
    isBookingOpen,
    computersStatus: computers.map(c => ({ id: c.id, status: c.status }))
  });

  if (isBookingOpen) {
    return (
      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          <strong>Booking Open:</strong> You can reserve computers now. 
          {availableCount > 0 ? (
            <span className="ml-1">{availableCount} of {totalComputers} computers available.</span>
          ) : (
            <span className="ml-1">All {totalComputers} computers are currently reserved or unavailable.</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
      <Clock className="h-4 w-4 text-orange-500" />
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        <strong>Booking Closed:</strong> Computer reservations are only available between 8:00 AM and 10:00 PM.
        {availableCount > 0 ? (
          <span className="ml-1">{availableCount} of {totalComputers} computers will be available during booking hours.</span>
        ) : (
          <span className="ml-1">All {totalComputers} computers are currently reserved or under maintenance.</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
