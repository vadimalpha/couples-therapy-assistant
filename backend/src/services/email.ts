import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@couplestherapy.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface InvitationEmailParams {
  to: string;
  inviterName: string;
  inviterEmail: string;
  token: string;
  relationshipType: string;
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Invitation email not sent.');
    console.log('Invitation link:', `${FRONTEND_URL}/accept-invitation/${params.token}`);
    return false;
  }

  const acceptUrl = `${FRONTEND_URL}/accept-invitation/${params.token}`;
  const relationshipLabel = params.relationshipType === 'partner' ? 'partner' : params.relationshipType;

  const msg = {
    to: params.to,
    from: FROM_EMAIL,
    replyTo: 'vadim@cvetlo.com',
    subject: `${params.inviterName} invited you to Couples Therapy Assistant`,
    text: `
Hi,

${params.inviterName} (${params.inviterEmail}) has invited you to connect as their ${relationshipLabel} on Couples Therapy Assistant.

Click the link below to accept the invitation:
${acceptUrl}

This invitation expires in 72 hours.

If you didn't expect this invitation, you can safely ignore this email.

- The Couples Therapy Assistant Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Couples Therapy Assistant</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi,</p>

    <p style="font-size: 16px;">
      <strong>${params.inviterName}</strong> (${params.inviterEmail}) has invited you to connect as their <strong>${relationshipLabel}</strong> on Couples Therapy Assistant.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${acceptUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">
      This invitation expires in 72 hours.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="font-size: 12px; color: #999;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`Invitation email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}
