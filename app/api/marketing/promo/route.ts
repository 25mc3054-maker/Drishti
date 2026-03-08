import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export const dynamic = 'force-dynamic';

type PromoPayload = {
  shopName: string;
  area: string;
  productName: string;
  productDescription?: string;
  specialOffer?: string;
  openingHours?: string;
};

type PosterPalette = {
  bgStart: string;
  bgEnd: string;
  glow: string;
  accent: string;
  accentSoft: string;
  textMain: string;
  textSub: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function clampText(input: string, maxLength: number) {
  const normalized = input.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function splitLines(text: string, maxCharsPerLine: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && words.length > 0) {
    const joined = lines.join(' ');
    if (joined.length < text.length) {
      lines[maxLines - 1] = clampText(lines[maxLines - 1], Math.max(4, maxCharsPerLine - 1));
    }
  }

  return lines;
}

function pickPalette(seedSource: string): PosterPalette {
  const palettes: PosterPalette[] = [
    {
      bgStart: '#061E4B',
      bgEnd: '#0D57C6',
      glow: '#2DA8FF',
      accent: '#38B6FF',
      accentSoft: '#BDE6FF',
      textMain: '#FFFFFF',
      textSub: '#D7EBFF',
    },
    {
      bgStart: '#1F1248',
      bgEnd: '#6A2FD2',
      glow: '#8F6BFF',
      accent: '#A37BFF',
      accentSoft: '#E6DDFF',
      textMain: '#FFFFFF',
      textSub: '#EAE3FF',
    },
    {
      bgStart: '#0A3B2E',
      bgEnd: '#0E8A69',
      glow: '#40D6A7',
      accent: '#53D9B0',
      accentSoft: '#D6FFF2',
      textMain: '#FFFFFF',
      textSub: '#D8FFF2',
    },
    {
      bgStart: '#4A1E0C',
      bgEnd: '#DB641F',
      glow: '#FF9A3D',
      accent: '#FFB15D',
      accentSoft: '#FFE7CF',
      textMain: '#FFFFFF',
      textSub: '#FFEBD9',
    },
  ];

  const hash = Array.from(seedSource).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function buildPremiumSvgPoster(payload: PromoPayload) {
  const palette = pickPalette(`${payload.productName}-${payload.shopName}-${payload.area}`);
  const productTitle = titleCase(clampText(payload.productName || 'Fresh Stock', 42));
  const offerText = clampText(payload.specialOffer || 'Fresh stock available at best price. Visit today!', 70);
  const descriptionText = clampText(payload.productDescription || `${productTitle} now available at your trusted local shop.`, 78);
  const shopLine = clampText(`${payload.shopName} • ${payload.area}`, 52);
  const hoursLine = clampText(`Open: ${payload.openingHours || '9:00 AM - 9:00 PM'}`, 40);
  const headlineLines = splitLines(productTitle, 14, 2);

  const headlineSvg = headlineLines
    .map((line, index) => `<text x='90' y='${310 + index * 92}' fill='${palette.textMain}' font-family='Poppins, Inter, Arial' font-size='84' font-weight='800' letter-spacing='-1.2'>${escapeXml(line)}</text>`)
    .join('');

  const gradientId = 'posterGradient';
  const glowId = 'posterGlow';

  return `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024' viewBox='0 0 1024 1024'>
    <defs>
      <linearGradient id='${gradientId}' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${palette.bgStart}'/>
        <stop offset='100%' stop-color='${palette.bgEnd}'/>
      </linearGradient>
      <radialGradient id='${glowId}' cx='70%' cy='18%' r='62%'>
        <stop offset='0%' stop-color='${palette.glow}' stop-opacity='0.58'/>
        <stop offset='100%' stop-color='${palette.glow}' stop-opacity='0'/>
      </radialGradient>
      <filter id='softShadow' x='-20%' y='-20%' width='140%' height='160%'>
        <feDropShadow dx='0' dy='14' stdDeviation='20' flood-color='#000000' flood-opacity='0.28'/>
      </filter>
    </defs>

    <rect width='1024' height='1024' fill='url(#${gradientId})'/>
    <rect width='1024' height='1024' fill='url(#${glowId})'/>

    <circle cx='904' cy='126' r='190' fill='${palette.accent}' fill-opacity='0.18'/>
    <circle cx='808' cy='112' r='88' fill='${palette.accent}' fill-opacity='0.22'/>
    <circle cx='124' cy='920' r='130' fill='${palette.accentSoft}' fill-opacity='0.16'/>

    <rect x='76' y='70' width='872' height='884' rx='44' fill='#FFFFFF' fill-opacity='0.06' stroke='#FFFFFF' stroke-opacity='0.18'/>

    <rect x='88' y='110' width='262' height='58' rx='29' fill='${palette.accent}' fill-opacity='0.26' stroke='${palette.accentSoft}' stroke-opacity='0.6'/>
    <text x='219' y='147' text-anchor='middle' fill='${palette.textMain}' font-family='Inter, Arial' font-size='24' font-weight='700' letter-spacing='1.2'>LIMITED OFFER</text>

    ${headlineSvg}

    <rect x='90' y='522' width='844' height='150' rx='30' fill='#FFFFFF' fill-opacity='0.1' stroke='#FFFFFF' stroke-opacity='0.18'/>
    <text x='128' y='576' fill='${palette.textSub}' font-family='Inter, Arial' font-size='34' font-weight='600'>Now available at ${escapeXml(payload.shopName)}</text>
    <text x='128' y='620' fill='${palette.textSub}' font-family='Inter, Arial' font-size='26'>${escapeXml(shopLine)}</text>

    <text x='92' y='724' fill='${palette.textSub}' font-family='Inter, Arial' font-size='30' font-weight='500'>${escapeXml(descriptionText)}</text>
    <text x='92' y='768' fill='${palette.textSub}' font-family='Inter, Arial' font-size='30' font-weight='500'>${escapeXml(offerText)}</text>

    <rect x='92' y='834' width='840' height='92' rx='24' fill='${palette.accent}' filter='url(#softShadow)'/>
    <text x='512' y='892' text-anchor='middle' fill='${palette.textMain}' font-family='Inter, Arial' font-size='44' font-weight='800'>Visit Today</text>

    <text x='512' y='965' text-anchor='middle' fill='${palette.textSub}' font-family='Inter, Arial' font-size='24' letter-spacing='0.6'>${escapeXml(hoursLine)}</text>
  </svg>`;
}

function fallbackCaption(input: PromoPayload) {
  return `${input.productName} now at ${input.shopName}, ${input.area}! ${input.specialOffer || 'Fresh stock at best price.'} Visit today.`;
}

async function generateCaptionWithClaude(payload: PromoPayload): Promise<string> {
  const region = process.env.AWS_REGION;
  const modelId = process.env.BEDROCK_MARKETING_MODEL_ID || process.env.BEDROCK_MODEL_ID_PRIMARY || 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  if (!region) {
    return fallbackCaption(payload);
  }

  try {
    const client = new BedrockRuntimeClient({ region });
    const prompt = `Write one short high-converting promo caption for a local Indian shopkeeper.
Rules:
- Max 25 words
- Friendly, local and trustworthy tone
- Mention shop name and area
- Mention product
  - Include one concrete value cue (freshness, price, quality, or availability)
- Add a clear call to visit today
  - No emojis, no hashtags, no quotes
Input:
Shop: ${payload.shopName}
Area: ${payload.area}
Product: ${payload.productName}
Details: ${payload.productDescription || 'Fresh stock available'}
  Offer: ${payload.specialOffer || 'Best local deal today'}
Return only caption text.`;

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 120,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ],
      }),
    });

    const response = await client.send(command);
    const json = JSON.parse(new TextDecoder().decode(response.body));
    const text = json?.content?.[0]?.text?.trim();
    return text || fallbackCaption(payload);
  } catch {
    return fallbackCaption(payload);
  }
}

async function generatePosterWithStability(payload: PromoPayload): Promise<string> {
  const apiKey = process.env.STABILITY_API_KEY;
  const fallbackSvgDataUrl = `data:image/svg+xml;base64,${Buffer.from(buildPremiumSvgPoster(payload)).toString('base64')}`;

  if (!apiKey) {
    return fallbackSvgDataUrl;
  }

  const formData = new FormData();
  formData.append(
    'prompt',
    `Premium social media marketing poster for ${payload.productName}. 
Indian neighborhood retail campaign for ${payload.shopName} in ${payload.area}. 
Design direction: cinematic advertising look, elegant gradient background, eye-catching hero product focus, clean premium layout, high visual contrast, polished brand design, professional commercial quality, modern typography-safe composition, crisp details, studio lighting, luxury retail vibe. 
Include visual cues for: ${payload.productDescription || 'fresh stock and quality assurance'}.`
  );
  formData.append('negative_prompt', 'low quality, blurry, pixelated, plain text-only poster, cluttered layout, watermark, logo artifacts, distorted letters, bad anatomy, dull colors');
  formData.append('output_format', 'png');
  formData.append('aspect_ratio', '1:1');

  try {
    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      return fallbackSvgDataUrl;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return fallbackSvgDataUrl;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload: PromoPayload = {
      shopName: (body.shopName || '').trim(),
      area: (body.area || 'RGIPT area').trim(),
      productName: (body.productName || '').trim(),
      productDescription: (body.productDescription || '').trim(),
      specialOffer: (body.specialOffer || '').trim(),
      openingHours: (body.openingHours || '').trim(),
    };

    if (!payload.shopName || !payload.productName) {
      return NextResponse.json({ success: false, error: 'shopName and productName are required' }, { status: 400 });
    }

    const [caption, posterDataUrl] = await Promise.all([
      generateCaptionWithClaude(payload),
      generatePosterWithStability(payload),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        caption,
        posterDataUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate promo' }, { status: 500 });
  }
}
