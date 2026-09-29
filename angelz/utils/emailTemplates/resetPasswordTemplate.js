exports.resetPasswordTemplate = (resetUrl) => {

const message = `
Hello,

You have requested to reset the password for your Angelz account.

To reset your password, please click the link below:

${resetUrl}

This password reset link will expire in 1 hour.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
Angelz Support Team
`;

const html = `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;padding:40px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.08);text-align:center;">

    <h2 style="color:#4F46E5;margin-bottom:20px;">
      Angelz
    </h2>

    <p style="font-size:16px;color:#333;margin-bottom:20px;">
      Hello,
    </p>

    <p style="font-size:16px;color:#333;line-height:1.6;margin-bottom:25px;">
      You have requested to reset the password for your <strong>Angelz</strong> account.
      Click the button below to create a new password.
    </p>

    <div style="margin:30px 0;">
      <a href="${resetUrl}"
         style="
           background:#4F46E5;
           color:#ffffff;
           padding:14px 32px;
           font-size:16px;
           font-weight:600;
           text-decoration:none;
           border-radius:6px;
           display:inline-block;
         ">
         Reset Password
      </a>
    </div>

    <p style="font-size:14px;color:#555;margin-top:20px;">
      This password reset link will expire in <strong>1 hour</strong>.
    </p>

    <p style="font-size:14px;color:#555;margin-top:10px;">
      If you did not request a password reset, please ignore this email.
      Your password will remain unchanged.
    </p>

    <p style="font-size:14px;color:#333;margin-top:30px;">
      Best regards,<br>
      <strong>Angelz Support Team</strong>
    </p>

  </div>
</div>
`;

return { message, html };

};