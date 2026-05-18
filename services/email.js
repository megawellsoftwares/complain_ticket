import nodemailer from "nodemailer";
import crypto from "crypto";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

/**
 * @param {{ email: string; userName: string; password: string; role: string; anyDesk?: string }} params
 */
export async function sendAccountCredentials({ email, userName, password, role, anyDesk }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const body = [
    `Hello ${userName},`,
    "",
    "An account has been created for you on ashki.",
    "",
    `Email: ${email}`,
    `Password: ${password}`,
    `Role: ${role}`,
    anyDesk ? `AnyDesk ID: ${anyDesk}` : null,
    "",
    "Please sign in and change your password after your first login.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!transporter || !from) {
    console.warn("[email] SMTP not configured — credentials not sent to", email);
    return { sent: false, reason: "smtp_not_configured" };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your ashki account credentials",
    text: body,
  });

  return { sent: true };
}
