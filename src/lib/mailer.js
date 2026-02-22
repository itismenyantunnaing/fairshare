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
 * Sends a registration confirmation email when AI verification passes.
 */
export async function sendRegistrationEmail(to, hostelName, shelterId) {
  const transporter = getTransporter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const profileUrl = `${baseUrl}/shelter/${shelterId}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `မှတ်ပုံတင်ခြင်း လက်ခံပြီးပါပြီ - "${hostelName}" - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">မှတ်ပုံတင်ခြင်း လက်ခံပြီးပါပြီ</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          သင့်ခိုလှုံရာအိမ် <strong>${hostelName}</strong> ၏ လက်မှတ်ကို AI ဖြင့် အတည်ပြုပြီးပါပြီ။
          ယခု စီမံခန့်ခွဲသူက ကိုယ်တိုင် စစ်ဆေးအတည်ပြုရန် စောင့်ဆိုင်းနေပါသည်။
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          စောင့်ဆိုင်းနေစဉ် အောက်ပါလင့်ခ်မှ သင့်ပရိုဖိုင်ကို ဝင်ရောက်ကြည့်ရှုပြီး အချက်အလက်များကို ပြင်ဆင်နိုင်ပါသည်။
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            ပရိုဖိုင် ဝင်ရောက်ရန်
          </a>
        </div>
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="color: #374151; font-size: 14px; margin: 0;">
            <strong>မှတ်ချက်:</strong> ဤလင့်ခ်ကို သိမ်းဆည်းထားပါ။ သင့်ပရိုဖိုင်သို့ ဝင်ရောက်ရန် ဤလင့်ခ် လိုအပ်ပါသည်။
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          ဤသည်မှာ FairShare မှ အလိုအလျောက် ပေးပို့သော စာဖြစ်ပါသည်။ ကျေးဇူးပြု၍ ဤအီးမေးလ်ကို ပြန်မဖြေပါနှင့်။
        </p>
      </div>
    `,
  });
}

/**
 * Sends an approval email to the shelter owner with a profile link.
 */
export async function sendApprovalEmail(to, hostelName, note, shelterId) {
  const transporter = getTransporter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const profileUrl = `${baseUrl}/shelter/${shelterId}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `သင့်ခိုလှုံရာအိမ် "${hostelName}" အတည်ပြုပြီးပါပြီ - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">မှတ်ပုံတင်ခြင်း အတည်ပြုပြီးပါပြီ</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          ဂုဏ်ယူပါသည်! သင့်ခိုလှုံရာအိမ် <strong>${hostelName}</strong> ကို ကျွန်ုပ်တို့၏ 
          စီမံခန့်ခွဲသူအဖွဲ့က စစ်ဆေးပြီး <strong style="color: #16a34a;">အတည်ပြုပြီး</strong> ဖြစ်ပါသည်။
        </p>
        ${
          note
            ? `<div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #374151; font-size: 14px; margin: 0;"><strong>စီမံခန့်ခွဲသူ မှတ်ချက်:</strong> ${note}</p>
              </div>`
            : ""
        }
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          သင့်ခိုလှုံရာအိမ်သည် ယခု FairShare တွင် စာရင်းသွင်းပြီးဖြစ်ပါသည်။ အောက်ပါလင့်ခ်မှ သင့်ပရိုဖိုင်ကို ဝင်ရောက်ကြည့်ရှုပြီး စီမံခန့်ခွဲနိုင်ပါသည်။
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${profileUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            ပရိုဖိုင် ဝင်ရောက်ရန်
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          ဤသည်မှာ FairShare မှ အလိုအလျောက် ပေးပို့သော စာဖြစ်ပါသည်။ ကျေးဇူးပြု၍ ဤအီးမေးလ်ကို ပြန်မဖြေပါနှင့်။
        </p>
      </div>
    `,
  });
}

/**
 * Sends a rejection email to the shelter owner.
 */
export async function sendRejectionEmail(to, hostelName, note) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `သင့်ခိုလှုံရာအိမ် "${hostelName}" မှတ်ပုံတင်ခြင်း အကြောင်းကြားစာ - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">မှတ်ပုံတင်ခြင်း အတည်မပြုပါ</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          ဝမ်းနည်းစွာ အသိပေးအပ်ပါသည်။ သင့်ခိုလှုံရာအိမ် <strong>${hostelName}</strong> မှတ်ပုံတင်ခြင်းကို 
          ကျွန်ုပ်တို့၏ စီမံခန့်ခွဲသူအဖွဲ့က စစ်ဆေးပြီးနောက် <strong style="color: #dc2626;">အတည်မပြုပါ</strong>။
        </p>
        ${
          note
            ? `<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #374151; font-size: 14px; margin: 0;"><strong>အကြောင်းပြချက်:</strong> ${note}</p>
              </div>`
            : ""
        }
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          မှတ်ပုံတင်ခြင်း စာမျက်နှာသို့ သွား၍ အပ်ဒိတ်လုပ်ထားသော စာရွက်စာတမ်းများဖြင့် ထပ်မံတင်သွင်းနိုင်ပါသည်။
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          ဤသည်မှာ FairShare မှ အလိုအလျောက် ပေးပို့သော စာဖြစ်ပါသည်။ ကျေးဇူးပြု၍ ဤအီးမေးလ်ကို ပြန်မဖြေပါနှင့်။
        </p>
      </div>
    `,
  });
}

/**
 * Sends email when admin approves a donation.
 * @param {string} summary – human-readable description, e.g. "10,000 MMK" or "ဆေးသေတ္တာ ×2, ပတ်တီး ×5"
 */
export async function sendDonationApprovedEmail(to, donorName, summary, certificateUrl) {
  const transporter = getTransporter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `သင့်အလှူ အတည်ပြုပြီးပါပြီ - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">အလှူ အတည်ပြုပြီးပါပြီ</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          ကျေးဇူးတင်ပါသည်! ${donorName || "အလှူရှင်"} မှ လှူဒါန်းထားသော <strong>${summary}</strong> ကို 
          စီမံခန့်ခွဲသူက စစ်ဆေးပြီး <strong style="color: #16a34a;">အတည်ပြုပြီး</strong> ဖြစ်ပါသည်။
        </p>
        ${
          certificateUrl
            ? `<p style="color: #374151; font-size: 15px; line-height: 1.6;">သင့်အလှူ လက်မှတ်ကို အောက်ပါလင့်ခ်မှ ဒေါင်းလုဒ်လုပ်နိုင်ပါသည်။</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${certificateUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">လက်မှတ် ကြည့်ရန်</a>
        </div>`
            : ""
        }
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          အကောင့်ရှိပါက <a href="${baseUrl}/donor">ပရိုဖိုင်</a> မှ အလှူ မှတ်တမ်းနှင့် လက်မှတ်များကို ကြည့်ရှုနိုင်ပါသည်။
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">ဤသည်မှာ FairShare မှ အလိုအလျောက် ပေးပို့သော စာဖြစ်ပါသည်။</p>
      </div>
    `,
  });
}

/**
 * Sends email when admin rejects a donation.
 * @param {string} summary – human-readable description
 */
export async function sendDonationRejectedEmail(to, donorName, summary, note) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `သင့်အလှူ အကြောင်းကြားစာ - FairShare`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">အလှူ အတည်မပြုပါ</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          ဝမ်းနည်းစွာ အသိပေးအပ်ပါသည်။ ${donorName || "သင်"} မှ လှူဒါန်းထားသော <strong>${summary}</strong> 
          ကို စီမံခန့်ခွဲသူက စစ်ဆေးပြီးနောက် <strong style="color: #dc2626;">အတည်မပြုပါ</strong>။
        </p>
        ${
          note
            ? `<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="color: #374151; font-size: 14px; margin: 0;"><strong>အကြောင်းပြချက်:</strong> ${note}</p>
              </div>`
            : ""
        }
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          မေးမြန်းလိုပါက ကျွန်ုပ်တို့ကို ဆက်သွယ်နိုင်ပါသည်။
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">ဤသည်မှာ FairShare မှ အလိုအလျောက် ပေးပို့သော စာဖြစ်ပါသည်။</p>
      </div>
    `,
  });
}
