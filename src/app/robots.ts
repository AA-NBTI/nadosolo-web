import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isTablebaroHost } from '@/modules/tenancy';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get('host');
  const isTablebaro = isTablebaroHost(host);
  const siteUrl = isTablebaro
    ? `https://${(host || 'tablebaro.com').split(':')[0]}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://nadosolo.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: isTablebaro
          ? ['/', '/reserve', '/reserve/my', '/reserve/affiliate', '/biz']
          : ['/', '/meetup', '/dining', '/showcase', '/checklist', '/solotest'],
        disallow: ['/admin', '/api/', '/dashboard'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
