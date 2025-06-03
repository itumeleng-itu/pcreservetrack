
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordProps {
  onComplete: () => void;
}

export const ResetPassword = ({ onComplete }: ResetPasswordProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Get the URL hash which contains the tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('Reset password tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (accessToken && refreshToken && type === 'recovery') {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error("Error setting session:", error);
            toast({
              title: "Error",
              description: "Invalid or expired reset link. Please request a new password reset.",
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }

          if (data.session) {
            setValidSession(true);
            console.log("Password reset session established successfully");
          }
        } else {
          // No valid tokens in URL, redirect to auth page
          console.log('No valid reset tokens found in URL');
          toast({
            title: "Error",
            description: "Invalid reset link. Please request a new password reset.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    handlePasswordReset();
  }, [toast, navigate]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!validSession) {
      toast({
        title: "Error",
        description: "Invalid session. Please request a new password reset.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setIsCompleted(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You can now log in with your new password.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>
            Verifying your password reset link...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validSession) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Your Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCompleted ? (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-medium text-green-600">Password Updated Successfully!</p>
            <p className="text-sm text-green-600 mt-1">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Enter your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Confirm your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};
