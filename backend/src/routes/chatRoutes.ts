import { Router } from 'express';
import multer from 'multer';
import { startChat, sendMessage, getConversation, uploadResume } from '../controllers/chatController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Start a new chat session
router.post('/start', startChat);

// Send a message
router.post('/message', sendMessage);

// Get conversation history
router.get('/:sessionId', getConversation);

// Upload Resume
router.post('/:sessionId/resume', upload.single('resume'), uploadResume);

export default router;
