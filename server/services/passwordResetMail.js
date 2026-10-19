import { createTransport } from "nodemailer";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

export async function sendPasswordResetMail(email, name, resetUrl) {
  const subject = "Reset your VidyaSetu password";
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#222">
    <h1 style="color:#6653cc">VidyaSetu</h1>
    <p>Hi ${escapeHtml(name)},</p>
    <p>We received a request to reset your password. This link expires in 15 minutes and works only once.</p>
    <p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#6653cc;color:white;padding:12px 22px;border-radius:8px;text-decoration:none">Reset password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    </div>`;
  if (process.env.RESEND_API_KEY) {
    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) throw new Error("RESEND_FROM_EMAIL is required with RESEND_API_KEY");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject, html }),
    });
    if (!response.ok) throw new Error(`Password reset email provider failed (${response.status})`);
    return;
  }
  if (!process.env.Gmail || !process.env.Password) throw new Error("Email provider is not configured");
  const transport = createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: process.env.Gmail, pass: process.env.Password } });
  await transport.sendMail({ from: process.env.Gmail, to: email, subject, html });
}
