import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { config } from '../config/env';
import { RESUME_SUMMARY_PROMPT, JD_MATCHING_PROMPT, QUESTION_GENERATION_PROMPT } from '../utils/prompts';
import { Conversation, IConversation } from '../models/Conversation';
import { Candidate } from '../models/Candidate';
import { Interview } from '../models/Interview';
import { calendarService } from './calendarService';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

interface ChatResponse {
  message: string;
  stage?: string;
  slots?: string[];
  interviewScheduled?: boolean;
  interviewDetails?: {
    date: string;
    time: string;
    meetLink: string;
  };
}

const checkCalendarSlotsDeclaration: FunctionDeclaration = {
  name: 'check_calendar_slots',
  description: 'Check available interview time slots for a given date.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      date: {
        type: SchemaType.STRING,
        description: 'The date for the interview. MUST be formatted as YYYY-MM-DD.'
      }
    },
    required: ['date']
  }
};

const bookInterviewDeclaration: FunctionDeclaration = {
  name: 'book_interview',
  description: 'Book the interview once all details are collected and confirmed by the candidate.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING },
      role: { type: SchemaType.STRING },
      email: { type: SchemaType.STRING },
      phone: { type: SchemaType.STRING },
      date: { type: SchemaType.STRING, description: 'MUST be formatted as YYYY-MM-DD.' },
      time: { type: SchemaType.STRING, description: 'MUST be formatted as HH:mm (24-hour format).' }
    },
    required: ['name', 'role', 'email', 'phone', 'date', 'time']
  }
};

export class AIAgent {
  private getModel(context?: any) {
    let instruction = `You are a friendly, conversational AI Interview Scheduler for SmartHire.
Your goal is to collect: Name, Role, Email, Phone, Preferred Date, and Preferred Time.
Always be polite, conversational, and human-like.
If the user asks off-topic questions, answer them briefly and naturally, then gently steer the conversation back.
If the user provides partial info, acknowledge it and ask for the rest.
When the user provides a preferred date, call the 'check_calendar_slots' function to check availability and present the options.
Once you have ALL details (Name, Role, Email, Phone, Date, Time), explicitly ask for confirmation (e.g. "Here are your details... Should I go ahead and schedule?").
If the user confirms, call the 'book_interview' function.
After the interview is successfully booked, congratulate them, provide the meeting details, and EXPLICITLY ask them to upload their resume using the attach button below to help us prepare for the interview.
Do not hallucinate dates or times. The current date is ${new Date().toDateString()}.`;

    if (context?.resumeUrl) {
      instruction = `You are a friendly, conversational AI Interview Scheduler for SmartHire.
The user has successfully scheduled their interview AND already uploaded their resume.
Your goal is COMPLETE.
Do NOT ask for their resume again. Answer any final questions politely and conclude the chat.
Do not hallucinate dates or times. The current date is ${new Date().toDateString()}.`;
    }

    return genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ functionDeclarations: [checkCalendarSlotsDeclaration, bookInterviewDeclaration] }],
      systemInstruction: instruction
    });
  }

  async startConversation(sessionId: string): Promise<ChatResponse> {
    let conversation = await Conversation.findOne({ sessionId });
    if (conversation) {
      return { message: '', stage: conversation.context.stage };
    }

    conversation = new Conversation({
      sessionId,
      messages: [],
      context: { stage: 'greeting', candidateInfo: {} },
      status: 'active',
    });

    const greeting = `Hi there! 👋 Welcome to SmartHire!\n\nI'm your AI interview scheduling assistant. I'll help you book your interview in just a few minutes.\n\nLet's get started — what's your full name?`;

    conversation.messages.push({ role: 'assistant', content: greeting, timestamp: new Date() });
    await conversation.save();

    return { message: greeting, stage: 'collecting_name' };
  }

  async processMessage(sessionId: string, userMessage: string): Promise<ChatResponse> {
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        messages: [],
        context: { stage: 'greeting', candidateInfo: {} },
        status: 'active',
      });
    }

    // Add user message to local history DB
    conversation.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });

    // Build Gemini history array
    const history = conversation.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Pop the last message to send it in sendMessage
    const lastMessage = history.pop()!;

    // Gemini API requires the first message in history to be from a 'user'
    if (history.length > 0 && history[0].role === 'model') {
      history.unshift({ role: 'user', parts: [{ text: 'Hi' }] });
    }

    const chat = this.getModel(conversation.context).startChat({ history });

    try {
      let result = await chat.sendMessage(lastMessage.parts[0].text!);
      let response = result.response;
      let finalMessageText = '';
      let scheduledDetails = null;

      // Check if model called a function
      const calls = response.functionCalls ? response.functionCalls() : undefined;
      if (calls && calls.length > 0) {
        const call = calls[0];
        
        if (call.name === 'check_calendar_slots') {
          const date = (call.args as any).date;
          const slots = await calendarService.getAvailableSlots(date);
          
          // Send function response back to model
          result = await chat.sendMessage([{
            functionResponse: {
              name: 'check_calendar_slots',
              response: { availableSlots: slots }
            }
          }]);
          response = result.response;
          finalMessageText = response.text();
        } 
        else if (call.name === 'book_interview') {
          const args = call.args as any;
          
          // Convert HH:mm to 12-hour AM/PM for better readability in DB and sheets
          const tempDate = new Date(`1970-01-01T${args.time.padStart(5, '0')}:00Z`);
          if (!isNaN(tempDate.getTime())) {
             args.time = tempDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
          }

          const { interviewId, meetLink } = await this.scheduleInterview(conversation, args);
          
          // Send function response back
          result = await chat.sendMessage([{
            functionResponse: {
              name: 'book_interview',
              response: { success: true, interviewId, meetLink }
            }
          }]);
          response = result.response;
          finalMessageText = response.text();
          
          scheduledDetails = {
            date: args.date,
            time: args.time,
            meetLink
          };
          conversation.context.stage = 'scheduled';
          
          // Save captured info for dashboard
          conversation.context.candidateInfo = {
            name: args.name,
            role: args.role,
            email: args.email,
            phone: args.phone
          };
        }
      } else {
        finalMessageText = response.text();
      }

      // Save AI reply to local DB
      conversation.messages.push({ role: 'assistant', content: finalMessageText, timestamp: new Date() });
      await conversation.save();

      if (scheduledDetails) {
        return {
          message: finalMessageText,
          stage: 'scheduled',
          interviewScheduled: true,
          interviewDetails: scheduledDetails
        };
      }

      return {
        message: finalMessageText,
        stage: conversation.context.stage
      };

    } catch (error: any) {
      console.error('Error in chat:', error);
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      
      const errMsg = "I'm sorry, I'm having trouble processing that right now. Could you please try again?";
      conversation.messages.push({ role: 'assistant', content: errMsg, timestamp: new Date() });
      await conversation.save();
      
      return { message: errMsg, stage: conversation.context.stage };
    }
  }

  private async scheduleInterview(conversation: IConversation, args: any): Promise<{ interviewId: string; meetLink: string }> {
    const { name, email, phone, role, date, time } = args;
    
    // Calculate proper Date object
    const dateTime = new Date(date);

    const meetLink = await calendarService.scheduleInterview(
      { name, email, role },
      date,
      time
    );

    let candidate = await Candidate.findOne({ email });
    const leadId = candidate?.leadId || `LEAD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    if (!candidate) {
      candidate = new Candidate({
        leadId,
        name,
        email,
        phone,
        role,
        status: 'scheduled',
        resumeUrl: conversation.context.resumeUrl,
        resumeSummary: conversation.context.resumeSummary,
        matchScore: conversation.context.matchScore,
        suggestedQuestions: conversation.context.suggestedQuestions,
      });
      await candidate.save();
    } else {
      candidate.status = 'scheduled';
      candidate.leadId = candidate.leadId || leadId;
      if (conversation.context.resumeUrl) candidate.resumeUrl = conversation.context.resumeUrl;
      if (conversation.context.resumeSummary) candidate.resumeSummary = conversation.context.resumeSummary;
      if (conversation.context.matchScore) candidate.matchScore = conversation.context.matchScore;
      if (conversation.context.suggestedQuestions) candidate.suggestedQuestions = conversation.context.suggestedQuestions;
      await candidate.save();
    }

    const interview = new Interview({
      candidateId: candidate._id,
      candidateName: name,
      candidateEmail: email,
      candidatePhone: phone,
      role: role,
      date: date,
      time: time,
      dateTime,
      duration: 30,
      status: 'scheduled',
      meetLink,
      recruiterEmail: config.google.recruiterEmail,
    });

    await interview.save();
    conversation.candidateId = candidate._id as any;

    return {
      interviewId: (interview._id as any).toString(),
      meetLink,
    };
  }

  async processResume(sessionId: string, parsedText: string, resumeUrl: string): Promise<void> {
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) return;

    let summary = '';
    let matchData: any = { matchScore: 0 };
    let questions: string[] = [];

    try {
      summary = await this.summarizeResume(parsedText);
      matchData = await this.matchJD('SmartHire standard role', parsedText);
      questions = await this.generateQuestions('Candidate', summary, matchData.matchingSkills || []);
    } catch (e: any) {
      console.warn("AI extraction skipped for resume due to quota limits, but storing the resume.", e.message);
    }

    conversation.context.resumeUrl = resumeUrl;
    conversation.context.resumeSummary = summary;
    conversation.context.matchScore = matchData.matchScore || 0;
    conversation.context.suggestedQuestions = questions;
    
    conversation.messages.push({
      role: 'assistant',
      content: questions.length > 0
        ? `Thanks for uploading your resume! I've analyzed it and prepared personalized interview questions. 📄✨`
        : `Thanks for uploading your resume! I've saved it. The AI analysis will be available once the API quota is restored. 📄`,
      timestamp: new Date(),
    });

    await conversation.save();

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
          role: conversation.context.candidateInfo?.role || 'Unknown',
          status: 'new',
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
    }
  }

  async summarizeResume(resumeText: string): Promise<string> {
    try {
      const prompt = RESUME_SUMMARY_PROMPT.replace('{{RESUME_TEXT}}', resumeText);
      const result = await this.getModel().generateContent(prompt);
      return result.response.text().trim();
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      return 'Unable to generate resume summary at this time.';
    }
  }

  async matchJD(jdText: string, resumeText: string): Promise<any> {
    try {
      const prompt = JD_MATCHING_PROMPT
        .replace('{{JD_TEXT}}', jdText)
        .replace('{{RESUME_TEXT}}', resumeText);

      const result = await this.getModel().generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      
      return { matchScore: 0, matchingSkills: [], missingSkills: [], recommendation: text };
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      return { matchScore: 0, matchingSkills: [], missingSkills: [], recommendation: 'Error' };
    }
  }

  async generateQuestions(role: string, resumeSummary: string, skills: string[]): Promise<string[]> {
    try {
      const prompt = QUESTION_GENERATION_PROMPT
        .replace('{{ROLE}}', role)
        .replace('{{RESUME_SUMMARY}}', resumeSummary)
        .replace('{{SKILLS}}', skills.join(', '));

      const result = await this.getModel().generateContent(prompt);
      const text = result.response.text().trim();

      const questions = text.split('\n')
        .filter((line) => /^\d+[.)]\s/.test(line.trim()))
        .map((line) => line.replace(/^\d+[.)]\s*/, '').trim());

      return questions.length > 0 ? questions : [text];
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) throw error;
      return ['Error generating questions'];
    }
  }

  async getConversation(sessionId: string): Promise<IConversation | null> {
    return Conversation.findOne({ sessionId });
  }
}

export const aiAgent = new AIAgent();
