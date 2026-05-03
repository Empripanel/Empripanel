import type { CookieOptions } from 'express';

/** Must match frontend localStorage key for the bearer token (`token`). */
export const AUTH_COOKIE_NAME = 'token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Production cross-site SPA: SameSite=None requires Secure. Local dev uses lax over HTTP. */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
  };
}

/** Match Set-Cookie attributes so browsers actually remove the cookie. */
export function getAuthCookieClearOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
  };
}
