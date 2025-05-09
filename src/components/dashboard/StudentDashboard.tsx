
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
  const [localComputers, setLocalComputers] = useState<Computer[]>([]);
  
  const bookingAvailable = isWithinBookingHours();
  const bookingMessage = getBookingHoursMessage();
  
  // Update local computers state whenever the main computers state changes
  useEffect(() => {
    console.log("Main computers state updated, updating local state");
    setLocalComputers(computers);
    
    // Also update myReservations immediately when computers state changes
    if (currentUser) {
      const userReservations = computers.filter(c => 
        c.status === "reserved" && c.reservedBy === currentUser.id
      );
      console.log("User reservations updated from computers state:", userReservations.map(c => c.id));
      setMyReservations(userReservations);
    }
  }, [computers, currentUser]);
  
  // Get available computers for filtering
  const availableComputers = localComputers.filter(c => c.status === "available");
  
  // Get unique locations for the filter
  const locations = Array.from(new Set(localComputers.map(c => c.location)));
  
  // Function to refresh the reservation list
  const refreshReservations = () => {
    console.log("Refreshing reservations manually");
    if (currentUser) {
      // Get all reserved computers from local state
      const allReservedComputers = localComputers.filter(c => 
        c.status === "reserved" && c.reservedBy === currentUser.id
      );
      
      console.log("User reservations:", allReservedComputers.map(c => c.id));
      setMyReservations(allReservedComputers);
    }
  };

  // Handle successful reservation by updating local state and switching tabs
  const handleReservationSuccess = (reservedComputer: Computer) => {
    console.log("Reservation success handler in StudentDashboard for computer:", reservedComputer.id);
    
    // Update local computers state to reflect the reservation
    setLocalComputers(prev => prev.map(computer => {
      if (computer.id === reservedComputer.id) {
        return { ...reservedComputer };
      }
      return computer;
    }));
    
    // Add the reserved computer to myReservations immediately
    setMyReservations(prev => {
      // Check if we already have this computer in myReservations
      const exists = prev.some(c => c.id === reservedComputer.id);
      if (!exists) {
        console.log("Adding newly reserved computer to myReservations");
        return [...prev, reservedComputer];
      }
      // If it already exists, update it
      return prev.map(c => c.id === reservedComputer.id ? reservedComputer : c);
    });
    
    // Switch tab to "my-reservations" immediately to show the newly reserved computer
    console.log("Switching to my-reservations tab after successful reservation");
    setActiveTab("my-reservations");
  };
  
  // Update reservations when tab changes
  useEffect(() => {
    console.log("Tab changed to:", activeTab);
    if (activeTab === "my-reservations") {
      refreshReservations();
    }
  }, [activeTab]);
  
  // Debug logs to track state
  useEffect(() => {
    console.log("Current dashboard state:", {
      allComputers: localComputers.length,
      available: availableComputers.length,
      myReservations: myReservations.length,
      myReservationIds: myReservations.map(r => r.id)
    });
  }, [localComputers, myReservations, availableComputers]);
  
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
              onReservationSuccess={handleReservationSuccess}
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
