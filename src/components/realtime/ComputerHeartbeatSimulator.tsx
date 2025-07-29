import { useEffect } from 'react';
import { useRealtime } from '@/context/RealtimeContext';
import { useAuth } from '@/context/AuthContext';

// This component simulates computer heartbeats for demonstration
export const ComputerHeartbeatSimulator = () => {
  const { sendComputerHeartbeat } = useRealtime();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Simulate heartbeats for computers 1-10 every 30 seconds
    const interval = setInterval(() => {
      for (let i = 1; i <= 10; i++) {
        const metrics = {
          cpuUsage: Math.floor(Math.random() * 80) + 10, // 10-90%
          memoryUsage: Math.floor(Math.random() * 70) + 20, // 20-90%
          networkLatency: Math.floor(Math.random() * 50) + 10, // 10-60ms
        };

        sendComputerHeartbeat(i, 'online', metrics);
      }
      console.log('📊 Simulated heartbeats sent for computers 1-10');
    }, 30000);

    // Send initial heartbeat
    setTimeout(() => {
      for (let i = 1; i <= 10; i++) {
        const metrics = {
          cpuUsage: Math.floor(Math.random() * 80) + 10,
          memoryUsage: Math.floor(Math.random() * 70) + 20,
          networkLatency: Math.floor(Math.random() * 50) + 10,
        };
        sendComputerHeartbeat(i, 'online', metrics);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, sendComputerHeartbeat]);

  return null; // This is an invisible component
};