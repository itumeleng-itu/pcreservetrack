
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
      
      // Check if user is already logged in on another device
      const { data: existingSession, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('email', email)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error("Error checking sessions:", sessionError);
      }

      const deviceId = getDeviceId();
      
      if (existingSession) {
        if (existingSession.device_id !== deviceId) {
          const lastActive = new Date(existingSession.last_active);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
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
              .match({ email: email });
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
        // Successfully logged in, update or create session record
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
      
      // Check if user previously existed and was deleted
      const { data: existingUser } = await supabase
        .from('registered')
        .select('*')
        .eq('email', email)
        .single();

      let authData;
      let authError;

      if (existingUser) {
        // User exists, try to sign them in (they might have been soft-deleted)
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInResult.error) {
          // If sign in fails, try to sign up (the auth user might have been deleted)
          const signUpResult = await supabase.auth.signUp({
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
          authData = signUpResult.data;
          authError = signUpResult.error;
        } else {
          authData = signInResult.data;
          authError = signInResult.error;
        }

        // Reactivate the user profile if it was soft-deleted
        if (authData.user) {
          await supabase
            .from('registered')
            .update({
              name,
              role,
              staff_num: identificationNumber,
              is_deleted: false
            })
            .eq('email', email);
        }
      } else {
        // New user, normal registration
        const signUpResult = await supabase.auth.signUp({
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
        authData = signUpResult.data;
        authError = signUpResult.error;
      }

      if (authError) {
        toast({
          title: "Registration failed",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      if (authData.user) {
        // Store current device as the active session
        const deviceId = getDeviceId();
        await supabase.from('user_sessions').upsert({
          user_id: authData.user.id,
          email,
          device_id: deviceId,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

        toast({
          title: "Registration successful",
          description: existingUser ? "Your account has been reactivated" : "Your account has been created",
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
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
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

  const deleteAccount = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Soft delete the user profile instead of trying to delete auth user
      const { error: profileError } = await supabase
        .from('registered')
        .update({ is_deleted: true })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Clear user sessions
      await supabase
        .from('user_sessions')
        .delete()
        .match({ user_id: user.id });

      // Sign out the user
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error("Sign out error:", signOutError);
      }

      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted",
      });
      
      return true;
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your account. Please try again later.",
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
    deleteAccount,
    isLoading,
  };
};
