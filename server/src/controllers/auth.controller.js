import { validationResult } from 'express-validator';
import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const result = await authService.registerUser({ name, email, password });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    res.json(result);
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
}

function redirectOAuthError(res, message) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(message)}`);
}

export async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, password } = req.body;
    const result = await authService.resetPassword({ token, password });
    res.json(result);
  } catch (err) { next(err); }
}

export function startOAuth(req, res, next) {
  try {
    res.redirect(authService.getOAuthAuthorizationUrl(req.params.provider, req));
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 501) {
      return redirectOAuthError(res, err.message);
    }
    next(err);
  }
}

export async function finishOAuth(req, res, next) {
  try {
    const { code, state, error } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (error) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(error)}`);
    }
    if (!code || !state) {
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Missing OAuth callback parameters')}`);
    }

    const result = await authService.handleOAuthCallback({
      provider: req.params.provider,
      code,
      state,
      req,
    });

    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${clientUrl}/auth/callback?${params.toString()}`);
  } catch (err) {
    redirectOAuthError(res, err.message || 'Social sign-in failed');
  }
}
