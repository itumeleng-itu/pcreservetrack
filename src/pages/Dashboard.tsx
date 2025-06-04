
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TechnicianDashboard } from "@/components/dashboard/TechnicianDashboard";
import { NotificationHandler } from "@/components/notifications/NotificationHandler";
import { useComputers } from "@/context/ComputerContext";

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
      <NotificationHandler />
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
