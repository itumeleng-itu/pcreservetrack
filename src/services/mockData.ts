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

// Mutable user list for mock logic
type MutableUser = User & { [key: string]: unknown };
export const mutableUsers: MutableUser[] = JSON.parse(JSON.stringify(mockUsers));

// Helper: Update user stats based on reservation outcome
export function updateUserStats(userId: string, outcome: 'noShow' | 'lateReturn' | 'success') {
  const user = mutableUsers.find(u => u.id === userId);
  if (!user) return;
  const noShowCount = typeof user.noShowCount === 'number' && !isNaN(user.noShowCount) ? user.noShowCount : 0;
  const lateReturnCount = typeof user.lateReturnCount === 'number' && !isNaN(user.lateReturnCount) ? user.lateReturnCount : 0;
  const successfulReservations = typeof user.successfulReservations === 'number' && !isNaN(user.successfulReservations) ? user.successfulReservations : 0;
  user.noShowCount = outcome === 'noShow' ? noShowCount + 1 : noShowCount;
  user.lateReturnCount = outcome === 'lateReturn' ? lateReturnCount + 1 : lateReturnCount;
  user.successfulReservations = outcome === 'success' ? successfulReservations + 1 : successfulReservations;
  assignBadges(user);
}

// Helper: Assign badges based on reservation history
export function assignBadges(user: MutableUser) {
  user.badges = Array.isArray(user.badges) ? user.badges as string[] : [];
  // Early Bird: 3+ successful reservations before 9am
  const earlyBirdCount = mockReservations.filter(r => r.userId === user.id && r.status === 'completed' && r.startTime.getHours() < 9).length;
  if (earlyBirdCount >= 3 && !(user.badges as string[]).includes('Early Bird')) (user.badges as string[]).push('Early Bird');
  // Night Owl: 3+ successful reservations after 9pm
  const nightOwlCount = mockReservations.filter(r => r.userId === user.id && r.status === 'completed' && r.startTime.getHours() >= 21).length;
  if (nightOwlCount >= 3 && !(user.badges as string[]).includes('Night Owl')) (user.badges as string[]).push('Night Owl');
  // Frequent User: 10+ successful reservations
  if (typeof user.successfulReservations === 'number' && user.successfulReservations >= 10 && !(user.badges as string[]).includes('Frequent User')) (user.badges as string[]).push('Frequent User');
}

// Get badges for a user
export function getUserBadges(userId: string): string[] {
  const user = mutableUsers.find(u => u.id === userId);
  return Array.isArray(user?.badges) ? (user.badges as string[]).map(b => String(b)) : [];
}
