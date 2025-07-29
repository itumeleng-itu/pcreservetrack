import React from 'react';
import { useRealtime } from '@/context/RealtimeContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Activity, Users, Monitor, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const RealtimeStatusPanel = () => {
  const { 
    isConnected, 
    activities, 
    userPresences, 
    computerHeartbeats 
  } = useRealtime();

  const onlineUsers = userPresences.filter(p => p.status === 'online').length;
  const awayUsers = userPresences.filter(p => p.status === 'away').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Real-time Status</CardTitle>
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time synchronization
          </p>
        </CardContent>
      </Card>

      {/* User Presence */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Users Online</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onlineUsers}</div>
          <p className="text-xs text-muted-foreground">
            {awayUsers} away users
          </p>
        </CardContent>
      </Card>

      {/* Active Computers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Computers</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {computerHeartbeats.filter(h => 
              new Date(h.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
            ).length}
          </div>
          <p className="text-xs text-muted-foreground">
            Last 5 minutes
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activities.length}</div>
          <p className="text-xs text-muted-foreground">
            Live activities tracked
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const RealtimeActivityFeed = () => {
  const { activities } = useRealtime();

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return 'bg-green-500';
      case 'UPDATE': return 'bg-blue-500';
      case 'DELETE': return 'bg-red-500';
      case 'fault_reported': return 'bg-orange-500';
      case 'computer_fixed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'fault_reported': return '⚠️';
      case 'computer_fixed': return '✅';
      case 'CREATE': return '➕';
      case 'UPDATE': return '📝';
      case 'DELETE': return '🗑️';
      default: return '📊';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activities yet. Actions will appear here in real-time.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 50).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.action_type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{getActivityIcon(activity.action_type)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {activity.action_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">
                        {activity.entity_type} {activity.entity_id}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export const UserPresenceList = () => {
  const { userPresences } = useRealtime();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Presence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60">
          {userPresences.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No users online
            </div>
          ) : (
            <div className="space-y-3">
              {userPresences
                .sort((a, b) => {
                  const statusOrder = { online: 0, away: 1, offline: 2 };
                  return statusOrder[a.status as keyof typeof statusOrder] - 
                         statusOrder[b.status as keyof typeof statusOrder];
                })
                .map((presence) => (
                  <div key={presence.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(presence.status)}`} />
                      <div>
                        <div className="text-sm font-medium">User {presence.user_id.slice(-6)}</div>
                        {presence.current_page && (
                          <div className="text-xs text-muted-foreground">
                            📍 {presence.current_page}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {presence.status}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};