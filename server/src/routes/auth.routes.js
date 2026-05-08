import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], authController.login);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
