import { Request, Response } from 'express';
import { aiAgent } from '../services/aiAgent';
import { emailService } from '../services/emailService';
import { config } from '../config/env';

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
  } catch (error) {
    console.error('Error starting chat:', error);
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
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error processing message:', error);
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
    res.status(500).json({ error: 'Failed to get conversation' });
  }
}
