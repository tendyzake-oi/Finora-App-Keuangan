import { Router } from 'express';
import { getBudgetStatus, updateBudgetLimit } from '../controllers/budgetController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/status', getBudgetStatus);
router.put('/limit', updateBudgetLimit);

export default router;
