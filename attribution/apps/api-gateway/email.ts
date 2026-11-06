// Email service using Resend
// Handles password reset emails and other notifications

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.FROM_EMAIL || 'UnMoGrowP <noreply@yourdomain.com>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Email templates
export class EmailService {

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {

    try {
      // Check if Resend is configured
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY not configured - email will not be sent');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      const resetUrl = `${EMAIL_CONFIG.frontendUrl}/reset-password?token=${resetToken}`;

      // Create password reset email
      const emailContent = this.createPasswordResetEmailTemplate(
        email,
        resetUrl,
        userName || 'User'
      );

      // Send email via Resend
      const response = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: [email],
        subject: 'Reset Your Password - UnMoGrowP',
        html: emailContent.html,
        text: emailContent.text,
      });

      if (response.error) {
        console.error('❌ Failed to send password reset email:', response.error);
        return {
          success: false,
          error: response.error.message || 'Failed to send email'
        };
      }

      console.log(`✅ Password reset email sent to ${email} (Message ID: ${response.data?.id})`);
      return {
        success: true,
        messageId: response.data?.id
      };

    } catch (error) {
      console.error('❌ Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Create password reset email template
   */
  private static createPasswordResetEmailTemplate(
    email: string,
    resetUrl: string,
    userName: string
  ): { html: string; text: string } {

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - UnMoGrowP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #6d8cf8;
            font-size: 32px;
            margin: 0;
            font-weight: bold;
        }
        .content {
            margin-bottom: 30px;
        }
        .reset-button {
            display: inline-block;
            background-color: #305093;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            margin: 20px 0;
        }
        .reset-button:hover {
            background-color: #26416a;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo">
            <h1>UnMoGrowP</h1>
        </div>

        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${userName},</p>

            <p>We received a request to reset the password for your UnMoGrowP account (${email}).</p>

            <p>Click the button below to create a new password:</p>

            <a href="${resetUrl}" class="reset-button">Reset Password</a>

            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This link will expire in 15 minutes for security</li>
                    <li>If you didn't request this reset, you can safely ignore this email</li>
                    <li>Your password won't change until you create a new one using the link above</li>
                </ul>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
        </div>

        <div class="footer">
            <p><strong>Need help?</strong> If you have any questions about your UnMoGrowP account, feel free to contact our support team.</p>
            <p style="margin-top: 20px;">
                Best regards,<br>
                The UnMoGrowP Team
            </p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Reset Your Password - UnMoGrowP

Hi ${userName},

We received a request to reset the password for your UnMoGrowP account (${email}).

To create a new password, click this link:
${resetUrl}

IMPORTANT:
- This link will expire in 15 minutes for security
- If you didn't request this reset, you can safely ignore this email
- Your password won't change until you create a new one using the link above

If you have any questions, feel free to contact our support team.

Best regards,
The UnMoGrowP Team
`;

    return { html, text };
  }

  /**
   * Send welcome email (future feature)
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement welcome email template
    console.log(`📧 Welcome email would be sent to ${userName} (${email})`);
    return { success: true };
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(): Promise<{ configured: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
      return {
        configured: false,
        error: 'RESEND_API_KEY environment variable not set'
      };
    }

    // TODO: Add actual API key validation if needed
    return { configured: true };
  }
}

export default EmailService;