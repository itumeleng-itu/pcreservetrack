
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TechnicianDashboard } from "@/components/dashboard/TechnicianDashboard";
import { RealtimeStatusPanel, RealtimeActivityFeed, UserPresenceList } from "@/components/realtime/RealtimeComponents";
import { ComputerHeartbeatSimulator } from "@/components/realtime/ComputerHeartbeatSimulator";
import { useComputers } from "@/context/ComputerContext";
import { useRealtime } from "@/context/RealtimeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { updateComputersFromTracking } = useComputers();

  // Debug log to see when Dashboard is re-rendered
  useEffect(() => {
    console.log("Dashboard component rendered with user:", currentUser?.id);
    
    // Force update of computers data when dashboard loads
    const refreshData = async () => {
      try {
        // This will update any computer tracking data and trigger necessary state updates
        await updateComputersFromTracking([]);
        console.log("Dashboard: Refreshed computer data");
      } catch (error) {
        console.error("Error refreshing computer data:", error);
      }
    };
    
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, updateComputersFromTracking]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return (
    <Layout>
      {/* Computer heartbeat simulator for testing */}
      <ComputerHeartbeatSimulator />
      
      {/* Real-time Status Panel */}
      <RealtimeStatusPanel />
      
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main">Main Dashboard</TabsTrigger>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="users">User Presence</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main" className="space-y-4">
          {currentUser?.role === "admin" ? (
            <AdminDashboard />
          ) : currentUser?.role === "technician" ? (
            <TechnicianDashboard />
          ) : (
            <StudentDashboard />
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <RealtimeActivityFeed />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <UserPresenceList />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;
