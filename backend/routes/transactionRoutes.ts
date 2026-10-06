import { Router } from 'express';
import {
  getTransactions,
  getTransactionDetails,
  addTransaction,
  editTransaction,
  removeTransaction,
} from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All transaction routes are protected
router.use(authenticateToken);

router.get('/', getTransactions);
router.get('/:id', getTransactionDetails);
router.post('/', addTransaction);
router.put('/:id', editTransaction);
router.delete('/:id', removeTransaction);

export default router;
