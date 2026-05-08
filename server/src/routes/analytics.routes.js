import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);

export default router;
