
import React, { createContext, useContext, useState, ReactNode } from "react";
import { User, UserRole } from "../types";
import { mockUsers } from "../services/mockData";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, identificationNumber: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Try to get user from local storage
    const storedUser = localStorage.getItem("currentUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const { toast } = useToast();

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call
    // For demo purposes, we'll just find the user in our mock data
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      return true;
    }
    
    toast({
      title: "Login failed",
      description: "Invalid email or password",
      variant: "destructive",
    });
    return false;
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole, 
    identificationNumber: string
  ): Promise<boolean> => {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    
    if (existingUser) {
      toast({
        title: "Registration failed",
        description: "Email already in use",
        variant: "destructive",
      });
      return false;
    }

    // Check if identification number is already in use
    const existingIdentification = mockUsers.find(
      u => u.identificationNumber === identificationNumber && u.role === role
    );

    if (existingIdentification) {
      toast({
        title: "Registration failed",
        description: `This ${role === "student" ? "student" : "staff"} number is already registered`,
        variant: "destructive",
      });
      return false;
    }

    // Create a new user (in a real app, this would save to a database)
    const newUser: User = {
      id: String(mockUsers.length + 1),
      name,
      email,
      role,
      identificationNumber
    };
    
    mockUsers.push(newUser);
    setCurrentUser(newUser);
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    
    toast({
      title: "Registration successful",
      description: "Your account has been created",
    });
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        register,
        isAuthenticated: !!currentUser
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
