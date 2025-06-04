
import React, { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { FaultConfirmationDialog } from "./FaultConfirmationDialog";
import { Computer } from "@/types";

export function NotificationHandler() {
  const { notifications, markAsRead } = useNotifications();
  const { confirmFaultReport, computers } = useComputers();
  const { currentUser } = useAuth();
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    notification: any;
    computer: Computer | null;
  }>({
    isOpen: false,
    notification: null,
    computer: null,
  });

  useEffect(() => {
    if (currentUser?.role === "admin") {
      const faultConfirmationNotifications = notifications.filter(
        n => !n.read && n.data?.type === "fault_confirmation"
      );

      if (faultConfirmationNotifications.length > 0) {
        const latestNotification = faultConfirmationNotifications[0];
        const computer = computers.find(c => c.id === latestNotification.data.computerId);
        
        if (computer) {
          setConfirmationDialog({
            isOpen: true,
            notification: latestNotification,
            computer: computer,
          });
        }
      }
    }
  }, [notifications, currentUser, computers]);

  const handleConfirmation = async (confirmed: boolean) => {
    if (confirmationDialog.notification && confirmationDialog.computer) {
      await confirmFaultReport(
        confirmationDialog.computer.id,
        confirmed,
        confirmed ? undefined : "Admin review determined computer is operational"
      );
      
      // Mark notification as read
      await markAsRead(confirmationDialog.notification.id);
      
      setConfirmationDialog({
        isOpen: false,
        notification: null,
        computer: null,
      });
    }
  };

  const handleClose = () => {
    setConfirmationDialog({
      isOpen: false,
      notification: null,
      computer: null,
    });
  };

  return (
    <FaultConfirmationDialog
      isOpen={confirmationDialog.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirmation}
      computer={confirmationDialog.computer}
      reporterName={confirmationDialog.notification?.data?.reporterName || ""}
      description={confirmationDialog.notification?.data?.description || ""}
      isEmergency={confirmationDialog.notification?.data?.isEmergency || false}
    />
  );
}
