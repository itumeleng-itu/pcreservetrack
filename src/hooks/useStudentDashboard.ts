
import { useState, useEffect } from "react";
import { useSupabaseComputers } from "@/context/SupabaseComputerContext";
import { useAuth } from "@/context/AuthContext";
import { Computer } from "@/types";

export function useStudentDashboard() {
  const { computers, getAvailableComputers } = useSupabaseComputers();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [myReservations, setMyReservations] = useState<Computer[]>([]);
  const [activeTab, setActiveTab] = useState("available");
  
  // Get available computers for filtering
  const availableComputers = getAvailableComputers();
  
  // Get unique locations for the filter
  const locations = Array.from(new Set(computers.map(c => c.location)));
  
  // Load user reservations whenever computers state changes
  useEffect(() => {
    console.log("Computers state or user changed, updating reservations");
    
    if (currentUser) {
      const userReservations = computers.filter(c => 
        c.status === "reserved" && c.reservedBy === currentUser.id
      );
      console.log("Found user reservations:", userReservations.length, "computers - IDs:", userReservations.map(c => c.id));
      setMyReservations(userReservations);
    }
  }, [computers, currentUser]);
  
  // Function to refresh the reservation list
  const refreshReservations = () => {
    console.log("Refreshing reservations manually");
    if (currentUser) {
      const userReservations = computers.filter(c => 
        c.status === "reserved" && c.reservedBy === currentUser.id
      );
      
      console.log("Manual refresh - User reservations:", userReservations.map(c => c.id));
      setMyReservations(userReservations);
    }
  };

  // Handle successful reservation by updating local state and switching tabs
  const handleReservationSuccess = (reservedComputer: Computer) => {
    console.log("Reservation success handler in StudentDashboard for computer:", reservedComputer.id);
    
    // Add the reserved computer to myReservations immediately
    setMyReservations(prev => {
      const exists = prev.some(c => c.id === reservedComputer.id);
      if (!exists) {
        console.log("Adding newly reserved computer to myReservations:", reservedComputer);
        return [...prev, reservedComputer];
      }
      return prev.map(c => c.id === reservedComputer.id ? reservedComputer : c);
    });
    
    // Switch tab to "my-reservations" immediately to show the newly reserved computer
    console.log("Switching to my-reservations tab after successful reservation");
    setActiveTab("my-reservations");
  };
  
  // Force refresh when tab changes to "my-reservations"
  useEffect(() => {
    console.log("Tab changed to:", activeTab);
    if (activeTab === "my-reservations") {
      refreshReservations();
    }
  }, [activeTab]);
  
  // Debug logs to track state
  useEffect(() => {
    console.log("Current dashboard state:", {
      allComputers: computers.length,
      available: availableComputers.length,
      myReservations: myReservations.length,
      myReservationIds: myReservations.map(r => r.id)
    });
  }, [computers, myReservations, availableComputers]);

  return {
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    myReservations,
    activeTab,
    setActiveTab,
    availableComputers,
    locations,
    refreshReservations,
    handleReservationSuccess
  };
}
