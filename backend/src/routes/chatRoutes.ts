import { Router } from 'express';
import { startChat, sendMessage, getConversation, uploadResume } from '../controllers/chatController';

const router = Router();

// Start a new chat session
router.post('/start', startChat);

// Send a message
router.post('/message', sendMessage);

// Get conversation history
router.get('/:sessionId', getConversation);

// Upload Resume
router.post('/:sessionId/resume', uploadResume);

export default router;
