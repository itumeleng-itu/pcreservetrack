
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Shield } from "lucide-react";
import { Computer } from "@/types";
import { useReservationValidation } from "@/hooks/useReservationValidation";
import { useAtomicReservation } from "@/hooks/useAtomicReservation";
import { Badge } from "@/components/ui/badge";

interface ReservationDialogProps {
  onReserve: (startTime: Date, duration: number) => Promise<boolean>;
  onReservationSuccess?: (computer: Computer) => void;
  computer: Computer;
}

export function ReservationDialog({ onReserve, onReservationSuccess, computer }: ReservationDialogProps) {
  const [reservationHours, setReservationHours] = useState("1");
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    if (now.getHours() < 8) {
      now.setHours(8);
    } else if (now.getHours() >= 22) {
      now.setDate(now.getDate() + 1);
      now.setHours(8);
    }
    return now.toISOString().slice(0, 16);
  });
  const [isReserving, setIsReserving] = useState(false);
  const [open, setOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  const { preValidateSlot, validateBusinessHours, isValidating } = useReservationValidation();
  const { createReservation } = useAtomicReservation();
  
  const handleReserve = async () => {
    const start = new Date(startTime);
    const duration = parseFloat(reservationHours);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    
    // Validate business hours
    if (!validateBusinessHours({ start, end })) {
      return;
    }
    
    setIsReserving(true);
    try {
      // Use the new atomic reservation system
      const result = await createReservation({
        computerId: computer.id,
        startTime: start,
        duration
      });

      if (result.success) {
        setOpen(false);
        if (onReservationSuccess && result.computer) {
          onReservationSuccess(result.computer);
        }
      }
    } catch (error) {
      console.error("Error in reservation:", error);
    } finally {
      setIsReserving(false);
    }
  };

  // Real-time validation when time slots change
  const handleTimeChange = async (newStartTime: string) => {
    setStartTime(newStartTime);
    
    if (newStartTime) {
      setValidationStatus('checking');
      const start = new Date(newStartTime);
      const duration = parseFloat(reservationHours);
      const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
      
      const isValid = await preValidateSlot(computer.id, { start, end });
      setValidationStatus(isValid ? 'valid' : 'invalid');
    }
  };

  const handleDurationChange = async (newDuration: string) => {
    setReservationHours(newDuration);
    
    if (startTime) {
      setValidationStatus('checking');
      const start = new Date(startTime);
      const duration = parseFloat(newDuration);
      const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
      
      const isValid = await preValidateSlot(computer.id, { start, end });
      setValidationStatus(isValid ? 'valid' : 'invalid');
    }
  };

  const getMinStartTime = () => {
    const now = new Date();
    if (now.getHours() < 8) {
      now.setHours(8, 0, 0, 0);
    } else if (now.getHours() >= 22) {
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0);
    }
    return now.toISOString().slice(0, 16);
  };

  const isValidReservation = () => {
    const start = new Date(startTime);
    const duration = parseFloat(reservationHours);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    
    return start.getHours() >= 8 && 
           start.getHours() < 22 && 
           (end.getHours() < 22 || (end.getHours() === 22 && end.getMinutes() === 0)) &&
           validationStatus !== 'invalid';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Reserve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reserve {computer.name}
          </DialogTitle>
          <DialogDescription>
            Choose your reservation time. Our system uses atomic locking to prevent double-bookings.
            Reservations are available weekdays between 8:00 AM and 10:00 PM.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <div className="col-span-3 space-y-2">
              <input
                type="datetime-local"
                id="startTime"
                className="w-full border rounded px-2 py-1"
                value={startTime}
                min={getMinStartTime()}
                onChange={e => handleTimeChange(e.target.value)}
                required
              />
              {validationStatus === 'checking' && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking availability...
                </div>
              )}
              {validationStatus === 'valid' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ Time slot available
                </Badge>
              )}
              {validationStatus === 'invalid' && (
                <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                  ✗ Time slot unavailable
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">
              Duration
            </Label>
            <Select
              value={reservationHours}
              onValueChange={handleDurationChange}
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
          
          {!isValidReservation() && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              <div className="font-medium">Reservation Requirements:</div>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Must be between 8:00 AM and 10:00 PM</li>
                <li>Must be on weekdays only</li>
                <li>Time slot must be available</li>
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleReserve} 
            disabled={isReserving || !isValidReservation() || isValidating}
            className="flex items-center gap-2"
          >
            {isReserving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Reservation...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Confirm Reservation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
