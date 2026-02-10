import nodemailer from "nodemailer";

/**
 * Creates and returns a nodemailer transporter.
 * Uses Gmail SMTP by default. Set these env vars in .env.local:
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your_email@gmail.com
 *   SMTP_PASS=your_app_password
 *   SMTP_FROM="FairShare <your_email@gmail.com>"
 *
 * For Gmail, you need to create an App Password:
 *   1. Go to https://myaccount.google.com/apppasswords
 *   2. Generate a new app password for "Mail"
 *   3. Use that 16-character password as SMTP_PASS
 */
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an approval email to the hostel owner.
 */
export async function sendApprovalEmail(to, hostelName, note) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Your hostel "${hostelName}" has been approved - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Registration Approved</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Congratulations! Your hostel <strong>${hostelName}</strong> has been reviewed and 
          <strong style="color: #16a34a;">approved</strong> by our admin team.
        </p>
        ${
          note
            ? `<div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Admin Note:</strong> ${note}</p>
              </div>`
            : ""
        }
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Your hostel is now listed on FairShare. You can start managing your hostel through the platform.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated message from FairShare. Please do not reply to this email.
        </p>
      </div>
    `,
  });
}

/**
 * Sends a rejection email to the hostel owner.
 */
export async function sendRejectionEmail(to, hostelName, note) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Update on your hostel "${hostelName}" registration - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">Registration Not Approved</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          We regret to inform you that your hostel <strong>${hostelName}</strong> registration 
          has been <strong style="color: #dc2626;">not approved</strong> after review by our admin team.
        </p>
        ${
          note
            ? `<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${note}</p>
              </div>`
            : ""
        }
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          You may re-submit your registration with updated documents by visiting our registration page.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          This is an automated message from FairShare. Please do not reply to this email.
        </p>
      </div>
    `,
  });
}
