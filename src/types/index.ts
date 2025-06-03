import { ReactNode } from "node_modules/react-resizable-panels/dist/declarations/src/vendor/react";

export type UserRole = "student" | "admin" | "technician";

export interface User {
  [x: string]: ReactNode;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  staffNum?: string; // Student number or staff number
  avatar_url?: string; // Added avatar URL
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
  isEmergency?: boolean;
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

export type LogEventType = 
  | "fault_reported"
  | "reserved"
  | "reservation_cancelled"
  | "fixed";

export interface AdminLog {
  id: string;
  eventType: LogEventType;
  computerId: string;
  computerName: string;
  location: string;
  reporteeName?: string;
  technicianName?: string;
  timeReported?: Date;
  timeFixed?: Date;
  reserveTime?: Date;
  expirationTime?: Date;
  cancellationTime?: Date;
  createdAt: Date;
  details?: string;
  status: string;
}
