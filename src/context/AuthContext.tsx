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
          staffNum: data.staff_num || "", // <-- correct mapping
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
    setUser(updatedUser); // update context state
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
function setUser(updatedUser: User) {
  setCurrentUser(updatedUser);
}

function setCurrentUser(updatedUser: User) {
  throw new Error("Function not implemented.");
}
// setCurrentUser is already defined as a useState setter above, so this function is unnecessary.
// If you need to expose setCurrentUser, you can export it or pass it through context.
// Otherwise, you can safely remove this function.

