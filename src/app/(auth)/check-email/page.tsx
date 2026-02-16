"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { resendConfirmation } from "@/lib/actions/auth";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);
  const { showToast } = useToast();

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    const result = await resendConfirmation(email);
    showToast(result.message, result.success ? "success" : "error");
    setIsResending(false);
  };

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "2.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "var(--purple-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--purple)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: "var(--font-sora), 'Sora', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          marginBottom: "0.4rem",
        }}
      >
        Check your email
      </h1>
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--dim)",
          marginBottom: "0.75rem",
          lineHeight: 1.5,
        }}
      >
        We sent a confirmation link to{" "}
        {email ? (
          <strong style={{ color: "var(--text)" }}>{email}</strong>
        ) : (
          "your email"
        )}
        . Click it to activate your account.
      </p>
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--muted)",
          marginBottom: "2rem",
          lineHeight: 1.5,
        }}
      >
        Don't see it? Check your spam or junk folder.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Link href="/login">
          <Button variant="primary" fullWidth>
            Go to login
          </Button>
        </Link>
        {email && (
          <button
            onClick={handleResend}
            disabled={isResending}
            style={{
              background: "none",
              border: "none",
              color: "var(--purple)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: isResending ? "default" : "pointer",
              opacity: isResending ? 0.5 : 1,
              padding: "0.5rem",
            }}
          >
            {isResending ? "Sending..." : "Resend confirmation email"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
