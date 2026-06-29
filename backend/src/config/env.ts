import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || process.env.SERVER_PORT || '5000', 10),
  frontendUrl: process.env.FUNCTION_TARGET 
    ? 'https://smarthire-d9513.web.app'
    : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT Auth
  jwtSecret: process.env.JWT_SECRET || 'smarthire-dev-secret-key-change-in-production',

  // MongoDB (legacy — now using Firebase Firestore)
  mongodbUri: process.env.MONGODB_URI || '',

  // Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.FUNCTION_TARGET 
      ? 'https://api-ut4fxs6siq-uc.a.run.app/api/auth/google/callback'
      : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback'),
    recruiterEmail: process.env.GOOGLE_RECRUITER_EMAIL || 'contactsuyashgupta@gmail.com',
    sheetId: process.env.GOOGLE_SHEET_ID || '',
  },

  // SMTP
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
