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

  // Memoized available computers with search and location filter
  const availableComputers = useMemo(() => {
    return computers.filter(c =>
      c.status === "available" &&
      (locationFilter === "all" || c.location === locationFilter) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [computers, searchTerm, locationFilter]);

  // Memoized user's reservations
  const myReservations = useMemo(() => {
    if (!currentUser) return [];
    return computers.filter(
      c => c.status === "reserved" && c.reservedBy === currentUser.id
    );
  }, [computers, currentUser]);

  // Memoized unique locations
  const locations = useMemo(
    () => Array.from(new Set(computers.map(c => c.location))),
    [computers]
  );

  const refreshReservations = () => {
    console.log("Refresh requested (no-op, context handles updates)");
  };

  const handleReservationSuccess = (reservedComputer: Computer) => {
    console.log("Reservation success handler in StudentDashboard for computer:", reservedComputer.id);
    setActiveTab("my-reservations");
  };

  useEffect(() => {
    if (activeTab === "my-reservations") {
      refreshReservations();
    }
  }, [activeTab]);

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