import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComputerIcon, Clock } from "lucide-react";
import { BookingStatusAlert } from "./BookingStatusAlert";
import { AvailableComputersTab } from "./AvailableComputersTab";
import { MyReservationsTab } from "./MyReservationsTab";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { getUserBadges } from "@/services/mockData";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

export function StudentDashboard() {
  const { //initialize the state and functions from the custom hook
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

  const { currentUser } = useAuth();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return ( // Return the main dashboard component
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">Reserve computers or manage your reservations.</p>
      </div>

      {/* My Badges Section */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow space-y-2">
        <h3 className="font-semibold text-lg mb-2">My Badges</h3>
        <div className="flex flex-wrap gap-2">
          {getUserBadges(currentUser?.id || "").length === 0 ? (
            <span className="text-sm text-gray-500">No badges earned yet.</span>
          ) : (
            (getUserBadges(currentUser?.id || "") as string[]).map((badge: string) => (
              <Badge key={badge}>{badge}</Badge>
            ))
          )}
        </div>
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
