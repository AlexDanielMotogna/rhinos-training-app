import * as brevo from '@getbrevo/brevo';

// Configure Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@rhinostraining.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Rhinos Training';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
  sendSmtpEmail.to = [{ email: options.to }];
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.htmlContent;
  sendSmtpEmail.textContent = options.textContent || options.htmlContent.replace(/<[^>]*>/g, '');

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #203731; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f5f5f5; }
        .button { display: inline-block; padding: 12px 30px; background-color: #FFB612; color: #203731; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏈 Rhinos Training</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}">${resetLink}</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rhinos Training. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Rhinos Training',
    htmlContent,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #203731; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f5f5f5; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏈 Welcome to Rhinos Training!</h1>
        </div>
        <div class="content">
          <h2>Hey ${name}! 👋</h2>
          <p>Welcome to the Rhinos Training family! Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>📊 Track your workouts and progress</li>
            <li>🏃 Log training sessions</li>
            <li>📈 View your performance stats</li>
            <li>👥 Connect with your teammates</li>
            <li>🎥 Access training videos</li>
          </ul>
          <p>Get ready to dominate the field! 💪</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rhinos Training. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Rhinos Training!',
    htmlContent,
  });
}
