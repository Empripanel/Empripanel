const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length > 0 && EMAIL_REGEX.test(email.trim());
}
