
import React from "react";
import { Navigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { Laptop } from "lucide-react";

const AuthPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-container">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8 text-white">
          <Laptop className="h-12 w-12 mb-2" />
          <h1 className="text-3xl font-bold">ComputeHubReserve</h1>
          <p className="mt-2 text-center">
            Sign in or create an account to manage computer reservations
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;
