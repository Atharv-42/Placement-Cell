const nodemailer = require("nodemailer");

const normalizeList = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  console.log("SMTP Config:", {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS: !!SMTP_PASS,
  });

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP email settings are incomplete. Please check Render environment variables."
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    family: 4, // Force IPv4
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

exports.sendVerificationEmail = async ({
  to,
  name,
  verificationUrl,
}) => {
  const transporter = createTransporter();

  const { MAIL_FROM, SMTP_USER } = process.env;

  const safeName = escapeHtml(name);
  const safeVerificationUrl = escapeHtml(verificationUrl);

  console.log(`Sending verification email to: ${to}`);

  const info = await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: "Verify your Placement Cell Portal email",
    text: `Hi ${name},

Please verify your email by opening this link:

${verificationUrl}

This link expires in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>Verify your Email</h2>

        <p>Hi ${safeName},</p>

        <p>
          Please verify your email address to activate your Placement Cell Portal account.
        </p>

        <p>
          <a
            href="${safeVerificationUrl}"
            style="
              display:inline-block;
              padding:12px 18px;
              background:#0f766e;
              color:#ffffff;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });

  const accepted = normalizeList(info.accepted);
  const rejected = normalizeList(info.rejected);
  const pending = normalizeList(info.pending);

  if (rejected.length > 0 || accepted.length === 0) {
    throw new Error(
      `Verification email was not accepted by SMTP. Accepted: ${
        accepted.join(", ") || "none"
      }. Rejected: ${rejected.join(", ") || "none"}.`
    );
  }

  console.log(
    `Verification email accepted by SMTP for ${accepted.join(
      ", "
    )}. Message ID: ${info.messageId}`
  );

  return {
    delivered: true,
    accepted,
    rejected,
    pending,
    messageId: info.messageId,
  };
};
