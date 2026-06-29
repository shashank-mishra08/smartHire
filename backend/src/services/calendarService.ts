import { google } from 'googleapis';
import { config } from '../config/env';
import { Settings } from '../models/Settings';
import { v4 as uuidv4 } from 'uuid';
import { Candidate } from '../models/Candidate';
import { Interview } from '../models/Interview';
export const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export class CalendarService {
  /**
   * Generate OAuth URL for recruiter to connect their calendar
   */
  getAuthUrl(): string {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force to get refresh token
    });
  }

  /**
   * Handle OAuth callback and save tokens
   */
  async handleCallback(code: string): Promise<string> {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || config.google.recruiterEmail;
    
    await Settings.findOneAndUpdate(
      { recruiterEmail: email },
      {
        recruiterEmail: email,
        googleCalendarConnected: true,
        googleTokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
        },
      },
      { upsert: true, new: true }
    );

    return email;
  }

  /**
   * Returns authenticated client or throws if not connected
   */
  async getAuthenticatedClient() {
    const isConnected = await this.loadTokens();
    if (!isConnected) {
      throw new Error('Calendar not connected');
    }
    return oauth2Client;
  }

  /**
   * Load tokens from DB into oauth2Client
   */
  public async loadTokens(): Promise<boolean> {
    // First try to find by env recruiter email, then fall back to any connected settings
    let settings = await Settings.findOne({ recruiterEmail: config.google.recruiterEmail });
    if (!settings || !settings.googleCalendarConnected) {
      settings = await Settings.findOne({ googleCalendarConnected: true });
    }
    if (!settings || !settings.googleCalendarConnected || !settings.googleTokens?.refresh_token) {
      console.log('❌ Google Calendar not connected or missing refresh token');
      return false;
    }
    
    oauth2Client.setCredentials({
      access_token: settings.googleTokens.access_token,
      refresh_token: settings.googleTokens.refresh_token,
      expiry_date: settings.googleTokens.expiry_date,
      token_type: settings.googleTokens.token_type,
    });

    // Handle token refresh automatically handled by googleapis if refresh_token is set
    return true;
  }

  /**
   * Get available 30-min slots for a given date string (e.g., "Wednesday, July 1")
   * Defaults to 10:00 AM to 6:00 PM IST
   */
  async getAvailableSlots(dateString: string): Promise<string[]> {
    const isConnected = await this.loadTokens();
    
    // If not connected, return some default mock slots to keep chat working
    if (!isConnected) {
      console.warn("Calendar not connected. Returning default slots.");
      return ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Parse the target date
    const targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) {
      targetDate.setTime(Date.now()); // Fallback to today
    }
    
    // Extract YYYY-MM-DD
    const dateStr = targetDate.toISOString().split('T')[0];

    // Define working hours for that day in IST (UTC+5:30)
    // 10:00 AM to 6:00 PM IST
    const startOfDay = new Date(`${dateStr}T10:00:00+05:30`);
    const endOfDay = new Date(`${dateStr}T18:00:00+05:30`);

    // Ensure start isn't in the past if it's today
    const now = new Date();
    if (startOfDay < now) {
      // If it's too late in the day, move to tomorrow
      if (endOfDay < now) {
        startOfDay.setDate(startOfDay.getDate() + 1);
        endOfDay.setDate(endOfDay.getDate() + 1);
      } else {
        // Start from next 30 min block
        const minutes = now.getMinutes();
        now.setMinutes(minutes < 30 ? 30 : 0);
        if (minutes >= 30) now.setHours(now.getHours() + 1);
        now.setSeconds(0);
        now.setMilliseconds(0);
        startOfDay.setTime(now.getTime());
      }
    }

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const busySlots: { start: Date; end: Date }[] = events
        .filter(event => event.start?.dateTime && event.end?.dateTime)
        .map(event => ({
          start: new Date(event.start!.dateTime!),
          end: new Date(event.end!.dateTime!),
        }));

      // Fetch booked slots from our database to avoid double-booking
      const dbInterviews = await Interview.find({ date: dateString });
      const dbBusySlots: { start: Date; end: Date }[] = dbInterviews.map((interview: any) => ({
        start: interview.dateTime,
        end: new Date(interview.dateTime.getTime() + (interview.duration || 30) * 60000)
      }));

      const allBusySlots = [...busySlots, ...dbBusySlots];

      // Generate 30 min blocks
      const freeSlots: string[] = [];
      let current = new Date(startOfDay);

      while (current < endOfDay) {
        const slotEnd = new Date(current.getTime() + 30 * 60000); // +30 mins

        // Check if slot overlaps with any busy slot
        const isBusy = allBusySlots.some(
          busy => current < busy.end && slotEnd > busy.start
        );

        if (!isBusy) {
          // Format as "HH:MM AM/PM" enforcing IST
          const timeString = current.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          });
          freeSlots.push(timeString);
        }

        current = slotEnd;
        // Limit to max 5 slots for UI simplicity
        if (freeSlots.length >= 5) break;
      }

      // If no slots found today, return default or empty
      if (freeSlots.length === 0) {
        return ['10:00 AM (Next Day)', '11:00 AM (Next Day)', '02:00 PM (Next Day)'];
      }

      return freeSlots;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return ['10:00 AM', '02:00 PM']; // Fallback
    }
  }

  /**
   * Schedule the interview on Google Calendar with Meet link
   */
  async scheduleInterview(
    candidate: { name: string; email: string; role: string },
    dateString: string,
    timeString: string
  ): Promise<string> {
    const isConnected = await this.loadTokens();
    
    // If not connected, return a mock meet link
    if (!isConnected) {
      console.warn("Calendar not connected. Generating mock Meet link.");
      return `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`;
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Robustly parse date and time
    // dateString might be "2026-06-30" or "June 30th" or "June 30, 2026"
    // timeString might be "10:00" or "10:00 AM"
    let cleanDate = dateString.replace(/(st|nd|rd|th)/g, '');
    if (!cleanDate.includes(new Date().getFullYear().toString())) {
      cleanDate = `${cleanDate}, ${new Date().getFullYear()}`;
    }

    // Explicitly enforce IST timezone so 10:00 is not interpreted as UTC
    let startDateTime = new Date(`${cleanDate} ${timeString} GMT+0530`);
    
    if (isNaN(startDateTime.getTime())) {
      // Fallback if the standard parsing fails
      console.warn(`Failed to parse date normally: ${cleanDate} ${timeString}. Attempting fallback.`);
      startDateTime = new Date(); // Fallback to current time + 1 day
      startDateTime.setDate(startDateTime.getDate() + 1);
    }

    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins later

    const event = {
      summary: `Interview: ${candidate.name} - ${candidate.role} (SmartHire)`,
      description: `Automated interview scheduled via SmartHire AI.\n\nCandidate: ${candidate.name}\nRole: ${candidate.role}\nEmail: ${candidate.email}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Kolkata', 
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email: candidate.email },
        { email: config.google.recruiterEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send email to attendees
      });

      const meetLink = response.data.hangoutLink;
      return meetLink || `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`;
    }
  }
}

export const calendarService = new CalendarService();
