
import React, { ReactNode } from "react";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentUser } = useAuth();
  
  const getRoleColor = () => {
    if (!currentUser) return "";
    
    switch (currentUser.role) {
      case "admin":
        return "border-l-blue-500";
      case "technician":
        return "border-l-amber-500";
      case "student":
        return "border-l-green-500";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${currentUser ? `border-l-4 ${getRoleColor()}` : ""}`}>
        <div className="container px-4 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="py-4 border-t bg-gray-50">
        <div className="container text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} ComputeHubReserve - All rights reserved
        </div>
      </footer>
    </div>
  );
}
