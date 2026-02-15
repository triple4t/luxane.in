import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter (using Gmail as example, can use SendGrid, Resend, etc.)
// Only create transporter if email credentials are provided
let transporter: nodemailer.Transporter | null = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
    },
  });
} else {
  console.warn('⚠️  Email credentials not configured. Email features will be disabled.');
}

// Alternative: Using SMTP (works with any email provider)
// Uncomment and configure if not using Gmail
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> => {
  if (!transporter) {
    console.warn('Email not configured. Skipping email send to:', to);
    return; // Silently fail if email is not configured
  }

  try {
    const mailOptions = {
      from: `"Creative Universe" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw error - just log it so the app doesn't crash
    console.warn('Email sending failed, but continuing...');
  }
};

// Email templates
export const emailTemplates = {
  orderConfirmation: (order: any, items: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: #fff; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .item { padding: 10px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Creative Universe</h1>
            </div>
            <div class="content">
              <h2>Order Confirmation</h2>
              <p>Thank you for your order!</p>
              <div class="order-details">
                <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
                <p><strong>Total:</strong> ₹${order.total.toFixed(0)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <h3>Items:</h3>
                <ul>
                  ${items.map(item => `<li class="item">${item.product.name} - Qty: ${item.quantity} - ₹${item.price.toFixed(0)}</li>`).join('')}
                </ul>
              </div>
              <p>We'll send you another email when your order ships.</p>
            </div>
            <div class="footer">
              <p>© 2026 Creative Universe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  passwordReset: (resetLink: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>© 2026 Creative Universe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  passwordResetSuccess: () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact us immediately.</p>
            <div class="footer">
              <p>© 2026 Creative Universe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
};

