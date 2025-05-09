
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Computer } from "@/types";

interface ReservationDialogProps {
  onReserve: (hours: number) => Promise<boolean>;
  onReservationSuccess?: (computer: Computer) => void;
  computer: Computer;
}

export function ReservationDialog({ onReserve, onReservationSuccess, computer }: ReservationDialogProps) {
  const [reservationHours, setReservationHours] = useState("0.25"); // Default to 15 minutes
  const [isReserving, setIsReserving] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleReserve = async () => {
    setIsReserving(true);
    try {
      const success = await onReserve(parseFloat(reservationHours));
      if (success) {
        // Create an updated computer object with the new reservation details
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + parseFloat(reservationHours));
        
        const updatedComputer: Computer = {
          ...computer,
          status: "reserved",
          reservedUntil: endTime
        };
        
        setOpen(false); // Close dialog after successful reservation
        
        if (onReservationSuccess) {
          console.log("Reservation successful, triggering callback with updated computer");
          onReservationSuccess(updatedComputer);
        }
      }
    } catch (error) {
      console.error("Error in reservation:", error);
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Reserve</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reserve Computer</DialogTitle>
          <DialogDescription>
            Choose how long you'd like to reserve this computer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">
              Time
            </Label>
            <Select
              value={reservationHours}
              onValueChange={setReservationHours}
              defaultValue="0.25"
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select reservation time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">15 minutes</SelectItem>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleReserve} disabled={isReserving}>
            {isReserving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reserving...
              </>
            ) : (
              "Reserve"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
