export interface AnalysisResult {
  problem: {
    title: string;
    description: string;
    severity: string;
    category: string;
    impactAreas: string[];
    financialImpact?: string;
  };
  actionPlan?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  productCatalog?: Array<{
    name: string;
    price: number;
    qty: number;
    category: string;
    description: string;
    image: string;
  }>;
  shopInfo?: {
    shopName: string;
    tagline: string;
    categories: string[];
  };
  operationGuide?: string[];
  optimization: {
    strategy: string;
    mathematicalModel: {
      objective: string;
      constraints: string[];
      variables: Record<string, string>;
      equations: string[];
    };
    expectedImpact: Array<{
      metric: string;
      currentValue: number | string;
      projectedValue: number | string;
      improvement: string;
      monthlySavings?: string;
    }>;
    timeline: string;
    estimatedCost?: string;
  };
  generatedDashboard?: {
    html: string;
    features: string[];
    howToUse: string;
  };
  implementation: {
    architecture: {
      frontend: string[];
      backend: string[];
      database: string[];
      apis: string[];
    };
    codeStructure: Array<{
      component: string;
      purpose: string;
      code: string;
    }>;
    dashboard: {
      widgets: Array<{
        type: string;
        title: string;
        dataSource: string;
        visualization: string;
      }>;
      layout: string;
    };
  };
  metadata: {
    confidence: number;
    processingTime: number;
    imageAnalysis: {
      objectsDetected: string[];
      textExtracted: string[];
      sceneDescription: string;
    };
  };
  generatedCredentials?: {
    username: string;
    password: string;
  };
  storefront?: {
    url: string;
    shopName: string;
    catalogSize: number;
    operationGuide: string[];
  };
}

export type GeminiAnalysisResult = AnalysisResult;

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result: AnalysisResult | null;
  error: string | null;
}

export interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}