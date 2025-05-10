
import React from "react";
import { Clock } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";

export function BookingStatusAlert() {
  const bookingAvailable = isWithinBookingHours();
  const bookingMessage = getBookingHoursMessage();
  
  return (
    <Alert className={bookingAvailable ? "bg-green-50" : "bg-amber-50"}>
      <Clock className="h-4 w-4" />
      <AlertTitle>{bookingAvailable ? "Booking is Available" : "Booking is Unavailable"}</AlertTitle>
      <AlertDescription>
        {bookingMessage}
      </AlertDescription>
    </Alert>
  );
}
