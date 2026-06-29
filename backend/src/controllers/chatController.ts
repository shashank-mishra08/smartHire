import { Request, Response } from 'express';
import { aiAgent } from '../services/aiAgent';
import { emailService } from '../services/emailService';
import { googleSheetsService } from '../services/googleSheetsService';
import { uploadToFirebase } from '../utils/storage';
import { config } from '../config/env';
import pdfParse from 'pdf-parse';
import { Candidate } from '../models/Candidate';
import Busboy from 'busboy';

/**
 * Start a new chat session
 */
export async function startChat(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const response = await aiAgent.startConversation(sessionId);
    res.json(response);
  } catch (error: any) {
    console.error('Error starting chat:', error);

    // Check if it's a Gemini rate limit error
    if (error?.status === 429 || error?.message?.includes('429')) {
      res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'The AI is currently receiving too many requests (Free Tier Quota Exceeded). Please wait about 30 seconds and try again.'
      });
      return;
    }

    res.status(500).json({ error: 'Failed to start conversation' });
  }
}

/**
 * Send a message in an existing chat
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      res.status(400).json({ error: 'sessionId and message are required' });
      return;
    }

    const response = await aiAgent.processMessage(sessionId, message);

    // If interview was scheduled, send emails
    if (response.interviewScheduled && response.interviewDetails) {
      const conversation = await aiAgent.getConversation(sessionId);
      if (conversation) {
        const { name, email, role } = conversation.context.candidateInfo;
        const emailData = {
          candidateName: name!,
          candidateEmail: email!,
          role: role!,
          date: response.interviewDetails.date,
          time: response.interviewDetails.time,
          meetLink: response.interviewDetails.meetLink,
          recruiterEmail: config.google.recruiterEmail,
        };

        // Send emails asynchronously (don't block the response)
        Promise.all([
          emailService.sendCandidateConfirmation(emailData),
          emailService.sendRecruiterNotification(emailData),
        ]).catch((err) => console.error('Email error:', err));

        // Get candidate to pass Lead ID and match score
        Candidate.findOne({ email }).then(candidate => {
          if (candidate) {
            googleSheetsService.appendCandidateRow({
              leadId: candidate.leadId || '',
              name: candidate.name,
              role: candidate.role,
              email: candidate.email,
              phone: candidate.phone,
              date: response.interviewDetails!.date,
              time: response.interviewDetails!.time,
              meetLink: response.interviewDetails!.meetLink,
              matchScore: candidate.matchScore || 'N/A'
            });
          }
        }).catch(err => console.error('Sheets error:', err));
      }
    }

    res.json(response);
  } catch (error: any) {
    console.error('Error processing message:', error);
    
    // Check if it's a Gemini rate limit error
    if (error?.status === 429 || error?.message?.includes('429')) {
      res.status(429).json({ 
        error: 'Too Many Requests', 
        message: 'The AI is currently receiving too many requests (Free Tier Quota Exceeded). Please wait about 30 seconds and try again.'
      });
      return;
    }

    res.status(500).json({ error: 'Failed to process message' });
  }
}

/**
 * Get conversation history
 */
export async function getConversation(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;
    const conversation = await aiAgent.getConversation(sessionId);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({
      messages: conversation.messages,
      stage: conversation.context.stage,
      status: conversation.status,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
}

/**
 * Upload Resume
 */
export async function uploadResume(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const busboy = Busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileMimeType = '';

    busboy.on('file', (name, file, info) => {
      fileName = info.filename;
      fileMimeType = info.mimeType;
      const chunks: Buffer[] = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', async () => {
      if (!fileBuffer) {
        res.status(400).json({ error: 'resume file is required' });
        return;
      }

      try {
        // 1. Upload to Firebase
        const fileUrl = await uploadToFirebase(fileBuffer, fileName, fileMimeType);

        // 2. Parse PDF
        const pdfData = await pdfParse(fileBuffer);
        const text = pdfData.text;

        // 3. Let AI Agent process it
        await aiAgent.processResume(sessionId, text, fileUrl);

        // 4. Return new conversation state
        const conversation = await aiAgent.getConversation(sessionId);
        res.json(conversation);
      } catch (error: any) {
        console.error('Error in busboy finish:', error);
        res.status(500).json({ error: 'Failed to upload and process resume' });
      }
    });

    // In Firebase Functions, req.rawBody is available.
    if ((req as any).rawBody) {
      busboy.end((req as any).rawBody);
    } else {
      req.pipe(busboy);
    }
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Failed to initialize resume upload' });
  }
}
