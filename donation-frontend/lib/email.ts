import nodemailer from "nodemailer";

export function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP_* env vars");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 true, 587 false
    auth: { user, pass },
  });
}

export async function sendCertificateEmail(opts: {
  to: string;
  donorName: string;
  certificateNo: string;
  pdfUrl: string;
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const transporter = getMailer();

  const subject = `Your Donation Certificate (${opts.certificateNo})`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Thank you, ${escapeHtml(opts.donorName)}! 💛</h2>
      <p>Your donation has been approved and we’ve issued your certificate.</p>
      <p><b>Certificate No:</b> ${escapeHtml(opts.certificateNo)}</p>
      <p>
        <a href="${opts.pdfUrl}" target="_blank">View / Download Certificate</a>
      </p>
      <p>Fair Sharing</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: opts.to,
    subject,
    html,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c] as string));
}
