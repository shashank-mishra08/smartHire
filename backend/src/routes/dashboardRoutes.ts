import { Router } from 'express';
import {
  getDashboardStats,
  getInterviews,
  getCandidates,
  updateInterviewStatus,
  getRecentInterviews,
} from '../controllers/dashboardController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// 🔒 All dashboard routes require authentication
router.use(requireAuth);

// Dashboard stats
router.get('/stats', getDashboardStats);

// Interviews
router.get('/interviews', getInterviews);
router.get('/interviews/recent', getRecentInterviews);
router.patch('/interviews/:id/status', updateInterviewStatus);

// Candidates
router.get('/candidates', getCandidates);

export default router;
