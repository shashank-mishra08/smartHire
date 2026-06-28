import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { calendarService } from '../services/calendarService';
import { Settings } from '../models/Settings';
import { config } from '../config/env';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Redirect to Google OAuth consent screen (for both login + calendar)
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const url = calendarService.getAuthUrl();
    res.redirect(url);
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    res.status(500).json({ error: 'Failed to initiate Google Login' });
  }
}

/**
 * Handle Google OAuth callback — save tokens + issue JWT session cookie
 */
export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).send('Authorization code is missing');
      return;
    }

    // Save calendar tokens to Firestore
    await calendarService.handleCallback(code);

    // Issue a JWT session cookie for the recruiter
    const token = jwt.sign(
      { email: config.google.recruiterEmail },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('smarthire_token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect back to frontend dashboard
    res.redirect(`${config.frontendUrl}/dashboard?calendarConnected=true`);
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    res.redirect(`${config.frontendUrl}/dashboard?calendarError=true`);
  }
}

/**
 * Check if calendar is connected
 */
export async function checkCalendarStatus(req: Request, res: Response): Promise<void> {
  try {
    const settings = await Settings.findOne({ recruiterEmail: config.google.recruiterEmail });
    res.json({
      connected: !!(settings && settings.googleCalendarConnected && settings.googleTokens?.refresh_token),
    });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
}

/**
 * Get current logged-in recruiter info
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  res.json({
    authenticated: true,
    email: req.recruiter?.email,
  });
}

/**
 * Logout — clear the session cookie
 */
export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('smarthire_token');
  res.json({ success: true, message: 'Logged out successfully' });
}
