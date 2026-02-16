import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface ConfirmPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const isSuccess = params.success === "true";
  const isError = params.error === "true";

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
      {isSuccess && (
        <>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--success-dim)",
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
              stroke="var(--success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
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
            Email confirmed!
          </h1>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--dim)",
              marginBottom: "2rem",
              lineHeight: 1.5,
            }}
          >
            Your account is verified and ready to go.
          </p>
          <Link href="/login">
            <Button variant="primary" fullWidth>
              Go to login
            </Button>
          </Link>
        </>
      )}

      {isError && (
        <>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--danger-dim)",
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
              stroke="var(--danger)"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
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
            Confirmation failed
          </h1>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--dim)",
              marginBottom: "2rem",
              lineHeight: 1.5,
            }}
          >
            The confirmation link is invalid or has expired.
          </p>
          <Link href="/signup">
            <Button variant="primary" fullWidth>
              Try again
            </Button>
          </Link>
        </>
      )}

      {!isSuccess && !isError && (
        <>
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
            We sent you a confirmation link. Click it to complete the creation of your account.
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
          <Link href="/login">
            <Button variant="primary" fullWidth>
              Back to login
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
