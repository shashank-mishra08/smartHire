import nodemailer from 'nodemailer';
import { config } from '../config/env';

interface InterviewEmailData {
  candidateName: string;
  candidateEmail: string;
  role: string;
  date: string;
  time: string;
  meetLink: string;
  recruiterEmail: string;
  duration?: number;
}

/**
 * Email Service — sends beautiful HTML emails to candidates and recruiters
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: false,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      console.log('✅ Email service initialized');
    } else {
      console.warn('⚠️  SMTP credentials not set. Emails will be logged to console.');
    }
  }

  /**
   * Send interview confirmation to candidate
   */
  async sendCandidateConfirmation(data: InterviewEmailData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:40px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">🎉 Interview Scheduled!</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;">SmartHire AI</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:18px;color:#1e293b;margin:0 0 24px;">Hi <strong>${data.candidateName}</strong>,</p>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
        Great news! Your interview has been successfully scheduled. Here are the details:
      </p>
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #e2e8f0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">💼 Position</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.role}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">📅 Date</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">🕐 Time</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">⏱️ Duration</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.duration || 30} minutes</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">📹 Platform</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">Google Meet</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${data.meetLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(99,102,241,0.3);">
          Join Google Meet 🔗
        </a>
      </div>
      <div style="background:#fffbeb;border-radius:8px;padding:16px;border:1px solid #fde68a;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          💡 <strong>Tip:</strong> Please join the meeting 2-3 minutes before the scheduled time. Keep your resume handy!
        </p>
      </div>
      <p style="font-size:14px;color:#64748b;line-height:1.6;">
        If you need to reschedule or cancel, simply reply to this email or visit our scheduling portal.
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Powered by SmartHire AI • Interview Scheduling Made Simple</p>
    </div>
  </div>
</body>
</html>`;

    await this.sendEmail({
      to: data.candidateEmail,
      subject: `✅ Interview Scheduled — ${data.role} | ${data.date} at ${data.time}`,
      html,
    });
  }

  /**
   * Send notification to recruiter
   */
  async sendRecruiterNotification(data: InterviewEmailData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">📋 New Interview Scheduled</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">SmartHire AI Notification</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 20px;">A new interview has been auto-scheduled by SmartHire AI:</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #bbf7d0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">👤 Candidate</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.candidateName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">📧 Email</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;">${data.candidateEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">💼 Role</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.role}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">📅 Date</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">🕐 Time</td>
            <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${data.time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;">🔗 Meet</td>
            <td style="padding:8px 0;font-size:14px;"><a href="${data.meetLink}" style="color:#6366f1;">${data.meetLink}</a></td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${data.meetLink}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
          Open Meet Link
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">SmartHire AI • Automated Interview Scheduling</p>
    </div>
  </div>
</body>
</html>`;

    await this.sendEmail({
      to: data.recruiterEmail,
      subject: `📋 New Interview: ${data.candidateName} — ${data.role} | ${data.date}`,
      html,
    });
  }

  /**
   * Core send method
   */
  private async sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"SmartHire AI" <${config.smtp.user}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        console.log(`📧 Email sent to ${options.to}: ${options.subject}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${options.to}:`, error);
      }
    } else {
      console.log(`📧 [MOCK EMAIL] To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   (Configure SMTP credentials to send real emails)`);
    }
  }
}

export const emailService = new EmailService();
