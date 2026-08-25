import type { Metadata } from 'next';

type Props = {
  params: { shopId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shopId = params.shopId || 'Store';
  const formattedName = shopId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com';
  const pageUrl = `${siteUrl}/customer-shop/${shopId}`;

  return {
    title: `${formattedName} | Online Customer Storefront`,
    description: `Shop online at ${formattedName}. Browse products, view prices and stock, place online orders with instant digital confirmations. Powered by EasyTrader.`,
    keywords: [
      formattedName,
      'Online Storefront',
      'Kirana Online Shop',
      'Buy Local Online',
      'EasyTrader Storefront',
    ],
    openGraph: {
      title: `${formattedName} | Online Customer Storefront`,
      description: `Shop online at ${formattedName}. Browse products, check stock, and place orders online.`,
      url: pageUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${formattedName} | Online Customer Storefront`,
      description: `Shop online at ${formattedName}. Browse products, check stock, and place orders online.`,
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default function CustomerShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
