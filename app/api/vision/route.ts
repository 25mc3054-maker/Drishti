// Ensure this API route is treated as dynamic so static export won't try to include it
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiAnalysisResult } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Gemini API
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash-001',
];

const FALLBACK_MODEL = 'gemini-2.5-flash';

let cachedModels: string[] | null = null;
let cachedAt = 0;
let lastResolvedModel = 'unknown';

const DEFAULT_RESULT: GeminiAnalysisResult = {
  problem: {
    title: 'Unspecified problem',
    description: 'No description provided by the model.',
    severity: 'medium',
    category: 'general',
    impactAreas: [],
  },
  optimization: {
    strategy: 'No strategy provided.',
    mathematicalModel: {
      objective: '',
      constraints: [],
      variables: {},
      equations: [],
    },
    expectedImpact: [],
    timeline: 'TBD',
  },
  implementation: {
    architecture: {
      frontend: [],
      backend: [],
      database: [],
      apis: [],
    },
    codeStructure: [],
    dashboard: {
      widgets: [],
      layout: 'TBD',
    },
  },
  metadata: {
    confidence: 50,
    processingTime: 0,
    imageAnalysis: {
      objectsDetected: [],
      textExtracted: [],
      sceneDescription: 'Business scenario analysis',
    },
  },
};

function normalizeAnalysisResult(input: any): GeminiAnalysisResult {
  const safe = input && typeof input === 'object' ? input : {};
  const problem = safe.problem ?? {};
  const optimization = safe.optimization ?? {};
  const mathematicalModel = optimization.mathematicalModel ?? {};
  const implementation = safe.implementation ?? {};
  const architecture = implementation.architecture ?? {};
  const dashboard = implementation.dashboard ?? {};
  const metadata = safe.metadata ?? {};
  const imageAnalysis = metadata.imageAnalysis ?? {};
  const actionPlan = safe.actionPlan ?? {};
  const generatedDashboard = safe.generatedDashboard ?? {};

  return {
    problem: {
      title: problem.title || DEFAULT_RESULT.problem.title,
      description: problem.description || DEFAULT_RESULT.problem.description,
      severity: problem.severity || DEFAULT_RESULT.problem.severity,
      category: problem.category || DEFAULT_RESULT.problem.category,
      impactAreas: Array.isArray(problem.impactAreas) ? problem.impactAreas : [],
      financialImpact: problem.financialImpact || undefined,
    },
    actionPlan: actionPlan.immediate || actionPlan.shortTerm || actionPlan.longTerm ? {
      immediate: Array.isArray(actionPlan.immediate) ? actionPlan.immediate : [],
      shortTerm: Array.isArray(actionPlan.shortTerm) ? actionPlan.shortTerm : [],
      longTerm: Array.isArray(actionPlan.longTerm) ? actionPlan.longTerm : [],
    } : undefined,
    optimization: {
      strategy: optimization.strategy || DEFAULT_RESULT.optimization.strategy,
      mathematicalModel: {
        objective: mathematicalModel.objective || DEFAULT_RESULT.optimization.mathematicalModel.objective,
        constraints: Array.isArray(mathematicalModel.constraints) ? mathematicalModel.constraints : [],
        variables: typeof mathematicalModel.variables === 'object' && mathematicalModel.variables !== null
          ? mathematicalModel.variables
          : {},
        equations: Array.isArray(mathematicalModel.equations) ? mathematicalModel.equations : [],
      },
      expectedImpact: Array.isArray(optimization.expectedImpact) ? optimization.expectedImpact : [],
      timeline: optimization.timeline || DEFAULT_RESULT.optimization.timeline,
      estimatedCost: optimization.estimatedCost || undefined,
    },
    generatedDashboard: generatedDashboard.html ? {
      html: generatedDashboard.html,
      features: Array.isArray(generatedDashboard.features) ? generatedDashboard.features : [],
      howToUse: generatedDashboard.howToUse || 'Download and open the HTML file in your browser.',
    } : undefined,
    implementation: {
      architecture: {
        frontend: Array.isArray(architecture.frontend) ? architecture.frontend : [],
        backend: Array.isArray(architecture.backend) ? architecture.backend : [],
        database: Array.isArray(architecture.database) ? architecture.database : [],
        apis: Array.isArray(architecture.apis) ? architecture.apis : [],
      },
      codeStructure: Array.isArray(implementation.codeStructure) ? implementation.codeStructure : [],
      dashboard: {
        widgets: Array.isArray(dashboard.widgets) ? dashboard.widgets : [],
        layout: dashboard.layout || DEFAULT_RESULT.implementation.dashboard.layout,
      },
    },
    metadata: {
      confidence: Number.isFinite(metadata.confidence) ? metadata.confidence : DEFAULT_RESULT.metadata.confidence,
      processingTime: Number.isFinite(metadata.processingTime) ? metadata.processingTime : DEFAULT_RESULT.metadata.processingTime,
      imageAnalysis: {
        objectsDetected: Array.isArray(imageAnalysis.objectsDetected) ? imageAnalysis.objectsDetected : [],
        textExtracted: Array.isArray(imageAnalysis.textExtracted) ? imageAnalysis.textExtracted : [],
        sceneDescription: imageAnalysis.sceneDescription || DEFAULT_RESULT.metadata.imageAnalysis.sceneDescription,
      },
    },
  };
}

// Attempt to repair malformed JSON returned by the model.
function repairJsonText(input: string): string {
  // remove JS-style block and line comments
  let s = input.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '\n');
  // remove trailing commas before } or ]
  s = s.replace(/,\s*(?=[}\]])/g, '');

  // escape literal newlines that appear inside JSON strings
  let out = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && !escape) {
      inString = !inString;
      out += ch;
      continue;
    }
    if (ch === '\\' && !escape) {
      escape = true;
      out += ch;
      continue;
    }
    if ((ch === '\n' || ch === '\r') && inString) {
      out += '\\n';
      escape = false;
      continue;
    }
    out += ch;
    escape = false;
  }

  return out;
}

// Extract the first balanced JSON object from a text blob by scanning braces
function extractBalancedJson(text: string): string | null {
  const n = text.length;
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (ch === '"' && !escape) {
      inString = !inString;
      escape = false;
      continue;
    }
    if (ch === '\\' && !escape) {
      escape = true;
      continue;
    }
    if (!inString) {
      if (ch === '{') {
        if (start === -1) start = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          return text.slice(start, i + 1);
        }
      }
    }
    if (escape && ch !== '\\') escape = false;
  }

  return null;
}

function tryParseWithRepairs(text: string): any {
  // direct parse
  try { return JSON.parse(text); } catch (e) {}

  // try extract balanced JSON
  const extracted = extractBalancedJson(text);
  if (extracted) {
    try { const p = JSON.parse(extracted); console.warn('Parsed JSON from extracted balanced object'); return p; } catch (e) {}
    const repaired = repairJsonText(extracted);
    try { const p = JSON.parse(repaired); console.warn('Parsed JSON after repairing extracted object'); return p; } catch (e) {}
  }

  // try repairing the raw text
  try {
    const repairedRaw = repairJsonText(text);
    try { const p = JSON.parse(repairedRaw); console.warn('Parsed JSON after repairing raw text'); return p; } catch (e) {}
  } catch (e) {}

  // last resort: try to loosely replace smart quotes and remove lone control chars
  try {
    let s = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    s = s.replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008/g, '');
    const extracted2 = extractBalancedJson(s) || s;
    return JSON.parse(repairJsonText(extracted2));
  } catch (e) {
    // If still failing, try a heuristic: if the text was truncated, append missing braces/quotes
    try {
      const firstBrace = text.indexOf('{');
      if (firstBrace !== -1) {
        let tail = text.slice(firstBrace);
        const openCount = (tail.match(/\{/g) || []).length;
        const closeCount = (tail.match(/\}/g) || []).length;
        const missing = Math.max(0, openCount - closeCount);
        // attempt to close missing braces and close an odd string quote
        let candidate = tail + '}'.repeat(missing);
        const unescapedQuotes = (candidate.match(/(?<!\\)\"/g) || []).length;
        if (unescapedQuotes % 2 === 1) candidate = candidate + '"';
        const repaired = repairJsonText(candidate);
        try { const p = JSON.parse(repaired); console.warn('Parsed JSON after heuristic closing of truncated output'); return p; } catch (e2) {}
      }
    } catch (e2) {
      // fall through to final throw
    }
    console.error('All JSON repair attempts failed');
    throw e;
  }
}

async function fetchAvailableModels(): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    return [];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];

  return models
    .filter((model: any) =>
      Array.isArray(model.supportedGenerationMethods) &&
      model.supportedGenerationMethods.includes('generateContent')
    )
    .map((model: any) => String(model.name || '').replace('models/', ''))
    .filter((name: string) => name.length > 0);
}

function pickModelName(models: string[]): string {
  const filteredModels = models.filter(
    (name) => !/image-generation|embedding|embed|text-embedding|code-embedding/i.test(name)
  );

  const candidates = filteredModels.length > 0 ? filteredModels : models;

  for (const preferred of PREFERRED_MODELS) {
    if (candidates.includes(preferred)) {
      return preferred;
    }
  }

  const visionModel = candidates.find((name) => /vision|multimodal/i.test(name));
  if (visionModel) {
    return visionModel;
  }

  return candidates[0] || 'gemini-1.5-flash';
}

async function resolveModelName(): Promise<string> {
  // For reliability and vision support, use the known working model
  // The model discovery can be flaky and some models don't support vision properly
  lastResolvedModel = FALLBACK_MODEL;
  return FALLBACK_MODEL;
  
  /* Model discovery logic (disabled for now to ensure reliability)
  try {
    const now = Date.now();
    
    if (!cachedModels || now - cachedAt > MODEL_CACHE_TTL_MS) {
      try {
        const models = await fetchAvailableModels();
        cachedModels = models;
        cachedAt = now;
      } catch (err) {
        console.warn('Failed to fetch models, using fallback:', err);
        lastResolvedModel = FALLBACK_MODEL;
        return FALLBACK_MODEL;
      }
    }
    
    if (cachedModels && cachedModels.length > 0) {
      lastResolvedModel = pickModelName(cachedModels);
    } else {
      lastResolvedModel = FALLBACK_MODEL;
    }
    
    return lastResolvedModel;
  } catch (error) {
    console.warn('Model resolution error, using fallback:', error);
    lastResolvedModel = FALLBACK_MODEL;
    return FALLBACK_MODEL;
  }
  */
}

const EXPERT_SYSTEM_PROMPT = `You are a Business Transformation AI. Analyze this business image and CREATE a complete, working solution.

CRITICAL: Generate ACTUAL WORKING CODE that the business owner can use immediately.

CRITICAL FORMAT RULES: When generating JSON, DO NOT include raw newline or carriage-return characters inside string values — represent any newline as the two-character sequence \\n. Do not include comments or trailing commas. Output ONLY valid JSON.

Your output MUST include:
1. Problem analysis
2. Step-by-step action plan a business owner can follow TODAY
3. COMPLETE HTML dashboard code they can open in a browser RIGHT NOW

Respond with ONLY valid JSON (no markdown, no code blocks):

{
  "problem": {
    "title": "Clear problem from the image",
    "description": "What's wrong and why it costs money/time",
    "severity": "high",
    "category": "inventory",
    "impactAreas": ["specific business areas"],
    "financialImpact": "Estimated monthly loss: ₹X,XXX due to inefficiency"
  },
  "actionPlan": {
    "immediate": [
      "Action 1: Do this today (15 mins)",
      "Action 2: Do this tomorrow (30 mins)"
    ],
    "shortTerm": [
      "Week 1: Implement X",
      "Week 2: Set up Y"
    ],
    "longTerm": [
      "Month 1-2: Deploy system",
      "Month 3: Review results"
    ]
  },
  "optimization": {
    "strategy": "Practical optimization approach",
    "mathematicalModel": {
      "objective": "Minimize cost = (retrieval_time × labor_cost) + (spoilage × product_cost)",
      "constraints": ["Must fit in existing space", "Budget under ₹50,000"],
      "variables": {"x": "items", "y": "space"},
      "equations": ["Space constraint: sum(item_volume) <= total_space"]
    },
    "expectedImpact": [
      {"metric": "Storage efficiency", "currentValue": 30, "projectedValue": 75, "improvement": "+150%", "monthlySavings": "₹8,000"},
      {"metric": "Retrieval time", "currentValue": 5, "projectedValue": 1, "improvement": "-80%", "monthlySavings": "₹12,000"}
    ],
    "timeline": "6-10 weeks",
    "estimatedCost": "₹25,000 - ₹45,000"
  },
  "generatedDashboard": {
    "html": "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Business Dashboard</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; } .container { max-width: 1200px; margin: 0 auto; } .header { background: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); } .header h1 { color: #333; margin-bottom: 10px; } .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; } .stat-card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); } .stat-card h3 { color: #666; font-size: 14px; margin-bottom: 10px; } .stat-card .value { font-size: 36px; font-weight: bold; color: #667eea; } .actions { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); } .action-item { padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 5px; } .action-item.done { background: #d4edda; border-color: #28a745; } button { background: #667eea; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 5px; } button:hover { background: #5568d3; }</style></head><body><div class='container'><div class='header'><h1>📊 Your Business Dashboard</h1><p>Real-time inventory management system</p></div><div class='stats'><div class='stat-card'><h3>Current Efficiency</h3><div class='value'>30%</div></div><div class='stat-card'><h3>Target Efficiency</h3><div class='value'>75%</div></div><div class='stat-card'><h3>Potential Savings</h3><div class='value'>₹20K/mo</div></div><div class='stat-card'><h3>ROI Timeline</h3><div class='value'>2 months</div></div></div><div class='actions'><h2>📋 Action Items</h2><div class='action-item'><strong>Today:</strong> Label all products and create a simple inventory list in Excel/Google Sheets</div><div class='action-item'><strong>This Week:</strong> Reorganize items by category - put fast-moving items at eye level</div><div class='action-item'><strong>Next Week:</strong> Implement FIFO system (First In, First Out) for perishables</div><button onclick='alert(\"Great! Mark this action as complete.\")'>Mark Complete</button><button onclick='alert(\"This would open detailed instructions.\")'>View Instructions</button></div></div></body></html>",
    "features": ["Real-time inventory tracking", "Low stock alerts", "Sales analytics", "Mobile responsive"],
    "howToUse": "1. Save the HTML code to a file called 'dashboard.html' 2. Double-click to open in your browser 3. Bookmark it for daily use"
  },
  "implementation": {
    "architecture": {
      "frontend": ["React", "Next.js", "TailwindCSS"],
      "backend": ["Python FastAPI", "Node.js Express"],
      "database": ["PostgreSQL"],
      "apis": ["REST API", "WebSocket for real-time updates"]
    },
    "codeStructure": [
      {"component": "InventoryItem", "purpose": "Track each product", "code": "class InventoryItem:\\n    def __init__(self, sku, name, quantity, location):\\n        self.sku = sku\\n        self.name = name\\n        self.quantity = quantity\\n        self.location = location"}
    ],
    "dashboard": {
      "widgets": [
        {"type": "chart", "title": "Stock Levels by Category", "dataSource": "inventory_db", "visualization": "bar chart"}
      ],
      "layout": "3-column grid"
    }
  },
  "metadata": {
    "confidence": 95,
    "processingTime": 0,
    "imageAnalysis": {
      "objectsDetected": ["actual objects from image"],
      "textExtracted": ["any text visible"],
      "sceneDescription": "Detailed description"
    }
  }
}

IMPORTANT: 
- Make the HTML dashboard COMPLETE and WORKING - it should open directly in a browser
- Use inline CSS and JavaScript (no external dependencies)
- Make it beautiful, professional, and mobile-responsive
- Include interactive elements (buttons that actually do something)
- Add at least 4-5 actionable widgets/sections`;
// Stronger JSON constraints to reduce malformed outputs
// Ask the model to avoid raw newlines in string values and to escape them as \n

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, WebP) or video (MP4, MOV)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Determine the mime type
    const mimeType = file.type;

    // Initialize Gemini model - resolve to an available model at runtime
    const modelName = await resolveModelName();
    console.log('Using model:', modelName);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    // Prepare the content for Gemini
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ];

    // Generate content
    const result = await model.generateContent([
      EXPERT_SYSTEM_PROMPT,
      ...imageParts,
    ]);

    const response = await result.response;
    let text = response.text();
    
    console.log('Raw AI response length:', text.length);
    console.log('Raw AI response preview:', text.substring(0, 200));

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let analysisResult: any;
    try {
      analysisResult = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      
      // Attempt to extract JSON from the response and repair common issues
      try {
        analysisResult = tryParseWithRepairs(text);
        console.warn('Parsed AI response (possibly repaired).');
      } catch (finalErr) {
        console.error('Failed to parse even after robust repairs:', finalErr);
        // Fallback: return a best-effort analysis object containing the raw AI text
        analysisResult = {
          problem: {
            title: 'Parsing Failed - raw AI response attached',
            description: `The AI returned an unparsable response. Raw output (truncated): ${text.substring(0, 1000)}`,
            severity: 'low',
            category: 'parsing',
            impactAreas: [],
          },
          actionPlan: { immediate: [], shortTerm: [], longTerm: [] },
          optimization: { strategy: '', mathematicalModel: { objective: '', constraints: [], variables: {}, equations: [] }, expectedImpact: [], timeline: '' },
          generatedDashboard: { html: undefined },
          implementation: { architecture: { frontend: [], backend: [], database: [], apis: [] }, codeStructure: [], dashboard: { widgets: [], layout: 'TBD' } },
          metadata: { confidence: 0, processingTime: Date.now() - startTime, parseFailed: true, rawResponse: text.substring(0, 2000) }
        } as any;
        console.warn('Returning fallback analysis with raw AI output attached.');
      }
    }

    analysisResult = normalizeAnalysisResult(analysisResult);

    // Check if the AI actually analyzed something meaningful
    const isEmptyResponse = 
      analysisResult.problem.title === 'Unspecified problem' &&
      analysisResult.problem.description === 'No description provided by the model.';
    
    if (isEmptyResponse) {
      console.error('AI returned empty/default response. Model:', modelName);
      console.error('This usually means the model does not support vision or processed incorrectly.');
      return NextResponse.json(
        { 
          error: 'AI Analysis Failed',
          details: `The model "${modelName}" did not provide meaningful analysis. It may not support vision tasks properly. Please try again or contact support.`,
          modelUsed: modelName
        },
        { status: 500 }
      );
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    analysisResult.metadata.processingTime = processingTime;

    return NextResponse.json({
      success: true,
      data: analysisResult,
      processingTime: processingTime,
    });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze image',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const modelName = await resolveModelName();
  return NextResponse.json({
    status: 'healthy',
    service: 'Drishti Vision API',
    version: '1.0.0',
    model: modelName,
  });
}
