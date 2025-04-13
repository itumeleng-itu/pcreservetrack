
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Computer } from "@/types";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, AlertTriangle, Clock } from "lucide-react";

interface ComputerCardProps {
  computer: Computer;
}

export function ComputerCard({ computer }: ComputerCardProps) {
  const { reserveComputer, releaseComputer, reportFault, fixComputer } = useComputers();
  const { currentUser } = useAuth();
  const [faultDescription, setFaultDescription] = useState("");
  const [reservationHours, setReservationHours] = useState("1");
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "faulty":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleReserve = () => {
    reserveComputer(computer.id, parseInt(reservationHours));
  };

  const handleRelease = () => {
    releaseComputer(computer.id);
  };

  const handleReportFault = () => {
    if (faultDescription.trim()) {
      reportFault(computer.id, faultDescription);
      setFaultDescription("");
    }
  };

  const handleFix = () => {
    fixComputer(computer.id);
  };

  const isReservedByCurrentUser = computer.reservedBy === currentUser?.id;
  const isStudent = currentUser?.role === "student";
  const isAdmin = currentUser?.role === "admin";
  const isTechnician = currentUser?.role === "technician";

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2" size={18} />
              {computer.name}
            </CardTitle>
            <CardDescription>{computer.location}</CardDescription>
          </div>
          <Badge className={getStatusColor(computer.status)}>
            {computer.status.charAt(0).toUpperCase() + computer.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p className="font-medium text-gray-700">Specifications</p>
          <p className="text-gray-600">{computer.specs}</p>
          
          {computer.status === "reserved" && computer.reservedUntil && (
            <div className="mt-2 flex items-center text-blue-600">
              <Clock className="mr-1" size={14} />
              <span className="text-xs">
                Reserved until {new Date(computer.reservedUntil).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {computer.status === "faulty" && computer.faultDescription && (
            <div className="mt-2 flex items-center text-red-600">
              <AlertTriangle className="mr-1" size={14} />
              <span className="text-xs">{computer.faultDescription}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isStudent && computer.status === "available" && (
          <Dialog>
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
                    Hours
                  </Label>
                  <Select
                    value={reservationHours}
                    onValueChange={setReservationHours}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleReserve}>Reserve</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {isStudent && isReservedByCurrentUser && (
          <Button size="sm" onClick={handleRelease}>Release</Button>
        )}
        
        {isStudent && computer.status !== "faulty" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Report Issue</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
                <DialogDescription>
                  Describe the problem you're experiencing with this computer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue..."
                    value={faultDescription}
                    onChange={(e) => setFaultDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleReportFault}>Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {isAdmin && computer.status === "reserved" && (
          <Button size="sm" onClick={handleRelease}>Force Release</Button>
        )}
        
        {isTechnician && computer.status === "faulty" && (
          <Button size="sm" onClick={handleFix}>Mark as Fixed</Button>
        )}
      </CardFooter>
    </Card>
  );
}
