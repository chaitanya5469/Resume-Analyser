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
