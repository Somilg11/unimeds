/** Canonical public origin, used for metadata, sitemap and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

export const SITE_NAME = 'Unimeds';

export const SITE_DESCRIPTION =
  'Find doctors near you, see their real open times and book appointments online. Keep prescriptions and lab reports in one private place. Clinics run bookings, schedules and records on Unimeds.';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Signed-in / one-time areas that must never be indexed. */
export const PRIVATE_SECTIONS = ['/patient', '/doctor', '/clinic', '/admin', '/invite', '/reset-password', '/api'];
