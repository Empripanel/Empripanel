import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { signAuthToken } from '../utils/jwt';

type AllowedRegistrationRole = 'EXPLORER' | 'BUSINESS';

function assertRegistrationRole(role: string): asserts role is AllowedRegistrationRole {
  if (role !== 'EXPLORER' && role !== 'BUSINESS') {
    throw new AppError('Invalid role. Must be EXPLORER or BUSINESS', 400);
  }
}

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  role: string;
}) {
  const { username, email, password } = input;

  if (input.role === 'ADMIN') {
    throw new AppError('ADMIN role cannot be assigned during registration', 400);
  }
  assertRegistrationRole(input.role);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });

  if (existing?.username === username) throw new AppError('Username already exists', 400);
  if (existing?.email === email) throw new AppError('Email already exists', 400);

  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        role: input.role,
      },
      select: { id: true, username: true, email: true, role: true },
    });

    const token = signAuthToken({ userId: user.id, role: user.role });
    return { token, user };
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Username or email already exists', 400);
    }
    throw err;
  }
}

export async function loginUser(input: { username: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true, username: true, email: true, role: true, password: true, isDeleted: true },
  });

  if (!user) throw new AppError('Invalid credentials', 401);
  if (user.isDeleted) throw new AppError('Account does not exist.', 401);

  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) throw new AppError('Invalid credentials', 401);

  const token = signAuthToken({ userId: user.id, role: user.role });
  const { password: _pw, ...safeUser } = user;

  return { token, user: safeUser };
}

