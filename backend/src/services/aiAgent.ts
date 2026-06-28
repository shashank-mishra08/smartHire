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
          message: `Please confirm — should I schedule the interview? Just say Yes or No.`,
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
    if (!candidate) {
      candidate = new Candidate({
        name: name!,
        email: email!,
        phone: phone!,
        role: role!,
        status: 'scheduled',
      });
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
    } catch (error) {
      console.error('Error in analyzeMessageWithGemini:', error);
      // Fallback: assume they didn't provide valid data if AI fails
      return { hasProvidedData: false, extractedData: null, replyMessage: "I'm having trouble processing that right now. Could you please answer the question directly?" };
    }
  }

  /**
   * Use AI to understand natural language dates
   */
  private async understandDate(text: string): Promise<string | null> {
    try {
      const today = new Date();
      const prompt = `The user said: "${text}"
Current date is: ${formatDate(today)} (${today.toISOString().split('T')[0]})

What date are they referring to? Respond with ONLY the date in a human-readable format like "Monday, June 30, 2026". If you can't determine the date, respond with "UNKNOWN".`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();

      if (response === 'UNKNOWN' || response.length < 3) {
        return null;
      }
      return response;
    } catch (error: any) {
      console.error('Error understanding date:', error);
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      // Fallback to basic parsing if Gemini is completely unavailable
      const lower = text.toLowerCase();
      const d = new Date();
      if (lower.includes('tomorrow')) {
        d.setDate(d.getDate() + 1);
        return formatDate(d);
      }
      if (lower.includes('today')) {
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
