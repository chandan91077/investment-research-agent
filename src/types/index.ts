export interface ResearchLog {
  timestamp: string;
  source: 'system' | 'research' | 'analyze' | 'decision' | 'error';
  message: string;
}

export interface BulletPoint {
  heading: string;
  detail: string;
}

export interface VerdictBreakdown {
  verdict: 'INVEST' | 'PASS';
  confidenceScore: number; // 0 - 100
  growthOutlook: BulletPoint[];
  riskFactors: BulletPoint[];
  marketSentiment: BulletPoint[];
  finalReasoning: BulletPoint[];
  financialHighlights: {
    label: string;
    value: string;
  }[];
}

export interface AgentResult {
  companyName: string;
  ticker: string;
  breakdown: VerdictBreakdown;
  logs: ResearchLog[];
}
