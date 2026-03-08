// Ensure this API route is treated as dynamic so static export won't try to include it
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { AnalysisResult } from '@/types';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';
import { createShopkeeperAccount } from '@/lib/cognito';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize AWS Clients
const hasStaticCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const awsConfig = {
  region: process.env.AWS_REGION || 'eu-north-1',
  ...(hasStaticCredentials
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
      }
    : {}),
};
console.log('Drishti Vision API initialized with region:', awsConfig.region);

// Bedrock configuration: keep us-east-1 by default for Claude availability
const bedrockRegion = process.env.AWS_BEDROCK_REGION || 'us-east-1';
console.log('Bedrock client initialized with region:', bedrockRegion);

const bedrock = new BedrockRuntimeClient({ ...awsConfig, region: bedrockRegion });
const s3 = new S3Client(awsConfig);
const rekognition = new RekognitionClient(awsConfig);
const textract = new TextractClient(awsConfig);
const ses = new SESClient(awsConfig);
const secretsManager = new SecretsManagerClient(awsConfig);
const sfn = new SFNClient(awsConfig);
const lambda = new LambdaClient(awsConfig);
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'drishti-assets';
const TABLE_ANALYSIS = process.env.AWS_DYNAMODB_TABLE_ANALYSIS || 'Drishti_Analysis';
const BEDROCK_MODEL_CANDIDATES = Array.from(
  new Set([
    process.env.BEDROCK_MODEL_ID_PRIMARY,
    process.env.BEDROCK_MODEL_ID,
    'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
  ].filter((value): value is string => !!value && value.trim().length > 0))
);
const SENDER_EMAIL = process.env.AWS_SES_SENDER_EMAIL || 'drishti-demo@example.com'; // Must be verified in SES
const SECRET_NAME = process.env.AWS_SECRET_NAME || 'Drishti/AppSecret';
const STATE_MACHINE_ARN = process.env.AWS_SFN_ARN; // Optional: ARN of your Step Function
const ANALYZE_LAMBDA_ARN = process.env.AWS_LAMBDA_ANALYZE_ARN; // Optional: ARN of post-processing Lambda
const ITEMS_DATA_PATH = path.join(process.cwd(), 'data', 'items.json');
const STOREFRONT_DATA_PATH = path.join(process.cwd(), 'data', 'storefront.json');

type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  qty: number;
  image: string;
  category: string;
  source: 'ai-generated' | 'manual';
};

type StorefrontConfig = {
  shopId: string;
  shopName: string;
  tagline: string;
  ownerLogin: string;
  generatedAt: string;
  storefrontUrl: string;
  catalogHighlights: string[];
  operationGuide: string[];
  shelfStrategy: {
    recommendation: string;
    probability: number;
  }[];
  reorderStrategy: {
    product: string;
    probability: number;
    trigger: string;
  }[];
};

const DEFAULT_RESULT: AnalysisResult = {
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

// Lightweight image dimension extractor for PNG and JPEG
function getImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (/png/i.test(mimeType)) {
      // PNG: width/height are 4-byte big-endian at offset 16 and 20
      if (buffer.length >= 24) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    } else if (/jpeg|jpg/i.test(mimeType)) {
      // JPEG: scan for SOF0/SOF2 marker (0xFFC0 / 0xFFC2)
      let i = 2; // skip 0xFFD8
      while (i < buffer.length) {
        if (buffer[i] !== 0xFF) { i++; continue; }
        const marker = buffer[i + 1];
        const len = buffer.readUInt16BE(i + 2);
        // SOF0/1/2 markers
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          const height = buffer.readUInt16BE(i + 5);
          const width = buffer.readUInt16BE(i + 7);
          return { width, height };
        }
        i += 2 + len;
      }
    }
  } catch (e) {
    // ignore and return null
  }
  return null;
}

function normalizeAnalysisResult(input: any): AnalysisResult {
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

const EXPERT_SYSTEM_PROMPT = `You are Drishti, an expert AI Business Consultant for Indian SMBs. Analyze this shop/business image.

I have already run AWS Rekognition and Textract on this image. 
Detected Objects: {{LABELS}}
Detected Text: {{TEXT}}

Your goal is to build an instant e-commerce setup and provide business intelligence.
1. IDENTIFY ALL PRODUCTS visible in the shop image and create a detailed e-commerce catalog
2. Extract product names, estimated prices, and descriptions
3. Suggest shelf arrangement probabilities to increase sales
4. Provide step-by-step operation guide for shopkeepers

Your output MUST include:
1. Problem analysis
2. DETAILED product catalog with at least 8-15 products extracted from the image
3. Step-by-step action plan a business owner can follow TODAY
4. COMPLETE HTML dashboard code they can open in a browser RIGHT NOW

Respond with ONLY valid JSON (no markdown, no code blocks). Do not include raw newlines in strings:

{
  "problem": {
    "title": "Clear problem from the image",
    "description": "Detailed analysis of the shop floor/inventory",
    "severity": "high",
    "category": "inventory",
    "impactAreas": ["specific business areas"],
    "financialImpact": "Estimated monthly loss: ₹X,XXX due to inefficiency"
  },
  "productCatalog": [
    {"name": "Product 1 Name", "price": 50, "qty": 100, "category": "Groceries", "description": "Brief product description", "image": ""},
    {"name": "Product 2 Name", "price": 120, "qty": 75, "category": "Snacks", "description": "Brief product description", "image": ""},
    {"name": "Product 3 Name", "price": 200, "qty": 50, "category": "Beverages", "description": "Brief product description", "image": ""}
  ],
  "shopInfo": {
    "shopName": "Detected shop name or general shop name based on products",
    "tagline": "One-line description of the shop",
    "categories": ["Category1", "Category2", "Category3"]
  },
  "operationGuide": [
    "Step 1: How to add new products to your online store",
    "Step 2: How to update prices and stock levels",
    "Step 3: How to view and fulfill customer orders",
    "Step 4: How to promote your store on social media"
  ],
  "optimization": {
    "strategy": "Shelf Arrangement & Stock Probability Strategy",
    "mathematicalModel": {
      "objective": "Maximize Sales Probability P(s) = (Visibility_V * 0.6) + (Accessibility_A * 0.4)",
      "constraints": ["Shelf Space < 200sqft", "Restocking Interval = 3 days"],
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

function buildFallbackAnalysis(detectedLabels: string, detectedText: string): AnalysisResult {
  const labels = detectedLabels === 'None'
    ? []
    : detectedLabels.split(',').map((value) => value.trim()).filter(Boolean);
  const textLines = detectedText === 'None'
    ? []
    : detectedText.split('\n').map((value) => value.trim()).filter(Boolean);

  // Use actual product names instead of generic categories
  const defaultProducts = ['Rice', 'Sugar', 'Oil', 'Biscuits', 'Soap', 'Detergent', 'Tea', 'Salt', 'Spices', 'Flour', 'Milk', 'Bread'];
  const topLabels = labels.slice(0, 12);
  const objectsDetected = topLabels.length > 0 ? topLabels : defaultProducts;
  const catalogProducts = objectsDetected.slice(0, 10);

  const shelfProbabilities = catalogProducts.length > 0
    ? catalogProducts.map((name, index) => ({
        name,
        eye: Math.max(45, 78 - index * 6),
        mid: Math.max(20, 58 - index * 4),
        low: Math.max(10, 36 - index * 2),
      }))
    : [
        { name: 'Top-selling snack', eye: 78, mid: 58, low: 36 },
        { name: 'Daily essentials', eye: 72, mid: 54, low: 34 },
        { name: 'Impulse products', eye: 69, mid: 49, low: 29 },
      ];

  const reorderRows = shelfProbabilities.map((row, index) => ({
    name: row.name,
    reorderProbability: Math.max(40, 70 - index * 5),
    trigger: `${Math.max(20, 35 - index * 3)}% stock remaining`,
  }));

  // Generate product catalog with prices for the dashboard
  const productCatalog = catalogProducts.length > 0
    ? catalogProducts.map((name, index) => ({
        name,
        price: Math.floor(Math.random() * 400) + 50,
        qty: Math.floor(Math.random() * 100) + 20,
        category: ['Groceries', 'Snacks', 'Beverages', 'Personal Care', 'Household'][index % 5],
        description: `${name} - Quality product available at competitive prices`,
        image: '',
      }))
    : [
        { name: 'Rice', price: 1200, qty: 100, category: 'Groceries', description: 'Premium quality rice 25kg', image: '' },
        { name: 'Sugar', price: 45, qty: 150, category: 'Groceries', description: 'White sugar 1kg', image: '' },
        { name: 'Biscuits', price: 20, qty: 200, category: 'Snacks', description: 'Assorted biscuits', image: '' },
        { name: 'Cold Drink', price: 40, qty: 80, category: 'Beverages', description: 'Soft drinks 500ml', image: '' },
        { name: 'Soap', price: 35, qty: 120, category: 'Personal Care', description: 'Bathing soap 100g', image: '' },
        { name: 'Detergent', price: 180, qty: 60, category: 'Household', description: 'Washing powder 1kg', image: '' },
      ];

  const ecommerceHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Product Catalog Dashboard</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,sans-serif;background:#0a0e1a;min-height:100vh;padding:20px;color:#fff;overflow-x:hidden}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}@keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}.bg-orb{position:fixed;border-radius:50%;filter:blur(100px);opacity:.4;pointer-events:none;z-index:0}.orb1{top:-10%;left:-5%;width:500px;height:500px;background:linear-gradient(45deg,#667eea,#764ba2);animation:float 8s ease-in-out infinite}.orb2{top:30%;right:-10%;width:600px;height:600px;background:linear-gradient(45deg,#00c9ff,#92fe9d);animation:float 10s ease-in-out infinite;animation-delay:1s}.orb3{bottom:-15%;left:40%;width:550px;height:550px;background:linear-gradient(45deg,#f093fb,#f5576c);animation:float 12s ease-in-out infinite;animation-delay:2s}.container{max-width:1400px;margin:0 auto;position:relative;z-index:1}.header{background:linear-gradient(135deg,rgba(102,126,234,.15),rgba(118,75,162,.15));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:40px;margin-bottom:32px;box-shadow:0 8px 32px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.1)}h1{font-size:42px;font-weight:800;background:linear-gradient(135deg,#667eea,#764ba2,#f093fb);background-size:300% 300%;animation:gradient 6s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;letter-spacing:-1px}h1::before{content:'🛍️';margin-right:12px;-webkit-text-fill-color:initial}.subtitle{color:rgba(255,255,255,.7);font-size:18px;font-weight:400}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-bottom:32px}.stat-card{background:linear-gradient(135deg,rgba(102,126,234,.12),rgba(118,75,162,.12));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:28px;box-shadow:0 8px 32px rgba(0,0,0,.2);transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}.stat-card::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,.1),transparent);opacity:0;transition:opacity .3s}.stat-card:hover{transform:translateY(-8px);border-color:rgba(255,255,255,.3);box-shadow:0 16px 48px rgba(102,126,234,.4)}.stat-card:hover::before{opacity:1}.stat-label{font-size:12px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600}.stat-value{font-size:36px;font-weight:800;background:linear-gradient(135deg,#00c9ff,#92fe9d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.products-section{background:linear-gradient(135deg,rgba(102,126,234,.08),rgba(118,75,162,.08));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:40px;box-shadow:0 8px 32px rgba(0,0,0,.3);margin-bottom:32px}h2{color:#fff;margin-bottom:28px;font-size:28px;font-weight:700;display:flex;align-items:center;gap:12px}h2::before{content:'';width:6px;height:32px;background:linear-gradient(180deg,#667eea,#764ba2);border-radius:3px}.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;margin-bottom:40px}.product-card{background:linear-gradient(135deg,rgba(0,201,255,.12),rgba(146,254,157,.12));backdrop-filter:blur(15px);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:24px;transition:all .4s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}.product-card::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(102,126,234,.2),rgba(118,75,162,.2));opacity:0;transition:opacity .4s}.product-card:hover{transform:translateY(-6px) scale(1.02);border-color:rgba(0,201,255,.5);box-shadow:0 20px 60px rgba(0,201,255,.3)}.product-card:hover::after{opacity:1}.category{display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:6px 16px;border-radius:20px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:16px;box-shadow:0 4px 12px rgba(102,126,234,.4);position:relative;z-index:1}.product-name{font-size:20px;font-weight:700;color:#fff;margin-bottom:16px;position:relative;z-index:1}.product-info{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}.price{font-size:28px;font-weight:800;background:linear-gradient(135deg,#f093fb,#f5576c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.price::before{content:'₹'}.stock{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);padding:8px 16px;border-radius:12px;font-size:13px;color:rgba(255,255,255,.9);font-weight:600}.stock-value{color:#00c9ff;font-weight:800}.table-section{margin-top:40px;background:rgba(0,0,0,.2);border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,.1)}.data-table{width:100%;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden}th{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:18px 20px;text-align:left;font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:1.2px;border:none}td{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.9);font-weight:500;background:rgba(0,0,0,.15)}.row:hover{background:rgba(102,126,234,.15)}.action-btn{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:16px 36px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:all .3s;margin:8px;box-shadow:0 8px 24px rgba(102,126,234,.4);position:relative;overflow:hidden}.action-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent);opacity:0;transition:opacity .3s}.action-btn:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 12px 32px rgba(102,126,234,.6)}.action-btn:hover::before{opacity:1}.action-btn:active{transform:translateY(-1px) scale(1.02)}.next-steps{background:linear-gradient(135deg,rgba(0,201,255,.15),rgba(146,254,157,.15));backdrop-filter:blur(15px);border-left:4px solid #00c9ff;border-radius:12px;padding:24px;margin-top:32px;color:rgba(255,255,255,.95);border:1px solid rgba(0,201,255,.3);box-shadow:0 8px 24px rgba(0,201,255,.2)}.next-steps strong{color:#00c9ff;font-weight:700}@media (max-width:768px){h1{font-size:32px}.stats{grid-template-columns:1fr}.product-grid{grid-template-columns:1fr}.action-btn{width:100%;margin:8px 0}}</style></head><body><div class="bg-orb orb1"></div><div class="bg-orb orb2"></div><div class="bg-orb orb3"></div><div class="container"><div class="header"><h1>Your Store Inventory Dashboard</h1><p class="subtitle">AI-detected products from your shop image - Review and manage your catalog</p></div><div class="stats"><div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${productCatalog.length}</div></div><div class="stat-card"><div class="stat-label">Total Stock Value</div><div class="stat-value">₹${productCatalog.reduce((sum, p) => sum + (p.price * p.qty), 0).toLocaleString()}</div></div><div class="stat-card"><div class="stat-label">Avg Product Price</div><div class="stat-value">₹${Math.round(productCatalog.reduce((sum, p) => sum + p.price, 0) / productCatalog.length)}</div></div><div class="stat-card"><div class="stat-label">Store Status</div><div class="stat-value" style="font-size:20px;background:linear-gradient(135deg,#00c9ff,#92fe9d);-webkit-background-clip:text;-webkit-text-fill-color:transparent">✓ LIVE</div></div></div><div class="products-section"><h2>📦 Product Catalog</h2><div class="product-grid">${productCatalog.map(p => `<div class="product-card"><div class="category">${p.category}</div><div class="product-name">${p.name}</div><div class="product-info"><span class="price">${p.price}</span><span class="stock">Stock: <span class="stock-value">${p.qty}</span></span></div></div>`).join('')}</div><div class="table-section"><h2>📊 Shelf Strategy & Reorder Plan</h2><table class="data-table"><thead><tr><th>Product</th><th>Eye Level</th><th>Mid Shelf</th><th>Lower Shelf</th><th>Reorder At</th></tr></thead><tbody>${shelfProbabilities.map((p, i) => `<tr class="row"><td><strong>${p.name}</strong></td><td>${p.eye}%</td><td>${p.mid}%</td><td>${p.low}%</td><td>${reorderRows[i].trigger}</td></tr>`).join('')}</tbody></table></div><div class="next-steps"><strong>✨ Next Steps:</strong> Visit your live storefront at <strong>/storefront</strong> to share with customers. Login to <strong>/admin</strong> to update prices and add product images.</div><button class="action-btn" onclick="window.location.href='/storefront'">🚀 View Live Storefront</button> <button class="action-btn" onclick="window.location.href='/admin'" style="background:linear-gradient(135deg,#00c9ff,#92fe9d)">⚙️ Manage Store</button></div></div></body></html>`;

  return {
    ...DEFAULT_RESULT,
    problem: {
      title: 'Shop layout and inventory optimization opportunity',
      description: 'Image cues indicate opportunity to improve product visibility, shelf hierarchy, and reorder timing. A combined online + offline catalog workflow will improve conversion and reduce stock-outs.',
      severity: 'medium',
      category: 'inventory',
      impactAreas: ['Shelf arrangement', 'Stock planning', 'Store operations', 'E-commerce readiness'],
      financialImpact: 'Estimated monthly upside: ₹12,000 to ₹35,000 from higher conversion and lower stock-outs.',
    },
    productCatalog,
    shopInfo: {
      shopName: textLines.length > 0 && textLines[0].length < 50 ? textLines[0] : 'My Neighborhood Store',
      tagline: 'Your trusted local shop, now online 24/7',
      categories: ['Groceries', 'Snacks', 'Beverages', 'Personal Care', 'Household'],
    },
    operationGuide: [
      'Access your admin dashboard using the credentials sent to your email',
      'Review the auto-generated product catalog at /storefront',
      'Update product images by uploading photos from your phone',
      'Adjust prices and stock quantities as needed from the admin panel',
      'Share your storefront link with customers via WhatsApp or social media',
      'Monitor daily orders and sales from your dashboard',
      'Enable automatic low-stock alerts to never run out of popular items',
    ],
    actionPlan: {
      immediate: [
        'Place high-demand items at eye level near entrance flow with a target shelf probability above 70%.',
        'Create a digital product catalog for top 20 SKUs and enable storefront listing from the same data.',
        'Mark low-stock SKUs and set reorder trigger at 30% remaining quantity.',
      ],
      shortTerm: [
        'Track daily sales by category and rank SKUs by revenue-per-shelf-space.',
        'Set reorder probability model: P(order) = 0.55*demandVelocity + 0.45*stockRisk.',
        'Use Cognito credentials to onboard shopkeeper to the admin panel and maintain inventory daily.',
      ],
      longTerm: [
        'Automate reorder suggestions from billing trends and execute via Step Functions + Lambda.',
        'Expand storefront with offer campaigns and repeat-purchase recommendations.',
        'Run monthly A/B shelf layout experiments and optimize placement probabilities by category.',
      ],
    },
    optimization: {
      strategy: 'Use demand-weighted shelf placement, probability-based reorder triggers, and unified catalog-to-billing data flow.',
      mathematicalModel: {
        objective: 'Maximize expected sales score S = Σ(Visibility_i × Demand_i × Margin_i) while minimizing stock-out risk.',
        constraints: [
          'Shelf space capacity and category adjacency rules must be preserved.',
          'Reorder budget should stay within weekly procurement limit.',
          'Critical SKUs must remain above safety stock threshold.',
        ],
        variables: {
          x_i: 'Shelf position weight for SKU i',
          y_i: 'Reorder quantity for SKU i',
          p_i: 'Reorder probability for SKU i',
        },
        equations: [
          'p_i = 0.55*demandVelocity_i + 0.45*stockoutRisk_i',
          'Reorder if p_i >= 0.62 OR currentStock_i <= safetyStock_i',
          'Σ(space_i * x_i) <= totalShelfSpace',
        ],
      },
      expectedImpact: [
        { metric: 'Shelf conversion', currentValue: 100, projectedValue: 118, improvement: '+18%', monthlySavings: '₹8,000' },
        { metric: 'Stock-out frequency', currentValue: 100, projectedValue: 72, improvement: '-28%', monthlySavings: '₹9,500' },
        { metric: 'Inventory holding efficiency', currentValue: 100, projectedValue: 121, improvement: '+21%', monthlySavings: '₹6,000' },
      ],
      timeline: '2-4 weeks for first measurable gains',
      estimatedCost: '₹12,000 - ₹30,000 setup with existing AWS stack',
    },
    generatedDashboard: {
      html: ecommerceHtml,
      features: [
        'Catalog-ready storefront starter page',
        'Shelf placement probability table',
        'Stock reorder probability and trigger table',
        'KPI cards for conversion and stock-out control',
      ],
      howToUse: 'Open the generated HTML to review ecommerce starter dashboard, then sync products from billing items API and publish via Amplify.',
    },
    implementation: {
      architecture: {
        frontend: ['Next.js storefront', 'Admin dashboard', 'AWS Amplify Hosting'],
        backend: ['Next.js API routes', 'AWS Lambda AnalyzeShopImagesFn', 'AWS Step Functions orchestration'],
        database: ['Amazon DynamoDB: drishti-analysis, drishti-billing, drishti-recommendations, drishti-shops'],
        apis: ['S3 upload', 'Rekognition', 'Textract', 'Bedrock', 'Cognito', 'SES'],
      },
      codeStructure: [
        {
          component: 'ProductCatalogItem',
          purpose: 'Single source of truth for product listing across billing and storefront',
          code: 'type ProductCatalogItem = { id: string; name: string; price: number; qty: number; category?: string; image?: string; reorderThreshold?: number };',
        },
        {
          component: 'AnalysisRecord',
          purpose: 'Store AI analyzer result with action plan and generated credentials',
          code: 'type AnalysisRecord = { id: string; timestamp: string; analysis: AnalysisResult; status: "COMPLETED" | "FAILED"; s3Key?: string; };',
        },
      ],
      dashboard: {
        widgets: [
          { type: 'kpi', title: 'Conversion Potential', dataSource: 'drishti-analysis', visualization: 'stat-card' },
          { type: 'table', title: 'Shelf Probabilities', dataSource: 'drishti-recommendations', visualization: 'data-table' },
          { type: 'table', title: 'Reorder Triggers', dataSource: 'drishti-billing', visualization: 'data-table' },
          { type: 'list', title: 'Priority Action Plan', dataSource: 'analysis.actionPlan', visualization: 'checklist' },
        ],
        layout: 'Responsive two-column operations layout',
      },
    },
    metadata: {
      ...DEFAULT_RESULT.metadata,
      confidence: 72,
      imageAnalysis: {
        objectsDetected,
        textExtracted: textLines,
        sceneDescription: `Retail scene interpreted from detected objects: ${objectsDetected.join(', ')}`,
      },
    },
  };
}
// Stronger JSON constraints to reduce malformed outputs
// Ask the model to avoid raw newlines in string values and to escape them as \n

// Persist generated storefront data from AI analysis
async function persistGeneratedStorefront(params: {
  fileId: string;
  detectedLabels: string;
  detectedText: string;
  credentials: { username: string; password: string } | null;
  analysisResult?: any;
}): Promise<{
  storefront: StorefrontConfig;
  catalogSize: number;
}> {
  const { fileId, detectedLabels, detectedText, credentials, analysisResult } = params;

  // Extract product catalog from AI analysis or build from detected labels
  let catalogItems: CatalogItem[] = [];
  
  if (analysisResult?.productCatalog && Array.isArray(analysisResult.productCatalog)) {
    // Use AI-generated product catalog
    catalogItems = analysisResult.productCatalog.map((product: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      name: product.name || `Product ${index + 1}`,
      description: product.description || 'AI-detected product from shop image',
      price: product.price || Math.floor(Math.random() * 500) + 50,
      qty: product.qty || Math.floor(Math.random() * 100) + 10,
      image: product.image || '',
      category: product.category || 'General',
      source: 'ai-generated' as const,
    }));
  } else {
    // Fallback: Generate catalog from detected labels
    const labels = detectedLabels === 'None' 
      ? [] 
      : detectedLabels.split(',').map(s => s.trim()).filter(Boolean);
    
    const productNames = labels.slice(0, 12);
    const categories = ['Groceries', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Electronics'];
    
    catalogItems = productNames.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name: name,
      description: `${name} - Available at our store`,
      price: Math.floor(Math.random() * 500) + 50,
      qty: Math.floor(Math.random() * 100) + 10,
      image: '',
      category: categories[index % categories.length],
      source: 'ai-generated' as const,
    }));

    // Ensure we have at minimum some products
    if (catalogItems.length === 0) {
      catalogItems = [
        { id: `${Date.now()}-1`, name: 'Rice', description: 'Premium quality rice', price: 1200, qty: 100, image: '', category: 'Groceries', source: 'ai-generated' },
        { id: `${Date.now()}-2`, name: 'Sugar', description: 'White sugar 1kg', price: 45, qty: 150, image: '', category: 'Groceries', source: 'ai-generated' },
        { id: `${Date.now()}-3`, name: 'Biscuits', description: 'Assorted biscuits', price: 20, qty: 200, image: '', category: 'Snacks', source: 'ai-generated' },
        { id: `${Date.now()}-4`, name: 'Cold Drink', description: 'Soft drinks', price: 40, qty: 80, image: '', category: 'Beverages', source: 'ai-generated' },
        { id: `${Date.now()}-5`, name: 'Soap', description: 'Bathing soap', price: 35, qty: 120, image: '', category: 'Personal Care', source: 'ai-generated' },
        { id: `${Date.now()}-6`, name: 'Detergent', description: 'Washing powder', price: 180, qty: 60, image: '', category: 'Household', source: 'ai-generated' },
      ];
    }
  }

  // Build storefront configuration
  const shopName = analysisResult?.shopInfo?.shopName || 'My Digital Store';
  const tagline = analysisResult?.shopInfo?.tagline || 'Your neighborhood shop, now online!';
  const operationGuide = analysisResult?.operationGuide || [
    'Login to admin panel using your credentials sent via email',
    'Open your customer website at /customer-shop/{shopId}',
    'Update product prices and quantities from the admin dashboard',
    'Share your customer website URL with customers on WhatsApp',
    'Monitor daily sales and inventory from the dashboard',
    'Set low-stock alerts for automatic reordering',
  ];

  const catalogHighlights = catalogItems.slice(0, 5).map(item => item.name);

  const storefrontConfig: StorefrontConfig = {
    shopId: fileId,
    shopName,
    tagline,
    ownerLogin: credentials?.username || 'shopkeeper@example.com',
    generatedAt: new Date().toISOString(),
    storefrontUrl: `/customer-shop/${fileId}`,
    catalogHighlights,
    operationGuide,
    shelfStrategy: catalogItems.slice(0, 5).map((item, index) => ({
      recommendation: `Place ${item.name} at eye level - High visibility zone`,
      probability: Math.max(65, 85 - index * 4),
    })),
    reorderStrategy: catalogItems.slice(0, 5).map((item, index) => ({
      product: item.name,
      probability: Math.max(55, 75 - index * 4),
      trigger: `${Math.max(15, 30 - index * 2)}% stock remaining`,
    })),
  };

  // Persist to data files
  try {
    // Read existing items
    let existingItems: CatalogItem[] = [];
    try {
      const itemsData = await fs.readFile(ITEMS_DATA_PATH, 'utf8');
      existingItems = JSON.parse(itemsData);
    } catch (e) {
      // File doesn't exist or is empty, start fresh
    }

    // Merge: keep manual items, add AI-generated ones
    const manualItems = existingItems.filter(item => item.source !== 'ai-generated');
    const mergedItems = [...manualItems, ...catalogItems];

    // Save items.json
    await fs.writeFile(ITEMS_DATA_PATH, JSON.stringify(mergedItems, null, 2), 'utf8');
    console.log(`Saved ${catalogItems.length} products to ${ITEMS_DATA_PATH}`);

    // Save storefront.json
    await fs.writeFile(STOREFRONT_DATA_PATH, JSON.stringify(storefrontConfig, null, 2), 'utf8');
    console.log(`Saved storefront config to ${STOREFRONT_DATA_PATH}`);

  } catch (error) {
    console.error('Error persisting storefront data:', error);
    throw error;
  }

  return {
    storefront: storefrontConfig,
    catalogSize: catalogItems.length,
  };
}

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
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, WebP).' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Determine the mime type
    const mimeType = file.type;

    // Capture and log basic payload info (do NOT log API keys)
    const payloadInfo = {
      filename: (file as any).name || 'upload',
      mimeType,
      sizeBytes: buffer.length,
      base64Length: base64Data.length,
    };
    console.log('Vision upload payload:', payloadInfo);

    // Validate image size and dimensions before calling Bedrock
    const MIN_BYTES = 5 * 1024; // 5 KB
    const MIN_WIDTH = 100;
    const MIN_HEIGHT = 100;

    if (buffer.length < MIN_BYTES) {
      return NextResponse.json(
        { error: 'Uploaded image too small. Please upload a larger, higher-resolution image.' },
        { status: 400 }
      );
    }

    const dims = getImageDimensions(buffer, mimeType);
    if (dims) {
      console.log('Detected image dimensions:', dims.width + 'x' + dims.height);
      if (dims.width < MIN_WIDTH || dims.height < MIN_HEIGHT) {
        return NextResponse.json(
          { error: `Image dimensions too small (${dims.width}x${dims.height}). Minimum is ${MIN_WIDTH}x${MIN_HEIGHT}.` },
          { status: 400 }
        );
      }
    } else {
      console.warn('Could not determine image dimensions from upload; proceeding but may fail.');
    }

    // Check for critical AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS Credentials missing. Please check .env.local' },
        { status: 500 }
      );
    }

    // 0. Fetch Secure Configuration from Secrets Manager (Security Layer)
    try {
      // We fetch this to demonstrate secure configuration management
      const secretValue = await secretsManager.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
      console.log("Secrets Manager: Secure configuration verified.");
    } catch (secretError) {
      console.warn("Secrets Manager check skipped (optional for local dev):", secretError);
    }

    // 1. Upload Image to S3
    const s3Key = `uploads/${fileId}.${mimeType.split('/')[1]}`;
    try {
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
      }));
      console.log(`Image uploaded to S3: ${S3_BUCKET}/${s3Key}`);
    } catch (s3Error) {
      console.error('S3 Upload Error:', s3Error);
      // Continue even if S3 fails, we can still analyze
    }

    // 2. Run AWS Vision Services (Rekognition & Textract) in Parallel
    let detectedLabels = "None";
    let detectedText = "None";

    try {
      const [rekogResult, textractResult] = await Promise.all([
        rekognition.send(new DetectLabelsCommand({ 
          Image: { Bytes: buffer }, 
          MaxLabels: 10, 
          MinConfidence: 70 
        })),
        textract.send(new DetectDocumentTextCommand({ 
          Document: { Bytes: buffer } 
        }))
      ]);

      detectedLabels = rekogResult.Labels?.map((label: any) => label.Name).join(', ') || "None";
      detectedText = textractResult.Blocks?.filter((block: any) => block.BlockType === 'LINE').map((block: any) => block.Text).join('\n') || "None";
      
      console.log("AWS Vision Analysis Complete");
    } catch (visionError) {
      console.warn("Vision services partial failure:", visionError);
    }

    // 3. Create Cognito User (Parallel to AI analysis to save time)
    const credentialsPromise = createShopkeeperAccount();

    // 4. Analyze with AWS Bedrock (Claude 3 Sonnet)
    let rawText = '';
    let bedrockUsedModel = '';
    try {
      // Inject vision data into prompt
      const finalPrompt = EXPERT_SYSTEM_PROMPT
        .replace('{{LABELS}}', detectedLabels)
        .replace('{{TEXT}}', detectedText);

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: finalPrompt,
              },
            ],
          },
        ],
      };

      const bedrockErrors: string[] = [];
      for (const modelId of BEDROCK_MODEL_CANDIDATES) {
        try {
          const command = new InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
          });

          const response = await bedrock.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));
          const candidateText = responseBody?.content?.[0]?.text || '';
          if (candidateText && candidateText.trim().length > 0) {
            rawText = candidateText;
            bedrockUsedModel = modelId;
            console.log('Bedrock analysis succeeded with model:', modelId);
            break;
          }
          bedrockErrors.push(`${modelId}: empty response`);
        } catch (modelError: any) {
          bedrockErrors.push(`${modelId}: ${modelError?.message || String(modelError)}`);
        }
      }

      if (!rawText) {
        throw new Error(`All Bedrock model attempts failed. ${bedrockErrors.join(' | ')}`);
      }

    } catch (bedrockError: any) {
      console.error('Bedrock API Error:', bedrockError);
      rawText = JSON.stringify(buildFallbackAnalysis(detectedLabels, detectedText));
    }

    // 5. Parse JSON
    let analysisResult: AnalysisResult;
    try {
      const parsedData = tryParseWithRepairs(rawText);
      analysisResult = normalizeAnalysisResult(parsedData);
    } catch (parseError) {
      console.warn('Model JSON parse failed, using fallback result:', parseError);
      analysisResult = buildFallbackAnalysis(detectedLabels, detectedText);
    }

    // 6. Inject Real Credentials & Send Email via SES
    const credentials = await credentialsPromise;
    if (credentials.success) {
      // Attach credentials to the result so the frontend can display them
      analysisResult.generatedCredentials = {
        username: credentials.username,
        password: credentials.password
      };

      // Send Email via SES
      if (process.env.AWS_SES_SENDER_EMAIL) {
        console.log(`Attempting to send email from ${process.env.AWS_SES_SENDER_EMAIL} to ${credentials.username}`);
        try {
          await ses.send(new SendEmailCommand({
            Source: process.env.AWS_SES_SENDER_EMAIL,
            Destination: { ToAddresses: [credentials.username] }, // Assuming username is email
            Message: {
              Subject: { Data: "Your Drishti Shop Credentials" },
              Body: {
                Text: { Data: `Welcome to Drishti!\n\nYour E-commerce store is ready.\nUsername: ${credentials.username}\nPassword: ${credentials.password}\n\nLogin to manage your store.` }
              }
            }
          }));
          console.log("SES Email sent to:", credentials.username);
        } catch (sesError) {
          console.error("SES Error:", sesError);
        }
      }
    }

    // Generate and persist ecommerce storefront data from AI vision output
    const storefrontPersisted = await persistGeneratedStorefront({
      fileId,
      detectedLabels,
      detectedText,
      credentials: credentials.success
        ? { username: credentials.username, password: credentials.password }
        : null,
      analysisResult,
    });

    analysisResult.storefront = {
      url: storefrontPersisted.storefront.storefrontUrl,
      customerUrl: storefrontPersisted.storefront.storefrontUrl,
      adminUrl: '/storefront',
      shopName: storefrontPersisted.storefront.shopName,
      catalogSize: storefrontPersisted.catalogSize,
      operationGuide: storefrontPersisted.storefront.operationGuide,
    } as any;

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    analysisResult.metadata.processingTime = processingTime;

    // 7. Trigger Step Functions (Business Logic Orchestration)
    if (STATE_MACHINE_ARN) {
      try {
        const sfnResult = await sfn.send(new StartExecutionCommand({
          stateMachineArn: STATE_MACHINE_ARN,
          input: JSON.stringify({
            fileId,
            analysis: analysisResult,
            credentials: credentials.success ? { username: credentials.username } : null
          })
        }));
        console.log("Step Function triggered:", sfnResult.executionArn);
      } catch (sfnError) {
        console.error("Step Function Error:", sfnError);
      }
    }

    // 7b. Trigger Lambda (optional async post-processing hook)
    if (ANALYZE_LAMBDA_ARN) {
      try {
        await lambda.send(new InvokeCommand({
          FunctionName: ANALYZE_LAMBDA_ARN,
          InvocationType: 'Event',
          Payload: Buffer.from(JSON.stringify({
            fileId,
            s3Bucket: S3_BUCKET,
            s3Key,
            analysis: analysisResult,
            credentials: credentials.success ? { username: credentials.username } : null,
            triggeredAt: new Date().toISOString(),
          })),
        }));
        console.log('Lambda triggered:', ANALYZE_LAMBDA_ARN);
      } catch (lambdaError) {
        console.error('Lambda invoke error:', lambdaError);
      }
    }

    // 8. Save to DynamoDB
    try {
      const dbItem = {
        id: fileId,
        timestamp: new Date().toISOString(),
        s3Key: s3Key,
        analysis: analysisResult,
        status: 'COMPLETED'
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_ANALYSIS,
        Item: dbItem
      }));
      console.log(`Analysis saved to DynamoDB: ${TABLE_ANALYSIS} (ID: ${fileId})`);
    } catch (dbError) {
      console.error('DynamoDB Save Error:', dbError);
      // Don't fail the request if DB save fails, just log it
    }

    return NextResponse.json({ success: true, data: analysisResult, processingTime });

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
  return NextResponse.json({
    status: 'healthy',
    service: 'Drishti Vision API',
    version: '1.0.0',
    model: 'aws-bedrock-claude-3',
  });
}
