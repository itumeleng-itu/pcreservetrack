
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Computer } from "@/types";
import { Cpu, HardDrive, Wifi, WifiOff } from "lucide-react";

interface ComputerTrackingTableProps {
  computers: Computer[];
}

export function ComputerTrackingTable({ computers }: ComputerTrackingTableProps) {
  if (!computers.length) {
    return <div className="p-8 text-center">No computers available for tracking.</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableCaption>Real-time tracking information for all computers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Computer Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>CPU Usage</TableHead>
            <TableHead>Memory Usage</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {computers.map((computer) => (
            <TableRow key={computer.id}>
              <TableCell className="font-medium">{computer.id}</TableCell>
              <TableCell>{computer.name}</TableCell>
              <TableCell>{computer.location}</TableCell>
              <TableCell>
                {computer.tracking?.online !== undefined ? (
                  <Badge className={computer.tracking.online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {computer.tracking.online ? (
                      <Wifi size={14} className="mr-1 inline" />
                    ) : (
                      <WifiOff size={14} className="mr-1 inline" />
                    )}
                    {computer.tracking.online ? "Online" : "Offline"}
                  </Badge>
                ) : (
                  <span>Unknown</span>
                )}
              </TableCell>
              <TableCell>
                {computer.tracking?.cpuUsage !== undefined ? (
                  <div className="flex items-center">
                    <Cpu size={14} className="mr-1" />
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${computer.tracking.cpuUsage}%` }}
                      ></div>
                    </div>
                    <span>{computer.tracking.cpuUsage}%</span>
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                {computer.tracking?.memoryUsage !== undefined ? (
                  <div className="flex items-center">
                    <HardDrive size={14} className="mr-1" />
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div
                        className="bg-purple-600 h-2.5 rounded-full"
                        style={{ width: `${computer.tracking.memoryUsage}%` }}
                      ></div>
                    </div>
                    <span>{computer.tracking.memoryUsage}%</span>
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                {computer.lastSeen ? (
                  new Date(computer.lastSeen).toLocaleString()
                ) : (
                  "Never"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
