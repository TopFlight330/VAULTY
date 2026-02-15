"use client";

import { useState } from "react";
import { VaultyLogo } from "@/components/ui/VaultyLogo";
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(244,63,142,0.05) 0%, rgba(139,92,246,0.03) 40%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <VaultyLogo />
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
      </div>
    </div>
  );
}
