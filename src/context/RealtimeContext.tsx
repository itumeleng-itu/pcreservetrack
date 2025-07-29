import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtimeManager, RealtimeActivity, UserPresence, ComputerHeartbeat } from '@/hooks/useRealtimeManager';

interface RealtimeContextType {
  isConnected: boolean;
  activities: RealtimeActivity[];
  userPresences: UserPresence[];
  computerHeartbeats: ComputerHeartbeat[];
  updatePresence: (status: 'online' | 'away' | 'offline', currentPage?: string) => Promise<void>;
  sendComputerHeartbeat: (computerId: number, status: string, metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    networkLatency?: number;
  }) => Promise<void>;
  sendMessage: (
    recipientId: string,
    messageType: 'notification' | 'alert' | 'system' | 'chat',
    content: string,
    title?: string,
    data?: any
  ) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const realtimeManager = useRealtimeManager();

  return (
    <RealtimeContext.Provider value={realtimeManager}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};