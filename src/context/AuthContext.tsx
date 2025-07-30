import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, UserRole } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AuthContextType } from "@/types/auth";
import { useAuthActions } from "@/hooks/useAuthActions";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { login, register, logout, resetPassword } = useAuthActions();

  const trackUserSession = async (userId: string, email: string) => {
    try {
      const deviceId = navigator.userAgent + window.screen.width + window.screen.height;
      
      await supabase.from('user_sessions').upsert({
        user_id: userId,
        email,
        device_id: deviceId,
        last_active: new Date().toISOString()
      });

      // Log login activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action_type: 'user_login',
        entity_type: 'user',
        entity_id: userId,
        metadata: {
          device_info: {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      });
    } catch (error) {
      console.error('Error tracking user session:', error);
    }
  };

  const updateUserPresence = async (status: 'online' | 'away' | 'offline') => {
    if (!currentUser) return;
    
    try {
      await supabase.from('user_presence').upsert({
        user_id: currentUser.id,
        status,
        last_seen: new Date().toISOString(),
        current_page: window.location.pathname,
        device_info: {
          userAgent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  };

  // Set up authentication listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Get user profile from registered table
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
          
          // Track user session
          if (event === 'SIGNED_IN') {
            await trackUserSession(currentSession.user.id, currentSession.user.email || '');
          }
        } else {
          setCurrentUser(null);
          setIsLoading(false);
          
          // Update presence to offline on sign out
          if (event === 'SIGNED_OUT') {
            await updateUserPresence('offline');
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('registered')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setCurrentUser(null);
      } else if (data) {
        const userData: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          staffNum: data.staff_num || "", 
          avatar_url: data.avatar_url
        };
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: { name?: string }) => {
    // Call your backend PATCH /api/users/me
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update profile");
    const updatedUser = await res.json();
    setCurrentUser(updatedUser); // update context state
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        register,
        resetPassword,
        isAuthenticated: !!currentUser,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};