"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { getWelcomeEmailHtml } from "@/lib/emails/welcome-template";
import { getResetPasswordEmailHtml } from "@/lib/emails/reset-password-template";
import { redirect } from "next/navigation";
import type { AuthActionResult, SignupFormData } from "@/types/auth";
import {
  validateEmail,
  validatePassword,
  validateNickname,
} from "@/lib/validations/auth";

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.URL) return process.env.URL;
  return "https://vaulty.com";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function signup(data: SignupFormData): Promise<AuthActionResult> {
  const emailErr = validateEmail(data.email);
  if (emailErr) return { success: false, message: emailErr };

  const pwErr = validatePassword(data.password);
  if (pwErr) return { success: false, message: pwErr };

  const nickErr = validateNickname(data.nickname);
  if (nickErr) return { success: false, message: nickErr };

  const supabase = await createClient();

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nickname: data.nickname,
        account_type: data.accountType,
        category: data.category,
        social_reach: data.socialReach,
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Supabase returns empty identities when the email already exists
  if (signUpData.user?.identities?.length === 0) {
    return { success: false, message: "An account with this email already exists." };
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
    message: "Account created! You can now log in.",
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

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Route by profile role
  let destination = "/dashboard/client";
  if (signInData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", signInData.user.id)
      .single();

    if (profile?.is_banned) {
      await supabase.auth.signOut();
      return { success: false, message: "Your account has been suspended." };
    }

    if (profile?.role === "creator") destination = "/dashboard";
    else if (profile?.role === "admin") destination = "/admin";
  }

  redirect(destination);
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

  const admin = createAdminClient();

  // Find user by email
  const { data: usersData } = await admin.auth.admin.listUsers();
  const user = usersData?.users?.find((u) => u.email === data.email);

  // Always return success to prevent email enumeration
  if (!user) {
    return {
      success: true,
      message: "If an account exists with this email, you'll receive a reset link.",
    };
  }

  // Generate a random token and hash it for storage
  const rawToken = crypto.randomUUID();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Invalidate any existing tokens for this user
  await admin.from("password_resets").delete().eq("user_id", user.id);

  // Store the hashed token
  await admin.from("password_resets").insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  // Build reset URL with raw token
  const siteUrl = getSiteUrl();
  const resetUrl = `${siteUrl}/reset-password?token=${rawToken}`;

  // Send email via Resend
  try {
    await resend.emails.send({
      from: "Vaulty <onboarding@resend.dev>",
      to: data.email,
      subject: "Reset your Vaulty password",
      html: getResetPasswordEmailHtml(resetUrl),
    });
  } catch {
    return { success: false, message: "Failed to send reset email. Please try again." };
  }

  return {
    success: true,
    message: "If an account exists with this email, you'll receive a reset link.",
  };
}

export async function resetPassword(data: {
  token: string;
  password: string;
}): Promise<AuthActionResult> {
  if (!data.token) {
    return { success: false, message: "Invalid reset link." };
  }

  const pwErr = validatePassword(data.password);
  if (pwErr) return { success: false, message: pwErr };

  const admin = createAdminClient();
  const tokenHash = hashToken(data.token);

  // Find the reset record
  const { data: resetRecord, error: findErr } = await admin
    .from("password_resets")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("used", false)
    .single();

  if (findErr || !resetRecord) {
    return { success: false, message: "Invalid or expired reset link." };
  }

  // Check expiry
  if (new Date(resetRecord.expires_at) < new Date()) {
    await admin.from("password_resets").delete().eq("id", resetRecord.id);
    return { success: false, message: "This reset link has expired. Please request a new one." };
  }

  // Update password via admin API
  const { error: updateErr } = await admin.auth.admin.updateUserById(
    resetRecord.user_id,
    { password: data.password }
  );

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  // Mark token as used
  await admin.from("password_resets").update({ used: true }).eq("id", resetRecord.id);

  return {
    success: true,
    message: "Password updated! You can now log in.",
  };
}
