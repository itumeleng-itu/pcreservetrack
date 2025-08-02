import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Loader2, Fingerprint } from "lucide-react";
import { FingerprintAuth } from "./FingerprintAuth";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "react-router-dom";
import { ForgotPassword } from "./ForgotPassword";
import { ResetPassword } from "./ResetPassword";

export function AuthForm() {
  const { login, register, isLoading } = useAuth();
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [loginStaffNum, setLoginStaffNum] = useState("");
  const [staffNum, setStaffNum] = useState("");

  // Check for both reset parameter and access_token to determine if this is a password reset
  const isReset = searchParams.get('reset') === 'true' || searchParams.has('access_token');

  useEffect(() => {
    if (isReset) {
      // Handle password reset logic if needed
    }
  }, [isReset]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!loginStaffNum.trim() || !loginPassword.trim()) {
      return;
    }
    
    // Sanitize staff number input
    const sanitizedStaffNum = loginStaffNum.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    
    await login(sanitizedStaffNum, loginPassword);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim() || !staffNum.trim()) {
      return;
    }
    
    // Sanitize inputs
    const sanitizedName = registerName.replace(/[<>]/g, '').trim().slice(0, 50);
    const sanitizedEmail = registerEmail.toLowerCase().trim().slice(0, 100);
    const sanitizedStaffNum = staffNum.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    
    // Additional validation
    if (sanitizedName.length < 2 || sanitizedStaffNum.length < 6) {
      return;
    }
    
    await register(sanitizedName, sanitizedEmail, registerPassword, registerRole, sanitizedStaffNum);
  };

  // Helper to get the proper label for the identification field based on role
  const getIdNumberLabel = () => {
    switch (registerRole) {
      case "student": return "Student Number";
      case "admin": return "Admin Staff Number";
      case "technician": return "Technician Staff Number";
      default: return "Identification Number";
    }
  };

  // Show password reset form if we're in reset mode
  if (isReset) {
    return <ResetPassword onComplete={() => window.location.href = '/auth'} />;
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <Card className="w-full max-w-md">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-staff-num">Student/Staff Number</Label>
                <Input
                  id="login-staff-num"
                  type="text"
                  pattern="\d{9}"
                  maxLength={9}
                  placeholder="Enter your 9-digit number"
                  value={loginStaffNum}
                  onChange={(e) => setLoginStaffNum(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <div className="text-right">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm" 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login with Email"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <FingerprintAuth onAuthSuccess={() => login(loginStaffNum, loginPassword)} />
            </CardContent>
          </form>
        </TabsContent>
        
        <TabsContent value="register">
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle>Register</CardTitle>
              <CardDescription>
                Create a new account to start using our services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Maria Simpson"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="m.simpson@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={registerRole}
                  onValueChange={(value) => setRegisterRole(value as UserRole)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-num">{getIdNumberLabel()}</Label>
                <Input
                  id="staff-num"
                  placeholder={`Enter your ${getIdNumberLabel().toLowerCase()}`}
                  value={staffNum}
                  onChange={(e) => setStaffNum(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
