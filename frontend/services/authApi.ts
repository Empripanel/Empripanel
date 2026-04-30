import { mapApiMessage } from '../src/shared/userMessages';

const rawApiBase = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = (() => {
  if (!rawApiBase) return 'http://localhost:4000/api';
  const trimmed = rawApiBase.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
})();

const STORAGE_TOKEN = 'token';
const STORAGE_USER = 'user';

function apiMessage(data: Record<string, unknown>, fallback: string): string {
  return mapApiMessage(typeof data.message === 'string' ? data.message : undefined, fallback);
}

export type BackendUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export type RegisterBody = {
  username: string;
  email: string;
  password: string;
  role: 'EXPLORER' | 'BUSINESS';
};

export type LoginBody = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: BackendUser;
};

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN);
}

export function getStoredUser(): BackendUser | null {
  const raw = localStorage.getItem(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackendUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: BackendUser): void {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
}

/** Decode JWT payload without verification (client-side expiry check only). */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload) as { exp?: number };
  } catch {
    return null;
  }
}

/** Returns true if token exists and is not expired (with 60s buffer). */
export function isTokenValid(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || payload.exp == null) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now + 60;
}

export async function register(body: RegisterBody): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(apiMessage(data, 'No pudimos completar el registro. Inténtalo nuevamente'));
  }
  return data as AuthResponse;
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(apiMessage(data, 'Credenciales inválidas'));
  }
  return data as AuthResponse;
}

/** Headers to attach to authenticated requests. */
export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Map backend user to app UserAccount-like shape (id as string, privateEmail from email). */
export function toAppUser(u: BackendUser): { id: string; username: string; privateEmail: string; role: string; likedBusinesses: string[]; visitedHistory: string[] } {
  return {
    id: String(u.id),
    username: u.username,
    privateEmail: u.email,
    role: u.role,
    likedBusinesses: [],
    visitedHistory: [],
  };
}

const USERS_BASE = `${API_BASE}/users`;

async function authFetch(url: string, options: RequestInit = {}) {
  const headers = { ...authHeaders(), ...(options.headers as Record<string, string>) };
  if (typeof (options.body as string) === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'Ocurrió un problema. Inténtalo nuevamente'));
  return data;
}

/** PATCH /api/users/me - update email. Returns { message, user }. */
export async function updateEmail(email: string): Promise<{ message: string; user: BackendUser }> {
  return authFetch(`${USERS_BASE}/me`, { method: 'PATCH', body: JSON.stringify({ email }) });
}

/** PATCH /api/users/password - change password. */
export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
  return authFetch(`${USERS_BASE}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

/** DELETE /api/users/me - delete account. */
export async function deleteAccount(): Promise<{ message: string }> {
  return authFetch(`${USERS_BASE}/me`, { method: 'DELETE' });
}

/** PATCH /api/users/role - switch role. Returns { message, role }. */
export async function switchRole(): Promise<{ message: string; role: string }> {
  return authFetch(`${USERS_BASE}/role`, { method: 'PATCH' });
}

// --- Business API ---

export type BackendBusiness = {
  id: string;
  ownerId: number;
  name: string;
  category: string;
  bannerImageUrl: string;
  redirectUrl: string;
  slogan: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  clickCount?: number;
  reportCount?: number;
  location?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  x?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  hidden?: boolean;
};

export type CreateBusinessBody = {
  name: string;
  category: string;
  bannerImageUrl: string;
  redirectUrl: string;
  slogan: string;
  description: string;
  location?: string;
  phone?: string;
  contactEmail?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  x?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
};

const BUSINESS_BASE = `${API_BASE}/business`;

/** Base URL for shared business links (production: https://empripanel.com) */
export const SHARE_BASE_URL =
  (import.meta.env.VITE_SHARE_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'https://empripanel.com';

/** GET /api/business/:id - fetch single business (public). */
export async function getBusinessById(id: string): Promise<BackendBusiness> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) throw new Error('Negocio no encontrado');
    throw new Error(apiMessage(data, 'No pudimos cargar el negocio. Inténtalo nuevamente'));
  }
  return data as BackendBusiness;
}

/** POST /api/business - create business. Returns created business. */
export async function createBusiness(body: CreateBusinessBody): Promise<BackendBusiness> {
  const res = await fetch(BUSINESS_BASE, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos crear el negocio. Inténtalo nuevamente'));
  return data as BackendBusiness;
}

/** GET /api/business - list businesses. */
export async function getBusinesses(): Promise<BackendBusiness[]> {
  const res = await fetch(BUSINESS_BASE, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar los negocios. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** GET /api/business/search?q=... - search businesses by name, description, category (case-insensitive). */
export async function getSearchBusinesses(query: string): Promise<BackendBusiness[]> {
  const q = typeof query === 'string' ? query.trim() : '';
  if (!q) return [];
  const res = await fetch(`${BUSINESS_BASE}/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos buscar. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** GET /api/business/category/:category - list businesses by category (case- and accent-insensitive). */
export async function getBusinessesByCategory(category: string): Promise<BackendBusiness[]> {
  const cat = typeof category === 'string' ? category.trim() : '';
  if (!cat) return [];
  const res = await fetch(`${BUSINESS_BASE}/category/${encodeURIComponent(cat)}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar la categoría. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** GET /api/business/featured-category - featured category of the day (value). */
export async function getFeaturedCategory(): Promise<{ featuredCategory: string }> {
  const res = await fetch(`${BUSINESS_BASE}/featured-category`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar la categoría destacada. Inténtalo nuevamente'));
  return data as { featuredCategory: string };
}

const RANKINGS_BASE = `${API_BASE}/rankings`;

/** GET /api/rankings/top-clicked - businesses ordered by click count. */
export async function getRankingsTopClicked(): Promise<BackendBusiness[]> {
  const res = await fetch(`${RANKINGS_BASE}/top-clicked`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar el ranking. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** GET /api/rankings/top-liked - businesses ordered by like count. */
export async function getRankingsTopLiked(): Promise<BackendBusiness[]> {
  const res = await fetch(`${RANKINGS_BASE}/top-liked`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar el ranking. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** GET /api/rankings/new - recently created businesses. */
export async function getRankingsNew(): Promise<BackendBusiness[]> {
  const res = await fetch(`${RANKINGS_BASE}/new`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar los negocios nuevos. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** GET /api/business/panel - list businesses owned by current user. */
export async function getPanelBusinesses(): Promise<BackendBusiness[]> {
  const res = await fetch(`${BUSINESS_BASE}/panel`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar tu panel. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** PUT /api/business/:id - update business (owner only). Returns updated business. */
export async function updateBusiness(id: string, body: CreateBusinessBody): Promise<BackendBusiness> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403) throw new Error(apiMessage(data, 'No tenés permiso para editar este negocio'));
    if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
    throw new Error(apiMessage(data, 'No pudimos actualizar el negocio. Inténtalo nuevamente'));
  }
  return data as BackendBusiness;
}

/** DELETE /api/business/:id - delete business (owner or admin). */
export async function deleteBusiness(id: string): Promise<void> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  if (res.status === 403) throw new Error(apiMessage(data, 'No tenés permiso para eliminar este negocio'));
  if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos eliminar el negocio. Inténtalo nuevamente'));
}

/** PATCH /api/business/:id/hide - hide business (admin only). */
export async function hideBusiness(id: string): Promise<BackendBusiness> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(id)}/hide`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403) throw new Error(apiMessage(data, 'Solo los administradores pueden ocultar fichas'));
    if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
    throw new Error(apiMessage(data, 'No pudimos ocultar la ficha. Inténtalo nuevamente'));
  }
  return data as BackendBusiness;
}

/** PATCH /api/business/:id/restore - restore hidden business (admin only). */
export async function restoreBusiness(id: string): Promise<BackendBusiness> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(id)}/restore`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403) throw new Error(apiMessage(data, 'Solo los administradores pueden restaurar fichas'));
    if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
    throw new Error(apiMessage(data, 'No pudimos restaurar la ficha. Inténtalo nuevamente'));
  }
  return data as BackendBusiness;
}

/** GET /api/admin/hidden-businesses - list hidden businesses (admin only). */
export async function getHiddenBusinesses(): Promise<BackendBusiness[]> {
  const res = await fetch(`${API_BASE}/admin/hidden-businesses`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiMessage(data, 'No pudimos cargar las fichas ocultas. Inténtalo nuevamente'));
  return Array.isArray(data) ? data : [];
}

/** PATCH /api/admin/reset-password - admin password reset by username. */
export async function resetAdminUserPassword(
  username: string,
  newPassword: string
): Promise<{ message: string }> {
  return authFetch(`${API_BASE}/admin/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ username, newPassword }),
  });
}

/** POST /api/business/:id/like - toggle like. Returns { liked, likeCount }. */
export async function toggleLike(businessId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(businessId)}/like`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
    throw new Error(apiMessage(data, 'No pudimos actualizar el like. Inténtalo nuevamente'));
  }
  return data as { liked: boolean; likeCount: number };
}

/** POST /api/business/:id/click - register click (auth required). Returns { clickCount }. */
export async function registerClick(businessId: string): Promise<{ clickCount: number }> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(businessId)}/click`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
    throw new Error(apiMessage(data, 'No pudimos registrar la visita. Inténtalo nuevamente'));
  }
  return data as { clickCount: number };
}

/** POST /api/business/:id/report - toggle report. Returns { reported, reportCount }. */
export async function toggleReport(businessId: string): Promise<{ reported: boolean; reportCount: number }> {
  const res = await fetch(`${BUSINESS_BASE}/${encodeURIComponent(businessId)}/report`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) throw new Error(apiMessage(data, 'Negocio no encontrado'));
    throw new Error(apiMessage(data, 'No pudimos enviar el reporte. Inténtalo nuevamente'));
  }
  return data as { reported: boolean; reportCount: number };
}

/** GET /api/users/likes - list business IDs liked by current user. */
export async function getLikedBusinessIds(): Promise<string[]> {
  const res = await fetch(`${USERS_BASE}/likes`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const list = Array.isArray(data) ? data : [];
  return list.map((b: BackendBusiness) => b.id);
}

/** GET /api/users/likes - list full liked businesses (as profiles). */
export async function getLikedBusinesses(): Promise<ReturnType<typeof businessToProfile>[]> {
  const res = await fetch(`${USERS_BASE}/likes`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const list = Array.isArray(data) ? data : [];
  return list.map((b: BackendBusiness) => businessToProfile(b));
}

/** GET /api/users/visits - visit history (business + visitedAt). */
export async function getVisitHistory(): Promise<{ business: ReturnType<typeof businessToProfile>; visitedAt: string }[]> {
  const res = await fetch(`${USERS_BASE}/visits`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const list = Array.isArray(data) ? data : [];
  return list.map((item: { business: BackendBusiness; visitedAt: string }) => ({
    business: businessToProfile(item.business),
    visitedAt: typeof item.visitedAt === 'string' ? item.visitedAt : new Date(item.visitedAt).toISOString(),
  }));
}

/** GET /api/users/interaction-state — all clicked + active report IDs for UI sync across sessions. */
export async function getUserInteractionState(): Promise<{
  visitedBusinessIds: string[];
  reportedBusinessIds: string[];
}> {
  const res = await fetch(`${USERS_BASE}/interaction-state`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { visitedBusinessIds: [], reportedBusinessIds: [] };
  return {
    visitedBusinessIds: Array.isArray(data.visitedBusinessIds) ? data.visitedBusinessIds : [],
    reportedBusinessIds: Array.isArray(data.reportedBusinessIds) ? data.reportedBusinessIds : [],
  };
}

/** Map backend business to frontend BusinessProfile shape. */
export function businessToProfile(b: BackendBusiness): {
  id: string;
  ownerId: string;
  publicName: string;
  category: string;
  logo: string;
  shortDescription: string;
  fullDescription: string;
  redirectionUrl: string;
  location?: string;
  publicPhone?: string;
  publicEmail?: string;
  socials: { instagram?: string; twitter?: string; linkedin?: string; tiktok?: string; facebook?: string; website?: string; youtube?: string };
  clicks: number;
  likes: number;
  reports: string[];
  reportCount?: number;
  status: 'visible' | 'hidden';
  hiddenReason?: string;
} {
  return {
    id: b.id,
    ownerId: String(b.ownerId),
    publicName: b.name,
    category: b.category,
    logo: b.bannerImageUrl,
    shortDescription: b.slogan,
    fullDescription: b.description,
    redirectionUrl: b.redirectUrl,
    location: b.location ?? undefined,
    publicPhone: b.phone ?? undefined,
    publicEmail: b.contactEmail ?? undefined,
    socials: {
      website: b.website ?? undefined,
      instagram: b.instagram ?? undefined,
      twitter: b.x ?? undefined,
      tiktok: b.tiktok ?? undefined,
      linkedin: b.linkedin ?? undefined,
      facebook: b.facebook ?? undefined,
      youtube: b.youtube ?? undefined,
    },
    clicks: b.clickCount ?? 0,
    likes: b.likeCount ?? 0,
    reports: [],
    reportCount: b.reportCount ?? 0,
    status: b.hidden ? 'hidden' : 'visible',
    hiddenReason: b.hidden ? 'Ocultada por moderación' : undefined,
  };
}
