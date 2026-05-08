import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';

const SALT_ROUNDS = 12;

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { userId, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
}

export async function registerUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return { user, accessToken, refreshToken };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error('Refresh token expired or revoked');
    err.statusCode = 401;
    throw err;
  }

  // Rotate token
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newTokens = generateTokens(decoded.userId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({
    data: { token: newTokens.refreshToken, userId: decoded.userId, expiresAt },
  });

  return newTokens;
}

export async function logoutUser(refreshToken) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
}

export async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
  });
}
