/**
 * Auth transport seam.
 *
 * SmartFlow has no auth endpoint yet, so `authenticate` and `register` resolve
 * locally and the session lives only on this device. That means credentials are
 * NOT checked against anything — any well-formed email and password will sign
 * in. This is the sign-in *flow*, not security.
 *
 * When the backend lands, replace the two function bodies with fetch calls and
 * return the token it issues; nothing above this file needs to change.
 */

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  fullName: string;
  email: string;
}

export const MIN_PASSWORD_LENGTH = 6;

// Deliberately permissive: something@something.tld. Anything stricter starts
// rejecting addresses that are perfectly valid.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 'Enter your email address.';
  }
  if (!emailPattern.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) {
    return 'Enter your password.';
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateFullName(value: string): string | null {
  if (value.trim().length === 0) {
    return 'Enter your full name.';
  }
  if (value.trim().length < 2) {
    return 'Enter your full name.';
  }
  return null;
}

/** "ysa.jabagat@gmail.com" -> "Ysa Jabagat", so the profile is not blank. */
export function displayNameFromEmail(email: string): string {
  const localPart = email.trim().split('@')[0] ?? '';
  const words = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return words.length > 0 ? words.join(' ') : 'NLEX Traveler';
}

function issueLocalToken(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function authenticate({ email, password }: Credentials): Promise<AuthResult> {
  const emailError = validateEmail(email);
  if (emailError !== null) {
    throw new Error(emailError);
  }
  const passwordError = validatePassword(password);
  if (passwordError !== null) {
    throw new Error(passwordError);
  }

  return {
    token: issueLocalToken(),
    fullName: displayNameFromEmail(email),
    email: email.trim(),
  };
}

export async function register({
  fullName,
  email,
  password,
}: Registration): Promise<AuthResult> {
  const nameError = validateFullName(fullName);
  if (nameError !== null) {
    throw new Error(nameError);
  }
  const emailError = validateEmail(email);
  if (emailError !== null) {
    throw new Error(emailError);
  }
  const passwordError = validatePassword(password);
  if (passwordError !== null) {
    throw new Error(passwordError);
  }

  return {
    token: issueLocalToken(),
    fullName: fullName.trim(),
    email: email.trim(),
  };
}
