
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TechnicianDashboard } from "@/components/dashboard/TechnicianDashboard";

const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();

  // Debug log to see when Dashboard is re-rendered
  useEffect(() => {
    console.log("Dashboard component rendered with user:", currentUser?.id);
  }, [currentUser]);

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
