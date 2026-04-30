import { z } from 'zod';

export const createBusinessSchema = z.object({
  // Required
  name: z.string().min(1, 'name is required'),
  category: z.string().min(1, 'category is required'),
  bannerImageUrl: z.string().url('bannerImageUrl must be a valid URL'),
  redirectUrl: z.string().url('redirectUrl must be a valid URL'),
  slogan: z.string().min(1, 'slogan is required'),
  description: z.string().min(1, 'description is required'),
  // Optional – if present must be valid
  contactEmail: z.union([z.string().email('contactEmail must be a valid email'), z.literal('')]).optional(),
  website: z.union([z.string().url('website must be a valid URL'), z.literal('')]).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  x: z.string().optional(),
  linkedin: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
