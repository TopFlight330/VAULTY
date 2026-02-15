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

    // If we get here, it means login failed (success would redirect)
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
          <div className="flex justify-between items-center mb-[1.2rem]">
            <label className="flex items-center gap-[6px] text-[0.78rem] text-[var(--dim)] cursor-pointer">
              <input
                type="checkbox"
                className="accent-[var(--pink)]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-[0.78rem] text-[var(--pink)] font-bold hover:underline"
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
      <p className="text-center mt-6 text-[0.82rem] text-[var(--dim)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[var(--pink)] font-bold hover:underline"
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
