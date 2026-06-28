import { Router } from 'express';
import {
  getDashboardStats,
  getInterviews,
  getCandidates,
  updateInterviewStatus,
  getRecentInterviews,
} from '../controllers/dashboardController';

const router = Router();

// Dashboard stats
router.get('/stats', getDashboardStats);

// Interviews
router.get('/interviews', getInterviews);
router.get('/interviews/recent', getRecentInterviews);
router.patch('/interviews/:id/status', updateInterviewStatus);

// Candidates
router.get('/candidates', getCandidates);

export default router;
