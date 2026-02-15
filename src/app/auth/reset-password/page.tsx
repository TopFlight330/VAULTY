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

    // If we get here, it means reset failed (success would redirect)
    if (result && !result.success) {
      showToast(result.message, "error");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(244,63,142,0.05) 0%, rgba(139,92,246,0.03) 40%, transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-[420px]">
        <VaultyLogo />
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10">
          <h1
            className="text-[1.5rem] font-extrabold mb-[0.4rem]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Reset your password
          </h1>
          <p className="text-[0.88rem] text-[var(--dim)] mb-8 leading-relaxed">
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
