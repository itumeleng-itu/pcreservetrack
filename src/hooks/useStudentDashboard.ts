
import { useState, useEffect } from "react";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { Computer } from "@/types";

export function useStudentDashboard() {
  const { computers, getAvailableComputers } = useComputers();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [myReservations, setMyReservations] = useState<Computer[]>([]);
  const [activeTab, setActiveTab] = useState("available");
  const [localComputers, setLocalComputers] = useState<Computer[]>([]);
  
  // Immediately load user reservations on component mount and whenever computers state changes
  useEffect(() => {
    console.log("Computers state or user changed, updating reservations");
    
    // Update local computers state
    setLocalComputers(computers);
    
    // Fetch user's reservations if user is logged in
    if (currentUser) {
      const userReservations = computers.filter(c => 
        c.status === "reserved" && c.reservedBy === currentUser.id
      );
      console.log("Found user reservations:", userReservations.length, "computers - IDs:", userReservations.map(c => c.id));
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
      // Get all reserved computers from main computers state, not local state
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
        console.log("Adding newly reserved computer to myReservations:", reservedComputer);
        return [...prev, reservedComputer];
      }
      // If it already exists, update it
      return prev.map(c => c.id === reservedComputer.id ? reservedComputer : c);
    });
    
    // Force refresh of reservations from main computers state
    refreshReservations();
    
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
      allComputers: localComputers.length,
      available: availableComputers.length,
      myReservations: myReservations.length,
      myReservationIds: myReservations.map(r => r.id)
    });
  }, [localComputers, myReservations, availableComputers]);

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
