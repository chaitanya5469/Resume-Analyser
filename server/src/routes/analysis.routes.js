import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import * as analysisController from '../controllers/analysis.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/public/:id', param('id').isUUID(), validate, analysisController.getPublic);

router.use(authenticate);

router.post('/resume/:resumeId/analyze', param('resumeId').isUUID(), validate, analysisController.analyze);
router.post('/resume/:resumeId/tailor',
  param('resumeId').isUUID(),
  body('jobDescription').trim().isLength({ min: 40, max: 12000 }),
  validate,
  analysisController.tailor
);
router.post('/resume/:resumeId/cover-letter',
  param('resumeId').isUUID(),
  body('jobDescription').trim().isLength({ min: 40, max: 12000 }),
  body('company').optional().trim().isLength({ max: 120 }),
  validate,
  analysisController.coverLetter
);
router.get('/:id/report.pdf', param('id').isUUID(), validate, analysisController.exportReport);
router.get('/:id', param('id').isUUID(), validate, analysisController.getOne);

export default router;
