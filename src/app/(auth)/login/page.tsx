"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { useToast } from "@/hooks/useToast";
import { login } from "@/lib/actions/auth";
import s from "../auth.module.css";

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

  const handleSocialLogin = async (provider: "google" | "apple") => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) showToast(error.message, "error");
  };

  return (
    <>
      {/* Logo */}
      <Link href="/" className={s.authLogo}>
        <div className={s.authLogoIcon}>
          <div className={s.authLogoVault}>
            <div className={s.sp} style={{ transform: "rotate(0deg)" }} />
            <div className={s.sp} style={{ transform: "rotate(90deg)" }} />
            <div className={s.sp} style={{ transform: "rotate(45deg)" }} />
            <div className={s.sp} style={{ transform: "rotate(135deg)" }} />
          </div>
        </div>
        <span className={s.authLogoText}>Vaulty</span>
      </Link>

      {/* Card */}
      <div className={s.authCard}>
        <h1>Welcome back</h1>
        <p className={s.subtitle}>Log in to your Vaulty account.</p>

        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label>Email or username</label>
            <input
              type="text"
              className={s.formInput}
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={s.formGroup}>
            <label>Password</label>
            <input
              type="password"
              className={s.formInput}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={s.formRowBetween}>
            <label className={s.remember}>
              <input type="checkbox" defaultChecked /> Remember me
            </label>
            <button
              type="button"
              className={s.forgot}
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className={s.authSubmit}
            disabled={isLoading}
          >
            {isLoading && (
              <svg className={s.spinner} viewBox="0 0 24 24" fill="none">
                <circle opacity={0.25} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path opacity={0.75} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Log in
          </button>
        </form>

        <div className={s.authDivider}><span className={s.dividerText}>or continue with</span></div>

        <div className={s.socialBtns}>
          <button type="button" className={s.socialBtn} onClick={() => handleSocialLogin("google")}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button type="button" className={s.socialBtn} onClick={() => handleSocialLogin("apple")}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={s.authFooter}>
        Don&apos;t have an account? <Link href="/signup">Create one</Link>
      </div>

      <ForgotPasswordModal
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </>
  );
}
