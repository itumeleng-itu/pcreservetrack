import { useState, useEffect, useMemo } from "react";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { Computer } from "@/types";

export function useStudentDashboard() {
  const { computers } = useComputers();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("available");

  // Filter available computers directly from context
  const availableComputers = useMemo(() => {
    return computers.filter(
      c =>
        c.status === "available" &&
        (locationFilter === "all" || c.location === locationFilter) &&
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [computers, searchTerm, locationFilter]);

  // Filter user's reservations directly from context
  const myReservations = useMemo(() => {
    if (!currentUser) return [];
    return computers.filter(
      c => c.status === "reserved" && c.reservedBy === currentUser.id
    );
  }, [computers, currentUser]);

  // Get unique locations for the filter
  const locations = useMemo(
    () => Array.from(new Set(computers.map(c => c.location))),
    [computers]
  );

  // Function to refresh the reservation list (no-op, context handles updates)
  const refreshReservations = () => {
    // Optionally, you can trigger a context refresh if your context supports it
    // For now, this is a no-op
    console.log("Refresh requested (no-op, context handles updates)");
  };

  // Handle successful reservation by switching tabs
  const handleReservationSuccess = (reservedComputer: Computer) => {
    setActiveTab("my-reservations");
    // No need to update local state, context will update and UI will re-render
  };

  // Force refresh when tab changes to "my-reservations"
  useEffect(() => {
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