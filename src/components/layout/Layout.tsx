
import React from "react";
import { Header } from "./Header";
import { NotificationHandler } from "../notifications/NotificationHandler";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <div className="absolute top-4 right-20">
        <NotificationHandler />
      </div>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
