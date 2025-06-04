
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Computer } from "@/types";

interface FaultConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmed: boolean) => void;
  computer: Computer | null;
  reporterName: string;
  description: string;
  isEmergency: boolean;
}

export function FaultConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  computer,
  reporterName,
  description,
  isEmergency,
}: FaultConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm(true);
    onClose();
  };

  const handleDeny = () => {
    onConfirm(false);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEmergency ? "🚨 EMERGENCY: " : ""}Confirm Fault Report
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reporterName} has reported an issue with {computer?.name} ({computer?.location}).
            
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm">
                <strong>Computer:</strong> {computer?.name}<br />
                <strong>Location:</strong> {computer?.location}<br />
                <strong>Reported by:</strong> {reporterName}<br />
                <strong>Issue:</strong> {description}<br />
                {isEmergency && <strong className="text-red-600">⚠️ EMERGENCY PRIORITY</strong>}
              </p>
            </div>
            
            Do you confirm that this computer should be marked as faulty and removed from service?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDeny}>
            Deny - Keep Operational
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className={isEmergency ? "bg-red-600 hover:bg-red-700" : ""}>
            Confirm - Mark as Faulty
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
