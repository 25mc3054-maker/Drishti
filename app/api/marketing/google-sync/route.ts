import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = (value || '').trim();
    if (normalized) return normalized;
  }
  return '';
}

function normalizeLocationName(rawValue: string) {
  if (!rawValue) return '';
  if (rawValue.includes('/')) return rawValue;
  return `locations/${rawValue}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const openingHours = String(body.openingHours || '').trim();
    const specialOffer = String(body.specialOffer || '').trim();

    const locationName = normalizeLocationName(
      firstNonEmpty(
        process.env.GOOGLE_BUSINESS_LOCATION_NAME,
        process.env.GOOGLE_BUSINESS_LOCATION,
        process.env.GOOGLE_LOCATION_NAME,
        process.env.GOOGLE_LOCATION_ID
      )
    );
    const accessToken = firstNonEmpty(
      process.env.GOOGLE_BUSINESS_ACCESS_TOKEN,
      process.env.GOOGLE_ACCESS_TOKEN,
      process.env.GOOGLE_API_ACCESS_TOKEN
    );

    if (!locationName || !accessToken) {
      return NextResponse.json(
        {
          success: true,
          data: {
            liveSync: false,
            openingHours,
            specialOffer,
          },
          message:
            'Google sync saved in demo mode. Add GOOGLE_BUSINESS_LOCATION_NAME and GOOGLE_BUSINESS_ACCESS_TOKEN in .env.local for live push.',
        },
        { status: 200 }
      );
    }

    const results: Record<string, any> = {};

    if (openingHours) {
      const profileResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            description: `Opening Hours: ${openingHours}`,
          },
        }),
      });

      const profileJson = await profileResponse.json();
      if (!profileResponse.ok) {
        return NextResponse.json({ success: false, error: profileJson?.error?.message || 'Failed to update opening hours' }, { status: 500 });
      }
      results.profileUpdate = profileJson;
    }

    if (specialOffer) {
      const postResponse = await fetch(`https://mybusiness.googleapis.com/v4/${locationName}/localPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageCode: 'en-IN',
          summary: specialOffer,
          topicType: 'STANDARD',
          callToAction: {
            actionType: 'LEARN_MORE',
            url: process.env.GOOGLE_BUSINESS_CTA_URL || 'https://maps.google.com',
          },
        }),
      });

      const postJson = await postResponse.json();
      if (!postResponse.ok) {
        return NextResponse.json({ success: false, error: postJson?.error?.message || 'Failed to create special offer post' }, { status: 500 });
      }
      results.offerPost = postJson;
    }

    return NextResponse.json({ success: true, data: { ...results, liveSync: true }, message: 'Google Business sync completed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Google sync failed' }, { status: 500 });
  }
}
