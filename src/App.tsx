
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ComputerProvider } from "./context/ComputerContext";
import { TrackingProvider } from "./context/TrackingContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const basePath = import.meta.env.MODE === 'production' ? '/pcreservetrack' : '';

const App = () => {
  // Initialize dark mode based on localStorage or user preference
  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ComputerProvider>
          <TrackingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter basename={basePath}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </TrackingProvider>
        </ComputerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
