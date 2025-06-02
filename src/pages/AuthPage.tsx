
import React from "react";
import { Navigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { Laptop, Loader2, Fingerprint } from "lucide-react";

const AuthPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Loading authentication status...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-container">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8 text-white">
          <div className="flex items-center gap-2">
            <Laptop className="h-12 w-12 mb-2" />
            <Fingerprint className="h-10 w-10 mb-2 text-blue-300" />
          </div>
          <h1 className="text-3xl font-bold">ComputeHubReserve</h1>
          <p className="mt-2 text-center">
            Sign in or create an account to manage computer reservations
          </p>
          <p className="text-sm text-blue-200 mt-1">
            Now with fingerprint authentication for supported devices
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;
