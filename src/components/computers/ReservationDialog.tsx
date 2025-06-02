import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Computer } from "@/types";

interface ReservationDialogProps {
  onReserve: (startTime: Date, duration: number) => Promise<boolean>;
  onReservationSuccess?: (computer: Computer) => void;
  computer: Computer;
}

export function ReservationDialog({ onReserve, onReservationSuccess, computer }: ReservationDialogProps) {
  const [reservationHours, setReservationHours] = useState("1"); // Default to 1 hour
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  });
  const [isReserving, setIsReserving] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleReserve = async () => {
    setIsReserving(true);
    try {
      const start = new Date(startTime);
      const duration = parseFloat(reservationHours);
      const success = await onReserve(start, duration);
      if (success) {
        setOpen(false);
        const endTime = new Date(start);
        endTime.setHours(endTime.getHours() + duration);
        const updatedComputer: Computer = {
          ...computer,
          status: "reserved",
          reservedUntil: endTime
        };
        if (onReservationSuccess) {
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
            Choose your reservation start time and duration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <input
              type="datetime-local"
              id="startTime"
              className="col-span-3 border rounded px-2 py-1"
              value={startTime}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">
              Duration
            </Label>
            <Select
              value={reservationHours}
              onValueChange={setReservationHours}
              defaultValue="1"
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select reservation time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
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
