import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

function getRefreshExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId) {
  const { accessToken, refreshToken } = generateTokens(userId);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt: getRefreshExpiry() },
  });
  return { accessToken, refreshToken };
}

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

function getApiUrl(req) {
  return process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
}

function getOAuthConfig(provider, req) {
  const apiUrl = getApiUrl(req);
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid email profile',
      redirectUri: `${apiUrl}/api/auth/oauth/google/callback`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userUrl: 'https://api.github.com/user',
      emailsUrl: 'https://api.github.com/user/emails',
      scope: 'read:user user:email',
      redirectUri: `${apiUrl}/api/auth/oauth/github/callback`,
    },
  };

  const config = configs[provider];
  if (!config) {
    const err = new Error('Unsupported auth provider');
    err.statusCode = 404;
    throw err;
  }
  if (!config.clientId || !config.clientSecret) {
    const err = new Error(`${provider} auth is not configured`);
    err.statusCode = 501;
    throw err;
  }
  return config;
}

async function createAuthResult(user) {
  const tokens = await createSession(user.id);
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
  return { user: safeUser, ...tokens };
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

  const { accessToken, refreshToken } = await createSession(user.id);

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

  const { accessToken, refreshToken } = await createSession(user.id);

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
  await prisma.refreshToken.create({
    data: { token: newTokens.refreshToken, userId: decoded.userId, expiresAt: getRefreshExpiry() },
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

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: 'If an account exists for that email, password reset instructions have been sent.' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt,
    },
  });

  const resetUrl = `${getClientUrl()}/reset-password?token=${token}`;

  return {
    message: 'If an account exists for that email, password reset instructions have been sent.',
    ...(process.env.NODE_ENV !== 'production' && { resetUrl }),
  };
}

export async function resetPassword({ token, password }) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    const err = new Error('Password reset link is invalid or expired');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return { message: 'Password reset successfully. Please sign in with your new password.' };
}

export function getOAuthAuthorizationUrl(provider, req) {
  const config = getOAuthConfig(provider, req);
  const state = jwt.sign({ provider }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  if (provider === 'google') params.set('access_type', 'offline');
  return `${config.authUrl}?${params.toString()}`;
}

async function exchangeOAuthCode(provider, code, req) {
  const config = getOAuthConfig(provider, req);
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    const err = new Error(data.error_description || data.error || 'OAuth token exchange failed');
    err.statusCode = 400;
    throw err;
  }
  return data.access_token;
}

async function getOAuthProfile(provider, accessToken, req) {
  const config = getOAuthConfig(provider, req);
  const response = await fetch(config.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'ResumeAnalyser',
    },
  });
  const profile = await response.json();
  if (!response.ok) {
    const err = new Error(profile.message || 'Failed to load OAuth profile');
    err.statusCode = 400;
    throw err;
  }

  if (provider === 'google') {
    return { email: profile.email, name: profile.name, avatarUrl: profile.picture };
  }

  let email = profile.email;
  if (!email) {
    const emailsResponse = await fetch(config.emailsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'ResumeAnalyser',
      },
    });
    const emails = await emailsResponse.json();
    email = Array.isArray(emails)
      ? emails.find(item => item.primary && item.verified)?.email || emails.find(item => item.verified)?.email
      : null;
  }

  return { email, name: profile.name || profile.login, avatarUrl: profile.avatar_url };
}

export async function handleOAuthCallback({ provider, code, state, req }) {
  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (decoded.provider !== provider) throw new Error('Provider mismatch');
  } catch {
    const err = new Error('Invalid OAuth state');
    err.statusCode = 400;
    throw err;
  }

  const oauthAccessToken = await exchangeOAuthCode(provider, code, req);
  const profile = await getOAuthProfile(provider, oauthAccessToken, req);
  if (!profile.email) {
    const err = new Error('No verified email address was returned by the provider');
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      name: profile.name || undefined,
      avatarUrl: profile.avatarUrl || undefined,
    },
    create: {
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatarUrl: profile.avatarUrl,
      passwordHash: `oauth:${crypto.randomBytes(32).toString('hex')}`,
    },
  });

  return createAuthResult(user);
}
