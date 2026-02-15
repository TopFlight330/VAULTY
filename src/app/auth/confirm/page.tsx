import Link from "next/link";
import { VaultyLogo } from "@/components/ui/VaultyLogo";
import { Button } from "@/components/ui/Button";

interface ConfirmPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const isSuccess = params.success === "true";
  const isError = params.error === "true";

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
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10 text-center">
          {isSuccess && (
            <>
              {/* Success icon */}
              <div className="w-16 h-16 rounded-full bg-[var(--success-dim)] flex items-center justify-center mx-auto mb-6">
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
                className="text-[1.5rem] font-extrabold mb-[0.4rem]"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Email confirmed!
              </h1>
              <p className="text-[0.88rem] text-[var(--dim)] mb-8 leading-relaxed">
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
              {/* Error icon */}
              <div className="w-16 h-16 rounded-full bg-[var(--danger-dim)] flex items-center justify-center mx-auto mb-6">
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
                className="text-[1.5rem] font-extrabold mb-[0.4rem]"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Confirmation failed
              </h1>
              <p className="text-[0.88rem] text-[var(--dim)] mb-8 leading-relaxed">
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
              {/* Waiting state */}
              <div className="w-16 h-16 rounded-full bg-[var(--purple-dim)] flex items-center justify-center mx-auto mb-6">
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
                className="text-[1.5rem] font-extrabold mb-[0.4rem]"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Check your email
              </h1>
              <p className="text-[0.88rem] text-[var(--dim)] mb-8 leading-relaxed">
                We sent you a confirmation link. Click it to verify your
                account.
              </p>
              <Link href="/login">
                <Button variant="secondary" fullWidth>
                  Back to login
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
