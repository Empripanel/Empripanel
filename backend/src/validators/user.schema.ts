import { z } from 'zod';

export const registerUserSchema = z.object({
  username: z.string().min(1, 'username is required'),
  email: z.string().email('email must be a valid email'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: z.enum(['EXPLORER', 'BUSINESS'], { message: 'role must be EXPLORER or BUSINESS' }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
