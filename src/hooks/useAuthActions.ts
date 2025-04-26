import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, UserRole } from "@/types";

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data: existingSessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('email', email)
        .single();

      if (existingSessions) {
        const deviceId = getDeviceId();
        
        if (existingSessions.device_id !== deviceId) {
          const lastActive = new Date(existingSessions.last_active);
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          
          if (lastActive > tenMinutesAgo) {
            toast({
              title: "Account in use",
              description: "This account is currently being used on another device.",
              variant: "destructive",
            });
            return false;
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        const deviceId = getDeviceId();
        
        await supabase.from('user_sessions')
          .upsert({
            user_id: data.user.id,
            email: data.user.email,
            device_id: deviceId,
            last_active: new Date().toISOString()
          }, {
            onConflict: 'email'
          });

        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole, 
    identificationNumber: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            staff_num: identificationNumber
          }
        }
      });

      if (authError) {
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      if (authData.user) {
        const { error: insertError } = await supabase
          .from('registered')
          .insert({
            id: authData.user.id,
            name,
            email,
            role,
            staff_num: identificationNumber
          });

        if (insertError) {
          console.error("Error inserting user data:", insertError);
          toast({
            title: "Profile creation failed",
            description: "Your account was created but profile data could not be saved",
            variant: "destructive",
          });
          return false;
        }

        const deviceId = getDeviceId();
        await supabase.from('user_sessions').insert({
          user_id: authData.user.id,
          email,
          device_id: deviceId,
          last_active: new Date().toISOString()
        });

        toast({
          title: "Registration successful",
          description: "Your account has been created",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_sessions')
          .delete()
          .match({ user_id: user.id });
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
  };
};
