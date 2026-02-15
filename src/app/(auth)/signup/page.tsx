"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VaultyLogo } from "@/components/ui/VaultyLogo";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { AccountTypeSelector } from "@/components/auth/AccountTypeSelector";
import { CreatorFields } from "@/components/auth/CreatorFields";
import { useToast } from "@/hooks/useToast";
import { signup } from "@/lib/actions/auth";
import type {
  AccountType,
  CreatorCategory,
  SocialReach,
} from "@/types/auth";

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>("subscriber");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<CreatorCategory>("general");
  const [socialReach, setSocialReach] = useState<SocialReach>("100");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signup({
      email,
      password,
      nickname,
      accountType,
      ...(accountType === "creator" && { category, socialReach }),
    });

    if (result.success) {
      showToast(result.message, "success", 6000);
      router.push("/login");
    } else {
      showToast(result.message, "error");
    }

    setIsLoading(false);
  };

  return (
    <>
      <VaultyLogo />
      <AuthCard
        title="Create an account"
        subtitle="Join Vaulty and start in minutes."
      >
        <AccountTypeSelector value={accountType} onChange={setAccountType} />

        <form onSubmit={handleSubmit}>
          <Input
            label="Nickname"
            type="text"
            placeholder="How others will see you"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
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
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {accountType === "creator" && (
            <CreatorFields
              category={category}
              onCategoryChange={setCategory}
              socialReach={socialReach}
              onSocialReachChange={setSocialReach}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            style={{ marginTop: "0.5rem" }}
          >
            {accountType === "creator"
              ? "Create creator account"
              : "Create account"}
          </Button>
        </form>

        <SocialLoginButtons />

        {/* Terms */}
        <p
          style={{
            fontSize: "0.68rem",
            color: "var(--muted)",
            textAlign: "center",
            marginTop: "1.2rem",
            lineHeight: 1.6,
          }}
        >
          By creating an account, you agree to Vaulty&apos;s{" "}
          <a href="#" style={{ color: "var(--dim)", textDecoration: "underline" }}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" style={{ color: "var(--dim)", textDecoration: "underline" }}>
            Privacy Policy
          </a>
          .
        </p>
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
        Already have an account?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--pink)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Log in
        </Link>
      </p>
    </>
  );
}
