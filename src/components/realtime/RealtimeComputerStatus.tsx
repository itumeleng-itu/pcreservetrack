import React from 'react';
import { useRealtime } from '@/context/RealtimeContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface RealtimeComputerStatusProps {
  computerId: string;
}

export const RealtimeComputerStatus = ({ computerId }: RealtimeComputerStatusProps) => {
  const { computerHeartbeats } = useRealtime();

  // Find the latest heartbeat for this computer
  const latestHeartbeat = computerHeartbeats
    .filter(hb => hb.computer_id.toString() === computerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!latestHeartbeat) {
    return (
      <Badge variant="outline" className="text-xs">
        No Data
      </Badge>
    );
  }

  const isRecent = new Date(latestHeartbeat.timestamp) > new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
  const isOnline = isRecent && latestHeartbeat.status === 'online';

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
          <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
            {isOnline ? 'Live' : 'Offline'}
          </Badge>
          {latestHeartbeat.cpu_usage !== undefined && (
            <Badge variant="outline" className="text-xs">
              CPU: {latestHeartbeat.cpu_usage}%
            </Badge>
          )}
          {latestHeartbeat.memory_usage !== undefined && (
            <Badge variant="outline" className="text-xs">
              RAM: {latestHeartbeat.memory_usage}%
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <div>Last seen: {formatDistanceToNow(new Date(latestHeartbeat.timestamp), { addSuffix: true })}</div>
          <div>Status: {latestHeartbeat.status}</div>
          {latestHeartbeat.cpu_usage !== undefined && <div>CPU Usage: {latestHeartbeat.cpu_usage}%</div>}
          {latestHeartbeat.memory_usage !== undefined && <div>Memory Usage: {latestHeartbeat.memory_usage}%</div>}
          {latestHeartbeat.network_latency !== undefined && <div>Latency: {latestHeartbeat.network_latency}ms</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};