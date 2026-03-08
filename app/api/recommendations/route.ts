import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, DetectLabelsCommand, DetectTextCommand } from '@aws-sdk/client-rekognition';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Minimal JSON repair utilities (copied/trimmed from vision route)
function repairJsonText(input: string): string {
  let s = input.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '\n');
  s = s.replace(/,\s*(?=[}\]])/g, '');
  return s;
}

function extractBalancedJson(text: string): string | null {
  const n = text.length;
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (ch === '"' && !escape) { inString = !inString; escape = false; continue; }
    if (ch === '\\' && !escape) { escape = true; continue; }
    if (!inString) {
      if (ch === '{') { if (start === -1) start = i; depth++; }
      else if (ch === '}') { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
    }
    if (escape && ch !== '\\') escape = false;
  }
  return null;
}

function tryParseWithRepairs(text: string): any {
  try { return JSON.parse(text); } catch (e) {}
  const extracted = extractBalancedJson(text);
  if (extracted) {
    try { return JSON.parse(extracted); } catch (e) {}
    const repaired = repairJsonText(extracted);
    try { return JSON.parse(repaired); } catch (e) {}
  }
  try { return JSON.parse(repairJsonText(text)); } catch (e) { throw new Error('Failed to parse JSON output'); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body may contain: items: [{id,name,price,qty}], or imageBase64: string
    const awsRegion = process.env.AWS_REGION || 'eu-north-1';
    const bedrockRegion = process.env.AWS_BEDROCK_REGION || 'us-east-1';
    const hasStaticCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const awsConfig = {
      region: awsRegion,
      ...(hasStaticCredentials
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            },
          }
        : {}),
    };
    const rekClient = new RekognitionClient(awsConfig);

    let items = body.items || [];
    // If image provided, run Rekognition to extract labels/text
    if (!items.length && body.imageBase64) {
      const buffer = Buffer.from(body.imageBase64, 'base64');
      const labelsResp = await rekClient.send(new DetectLabelsCommand({ Image: { Bytes: buffer }, MaxLabels: 25, MinConfidence: 50 }));
      const labels = (labelsResp.Labels || []).map((l: any) => ({ name: l.Name, confidence: l.Confidence }));
      const textResp = await rekClient.send(new DetectTextCommand({ Image: { Bytes: buffer } }));
      const texts = (textResp?.TextDetections || []).filter((t: any) => t.Type === 'LINE').map((t: any) => t.DetectedText);

      // Convert labels into provisional items with heuristics
      items = labels.map((l: any, idx: number) => ({ id: `det-${idx}`, name: l.name || l.Name || 'item', price: Math.round((l.Confidence || 60) / 100 * 200), qty: 10 }));
      // attach detected text as meta
      body._detectedText = texts;
    }

    // Prepare the prompt for Bedrock or fallback
    const promptPayload = {
      instruction: `You are a retail optimization assistant. Given this items list, suggest an optimized shelf placement plan that maximizes visibility and conversion. Output ONLY valid JSON with keys: placements (array of {id,name,position,probability}), actionPlan (immediate, shortTerm, longTerm arrays), dashboardHtml (string).`,
      items,
      extra: { detectedText: body._detectedText || [] }
    };

    const bedrockModelId = process.env.BEDROCK_MODEL_ID_PRIMARY || process.env.BEDROCK_MODEL_ID;

    if (bedrockModelId) {
      // Call Amazon Bedrock
      const bedrock = new BedrockRuntimeClient({ ...awsConfig, region: bedrockRegion });
      const prompt = `${promptPayload.instruction}\n\nInput JSON:\n${JSON.stringify({ items: promptPayload.items, extra: promptPayload.extra })}`;
      const invocation = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1200,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });
      const cmd = new InvokeModelCommand({
        body: invocation,
        modelId: bedrockModelId,
        contentType: 'application/json',
        accept: 'application/json',
      });
      let resp: any;
      try {
        resp = await bedrock.send(cmd);
      } catch (err: any) {
        console.error('Bedrock invocation error:', err?.message || err);
        return NextResponse.json({ success: false, error: 'Bedrock invocation failed', details: err?.toString() }, { status: 500 });
      }

      const rawResponse = resp?.body ? Buffer.from(await resp.body.transformToByteArray()).toString('utf8') : '';
      let asText = rawResponse;
      try {
        const parsedEnvelope = JSON.parse(rawResponse);
        asText = parsedEnvelope?.content?.[0]?.text || rawResponse;
      } catch {
        asText = rawResponse;
      }
      let parsed: any;
      try { parsed = tryParseWithRepairs(asText); } catch (e) { return NextResponse.json({ success: false, error: 'Failed parsing Bedrock output', raw: asText }, { status: 500 }); }
      return NextResponse.json({ success: true, source: 'bedrock', data: parsed });
    }

    // Fallback heuristics (no Bedrock configured) — produce a plausible recommendation
    const placements = items.map((it: any, idx: number) => {
      const price = Number(it.price || 0);
      const qty = Number(it.qty || 0);
      const score = Math.min(95, Math.round((price / 200) * 50 + Math.min(qty, 20) * 2));
      const position = score > 60 ? 'eye-level' : (score > 40 ? 'mid-shelf' : 'lower-shelf');
      return { id: it.id || `i${idx}`, name: it.name || it.name, position, probability: Math.round(score) };
    });

    const actionPlan = {
      immediate: ['Group top-selling items at eye level', 'Label shelves with clear price tags'],
      shortTerm: ['Optimize layout by category', 'Run 2-week price experiment on top 5 items'],
      longTerm: ['Integrate online billing and inventory sync', 'Monitor sales and iterate layout monthly']
    };

    const dashboardHtml = `<html><body><h1>Placement Recommendations</h1><ul>${placements.map((p:any)=>`<li>${p.name}: ${p.position} (${p.probability}%)</li>`).join('')}</ul></body></html>`;

    const result = { placements, actionPlan, dashboardHtml };
    return NextResponse.json({ success: true, source: 'heuristic', data: result });
  } catch (error: any) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
