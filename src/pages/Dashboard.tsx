
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TechnicianDashboard } from "@/components/dashboard/TechnicianDashboard";
import { useSupabaseComputers } from "@/context/SupabaseComputerContext";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { updateComputersFromTracking, refreshComputers } = useSupabaseComputers();
  
  // Initialize real-time updates
  useRealtimeUpdates();

  // Debug log to see when Dashboard is re-rendered
  useEffect(() => {
    console.log("Dashboard component rendered with user:", currentUser?.id);
    
    // Force update of computers data when dashboard loads
    const refreshData = async () => {
      try {
        // This will update any computer tracking data and trigger necessary state updates
        await refreshComputers();
        console.log("Dashboard: Refreshed computer data");
      } catch (error) {
        console.error("Error refreshing computer data:", error);
      }
    };
    
    if (currentUser) {
      refreshData();
      
      // Set up periodic refresh every 2 minutes
      const refreshInterval = setInterval(refreshData, 120000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [currentUser, refreshComputers]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return (
    <Layout>
      {currentUser?.role === "admin" ? (
        <AdminDashboard />
      ) : currentUser?.role === "technician" ? (
        <TechnicianDashboard />
      ) : (
        <StudentDashboard />
      )}
    </Layout>
  );
};

export default Dashboard;
