const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.163.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendVerificationCode(email, code) {
  const user = process.env.SMTP_USER || '';
  const fromName = process.env.SMTP_FROM_NAME || 'Bio App';
  const from = user.includes('@')
    ? `"${fromName}" <${user}>`
    : (process.env.SMTP_FROM || user);

  await getTransporter().sendMail({
    from,
    to: email,
    subject: 'Bio App - Password Reset Verification Code',
    text: `Your verification code is: ${code}. It is valid for 10 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It is valid for 10 minutes.</p>`,
  });
}

module.exports = {
  sendVerificationCode,
};
