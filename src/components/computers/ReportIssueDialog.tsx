
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ReportIssueDialogProps {
  onReportIssue: (description: string, isEmergency: boolean) => void;
}

export function ReportIssueDialog({ onReportIssue }: ReportIssueDialogProps) {
  const [faultDescription, setFaultDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  
  const handleReportFault = () => {
    const trimmedDescription = faultDescription.trim();
    
    // Enhanced validation
    if (!trimmedDescription) {
      return; // Don't proceed if empty
    }
    
    if (trimmedDescription.length < 10) {
      return; // Don't proceed if too short
    }
    
    if (trimmedDescription.length > 500) {
      return; // Don't proceed if too long
    }
    
    // Sanitize input to prevent XSS
    const sanitizedDescription = trimmedDescription
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
    
    onReportIssue(sanitizedDescription, isEmergency);
    setFaultDescription("");
    setIsEmergency(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Report Issue</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the problem you're experiencing with this computer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue..."
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              minLength={10}
              maxLength={500}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="emergency" 
              checked={isEmergency} 
              onCheckedChange={(checked) => setIsEmergency(checked === true)}
            />
            <Label htmlFor="emergency" className="text-sm font-medium">
              This is an emergency
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleReportFault}>Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
