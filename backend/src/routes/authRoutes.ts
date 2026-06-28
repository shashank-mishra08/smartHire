import { Router } from 'express';
import { googleLogin, googleCallback, checkCalendarStatus } from '../controllers/authController';

const router = Router();

// /api/auth/google
router.get('/google', googleLogin);

// /api/auth/google/callback
router.get('/google/callback', googleCallback);

// /api/auth/calendar/status
router.get('/calendar/status', checkCalendarStatus);

export default router;
