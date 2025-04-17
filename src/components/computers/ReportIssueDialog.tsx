
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReportIssueDialogProps {
  onReportIssue: (description: string) => void;
}

export function ReportIssueDialog({ onReportIssue }: ReportIssueDialogProps) {
  const [faultDescription, setFaultDescription] = useState("");
  
  const handleReportFault = () => {
    if (faultDescription.trim()) {
      onReportIssue(faultDescription);
      setFaultDescription("");
    }
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleReportFault}>Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
