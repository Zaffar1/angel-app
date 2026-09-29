const nodemailer = require('nodemailer');

// create transporter ONCE
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  secure: false,
  auth: {
    user: '0e4217c187874f',
    pass: '84eed26e650edf',
  },
});

// optional but recommended: verify on startup
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Mailtrap SMTP error:', err.message);
  } else {
    console.log('✅ Mailtrap SMTP ready');
  }
});

module.exports = async function sendInviteEmail(to, inviteLink) {
  return transporter.sendMail({
    from: '"Volunteer App" <no-reply@example.com>',
    to,
    subject: 'Volunteer Invitation',
    html: `
      <p>You have been invited to join an organization as a volunteer.</p>
      <a href="${inviteLink}">Accept Invitation</a>
    `,
  });
};
