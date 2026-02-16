"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { forgotPassword } from "@/lib/actions/auth";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await forgotPassword({ email });

    if (result.success) {
      showToast(result.message, "success");
      setEmail("");
      onClose();
    } else {
      showToast(result.message, "error");
    }

    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forgot password?">
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--dim)",
          lineHeight: 1.5,
          marginBottom: "1.5rem",
        }}
      >
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          Send reset link
        </Button>
      </form>
      <button
        onClick={onClose}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          marginTop: "1rem",
          fontSize: "0.82rem",
          color: "var(--dim)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "color 0.2s",
        }}
      >
        Back to login
      </button>
    </Modal>
  );
}
