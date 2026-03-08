import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Deprecated endpoint. Use /api/vision for AWS analyzer pipeline.',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({
    status: 'deprecated',
    service: 'Backup Vision API',
    message: 'Use /api/vision',
  });
}
