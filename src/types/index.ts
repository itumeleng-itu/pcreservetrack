
export type UserRole = "student" | "admin" | "technician";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  identificationNumber?: string; // Student number or staff number
}

export type ComputerStatus = "available" | "reserved" | "faulty";

export interface Computer {
  id: string;
  name: string;
  location: string;
  status: ComputerStatus;
  specs: string;
  reservedBy?: string;
  reservedUntil?: Date;
  faultDescription?: string;
  lastSeen?: Date;
  ipAddress?: string;
  macAddress?: string;
  tracking?: {
    online: boolean;
    lastHeartbeat: Date;
    cpuUsage?: number;
    memoryUsage?: number;
  };
}

export interface Reservation {
  id: string;
  computerId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: "active" | "completed" | "cancelled";
}

export interface ComputerTracking {
  computerId: string;
  online: boolean;
  lastHeartbeat: Date;
  cpuUsage?: number;
  memoryUsage?: number;
}
