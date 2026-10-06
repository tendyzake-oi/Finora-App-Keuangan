import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  changePassword,
  resetPassword,
  deleteAccount,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);
router.delete('/account', authenticateToken, deleteAccount);

export default router;
