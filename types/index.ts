// Type definitions for the Drishti Agent application

export interface GeminiAnalysisResult {
  problem: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    impactAreas: string[];
    financialImpact?: string;
  };
  actionPlan?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  optimization: {
    strategy: string;
    mathematicalModel: {
      objective: string;
      constraints: string[];
      variables: Record<string, string>;
      equations: string[];
    };
    expectedImpact: {
      metric: string;
      currentValue: number;
      projectedValue: number;
      improvement: string;
      monthlySavings?: string;
    }[];
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
    codeStructure: {
      component: string;
      purpose: string;
      code: string;
    }[];
    dashboard: {
      widgets: {
        type: string;
        title: string;
        dataSource: string;
        visualization: string;
      }[];
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
}

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result: GeminiAnalysisResult | null;
  error: string | null;
}

export interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}
