import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET (or AUTH_SECRET) must be set and at least 32 characters long');
  }
  return secret;
}

export const env = {
  isProd,
  port: Number(process.env.PORT) || 8080,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: jwtSecret(),
  jwtTtl: process.env.JWT_TTL || '7d',
  // Shared secret between the Next.js server and this API. Required for the
  // Google identity exchange, which must never be callable from a browser.
  internalApiKey: required('INTERNAL_API_KEY'),
  appUrl: (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || process.env.APP_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'Unimeds <no-reply@unimeds.app>',
  },
};
