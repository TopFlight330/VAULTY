"use client";

import { useState } from "react";
import Link from "next/link";
import { VaultyLogo } from "@/components/ui/VaultyLogo";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { useToast } from "@/hooks/useToast";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login({ email, password });

    if (result && !result.success) {
      showToast(result.message, "error");
    }

    setIsLoading(false);
  };

  return (
    <>
      <VaultyLogo />
      <AuthCard title="Welcome back" subtitle="Log in to your Vaulty account.">
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Remember me + Forgot */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.2rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.78rem",
                color: "var(--dim)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                style={{ accentColor: "var(--pink)" }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.78rem",
                color: "var(--pink)",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Log in
          </Button>
        </form>

        <SocialLoginButtons />
      </AuthCard>

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: "0.82rem",
          color: "var(--dim)",
        }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          style={{
            color: "var(--pink)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Create one
        </Link>
      </p>

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </>
  );
}
