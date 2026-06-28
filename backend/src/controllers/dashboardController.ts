import { Request, Response } from 'express';
import { Interview } from '../models/Interview';
import { Candidate } from '../models/Candidate';

/**
 * Get dashboard overview stats
 */
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const [total, scheduled, completed, cancelled, candidates] = await Promise.all([
      Interview.countDocuments(),
      Interview.countDocuments({ status: 'scheduled' }),
      Interview.countDocuments({ status: 'completed' }),
      Interview.countDocuments({ status: 'cancelled' }),
      Candidate.countDocuments(),
    ]);

    res.json({
      total,
      scheduled,
      completed,
      cancelled,
      candidates,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

/**
 * Get all interviews
 */
export async function getInterviews(req: Request, res: Response): Promise<void> {
  try {
    const status = req.query.status as string;
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '20';
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Interview.countDocuments(filter),
    ]);

    res.json({ interviews, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    console.error('Error getting interviews:', error);
    res.status(500).json({ error: 'Failed to get interviews' });
  }
}

/**
 * Get all candidates
 */
export async function getCandidates(req: Request, res: Response): Promise<void> {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    console.error('Error getting candidates:', error);
    res.status(500).json({ error: 'Failed to get candidates' });
  }
}

/**
 * Update interview status
 */
export async function updateInterviewStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const status = req.body.status as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';

    const interview = await Interview.findByIdAndUpdate(id, { status }, { new: true });
    if (!interview) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }

    res.json(interview);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
}

/**
 * Get recent interviews for dashboard
 */
export async function getRecentInterviews(req: Request, res: Response): Promise<void> {
  try {
    const interviews = await Interview.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(interviews);
  } catch (error) {
    console.error('Error getting recent interviews:', error);
    res.status(500).json({ error: 'Failed to get recent interviews' });
  }
}
