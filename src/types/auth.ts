
import { User, UserRole } from "../types";

export interface AuthContextType {
  currentUser: User | null;
  login: (staffNum: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, staffNum: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
