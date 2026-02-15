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
            className="mt-2"
          >
            {accountType === "creator"
              ? "Create creator account"
              : "Create account"}
          </Button>
        </form>

        <SocialLoginButtons />

        {/* Terms */}
        <p className="text-[0.68rem] text-[var(--muted)] text-center mt-[1.2rem] leading-relaxed">
          By creating an account, you agree to Vaulty&apos;s{" "}
          <a href="#" className="text-[var(--dim)] underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-[var(--dim)] underline">
            Privacy Policy
          </a>
          .
        </p>
      </AuthCard>

      {/* Footer */}
      <p className="text-center mt-6 text-[0.82rem] text-[var(--dim)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--pink)] font-bold hover:underline"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
