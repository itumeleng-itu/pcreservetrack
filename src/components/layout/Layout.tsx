
import React from "react";
import { Header } from "./Header";
import { NotificationHandler } from "../notifications/NotificationHandler";
import { RealtimeStatusPanel } from "../realtime/RealtimeComponents";
import { useRealtime } from "@/context/RealtimeContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isConnected } = useRealtime();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <div className="absolute top-4 right-20">
        <NotificationHandler />
      </div>
      
      {/* Real-time connection indicator */}
      <div className="fixed top-4 left-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
