export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validateNickname(nickname: string): string | null {
  if (!nickname.trim()) return "Nickname is required.";
  if (nickname.trim().length > 30) return "Nickname must be 30 characters or less.";
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirm: string
): string | null {
  if (password !== confirm) return "Passwords do not match.";
  return null;
}
