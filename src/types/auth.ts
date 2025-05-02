
import { User, UserRole } from "../types";

export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, identificationNumber: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
