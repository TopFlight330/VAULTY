"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { logout } from "@/lib/actions/auth";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({
  className = "",
  children,
}: LogoutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={className}
      >
        {children || "Log out"}
      </button>
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowConfirm(false)}
        title="Log out?"
        message="Are you sure you want to log out of Vaulty?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}
