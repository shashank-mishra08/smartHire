import { Request, Response } from 'express';
import { calendarService } from '../services/calendarService';
import { Settings } from '../models/Settings';
import { config } from '../config/env';

/**
 * Redirect to Google OAuth consent screen
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
 * Handle Google OAuth callback
 */
export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).send('Authorization code is missing');
      return;
    }

    await calendarService.handleCallback(code);
    
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
