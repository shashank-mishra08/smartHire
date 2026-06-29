import { google } from 'googleapis';
import { oauth2Client, CalendarService } from './calendarService';
import { config } from '../config/env';

export class GoogleSheetsService {
  private calendarService = new CalendarService();

  /**
   * Append a row to the candidate tracking Google Sheet
   */
  async appendCandidateRow(data: {
    leadId: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    meetLink: string;
    matchScore: number | string;
  }): Promise<void> {
    try {
      if (!config.google.sheetId) {
        console.log('⚠️ GOOGLE_SHEET_ID not set in env, skipping Google Sheets logging.');
        return;
      }

      await this.calendarService.getAuthenticatedClient(); // Ensures tokens are loaded
      
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      const values = [
        [
          data.leadId,
          data.name,
          data.role,
          data.email,
          data.phone,
          data.date,
          data.time,
          data.meetLink,
          data.matchScore,
          new Date().toISOString(), // Timestamp
        ],
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: config.google.sheetId,
        range: 'Sheet1!A:J', // Adjust this if your sheet name is different
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      console.log(`✅ Logged Candidate ${data.leadId} to Google Sheets successfully.`);
    } catch (error) {
      console.error('❌ Failed to log to Google Sheets:', error);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
