export type AccountType = "subscriber" | "creator";
export type CreatorCategory = "general" | "18+";
export type SocialReach = "100" | "1000" | "100000" | "1000000";

export interface SignupFormData {
  email: string;
  password: string;
  nickname: string;
  accountType: AccountType;
  category?: CreatorCategory;
  socialReach?: SocialReach;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface AuthActionResult {
  success: boolean;
  message: string;
}
