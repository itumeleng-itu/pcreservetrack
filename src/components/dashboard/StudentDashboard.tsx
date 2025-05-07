
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
import { Clock, ComputerIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentDashboard() {
  const { computers, getReservedComputers, getAvailableComputers } = useComputers();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [myReservations, setMyReservations] = useState<Computer[]>([]);
  const [activeTab, setActiveTab] = useState("available");
  
  const bookingAvailable = isWithinBookingHours();
  const bookingMessage = getBookingHoursMessage();
  
  // Get available computers directly from the context
  const availableComputers = getAvailableComputers();
  
  // Get unique locations for the filter
  const locations = Array.from(new Set(computers.map(c => c.location)));
  
  // Function to refresh the reservation list
  const refreshReservations = () => {
    console.log("Refreshing reservations manually");
    if (currentUser) {
      // Get all reserved computers
      const allReservedComputers = getReservedComputers();
      console.log("All reserved computers:", allReservedComputers.map(c => c.id));
      
      // Filter for current user's reservations
      const userReservations = allReservedComputers.filter(computer => 
        computer.reservedBy === currentUser.id
      );
      
      console.log("User reservations:", userReservations.map(c => c.id));
      setMyReservations(userReservations);
    }
  };
  
  // Update reservations when computers change or when tab changes
  useEffect(() => {
    console.log("Refreshing dashboard, active tab:", activeTab);
    console.log("All computers:", computers.map(c => `${c.id} (${c.status})`));
    
    refreshReservations();
  }, [computers, currentUser, getReservedComputers, activeTab]);
  
  // Debug logs to track state
  useEffect(() => {
    console.log("Current reservations update:", {
      allComputers: computers.filter(c => c.status === "reserved").map(c => `${c.id} (${c.status})`),
      available: getAvailableComputers().length,
      reserved: getReservedComputers().length,
      myReservations: myReservations.map(c => c.id)
    });
  }, [computers, myReservations, getAvailableComputers, getReservedComputers]);
  
  // Filter available computers by search term and location
  const filteredComputers = availableComputers.filter(computer => {
    const matchesSearch = computer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          computer.specs.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === "all" || computer.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Force a refresh of the reservations when switching tabs
    if (value === "my-reservations") {
      refreshReservations();
    }
  };

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
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <ComputerIcon className="h-4 w-4" /> 
            Available Computers
          </TabsTrigger>
          <TabsTrigger value="my-reservations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> 
            My Reservations {myReservations.length > 0 && `(${myReservations.length})`}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                refreshReservations();
              }}
              className="h-5 w-5 ml-1"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </TabsTrigger>
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
              onReservationSuccess={refreshReservations}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="my-reservations">
          <ComputerGrid 
            computers={myReservations} 
            emptyMessage="You don't have any active reservations."
            onReservationSuccess={refreshReservations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
