
import React from "react";
import { ComputerGrid } from "../computers/ComputerGrid";
import { useComputers } from "@/context/ComputerContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export function TechnicianDashboard() {
  const { computers, getFaultyComputers } = useComputers();
  
  const faultyComputers = getFaultyComputers();
  const repairableCount = faultyComputers.length;
  const totalComputerCount = computers.length;
  const healthPercentage = Math.round(((totalComputerCount - repairableCount) / totalComputerCount) * 100);
  
  // Group faulty computers by location
  const faultyByLocation: Record<string, number> = {};
  faultyComputers.forEach(computer => {
    if (faultyByLocation[computer.location]) {
      faultyByLocation[computer.location]++;
    } else {
      faultyByLocation[computer.location] = 1;
    }
  });
  
  // Sort locations by number of faulty computers
  const sortedLocations = Object.entries(faultyByLocation)
    .sort(([, countA], [, countB]) => countB - countA);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Technician Dashboard</h2>
        <p className="text-muted-foreground">View and fix reported computer issues.</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall status of the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center flex-col">
              <div 
                className="relative flex justify-center items-center w-32 h-32 rounded-full"
                style={{
                  background: `conic-gradient(${healthPercentage > 90 ? '#22c55e' : healthPercentage > 70 ? '#eab308' : '#ef4444'} ${healthPercentage}%, #e5e7eb ${healthPercentage}%)`
                }}
              >
                <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center">
                  <span className="text-2xl font-bold">{healthPercentage}%</span>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">
                {repairableCount} out of {totalComputerCount} computers need attention
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Issues by Location</CardTitle>
            <CardDescription>Computer issues grouped by location</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedLocations.length > 0 ? (
              <div className="space-y-4">
                {sortedLocations.map(([location, count]) => (
                  <div key={location} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                      <span>{location}</span>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      {count} {count === 1 ? 'issue' : 'issues'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-center text-gray-500">No issues reported! All systems operational.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          Computers Requiring Attention
        </h3>
        <ComputerGrid 
          computers={faultyComputers} 
          emptyMessage="No faulty computers to fix at the moment." 
        />
      </div>
    </div>
  );
}
