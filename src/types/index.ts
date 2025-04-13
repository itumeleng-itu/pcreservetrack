
export type UserRole = "student" | "admin" | "technician";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
}

export interface Reservation {
  id: string;
  computerId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: "active" | "completed" | "cancelled";
}
