const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email error (non-fatal):', err.message);
  }
};

const sendInviteEmail = async ({ to, inviterName, workspaceName, inviteLink }) => {
  await sendEmail({
    to,
    subject: `${inviterName} ju fton në workspace "${workspaceName}" - TaskFlow`,
    html: `
      <div style="font-family: 'Instrument Sans', sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f13; color: #e2e8f0; border-radius: 12px; padding: 40px; border: 1px solid #1e1e2e;">
        <h1 style="color: #6366f1; font-size: 28px; margin-bottom: 8px;">TaskFlow</h1>
        <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 16px;">Ftesë për Workspace</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          <strong style="color: #e2e8f0;">${inviterName}</strong> ju ka ftuar të bashkoheni me workspace-in 
          <strong style="color: #6366f1;">"${workspaceName}"</strong> në TaskFlow.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${inviteLink}" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Pranoj Ftesën
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Ky link skadon pas 7 ditëve.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async ({ to, resetLink }) => {
  await sendEmail({
    to,
    subject: 'Rivendos fjalëkalimin — TaskFlow',
    html: `
      <div style="font-family: 'Instrument Sans', sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f13; color: #e2e8f0; border-radius: 12px; padding: 40px; border: 1px solid #1e1e2e;">
        <h1 style="color: #6366f1; font-size: 28px; margin-bottom: 8px;">TaskFlow</h1>
        <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 16px;">Rivendosni Fjalëkalimin</h2>
        <p style="color: #94a3b8;">Klikoni butonin më poshtë për të rivendosur fjalëkalimin tuaj:</p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetLink}" style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Rivendos Fjalëkalimin
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Ky link skadon pas 1 ore. Nëse nuk e keni kërkuar ju, injoroni këtë email.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendInviteEmail, sendPasswordResetEmail };
