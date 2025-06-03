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

  const login = async (staffNum: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Find user by staff_num
      const { data, error } = await supabase
        .from('registered')
        .select('*')
        .eq('staff_num', staffNum)
        .single();

      if (error || !data) {
        toast({
          title: "Login failed",
          description: "Invalid staff number or password",
          variant: "destructive",
        });
        return false;
      }

      // Now authenticate with Supabase Auth using the user's email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      });

      if (authError || !authData.user) {
        toast({
          title: "Login failed",
          description: "Invalid staff number or password",
          variant: "destructive",
        });
        return false;
      }

      // Check if user is already logged in on another device
      const { data: existingSession, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('email', data.email)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error("Error checking sessions:", sessionError);
      }

      const deviceId = getDeviceId();
      
      if (existingSession) {
        if (existingSession.device_id !== deviceId) {
          const lastActive = new Date(existingSession.last_active);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // Reduced from 10 to 5 minutes
          
          if (lastActive > fiveMinutesAgo) {
            toast({
              title: "Account in use",
              description: "This account is currently being used on another device. Please log out from the other device first.",
              variant: "destructive",
            });
            return false;
          } else {
            // Session on other device is considered inactive, we'll force logout
            await supabase.from('user_sessions')
              .delete()
              .match({ email: data.email });
          }
        }
      }

      // Successfully logged in, update or create session record
      await supabase.from('user_sessions')
        .upsert({
          user_id: authData.user.id,
          email: authData.user.email,
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
      
      // Sign up the user with auth
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
        // Registration successful - the trigger will create the profile
        // Store current device as the active session
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

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use the correct production URL for the dedicated reset password page
      const redirectUrl = 'https://itumeleng-itu.github.io/pcreservetrack/reset-password';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    resetPassword,
    isLoading,
  };
};
