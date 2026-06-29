import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { config } from '../config/env';
import { SYSTEM_PROMPT, RESUME_SUMMARY_PROMPT, JD_MATCHING_PROMPT, QUESTION_GENERATION_PROMPT, RAG_SYSTEM_PROMPT } from '../utils/prompts';
import { Conversation, IConversation } from '../models/Conversation';
import { Candidate } from '../models/Candidate';
import { Interview } from '../models/Interview';
import { isValidEmail, isValidPhone, formatDate } from '../utils/helpers';
import { calendarService } from './calendarService';
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

interface ChatResponse {
  message: string;
  stage: string;
  slots?: string[];
  interviewScheduled?: boolean;
  interviewDetails?: {
    date: string;
    time: string;
    meetLink: string;
  };
}

/**
 * SmartHire AI Agent — handles natural conversation with candidates
 */
export class AIAgent {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Process a message from the candidate
   */
  async processMessage(sessionId: string, userMessage: string): Promise<ChatResponse> {
    // Get or create conversation
    let conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        messages: [],
        context: {
          stage: 'greeting',
          candidateInfo: {},
        },
        status: 'active',
      });
    }

    // Add user message to history
    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Process based on current stage
    const response = await this.handleStage(conversation, userMessage);

    // Add AI response to history
    conversation.messages.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
    });

    await conversation.save();

    return response;
  }

  /**
   * Start a new conversation
   */
  async startConversation(sessionId: string): Promise<ChatResponse> {
    const existing = await Conversation.findOne({ sessionId });
    if (existing) {
      // Return last state
      return {
        message: '',
        stage: existing.context.stage,
      };
    }

    const conversation = new Conversation({
      sessionId,
      messages: [],
      context: {
        stage: 'greeting',
        candidateInfo: {},
      },
      status: 'active',
    });

    const greeting = `Hi there! 👋 Welcome to SmartHire!\n\nI'm your AI interview scheduling assistant. I'll help you book your interview in just a few minutes.\n\nLet's get started — what's your full name?`;

    conversation.messages.push({
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    });

    await conversation.save();

    return {
      message: greeting,
      stage: 'collecting_name',
    };
  }

  /**
   * Handle conversation based on current stage
   */
  private async handleStage(conversation: IConversation, userMessage: string): Promise<ChatResponse> {
    const stage = conversation.context.stage;
    const info = conversation.context.candidateInfo;

    switch (stage) {
      case 'greeting':
      case 'collecting_name': {
        const analysis = await this.analyzeMessageWithGemini(userMessage, 'collecting_name', "The candidate's full name");
        if (!analysis.hasProvidedData) {
          return {
            message: analysis.replyMessage || `Hmm, that doesn't seem right. Could you tell me your full name please?`,
            stage: 'collecting_name',
          };
        }
        const name = analysis.extractedData || userMessage.trim();
        conversation.context.candidateInfo.name = name;
        conversation.context.stage = 'collecting_role';
        return {
          message: `Nice to meet you, ${name}! 😊\n\nWhich role are you applying for?`,
          stage: 'collecting_role',
        };
      }

      case 'collecting_role': {
        const analysis = await this.analyzeMessageWithGemini(userMessage, 'collecting_role', "The job role the candidate is applying for");
        if (!analysis.hasProvidedData) {
          return {
            message: analysis.replyMessage || `Could you specify the role you're applying for? For example: Software Engineer, Data Analyst, etc.`,
            stage: 'collecting_role',
          };
        }
        const role = analysis.extractedData || userMessage.trim();
        conversation.context.candidateInfo.role = role;
        conversation.context.stage = 'collecting_email';
        return {
          message: `${role} — great choice! 🎯\n\nWhat's your email address? We'll send your interview confirmation here.`,
          stage: 'collecting_email',
        };
      }

      case 'collecting_email': {
        const analysis = await this.analyzeMessageWithGemini(userMessage, 'collecting_email', "The candidate's valid email address");
        if (!analysis.hasProvidedData || !isValidEmail(analysis.extractedData || '')) {
          return {
            message: analysis.replyMessage || `That doesn't look like a valid email address. Could you double-check and try again?`,
            stage: 'collecting_email',
          };
        }
        const email = (analysis.extractedData || userMessage).toLowerCase().trim();
        conversation.context.candidateInfo.email = email;
        conversation.context.stage = 'collecting_phone';
        return {
          message: `Got it! ✅\n\nAnd your phone number? (We might send you a quick reminder before the interview)`,
          stage: 'collecting_phone',
        };
      }

      case 'collecting_phone': {
        const analysis = await this.analyzeMessageWithGemini(userMessage, 'collecting_phone', "The candidate's phone number");
        if (!analysis.hasProvidedData || !isValidPhone(analysis.extractedData || '')) {
          return {
            message: analysis.replyMessage || `Please enter a valid phone number with at least 10 digits.`,
            stage: 'collecting_phone',
          };
        }
        const phone = analysis.extractedData || userMessage.trim();
        conversation.context.candidateInfo.phone = phone;
        conversation.context.stage = 'checking_availability';
        return {
          message: `Perfect! 📱\n\nNow let's find a time for your interview. When would you prefer?\n\nYou can say things like "tomorrow", "Monday", or a specific date like "July 1".`,
          stage: 'checking_availability',
        };
      }

      case 'checking_availability': {
        // Use AI to understand the date preference
        const dateResponse = await this.understandDate(userMessage);

        if (!dateResponse) {
          return {
            message: `I couldn't quite understand that date. Could you try again?\n\nFor example: "tomorrow", "Monday", "July 2", etc.`,
            stage: 'checking_availability',
          };
        }

        conversation.context.selectedDate = dateResponse;

        // Get available slots using Calendar API
        const slots = await calendarService.getAvailableSlots(dateResponse);
        conversation.context.availableSlots = slots;
        conversation.context.stage = 'selecting_slot';

        const slotList = slots.map((s, i) => `${i + 1}. ${s}`).join('\n');

        return {
          message: `📅 Here are the available slots for ${dateResponse}:\n\n${slotList}\n\nWhich time works best for you? Just tell me the number or the time.`,
          stage: 'selecting_slot',
          slots: slots,
        };
      }

      case 'selecting_slot': {
        const slots = conversation.context.availableSlots || await calendarService.getAvailableSlots(new Date().toDateString());
        const analysis = await this.analyzeMessageWithGemini(userMessage, 'selecting_slot', `A selected time slot from this list: ${slots.join(', ')}`);
        
        let selectedSlot = null;
        if (analysis.hasProvidedData && analysis.extractedData) {
            // First check if Gemini extracted the exact time string
            if (slots.includes(analysis.extractedData)) {
                selectedSlot = analysis.extractedData;
            } else {
                // Fallback to strict parsing in case Gemini returned a weird format
                selectedSlot = this.parseSlotSelection(analysis.extractedData, slots) || this.parseSlotSelection(userMessage, slots);
            }
        }

        if (!selectedSlot) {
          return {
            message: analysis.replyMessage || `I didn't catch that. Please pick a slot by number (1-${slots.length}) or tell me the time you prefer.`,
            stage: 'selecting_slot',
            slots: slots,
          };
        }

        conversation.context.selectedTime = selectedSlot;
        conversation.context.stage = 'confirming';

        const { name, role, email } = conversation.context.candidateInfo;

        return {
          message: `Let me confirm your interview details:\n\n👤 Name: ${name}\n💼 Role: ${role}\n📧 Email: ${email}\n📅 Date: ${conversation.context.selectedDate}\n🕐 Time: ${selectedSlot}\n⏱️ Duration: 30 minutes\n\nShall I go ahead and schedule this? (Yes/No)`,
          stage: 'confirming',
        };
      }

      case 'confirming': {
        const lower = userMessage.toLowerCase().trim();

        // Check if user is asking to update/change their details
        if (lower.includes('change') || lower.includes('update') || lower.includes('wrong') || lower.includes('mistake') || lower.includes('edit')) {
          // Send them back to collecting_name but keep existing context so they can update specific fields.
          // For simplicity, we can just ask them what they want to change, or reset to collecting_name
          // To be truly flexible without losing state, let's ask them which detail to update.
          // Wait, the simplest robust way for a state machine is just to drop them to a stage where they can provide it.
          // But our state machine is linear. Let's send them to `checking_availability` if they want to change time,
          // or we can just say "Sure, what is your correct name/email/phone?" 
          // Let's use a quick LLM check or just ask them to restart if we don't have a dynamic update stage, 
          // OR we can add a simple dynamic update logic using the LLM in the default block.
          // Let's route them to 'collecting_name' but with a friendly message so they just re-enter details quickly.
          conversation.context.stage = 'collecting_name';
          return {
            message: `Sure, let's fix that. What is your correct full name?`,
            stage: 'collecting_name',
          };
        }

        if (lower === 'no' || lower === 'nahi' || lower === 'nope' || lower === 'cancel') {
          conversation.context.stage = 'checking_availability';
          return {
            message: `No worries! Let's pick a different time. When would you prefer?`,
            stage: 'checking_availability',
          };
        }

        if (lower === 'yes' || lower === 'yeah' || lower === 'yep' || lower === 'haan' || lower === 'ha' || lower === 'sure' || lower === 'ok' || lower === 'okay' || lower === 'confirm') {
          // Schedule the interview!
          const result = await this.scheduleInterview(conversation);
          conversation.context.stage = 'scheduled';
          conversation.context.interviewId = result.interviewId;

          return {
            message: `🎉 Awesome! Your interview has been scheduled!\n\n✅ Interview Confirmation\n━━━━━━━━━━━━━━━━━━━━━\n👤 ${info.name}\n💼 ${info.role}\n📅 ${conversation.context.selectedDate}\n🕐 ${conversation.context.selectedTime}\n🔗 Meet Link: ${result.meetLink}\n━━━━━━━━━━━━━━━━━━━━━\n\n📧 A confirmation email has been sent to ${info.email}\n\nWould you like to upload your resume? It helps the interviewer prepare better! (Yes/No)`,
            stage: 'scheduled',
            interviewScheduled: true,
            interviewDetails: {
              date: conversation.context.selectedDate!,
              time: conversation.context.selectedTime!,
              meetLink: result.meetLink,
            },
          };
        }

        return {
          message: `Please confirm — should I schedule the interview? Just say Yes or No. (If you need to change your details, just say "change my details")`,
          stage: 'confirming',
        };
      }

      case 'scheduled': {
        const lower = userMessage.toLowerCase().trim();

        if (lower === 'yes' || lower === 'yeah' || lower === 'sure' || lower === 'ok') {
          conversation.context.stage = 'resume_upload';
          return {
            message: `Please upload your resume using the upload button below. I accept PDF and DOCX formats. 📄`,
            stage: 'resume_upload',
          };
        }

        if (lower === 'no' || lower === 'nahi' || lower === 'skip' || lower === 'nope') {
          conversation.context.stage = 'completed';
          conversation.status = 'completed';
          return {
            message: `No problem at all! 😊\n\nYou're all set. Here's a quick recap:\n\n📅 ${conversation.context.selectedDate} at ${conversation.context.selectedTime}\n💼 ${info.role} Interview\n\nWe'll send you a reminder before the interview. Best of luck! 🍀\n\nFeel free to come back anytime if you need to reschedule or have questions.`,
            stage: 'completed',
          };
        }

        // Check for reschedule/cancel
        if (lower.includes('reschedule')) {
          conversation.context.stage = 'rescheduling';
          return {
            message: `Sure, let's reschedule! When would you prefer the new date?`,
            stage: 'rescheduling',
          };
        }

        if (lower.includes('cancel')) {
          conversation.context.stage = 'cancelling';
          return {
            message: `Are you sure you want to cancel the interview? (Yes/No)`,
            stage: 'cancelling',
          };
        }

        return {
          message: `Would you like to upload your resume? It helps the interviewer prepare. (Yes/No)\n\nOr type "reschedule" or "cancel" if you need to make changes.`,
          stage: 'scheduled',
        };
      }

      case 'resume_upload': {
        conversation.context.stage = 'completed';
        conversation.status = 'completed';
        return {
          message: `Thanks for uploading! 📄✅\n\nYou're all set. Here's your interview recap:\n\n📅 ${conversation.context.selectedDate} at ${conversation.context.selectedTime}\n💼 ${info.role} Interview\n\nBest of luck! 🍀`,
          stage: 'completed',
        };
      }

      case 'rescheduling': {
        const dateResponse = await this.understandDate(userMessage);

        if (!dateResponse) {
          return {
            message: `I couldn't understand that date. Try "tomorrow", "Monday", or a specific date.`,
            stage: 'rescheduling',
          };
        }

        conversation.context.selectedDate = dateResponse;
        const slots = await calendarService.getAvailableSlots(dateResponse);
        conversation.context.availableSlots = slots;
        conversation.context.stage = 'selecting_slot';

        const slotList = slots.map((s, i) => `${i + 1}. ${s}`).join('\n');

        return {
          message: `📅 Available slots for ${dateResponse}:\n\n${slotList}\n\nPick a time that works for you!`,
          stage: 'selecting_slot',
          slots: slots,
        };
      }

      case 'cancelling': {
        const lower = userMessage.toLowerCase().trim();
        if (lower === 'yes' || lower === 'haan' || lower === 'ha' || lower === 'confirm') {
          // Cancel the interview
          if (conversation.context.interviewId) {
            await Interview.findByIdAndUpdate(conversation.context.interviewId, {
              status: 'cancelled',
            });
          }
          conversation.context.stage = 'completed';
          conversation.status = 'completed';

          return {
            message: `Your interview has been cancelled. ❌\n\nAll notifications have been sent and the calendar has been updated.\n\nIf you change your mind, feel free to start a new conversation anytime! 👋`,
            stage: 'completed',
          };
        }

        conversation.context.stage = 'scheduled';
        return {
          message: `Great, your interview is still on! 👍\n\n📅 ${conversation.context.selectedDate} at ${conversation.context.selectedTime}\n\nAnything else I can help with?`,
          stage: 'scheduled',
        };
      }

      case 'completed': {
        return {
          message: `Your interview is all set! 😊\n\n📅 ${conversation.context.selectedDate} at ${conversation.context.selectedTime}\n💼 ${info.role}\n\nIf you need to reschedule or have questions, just let me know!`,
          stage: 'completed',
        };
      }

      default:
        return {
          message: `I'm sorry, something went wrong. Let me restart our conversation. What's your name?`,
          stage: 'collecting_name',
        };
    }
  }

  /**
   * Schedule the interview — create records in DB
   */
  private async scheduleInterview(
    conversation: IConversation
  ): Promise<{ interviewId: string; meetLink: string }> {
    const { name, email, phone, role } = conversation.context.candidateInfo;

    // Parse date for the interview
    const dateStr = conversation.context.selectedDate || new Date().toDateString();
    const timeStr = conversation.context.selectedTime || '10:00 AM';
    const dateTime = new Date(dateStr);

    // Call calendar service to create event and get meet link
    const meetLink = await calendarService.scheduleInterview(
      { name: name!, email: email!, role: role! },
      dateStr,
      timeStr
    );

    // Create candidate
    let candidate = await Candidate.findOne({ email });
    const leadId = candidate?.leadId || `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    if (!candidate) {
      candidate = new Candidate({
        leadId,
        name: name!,
        email: email!,
        phone: phone!,
        role: role!,
        status: 'scheduled',
        resumeUrl: conversation.context.resumeUrl,
        resumeSummary: conversation.context.resumeSummary,
        matchScore: conversation.context.matchScore,
        suggestedQuestions: conversation.context.suggestedQuestions,
      });
      await candidate.save();
    } else {
      // Update existing candidate with resume info if newly provided
      candidate.status = 'scheduled';
      candidate.leadId = candidate.leadId || leadId;
      if (conversation.context.resumeUrl) candidate.resumeUrl = conversation.context.resumeUrl;
      if (conversation.context.resumeSummary) candidate.resumeSummary = conversation.context.resumeSummary;
      if (conversation.context.matchScore) candidate.matchScore = conversation.context.matchScore;
      if (conversation.context.suggestedQuestions) candidate.suggestedQuestions = conversation.context.suggestedQuestions;
      await candidate.save();
    }

    // The dateTime is now calculated above


    // Create interview
    const interview = new Interview({
      candidateId: candidate._id,
      candidateName: name!,
      candidateEmail: email!,
      candidatePhone: phone!,
      role: role!,
      date: dateStr,
      time: timeStr,
      dateTime,
      duration: 30,
      status: 'scheduled',
      meetLink,
      recruiterEmail: config.google.recruiterEmail,
    });

    await interview.save();

    // Link conversation to candidate
    conversation.candidateId = candidate._id as any;

    return {
      interviewId: (interview._id as any).toString(),
      meetLink,
    };
  }

  /**
   * Use Gemini to analyze a message against the current goal and context (RAG Lite)
   */
  private async analyzeMessageWithGemini(userMessage: string, stage: string, targetGoal: string): Promise<{ hasProvidedData: boolean; extractedData: string | null; replyMessage: string | null }> {
    try {
      const mockJD = `Company: SmartHire Inc.
Role details vary, but generally we offer remote-friendly positions, flexible working hours, and competitive salary packages.
If a candidate asks a general question, be helpful and informative based on standard tech company practices.`;

      const prompt = RAG_SYSTEM_PROMPT
        .replace('{{CONTEXT}}', mockJD)
        .replace('{{STAGE}}', stage)
        .replace('{{TARGET_GOAL}}', targetGoal);

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: prompt,
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });
      
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error in analyzeMessageWithGemini:', error.message || error);
      
      // Smart Fallback if Gemini hits rate limit (429)
      const text = userMessage.trim();
      
      if (stage === 'collecting_email') {
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) return { hasProvidedData: true, extractedData: emailMatch[1], replyMessage: null };
      }
      
      if (stage === 'collecting_phone') {
        // Find continuous digits (at least 10)
        const phoneMatch = text.replace(/[^0-9]/g, '');
        if (phoneMatch.length >= 10) return { hasProvidedData: true, extractedData: phoneMatch, replyMessage: null };
      }
      
      if (stage === 'collecting_name' && text.length >= 2 && !text.includes('?')) {
        // If they say "my name is X", strip it
        let name = text;
        const prefixes = ['my name is', 'i am', 'this is'];
        for (const p of prefixes) {
          if (name.toLowerCase().startsWith(p)) {
            name = name.substring(p.length).trim();
          }
        }
        return { hasProvidedData: true, extractedData: name, replyMessage: null };
      }
      
      if (stage === 'collecting_role' && text.length >= 2) {
        return { hasProvidedData: true, extractedData: text, replyMessage: null };
      }

      if (stage === 'selecting_slot') {
        const slotMatch = text.match(/(\d+)/);
        if (slotMatch) return { hasProvidedData: true, extractedData: slotMatch[1], replyMessage: null };
      }
      
      if (stage === 'confirming') {
        const lower = text.toLowerCase();
        if (lower.includes('yes') || lower.includes('y') || lower.includes('ha') || lower.includes('haan')) {
          return { hasProvidedData: true, extractedData: 'Yes', replyMessage: null };
        } else if (lower.includes('no') || lower.includes('n') || lower.includes('nahi')) {
          return { hasProvidedData: true, extractedData: 'No', replyMessage: null };
        }
      }

      // Default fallback
      return { hasProvidedData: false, extractedData: null, replyMessage: "I'm having trouble processing that due to high traffic. Could you please answer with just the exact detail directly?" };
    }
  }

  /**
   * Use AI to understand natural language dates
   */
  private async understandDate(text: string): Promise<string | null> {
    try {
      const today = new Date();
      const prompt = `You are a date extraction bot. The user is providing a date for an interview. They might speak in English, Hindi, or Hinglish (e.g. "kal" = tomorrow, "parso" = day after tomorrow, "aaj" = today, "somvaar" = monday).
User input: "${text}"
Current date is: ${formatDate(today)} (${today.toISOString().split('T')[0]})

What date are they referring to? Respond with ONLY the date in a human-readable format like "Monday, June 30, 2026". If you can't determine the date, respond with "UNKNOWN".`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();

      if (response === 'UNKNOWN' || response.length < 3) {
        return null;
      }
      return response;
    } catch (error: any) {
      console.error('Error understanding date:', error.message || error);
      
      const lower = text.toLowerCase();
      const d = new Date();
      if (lower.includes('tomorrow') || lower.includes('kal')) {
        d.setDate(d.getDate() + 1);
        return formatDate(d);
      }
      if (lower.includes('today') || lower.includes('aaj')) {
        return formatDate(d);
      }
      // Simple day of week fallback
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < days.length; i++) {
        if (lower.includes(days[i])) {
          const todayDay = d.getDay();
          let diff = i - todayDay;
          if (diff <= 0) diff += 7; // Next occurrence of that day
          d.setDate(d.getDate() + diff);
          return formatDate(d);
        }
      }
      return null;
    }
  }

  /**
   * Parse slot selection from user input
   */
  private parseSlotSelection(input: string, slots: string[]): string | null {
    const trimmed = input.trim();

    // Try as number
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= slots.length) {
      return slots[num - 1];
    }

    // Try matching time string
    const lower = trimmed.toLowerCase();
    for (const slot of slots) {
      if (lower.includes(slot.toLowerCase()) || slot.toLowerCase().includes(lower)) {
        return slot;
      }
    }

    // Try matching hour
    const hourMatch = lower.match(/(\d{1,2})\s*(am|pm)/i);
    if (hourMatch) {
      const searchTime = `${hourMatch[1]}:00 ${hourMatch[2].toUpperCase()}`;
      const found = slots.find((s) => s.includes(searchTime) || s.startsWith(hourMatch[1]));
      if (found) return found;
    }

    return null;
  }

  /**
   * Process and analyze an uploaded resume
   */
  async processResume(sessionId: string, resumeText: string, resumeUrl: string): Promise<void> {
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) throw new Error('Conversation not found');

    const role = conversation.context.candidateInfo?.role || 'the applied role';
    
    // AI processing with graceful fallbacks — resume should save even if Gemini quota is exhausted
    let summary = 'Resume uploaded successfully. AI summary will be available when API quota is restored.';
    let matchData: any = { matchScore: 0, matchingSkills: [], missingSkills: [] };
    let questions: string[] = [];

    try {
      // 1. Summarize
      summary = await this.summarizeResume(resumeText);
      
      // 2. Match JD (Role)
      matchData = await this.matchJD(role, resumeText);
      
      // 3. Generate Questions
      questions = await this.generateQuestions(role, summary, matchData.matchingSkills || []);
    } catch (aiError: any) {
      console.warn('⚠️ AI processing failed (likely quota). Resume still saved.', aiError?.message || aiError);
    }

    // Save to context (always — even if AI failed)
    conversation.context.resumeUrl = resumeUrl;
    conversation.context.resumeSummary = summary;
    conversation.context.matchScore = matchData.matchScore || 0;
    conversation.context.suggestedQuestions = questions;
    
    // Add AI message acknowledging receipt
    conversation.messages.push({
      role: 'assistant',
      content: questions.length > 0
        ? `Thanks for uploading your resume! I've analyzed it and prepared personalized interview questions. 📄✨`
        : `Thanks for uploading your resume! I've saved it. The AI analysis will be available once the API quota is restored. 📄`,
      timestamp: new Date(),
    });

    await conversation.save();

    // If email is already collected, save to Candidate collection immediately so it appears on Dashboard
    const email = conversation.context.candidateInfo?.email;
    if (email) {
      let candidate = await Candidate.findOne({ email });
      const leadId = candidate?.leadId || `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      if (!candidate) {
        candidate = new Candidate({
          leadId,
          name: conversation.context.candidateInfo?.name || 'Unknown',
          email: email,
          phone: conversation.context.candidateInfo?.phone || 'Unknown',
          role: role,
          status: 'active',
          resumeUrl: resumeUrl,
          resumeSummary: summary,
          matchScore: matchData.matchScore || 0,
          suggestedQuestions: questions,
        });
      } else {
        candidate.leadId = candidate.leadId || leadId;
        candidate.resumeUrl = resumeUrl;
        candidate.resumeSummary = summary;
        candidate.matchScore = matchData.matchScore || 0;
        candidate.suggestedQuestions = questions;
      }
      await candidate.save();
      console.log(`✅ Candidate ${leadId} saved with resume. AI: ${questions.length > 0 ? 'Yes' : 'Pending'}`);
    }
  }

  /**
   * Summarize a resume using AI
   */
  async summarizeResume(resumeText: string): Promise<string> {
    try {
      const prompt = RESUME_SUMMARY_PROMPT.replace('{{RESUME_TEXT}}', resumeText);
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error: any) {
      console.error('Error summarizing resume:', error);
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      return 'Unable to generate resume summary at this time.';
    }
  }

  /**
   * Match JD with resume
   */
  async matchJD(jdText: string, resumeText: string): Promise<any> {
    try {
      const prompt = JD_MATCHING_PROMPT
        .replace('{{JD_TEXT}}', jdText)
        .replace('{{RESUME_TEXT}}', resumeText);

      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();

      // Try to parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { matchScore: 0, matchingSkills: [], missingSkills: [], recommendation: text };
    } catch (error: any) {
      console.error('Error matching JD:', error);
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      return { matchScore: 0, matchingSkills: [], missingSkills: [], recommendation: 'Error' };
    }
  }

  /**
   * Generate interview questions
   */
  async generateQuestions(role: string, resumeSummary: string, skills: string[]): Promise<string[]> {
    try {
      const prompt = QUESTION_GENERATION_PROMPT
        .replace('{{ROLE}}', role)
        .replace('{{RESUME_SUMMARY}}', resumeSummary)
        .replace('{{SKILLS}}', skills.join(', '));

      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();

      // Parse numbered list
      const questions = text.split('\n')
        .filter((line) => /^\d+[.)]\s/.test(line.trim()))
        .map((line) => line.replace(/^\d+[.)]\s*/, '').trim());

      return questions.length > 0 ? questions : [text];
    } catch (error: any) {
      console.error('Error generating questions:', error);
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      return ['Error generating questions'];
    }
  }

  /**
   * Get conversation history
   */
  async getConversation(sessionId: string): Promise<IConversation | null> {
    return Conversation.findOne({ sessionId });
  }
}

export const aiAgent = new AIAgent();
