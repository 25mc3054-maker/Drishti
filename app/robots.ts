import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/storefront', '/customer-shop/'],
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
