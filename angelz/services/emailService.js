const nodemailer = require("nodemailer");

// ============================================================
// SMTP CONFIGURATION
// ============================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // Port 465 uses SSL/TLS

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Helpful for diagnosing SMTP connection problems
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

// ============================================================
// VERIFY SMTP CONNECTION
// ============================================================

transporter.verify((error, success) => {
  if (error) {
    console.error("========================================");
    console.error("❌ SMTP CONNECTION ERROR");
    console.error("========================================");
    console.error(error);
  } else {
    console.log("========================================");
    console.log("✅ SMTP SERVER READY");
    console.log("========================================");
    console.log("SMTP Host:", process.env.SMTP_HOST);
    console.log("SMTP Port:", process.env.SMTP_PORT);
    console.log("SMTP User:", process.env.SMTP_USER);
  }
});

// ============================================================
// SEND VOLUNTEER INVITATION EMAIL
// ============================================================

exports.sendInvitationEmail = async (
  email,
  name,
  tempPassword,
  loginUrl
) => {
  try {
    const mailOptions = {
      from: `"Angelz Platform" <${process.env.SMTP_USER}>`,
      to: email,

      subject: "🎉 You have been invited to join Angelz as a Volunteer!",

      html: `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Volunteer Invitation</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f4f6fb;
    font-family:'Segoe UI',Arial,sans-serif;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
      background-color:#f4f6fb;
      padding:40px 0;
    "
  >
    <tr>
      <td align="center">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.08);
          "
        >

          <!-- HEADER -->

          <tr>
            <td
              style="
                background:#6c63ff;
                padding:40px 32px;
                text-align:center;
              "
            >

              <h1
                style="
                  color:#ffffff;
                  margin:0;
                  font-size:26px;
                  font-weight:700;
                "
              >
                Welcome to Angelz 🌟
              </h1>

              <p
                style="
                  color:rgba(255,255,255,0.85);
                  margin:8px 0 0;
                  font-size:15px;
                "
              >
                You've been invited to make a difference
              </p>

            </td>
          </tr>

          <!-- BODY -->

          <tr>
            <td style="padding:40px 32px;">

              <p
                style="
                  color:#374151;
                  font-size:16px;
                  line-height:1.6;
                  margin:0 0 20px;
                "
              >
                Hi <strong>${name}</strong>,
              </p>

              <p
                style="
                  color:#374151;
                  font-size:15px;
                  line-height:1.6;
                  margin:0 0 28px;
                "
              >
                A Volunteer Group has invited you to join the
                <strong>Angelz Platform</strong>
                as a volunteer.

                Your account has been created and is ready to use.
                Below are your temporary login credentials:
              </p>

              <!-- CREDENTIALS -->

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background:#f0f4ff;
                  border-radius:8px;
                  margin-bottom:28px;
                "
              >

                <tr>
                  <td style="padding:24px 28px;">

                    <p
                      style="
                        margin:0 0 10px;
                        color:#6c63ff;
                        font-size:13px;
                        font-weight:600;
                        text-transform:uppercase;
                        letter-spacing:0.5px;
                      "
                    >
                      Your Credentials
                    </p>

                    <p
                      style="
                        margin:0 0 8px;
                        color:#111827;
                        font-size:15px;
                      "
                    >
                      <strong>Email:</strong>
                      ${email}
                    </p>

                    <p
                      style="
                        margin:0;
                        color:#111827;
                        font-size:15px;
                      "
                    >
                      <strong>Temporary Password:</strong>

                      <span
                        style="
                          font-family:monospace;
                          background:#e0e7ff;
                          color:#3730a3;
                          padding:2px 8px;
                          border-radius:4px;
                          font-size:14px;
                        "
                      >
                        ${tempPassword}
                      </span>
                    </p>

                  </td>
                </tr>

              </table>

              <!-- SECURITY MESSAGE -->

              <p
                style="
                  color:#6b7280;
                  font-size:14px;
                  line-height:1.6;
                  margin:0 0 28px;
                "
              >
                ⚠️ Please log in and change your password as soon as
                possible for security.
              </p>

              <!-- LOGIN BUTTON -->

              <table
                cellpadding="0"
                cellspacing="0"
                style="
                  margin:0 auto 32px;
                "
              >

                <tr>

                  <td
                    style="
                      background:#6c63ff;
                      border-radius:8px;
                      padding:14px 32px;
                      text-align:center;
                    "
                  >

                    <a
                      href="${loginUrl}"
                      style="
                        color:#ffffff;
                        font-size:15px;
                        font-weight:600;
                        text-decoration:none;
                        display:inline-block;
                      "
                    >
                      Log In to Angelz →
                    </a>

                  </td>

                </tr>

              </table>

              <hr
                style="
                  border:none;
                  border-top:1px solid #e5e7eb;
                  margin:0 0 24px;
                "
              />

              <!-- FOOTER -->

              <p
                style="
                  color:#9ca3af;
                  font-size:13px;
                  line-height:1.5;
                  margin:0;
                  text-align:center;
                "
              >
                If you did not expect this invitation,
                you can safely ignore this email.
                <br />

                © ${new Date().getFullYear()}
                Angelz Platform.
                All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>

</html>
      `,
    };

    // ========================================================
    // SEND EMAIL
    // ========================================================

    console.log("========================================");
    console.log("📧 SENDING INVITATION EMAIL");
    console.log("========================================");
    console.log("From:", process.env.SMTP_USER);
    console.log("To:", email);
    console.log("SMTP Host:", process.env.SMTP_HOST);
    console.log("SMTP Port:", process.env.SMTP_PORT);

    const info = await transporter.sendMail(mailOptions);

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log("========================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("========================================");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);

    return info;

  } catch (error) {

    // ========================================================
    // ERROR
    // ========================================================

    console.error("========================================");
    console.error("❌ EMAIL SEND ERROR");
    console.error("========================================");

    console.error("Error code:", error.code);
    console.error("Error command:", error.command);
    console.error("Error response:", error.response);
    console.error("Error responseCode:", error.responseCode);
    console.error("Full error:", error);

    throw error;
  }
};


// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT) || 587,
//   secure: false,      // false = use STARTTLS on port 587
//   requireTLS: true,   // force TLS upgrade
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// /**
//  * Send an invitation email to a new volunteer with their temporary credentials.
//  * @param {string} email       - Recipient email address
//  * @param {string} name        - Recipient's name
//  * @param {string} tempPassword - Temporary plain-text password
//  * @param {string} loginUrl    - URL the volunteer uses to log in
//  */
// exports.sendInvitationEmail = async (email, name, tempPassword, loginUrl) => {
//   const mailOptions = {
//     from: `"Angelz Platform" <${process.env.SMTP_USER}>`,
//     to: email,
//     subject: '🎉 You have been invited to join Angelz as a Volunteer!',
//     html: `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//   <title>Volunteer Invitation</title>
// </head>
// <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:40px 0;">
//     <tr>
//       <td align="center">
//         <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
//           <!-- Header -->
//           <tr>
//             <td style="background:linear-gradient(135deg,#6c63ff,#3b82f6);padding:40px 32px;text-align:center;">
//               <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
//                 Welcome to Angelz 🌟
//               </h1>
//               <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">
//                 You've been invited to make a difference
//               </p>
//             </td>
//           </tr>
//           <!-- Body -->
//           <tr>
//             <td style="padding:40px 32px;">
//               <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">
//                 Hi <strong>${name}</strong>,
//               </p>
//               <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px;">
//                 A Volunteer Group has invited you to join the <strong>Angelz Platform</strong> as a volunteer.
//                 Your account has been created and is ready to use. Below are your temporary login credentials:
//               </p>
//               <!-- Credentials box -->
//               <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border-radius:8px;padding:0;margin-bottom:28px;">
//                 <tr>
//                   <td style="padding:24px 28px;">
//                     <p style="margin:0 0 10px;color:#6c63ff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Credentials</p>
//                     <p style="margin:0 0 8px;color:#111827;font-size:15px;">
//                       <strong>Email:</strong> ${email}
//                     </p>
//                     <p style="margin:0;color:#111827;font-size:15px;">
//                       <strong>Temporary Password:</strong>
//                       <span style="font-family:monospace;background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:4px;font-size:14px;">${tempPassword}</span>
//                     </p>
//                   </td>
//                 </tr>
//               </table>
//               <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
//                 ⚠️ Please log in and change your password as soon as possible for security.
//               </p>
//               <!-- CTA Button -->
//               <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
//                 <tr>
//                   <td style="background:linear-gradient(135deg,#6c63ff,#3b82f6);border-radius:8px;padding:14px 32px;text-align:center;">
//                     <a href="${loginUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
//                       Log In to Angelz →
//                     </a>
//                   </td>
//                 </tr>
//               </table>
//               <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>
//               <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;text-align:center;">
//                 If you did not expect this invitation, you can safely ignore this email.<br/>
//                 © ${new Date().getFullYear()} Angelz Platform. All rights reserved.
//               </p>
//             </td>
//           </tr>
//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>
//     `,
//   };

//   await transporter.sendMail(mailOptions);
// };
