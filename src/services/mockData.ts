
import { User, Computer, Reservation, UserRole, ComputerStatus } from "../types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Student",
    email: "student@example.com",
    role: "student"
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin"
  },
  {
    id: "3",
    name: "Tech Support",
    email: "tech@example.com",
    role: "technician"
  }
];

// Mock Computers
export const mockComputers: Computer[] = [
  {
    id: "1",
    name: "PC-001",
    location: "Lab A",
    status: "available",
    specs: "i7, 16GB RAM, 512GB SSD"
  },
  {
    id: "2",
    name: "PC-002",
    location: "Lab A",
    status: "reserved",
    specs: "i5, 8GB RAM, 256GB SSD",
    reservedBy: "1",
    reservedUntil: new Date(Date.now() + 3600000) // 1 hour from now
  },
  {
    id: "3",
    name: "PC-003",
    location: "Lab B",
    status: "faulty",
    specs: "i7, 16GB RAM, 512GB SSD",
    faultDescription: "Blue screen when starting applications"
  },
  {
    id: "4",
    name: "PC-004",
    location: "Lab B",
    status: "available",
    specs: "i9, 32GB RAM, 1TB SSD"
  },
  {
    id: "5",
    name: "PC-005",
    location: "Lab C",
    status: "available",
    specs: "i7, 16GB RAM, 512GB SSD"
  }
];

// Mock Reservations
export const mockReservations: Reservation[] = [
  {
    id: "1",
    computerId: "2",
    userId: "1",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // 1 hour from now
    status: "active"
  }
];
