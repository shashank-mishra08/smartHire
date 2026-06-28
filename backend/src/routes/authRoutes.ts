import { Router } from 'express';
import { googleLogin, googleCallback, checkCalendarStatus, getMe, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public — OAuth flow
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

// Public — calendar status check
router.get('/calendar/status', checkCalendarStatus);

// Protected — requires login
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export default router;
