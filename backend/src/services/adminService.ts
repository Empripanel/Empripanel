import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export async function resetUserPasswordByUsername(username: string, newPassword: string) {
  const trimmedUsername = username?.trim();
  if (!trimmedUsername) throw new AppError('username is required', 400);

  if (!newPassword || newPassword.trim().length < 6) {
    throw new AppError('newPassword must be at least 6 characters', 400);
  }

  const user = await prisma.user.findFirst({
    where: { username: trimmedUsername, isDeleted: false },
    select: { id: true },
  });

  if (!user) throw new AppError('User not found', 404);

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
}

