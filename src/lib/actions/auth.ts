"use server";

import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";
import { getWelcomeEmailHtml } from "@/lib/emails/welcome-template";
import { redirect } from "next/navigation";
import type { AuthActionResult, SignupFormData } from "@/types/auth";
import {
  validateEmail,
  validatePassword,
  validateNickname,
} from "@/lib/validations/auth";

export async function signup(data: SignupFormData): Promise<AuthActionResult> {
  const emailErr = validateEmail(data.email);
  if (emailErr) return { success: false, message: emailErr };

  const pwErr = validatePassword(data.password);
  if (pwErr) return { success: false, message: pwErr };

  const nickErr = validateNickname(data.nickname);
  if (nickErr) return { success: false, message: nickErr };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vaulty.com";

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nickname: data.nickname,
        account_type: data.accountType,
        category: data.category,
        social_reach: data.socialReach,
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Send welcome email via Resend (non-blocking, don't fail signup if this fails)
  try {
    await resend.emails.send({
      from: "Vaulty <onboarding@resend.dev>",
      to: data.email,
      subject: "Welcome to Vaulty!",
      html: getWelcomeEmailHtml(data.nickname),
    });
  } catch {
    // Welcome email failure shouldn't block signup
  }

  return {
    success: true,
    message: "Account created! Check your email to confirm.",
  };
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const emailErr = validateEmail(data.email);
  if (emailErr) return { success: false, message: emailErr };

  if (!data.password) {
    return { success: false, message: "Password is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(data: {
  email: string;
}): Promise<AuthActionResult> {
  const emailErr = validateEmail(data.email);
  if (emailErr) return { success: false, message: emailErr };

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vaulty.com";

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "If an account exists with this email, you'll receive a reset link.",
  };
}

export async function resetPassword(data: {
  password: string;
}): Promise<AuthActionResult> {
  const pwErr = validatePassword(data.password);
  if (pwErr) return { success: false, message: pwErr };

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  redirect("/login");
}
