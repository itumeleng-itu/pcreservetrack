
import React, { useState, useEffect } from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { useComputers } from "@/context/ComputerContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Computer } from "@/types";
import { isWithinBookingHours, getBookingHoursMessage } from "@/utils/computerUtils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

export function StudentDashboard() {
  const { computers } = useComputers();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [myReservations, setMyReservations] = useState<Computer[]>([]);
  
  const bookingAvailable = isWithinBookingHours();
  const bookingMessage = getBookingHoursMessage();
  
  const availableComputers = computers.filter(c => c.status === "available");
  
  // Get unique locations for the filter
  const locations = Array.from(new Set(computers.map(c => c.location)));
  
  // Update reservations when computers change
  useEffect(() => {
    if (currentUser) {
      const userReservations = computers.filter(c => 
        c.status === "reserved" && c.reservedBy === currentUser.id
      );
      setMyReservations(userReservations);
    }
  }, [computers, currentUser]);
  
  // Filter available computers by search term and location
  const filteredComputers = availableComputers.filter(computer => {
    const matchesSearch = computer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          computer.specs.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === "all" || computer.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">Reserve computers or manage your reservations.</p>
      </div>
      
      <Alert className={bookingAvailable ? "bg-green-50" : "bg-amber-50"}>
        <Clock className="h-4 w-4" />
        <AlertTitle>{bookingAvailable ? "Booking is Available" : "Booking is Unavailable"}</AlertTitle>
        <AlertDescription>
          {bookingMessage}
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Computers</TabsTrigger>
          <TabsTrigger value="my-reservations">My Reservations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          <div className="grid gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or specs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ComputerGrid 
              computers={filteredComputers} 
              emptyMessage="No available computers match your criteria." 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="my-reservations">
          <ComputerGrid 
            computers={myReservations} 
            emptyMessage="You don't have any active reservations." 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
