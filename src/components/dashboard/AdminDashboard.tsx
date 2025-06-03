import React, { useState } from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { ComputerTrackingTable } from "../tracking/ComputerTrackingTable";
import { useComputers } from "@/context/ComputerContext";
import { useTracking } from "@/context/TrackingContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ComputerStatus } from "@/types";
import { RefreshCw } from "lucide-react";
import { UserManagement } from "../admin/UserManagement";
import { getLabQueue } from "@/services/mockData";
import { mockUsers } from "@/services/mockData";
import { useToast } from "@/hooks/use-toast";
import { autoReserveForQueue } from "@/services/mockData";
import { mockAdminLogs } from "@/services/mockData";

export function AdminDashboard() { // AdminDashboard component
  const { computers } = useComputers(); // Get computers from context
  const { syncComputers, lastSync, isLoading } = useTracking(); // Get sync function and last sync time from context
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [statusFilter, setStatusFilter] = useState<ComputerStatus | "all">("all"); // State for status filter
  const [locationFilter, setLocationFilter] = useState("all"); // State for location filter
  const { toast } = useToast();
  
  // Get unique locations for the filter
  const locations = Array.from(new Set(computers.map(c => c.location)));
  
  // Filter computers based on search term, status, and location
  const filteredComputers = computers.filter(computer => {
    const matchesSearch = computer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          computer.specs.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || computer.status === statusFilter;
    
    const matchesLocation = locationFilter === "all" || computer.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });
  
  // Calculate statistics for the dashboard
  const availableCount = computers.filter(c => c.status === "available").length;
  const reservedCount = computers.filter(c => c.status === "reserved").length;
  const faultyCount = computers.filter(c => c.status === "faulty").length;
  const totalComputers = computers.length;
  
  const statusData = [
    { name: "Available", value: availableCount, color: "#22c55e" },
    { name: "Reserved", value: reservedCount, color: "#3b82f6" },
    { name: "Faulty", value: faultyCount, color: "#ef4444" }
  ];
  
  // Calculate utilization by location 
  const locationData = locations.map(location => {
    const locComputers = computers.filter(c => c.location === location);
    const reservedInLoc = locComputers.filter(c => c.status === "reserved").length;
    return {
      name: location,
      total: locComputers.length,
      reserved: reservedInLoc,
      utilization: locComputers.length ? (reservedInLoc / locComputers.length) * 100 : 0
    };
  });

  // Calculate online/offline statistics 
  const onlineCount = computers.filter(c => c.tracking?.online).length;
  const offlineCount = computers.filter(c => c.tracking && !c.tracking.online).length;
  const unknownCount = computers.filter(c => c.tracking === undefined).length;
  
  const onlineStatusData = [
    { name: "Online", value: onlineCount, color: "#22c55e" },
    { name: "Offline", value: offlineCount, color: "#6b7280" },
    { name: "Unknown", value: unknownCount, color: "#d1d5db" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage all computers in the system.</p>
        </div>
        <Button 
          onClick={syncComputers} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Sync Computers
        </Button>
      </div>
      
      {lastSync && (
        <p className="text-sm text-gray-500">
          Last synchronized: {new Date(lastSync).toLocaleString()}
        </p>
      )}
      
      {/* Lab Virtual Queues Section */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow space-y-2">
        <h3 className="font-semibold text-lg mb-2">Lab Virtual Queues</h3>
        {locations.length === 0 ? (
          <span className="text-sm text-gray-500">No labs found.</span>
        ) : (
          <div className="space-y-2">
            {locations.map(lab => (
              <div key={lab} className="border-b pb-2 last:border-b-0">
                <div className="font-medium">{lab}</div>
                {getLabQueue(lab).length === 0 ? (
                  <div className="text-sm text-gray-500">No students in queue.</div>
                ) : (
                  <ol className="list-decimal pl-5">
                    {getLabQueue(lab).map((userId, idx) => {
                      const user = mockUsers.find(u => u.id === userId);
                      return (
                        <li key={userId} className="text-sm">
                          {user ? user.name : userId}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Computer Status</CardTitle>
            <CardDescription>Current status of all computers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Online Status</CardTitle>
            <CardDescription>Network connectivity of computers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={onlineStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {onlineStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Lab Utilization</CardTitle>
            <CardDescription>Computer usage by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.map(location => (
                <div key={location.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{location.name}</span>
                    <span>{location.reserved} / {location.total} ({location.utilization.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded">
                    <div 
                      className="h-2 bg-blue-500 rounded" 
                      style={{ width: `${location.utilization}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="computers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="computers">Computers</TabsTrigger>
          <TabsTrigger value="tracking">Tracking Info</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="computers">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search computers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ComputerStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="faulty">Faulty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ComputerGrid computers={filteredComputers} emptyMessage="No computers match your search criteria." />
          </div>
        </TabsContent>
        
        <TabsContent value="tracking">
          <ComputerTrackingTable computers={computers} />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>System Activity Logs</CardTitle>
          <CardDescription>Recent actions on computers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">Event</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">Computer</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">Location</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">User/Technician</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">Details</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">Time</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700 dark:text-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockAdminLogs.slice().reverse().map((log, idx) => (
                  <tr
                    key={log.id}
                    className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50 dark:bg-slate-800"}
                  >
                    <td className="px-4 py-2">{log.eventType}</td>
                    <td className="px-4 py-2">{log.computerName}</td>
                    <td className="px-4 py-2">{log.location}</td>
                    <td className="px-4 py-2">{log.reporteeName || log.technicianName || "-"}</td>
                    <td className="px-4 py-2">{log.details || "-"}</td>
                    <td className="px-4 py-2">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          log.status === "fixed"
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : log.status === "computer released"
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : log.status === "not fixed"
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : "text-gray-700 dark:text-gray-200"
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
