import { User, Computer, Reservation, UserRole, ComputerStatus } from "../types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Student",
    email: "student@example.com",
    role: "student",
    identificationNumber: "STU001"
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    identificationNumber: "ADM001"
  },
  {
    id: "3",
    name: "Tech Support",
    email: "tech@example.com",
    role: "technician",
    identificationNumber: "TEC001"
  }
];

// Mock Computers
export const mockComputers: Computer[] = [
  {
    id: "1",
    name: "PC-001",
    location: "iCentre1",
    status: "available",
    specs: "i7, 16GB RAM, 512GB SSD",
    tracking: {
      online: true,
      lastHeartbeat: new Date(),
      cpuUsage: 15,
      memoryUsage: 30
    }
  },
  {
    id: "2",
    name: "PC-002",
    location: "iCentre1",
    status: "reserved",
    specs: "i5, 8GB RAM, 256GB SSD",
    reservedBy: "1",
    reservedUntil: new Date(Date.now() + 3600000),
    tracking: {
      online: true,
      lastHeartbeat: new Date(),
      cpuUsage: 45,
      memoryUsage: 60
    }
  },
  {
    id: "3",
    name: "PC-003",
    location: "iCentre2",
    status: "faulty",
    specs: "i7, 16GB RAM, 512GB SSD",
    faultDescription: "Blue screen when starting applications",
    tracking: {
      online: false,
      lastHeartbeat: new Date(Date.now() - 3600000),
      cpuUsage: 0,
      memoryUsage: 0
    }
  },
  {
    id: "4",
    name: "PC-004",
    location: "iCentre2",
    status: "available",
    specs: "i9, 32GB RAM, 1TB SSD",
    tracking: {
      online: true,
      lastHeartbeat: new Date(),
      cpuUsage: 5,
      memoryUsage: 20
    }
  },
  {
    id: "5",
    name: "PC-005",
    location: "iCentre1",
    status: "available",
    specs: "i7, 16GB RAM, 512GB SSD",
    tracking: {
      online: true,
      lastHeartbeat: new Date(),
      cpuUsage: 10,
      memoryUsage: 25
    }
  }
];

// Mock Reservations
export const mockReservations: Reservation[] = [
  {
    id: "1",
    computerId: "2",
    userId: "1",
    startTime: new Date(Date.now() - 1800000), // 30 minutes ago
    endTime: new Date(Date.now() + 1800000), // 30 minutes from now
    status: "active"
  }
];
