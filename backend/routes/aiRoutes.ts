import { Router } from 'express';
import { askAiAssistant } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.post('/chat', askAiAssistant);

export default router;
