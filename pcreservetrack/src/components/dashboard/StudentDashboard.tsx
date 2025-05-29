
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComputerIcon, Clock } from "lucide-react";
import { BookingStatusAlert } from "./BookingStatusAlert";
import { AvailableComputersTab } from "./AvailableComputersTab";
import { MyReservationsTab } from "./MyReservationsTab";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";

export function StudentDashboard() {
  const {
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
  } = useStudentDashboard();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">Reserve computers or manage your reservations.</p>
      </div>
      
      <BookingStatusAlert />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <ComputerIcon className="h-4 w-4" /> 
            Available Computers
          </TabsTrigger>
          <TabsTrigger value="my-reservations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> 
            My Reservations {myReservations.length > 0 && `(${myReservations.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          <AvailableComputersTab
            availableComputers={availableComputers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            locations={locations}
            onReservationSuccess={handleReservationSuccess}
          />
        </TabsContent>
        
        <TabsContent value="my-reservations">
          <MyReservationsTab
            myReservations={myReservations}
            refreshReservations={refreshReservations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
