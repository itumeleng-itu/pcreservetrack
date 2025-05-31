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

// --- Virtual Queue Logic ---
// Map of lab location to array of user IDs (queue order)
export const labQueues: { [lab: string]: string[] } = {};

// Add a student to a lab's queue
export function joinLabQueue(lab: string, userId: string) {
  if (!labQueues[lab]) labQueues[lab] = [];
  if (!labQueues[lab].includes(userId)) {
    labQueues[lab].push(userId);
  }
}

// Remove a student from a lab's queue
export function leaveLabQueue(lab: string, userId: string) {
  if (!labQueues[lab]) return;
  labQueues[lab] = labQueues[lab].filter(id => id !== userId);
}

// Get the current queue for a lab
export function getLabQueue(lab: string): string[] {
  return labQueues[lab] || [];
}

// When a PC is released in a fully reserved lab, auto-reserve for first in queue
// Optionally accepts a notify callback: (userId, computer) => void
export function autoReserveForQueue(lab: string, computerId: string, notify?: (userId: string, computer: Computer) => void) {
  const queue = labQueues[lab];
  if (queue && queue.length > 0) {
    const nextUserId = queue.shift();
    // Find the computer and reserve it for the next user
    const computer = mockComputers.find(c => c.id === computerId);
    if (computer && nextUserId) {
      computer.status = "reserved";
      computer.reservedBy = nextUserId;
      computer.reservedUntil = new Date(Date.now() + 3600000); // 1 hour from now
      // Add a reservation record
      mockReservations.push({
        id: (mockReservations.length + 1).toString(),
        computerId: computerId,
        userId: nextUserId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        status: "active"
      });
      // Notify the user (in-app or browser notification)
      if (notify) {
        notify(nextUserId, computer);
      } else if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
        new Notification('Auto-Reservation', {
          body: `You have auto-reserved a computer: ${computer.name} (${computer.specs}) in ${computer.location}`
        });
      } else if (typeof window !== 'undefined') {
        window.alert(`You have auto-reserved a computer: ${computer.name} (${computer.specs}) in ${computer.location}`);
      }
    }
  }
}

// Simulate atomic reservation logic for a computer
export function reserveComputerAtomic(computerId: string, userId: string): boolean {
  type LockedComputer = Computer & { _lock?: boolean };
  const computer = mockComputers.find(c => c.id === computerId) as LockedComputer | undefined;
  // Add a temporary lock property if not present
  if (computer && typeof computer._lock === 'undefined') {
    computer._lock = false;
  }
  // If locked or not available, fail
  if (!computer || computer.status !== 'available' || computer._lock) {
    return false;
  }
  // Lock the computer for this operation
  computer._lock = true;
  // Double-check status after lock
  if (computer.status !== 'available') {
    computer._lock = false;
    return false;
  }
  // Reserve the computer
  computer.status = 'reserved';
  computer.reservedBy = userId;
  computer.reservedUntil = new Date(Date.now() + 3600000); // 1 hour from now
  mockReservations.push({
    id: (mockReservations.length + 1).toString(),
    computerId: computerId,
    userId: userId,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    status: 'active'
  });
  // Unlock
  computer._lock = false;
  return true;
}
