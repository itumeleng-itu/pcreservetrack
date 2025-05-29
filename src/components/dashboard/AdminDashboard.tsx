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
import { DatabaseManagement } from "../admin/DatabaseManagement";

export function AdminDashboard() {
  const { computers } = useComputers();
  const { syncComputers, lastSync, isLoading } = useTracking();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComputerStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState("all");
  
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
          <TabsTrigger value="database">Database</TabsTrigger>
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

        <TabsContent value="database">
          <DatabaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
