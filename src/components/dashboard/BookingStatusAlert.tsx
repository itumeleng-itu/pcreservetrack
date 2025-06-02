import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";

export function BookingStatusAlert() {
  const now = new Date();
  const bookingAvailable = isWithinBookingHours(now);
  const bookingMessage = getBookingHoursMessage(now) || "Unable to determine booking hours";
  
  return (
    <Alert className={bookingAvailable ? 
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : 
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"}>
      {bookingAvailable ? 
        <Clock className="h-4 w-4" /> : 
        <AlertCircle className="h-4 w-4 text-amber-500" />
      }
      <AlertTitle>{bookingAvailable ? "Booking is Available" : "Booking is Unavailable"}</AlertTitle>
      <AlertDescription>
        {bookingMessage}
      </AlertDescription>
    </Alert>
  );
}
