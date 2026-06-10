const nodemailer = require("nodemailer");

const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  console.log({
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS: !!SMTP_PASS,
  });

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const hasSmtpConfig = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;
const missingSmtpSettings = [
  ["SMTP_HOST", SMTP_HOST],
  ["SMTP_PORT", SMTP_PORT],
  ["SMTP_USER", SMTP_USER],
  ["SMTP_PASS", SMTP_PASS]
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

const createTransporter = () => {
  if (!hasSmtpConfig) {
    throw new Error(`SMTP email settings are incomplete. Missing: ${missingSmtpSettings.join(", ")}.`);
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

const normalizeList = (value) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

exports.sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const transporter = createTransporter();
  const safeName = escapeHtml(name);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  const info = await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: "Verify your Placement Cell Portal email",
    text: `Hi ${name},\n\nPlease verify your email by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>Verify your email</h2>
        <p>Hi ${safeName},</p>
        <p>Please verify your email address to activate your Placement Cell Portal account.</p>
        <p>
          <a href="${safeVerificationUrl}" style="display: inline-block; padding: 12px 18px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Verify email
          </a>
        </p>
        <p>This link expires in 24 hours.</p>
      </div>
    `
  });

  const accepted = normalizeList(info.accepted);
  const rejected = normalizeList(info.rejected);
  const pending = normalizeList(info.pending);

  if (rejected.length > 0 || accepted.length === 0) {
    throw new Error(
      `Verification email was not accepted by SMTP. Accepted: ${accepted.join(", ") || "none"}. Rejected: ${rejected.join(", ") || "none"}.`
    );
  }

  console.log(
    `Verification email accepted by SMTP for ${accepted.join(", ")}. Message ID: ${info.messageId || "not provided"}${pending.length ? `. Pending: ${pending.join(", ")}` : ""}`
  );

  return {
    delivered: true,
    accepted,
    rejected,
    pending,
    messageId: info.messageId
  };
};
