import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { storage } from '../config/database';
import { aiAgent } from '../services/aiAgent';
import { Candidate } from '../models/Candidate';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/resume', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No resume file provided' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    // Parse PDF text
    let resumeText = '';
    try {
      const data = await pdf(file.buffer);
      resumeText = data.text;
    } catch (e) {
      console.error('Error parsing PDF:', e);
      res.status(400).json({ error: 'Failed to parse PDF file. Ensure it is a valid PDF.' });
      return;
    }

    // Upload to Firebase Storage
    const bucket = storage().bucket();
    const fileName = `resumes/${sessionId}_${Date.now()}_${file.originalname}`;
    const fileRef = bucket.file(fileName);
    
    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype }
    });
    
    await fileRef.makePublic();
    const resumeUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Process with AI
    await aiAgent.processResume(sessionId, resumeText, resumeUrl);

    // Get the updated candidate data
    const conversation = await aiAgent.getConversation(sessionId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    
    // Update Candidate model in Firestore
    const candidateEmail = conversation.context.candidateInfo?.email;
    if (candidateEmail) {
      const candidateRef = await Candidate.findOne({ email: candidateEmail });
      if (candidateRef) {
        candidateRef.resumeUrl = resumeUrl;
        candidateRef.resumeSummary = conversation.context.resumeSummary;
        candidateRef.matchScore = typeof conversation.context.matchScore === 'number' ? conversation.context.matchScore : parseInt(conversation.context.matchScore || '0', 10);
        candidateRef.suggestedQuestions = conversation.context.suggestedQuestions || [];
        await candidateRef.save();
      }
    }

    res.json({
      success: true,
      resumeUrl,
      summary: conversation.context.resumeSummary,
      matchScore: conversation.context.matchScore,
      questions: conversation.context.suggestedQuestions
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Failed to upload and process resume' });
  }
});

export default router;
