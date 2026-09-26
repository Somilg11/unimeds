import type { MetadataRoute } from 'next';
import { absoluteUrl, PRIVATE_SECTIONS } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Rules are prefix matches, so "/doctor" alone would also block "/doctors".
  // Block each private section exactly ("$") and everything below it ("/").
  const disallow = PRIVATE_SECTIONS.flatMap((p) => [`${p}$`, `${p}/`]).concat('/login/continue');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
