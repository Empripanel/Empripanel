import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { isValidEmail } from '../utils/validation';

const USER_SELECT = { id: true, username: true, email: true, role: true, createdAt: true };

export async function updateEmail(userId: number, email: string) {
  const trimmed = email?.trim();
  if (!trimmed) throw new AppError('Email is required', 400);
  if (!isValidEmail(trimmed)) throw new AppError('Invalid email format', 400);

  const existing = await prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true },
  });
  if (existing && existing.id !== userId) {
    throw new AppError('Email already in use', 409);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { email: trimmed },
    select: USER_SELECT,
  });
  return user;
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('currentPassword, newPassword and confirmPassword are required', 400);
  }
  if (newPassword !== confirmPassword) {
    throw new AppError('newPassword and confirmPassword do not match', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('newPassword must be at least 6 characters', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

export async function deleteUser(userId: number) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, isDeleted: true },
    });
    if (!user) throw new AppError('User not found', 404);
    if (user.isDeleted) throw new AppError('Account is already deleted', 400);

    // Permanently delete all businesses owned by this user (cascades to their Likes, Reports, Visits)
    await tx.business.deleteMany({
      where: { ownerId: userId },
    });

    const invalidPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      10
    );

    await tx.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        email: `deleted_${user.id}_${user.email}`,
        username: `deleted_${user.id}_${user.username}`,
        password: invalidPassword,
      },
    });
  });
}

export async function switchRole(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new AppError('User not found', 404);

  if (user.role === 'ADMIN') {
    throw new AppError('Admin cannot switch role', 403);
  }

  const newRole = user.role === 'EXPLORER' ? 'BUSINESS' : 'EXPLORER';
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  return newRole;
}
