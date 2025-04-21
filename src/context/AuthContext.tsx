
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
  const { login, register, logout } = useAuthActions();

  // Set up authentication listener
  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Update device session in database to track active logins
          const deviceId = getDeviceId();
          await updateUserSession(currentSession.user.id, deviceId);
          
          // Get user profile from registered table
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Update device session in database
        const deviceId = getDeviceId();
        await updateUserSession(currentSession.user.id, deviceId);
        
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Generate a unique device ID
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  // Update user's active session in database
  const updateUserSession = async (userId: string, deviceId: string) => {
    try {
      await supabase
        .from('user_sessions')
        .upsert({ 
          user_id: userId, 
          device_id: deviceId,
          last_active: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });
    } catch (error) {
      console.error("Failed to update user session:", error);
    }
  };

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
          identificationNumber: data.staff_num || "",
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        register,
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
