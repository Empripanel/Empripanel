
export type Role = 'user' | 'business' | 'EXPLORER' | 'BUSINESS' | 'ADMIN';

export interface SocialMedia {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  facebook?: string;
  website?: string;
  youtube?: string;
}

export interface UserAccount {
  id: string;
  username: string; // Unique public username
  password?: string;
  privateEmail: string; // Private mandatory email (or email from API)
  role: Role;
  likedBusinesses?: string[];
  visitedHistory?: string[]; // List of business IDs, max 10, unique, MRU
}

export interface BusinessProfile {
  id: string;
  ownerId: string; // References UserAccount.id
  publicName: string;
  category: string;
  logo: string; // Mandatory banner image
  shortDescription: string;
  fullDescription: string;
  redirectionUrl: string; // Mandatory external link
  location?: string;
  publicPhone?: string;
  publicEmail?: string;
  socials: SocialMedia;
  clicks: number;
  likes: number;
  reports: string[]; // IDs de usuarios que reportaron
  reportCount?: number; // total report count from backend
  status: 'visible' | 'hidden';
  hiddenReason?: string;
}

/** Backend `hidden` maps to `status === 'hidden'`. Use for filtering non-admin lists. */
export function isBusinessHidden(profile: Pick<BusinessProfile, 'status'>): boolean {
  return profile.status === 'hidden';
}

export type AuthState = {
  user: UserAccount | null;
  isAuthenticated: boolean;
};
