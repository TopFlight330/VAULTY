"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { resetPassword } from "@/lib/actions/auth";
import { validatePasswordMatch } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const matchErr = validatePasswordMatch(password, confirmPassword);
    if (matchErr) {
      setError(matchErr);
      return;
    }

    setIsLoading(true);

    const result = await resetPassword({ password });

    if (result && !result.success) {
      showToast(result.message, "error");
    }

    setIsLoading(false);
  };

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "2.5rem",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-sora), 'Sora', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          marginBottom: "0.4rem",
        }}
      >
        Reset your password
      </h1>
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--dim)",
          marginBottom: "2rem",
          lineHeight: 1.5,
        }}
      >
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit}>
        <Input
          label="New password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={error}
          required
          minLength={8}
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          Update password
        </Button>
      </form>
    </div>
  );
}
