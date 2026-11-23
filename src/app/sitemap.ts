import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isTablebaroHost } from '@/modules/tenancy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get('host');
  const isTablebaro = isTablebaroHost(host);
  const now = new Date();

  if (isTablebaro) {
    const siteUrl = 'https://tablebaro.com';
    return [
      { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
      { url: `${siteUrl}/reserve`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
      { url: `${siteUrl}/reserve/my`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
      { url: `${siteUrl}/reserve/affiliate`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
      { url: `${siteUrl}/biz`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
      { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ];
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadosolo.com';
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/meetup`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/dining`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/showcase`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/checklist`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/solotest`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/biz`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
