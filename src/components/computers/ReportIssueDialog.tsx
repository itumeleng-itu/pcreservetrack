
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportIssueDialogProps {
  onReportIssue: (description: string, isEmergency: boolean) => Promise<boolean | void>;
}

export function ReportIssueDialog({ onReportIssue }: ReportIssueDialogProps) {
  const [faultDescription, setFaultDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Real-time validation
  const isDescriptionValid = faultDescription.trim().length >= 10 && faultDescription.trim().length <= 1000;
  const characterCount = faultDescription.trim().length;
  const remainingChars = 1000 - characterCount;
  
  const handleReportFault = async () => {
    // Frontend validation
    if (!isDescriptionValid) {
      toast({
        title: "Invalid Description",
        description: "Please provide a detailed description (10-1000 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Submitting fault report:", {
        description: faultDescription.substring(0, 50) + "...",
        isEmergency,
        timestamp: new Date().toISOString()
      });
      
      const result = await onReportIssue(faultDescription.trim(), isEmergency);
      
      // Only close dialog if report was successful
      if (result !== false) {
        // Reset form and close dialog
        setFaultDescription("");
        setIsEmergency(false);
        setOpen(false);
        
        console.log("Fault report submitted successfully");
      }
      
    } catch (error) {
      console.error("Error submitting fault report:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFaultDescription("");
    setIsEmergency(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Computer Issue
          </DialogTitle>
          <DialogDescription>
            Provide a detailed description of the problem you're experiencing. 
            This will help technicians resolve the issue quickly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Issue Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail (e.g., 'Computer won't start', 'Screen is flickering', 'Keyboard not responding')..."
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              className={cn(
                "min-h-[100px] resize-none",
                characterCount < 10 && characterCount > 0 && "border-orange-300 focus:border-orange-500",
                characterCount >= 10 && "border-green-300 focus:border-green-500",
                characterCount > 1000 && "border-red-300 focus:border-red-500"
              )}
              disabled={isSubmitting}
              maxLength={1000}
            />
            
            {/* Character counter and validation feedback */}
            <div className="flex justify-between items-center text-xs">
              <div className={cn(
                "transition-colors",
                characterCount < 10 && characterCount > 0 && "text-orange-600",
                characterCount >= 10 && characterCount <= 1000 && "text-green-600",
                characterCount > 1000 && "text-red-600"
              )}>
                {characterCount < 10 && characterCount > 0 && `Need ${10 - characterCount} more characters`}
                {characterCount >= 10 && characterCount <= 1000 && "✓ Description looks good"}
                {characterCount > 1000 && "Description too long"}
                {characterCount === 0 && "Please describe the issue"}
              </div>
              <div className={cn(
                "transition-colors",
                remainingChars < 100 && remainingChars >= 0 && "text-orange-600",
                remainingChars < 0 && "text-red-600",
                remainingChars >= 100 && "text-gray-500"
              )}>
                {remainingChars} characters remaining
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Checkbox 
              id="emergency" 
              checked={isEmergency} 
              onCheckedChange={(checked) => setIsEmergency(checked === true)}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <div className="flex-1">
              <Label htmlFor="emergency" className="text-sm font-medium text-red-800 cursor-pointer">
                🚨 This is an emergency
              </Label>
              <p className="text-xs text-red-700 mt-1">
                Check this only for critical issues that prevent computer use or pose safety risks
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReportFault}
            disabled={!isDescriptionValid || isSubmitting}
            className={cn(
              "min-w-[120px]",
              isEmergency && "bg-red-600 hover:bg-red-700"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {isEmergency ? "🚨 Report Emergency" : "Report Issue"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
