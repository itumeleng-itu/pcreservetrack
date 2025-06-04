
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

interface AdminConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmed: boolean) => void;
  computer: Computer | null;
  technicianName: string;
}

export function AdminConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  computer,
  technicianName,
}: AdminConfirmationDialogProps) {
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
          <AlertDialogTitle>Confirm Computer Fix</AlertDialogTitle>
          <AlertDialogDescription>
            Technician {technicianName} has marked {computer?.name} ({computer?.location}) as fixed.
            
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm">
                <strong>Computer:</strong> {computer?.name}<br />
                <strong>Location:</strong> {computer?.location}<br />
                <strong>Previous Issue:</strong> {computer?.faultDescription}<br />
                <strong>Technician:</strong> {technicianName}
              </p>
            </div>
            
            Do you want to confirm that this computer is indeed fixed and ready for use?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDeny}>
            Deny - Keep as Faulty
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirm - Mark as Available
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
