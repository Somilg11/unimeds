import nodemailer from 'nodemailer';
import { env } from '../lib/env.js';

const transporter =
  env.smtp.host && env.smtp.user
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      })
    : null;

export const mailEnabled = Boolean(transporter);

type Mail = { to: string; subject: string; heading: string; body: string; cta?: { label: string; url: string } };

function render({ heading, body, cta }: Mail): string {
  const button = cta
    ? `<p style="margin:32px 0"><a href="${cta.url}" style="background:#0f2a2e;color:#f5efe4;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">${cta.label}</a></p>
       <p style="font-size:12px;color:#6b7280">Or paste this link into your browser:<br>${cta.url}</p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f5efe4;font-family:Helvetica,Arial,sans-serif;color:#0f2a2e">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;padding:40px">
    <p style="letter-spacing:.2em;font-size:11px;text-transform:uppercase;color:#8a6d3b;margin:0 0 24px">Unimeds</p>
    <h1 style="font-size:24px;margin:0 0 16px">${heading}</h1>
    <div style="font-size:15px;line-height:1.6;color:#374151">${body}</div>
    ${button}
  </div></body></html>`;
}

/**
 * Sends a transactional email. Returns false when SMTP is not configured or
 * delivery fails, so callers can fall back to surfacing the link in-app.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!transporter) {
    console.info(`[mail disabled] to=${mail.to} subject="${mail.subject}"${mail.cta ? ` link=${mail.cta.url}` : ''}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to: mail.to, subject: mail.subject, html: render(mail) });
    return true;
  } catch (err) {
    console.error('[mail] delivery failed', err);
    return false;
  }
}
