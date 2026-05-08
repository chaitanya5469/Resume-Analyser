import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';
import * as resumeController from '../controllers/resume.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', upload.single('resume'), resumeController.upload);
router.get('/', resumeController.getAll);
router.get('/:id', resumeController.getOne);
router.patch('/:id', resumeController.update);
router.delete('/:id', resumeController.remove);

export default router;
