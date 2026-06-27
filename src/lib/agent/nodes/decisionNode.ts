import { getLLM } from "../llm";
import { ResearchLog, VerdictBreakdown } from "../../../types";

export async function decisionNode(state: any) {
  const logs: ResearchLog[] = [];
  const pushLog = (msg: string, source: 'system' | 'research' | 'analyze' | 'decision' | 'error' = 'decision') => {
    logs.push({
      timestamp: new Date().toLocaleTimeString(),
      source,
      message: msg
    });
  };

  pushLog(`Formulating final investment verdict for "${state.companyName}"...`, 'system');
  pushLog(`Running analytical findings through investment filters (Growth vs Risk vs Sentiment)...`);

  const model = getLLM();
  let breakdown: VerdictBreakdown;

  if (model) {
    try {
      const prompt = `You are the Investment Committee Chair. You must review the following analyst report for "${state.companyName}" (Ticker: "${state.ticker}") and make a final investment decision: either "INVEST" or "PASS".
      
      === ANALYST REPORT ===
      ${state.analysisText}
      
      Based on this report, formulate a definitive verdict. 
      You must respond with a JSON object. Ensure it is valid JSON enclosed in a \`\`\`json \`\`\` code block.
      
      JSON Schema required:
      {
        "verdict": "INVEST" | "PASS",
        "confidenceScore": number (0 to 100),
        "growthOutlook": [
          { "heading": "Short heading (3-6 words)", "detail": "Detailed explanation (1-2 sentences)" }
        ],
        "riskFactors": [
          { "heading": "Short heading (3-6 words)", "detail": "Detailed explanation (1-2 sentences)" }
        ],
        "marketSentiment": [
          { "heading": "Short heading (3-6 words)", "detail": "Detailed explanation (1-2 sentences)" }
        ],
        "finalReasoning": [
          { "heading": "Short heading (3-6 words)", "detail": "Detailed explanation (1-2 sentences)" }
        ],
        "financialHighlights": [
          { "label": "e.g., Q4 Revenue", "value": "e.g., INR 3,850 Cr (+35% YoY)" }
        ]
      }
      
      Provide 2-3 points for each list section. Be sharp, confident, and professional.`;

      const response = await model.invoke(prompt);
      const contentText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      
      // Extract JSON from markdown code block
      const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        contentText.match(/{[\s\S]*}/);
      
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : contentText;
      breakdown = JSON.parse(jsonString.trim());
      
      pushLog(`Structured decision JSON successfully compiled. Verdict: [${breakdown.verdict}] with confidence ${breakdown.confidenceScore}%`);
    } catch (err: any) {
      pushLog(`Decision structuring failed: ${err.message}. Defaulting to pre-compiled structured layout.`, 'error');
      breakdown = getMockVerdict(state.companyName);
    }
  } else {
    pushLog(`[MOCK MODE] Committee reviewing pre-analyzed filings for "${state.companyName}"...`);
    await new Promise(resolve => setTimeout(resolve, 1200));
    breakdown = getMockVerdict(state.companyName);
    pushLog(`Investment verdict rendered: [${breakdown.verdict}] (Confidence: ${breakdown.confidenceScore}%)`, 'system');
  }

  pushLog(`Investment Research Dossier compiled and locked. Ready for rendering.`, 'system');

  return {
    logs,
    breakdown
  };
}

function getMockVerdict(companyName: string): VerdictBreakdown {
  const lower = companyName.toLowerCase();
  
  if (lower.includes("zomato")) {
    return {
      verdict: "INVEST",
      confidenceScore: 85,
      growthOutlook: [
        {
          heading: "Blinkit Hyper-Scale",
          detail: "Quick commerce division grew 90% YoY, representing a monumental shift in retail distribution and capturing significant market share in tier-1 cities."
        },
        {
          heading: "Food Delivery Profitability",
          detail: "Food delivery contribution margins have solidified at 6.2%, generating reliable, recurring cash flows to finance expansion."
        }
      ],
      riskFactors: [
        {
          heading: "Intense Hyperlocal Competition",
          detail: "Aggressive discounting and capital deployment from Swiggy (post-IPO) and Zepto could squeeze take-rates in the near term."
        },
        {
          heading: "Gig Economy Regulation",
          detail: "Potential social security compliance and minimum wage regulations for delivery partners could inflate operating costs."
        }
      ],
      marketSentiment: [
        {
          heading: "Brokerage Upgrade Cycle",
          detail: "Major institutional desks have upgraded the stock to a Strong Buy, following EBITDA positive execution at Blinkit."
        },
        {
          heading: "Retail Enthusiasm",
          detail: "Retail momentum remains high as the brand demonstrates consistent execution in digital food convenience."
        }
      ],
      finalReasoning: [
        {
          heading: "Market Dominance & Margin Expansion",
          detail: "Zomato has successfully navigated the scale phase and is now entering a monetization phase, with Blinkit acting as an explosive call option."
        },
        {
          heading: "High-Confidence Buy",
          detail: "Despite premium valuations (PE ratios), the sheer growth velocity in Quick Commerce justifies the entry point."
        }
      ],
      financialHighlights: [
        { label: "Q4 FY26 Revenue", value: "INR 3,850 Cr (+35% YoY)" },
        { label: "Consolidated Net Profit", value: "INR 250 Cr (vs 175 Cr QoQ)" },
        { label: "Quick Commerce Growth", value: "+90% YoY (EBITDA Breakeven)" }
      ]
    };
  }

  if (lower.includes("infosys")) {
    return {
      verdict: "PASS",
      confidenceScore: 72,
      growthOutlook: [
        {
          heading: "Generative AI Tailwinds",
          detail: "The Topaz AI suite is driving large enterprise deal signings, including a $1.5B multi-year banking contract."
        },
        {
          heading: "Digital Services Resilience",
          detail: "Digital services remain a core revenue base, accounting for over 62.5% of total business."
        }
      ],
      riskFactors: [
        {
          heading: "Discretionary Tech Squeeze",
          detail: "Enterprise clients are aggressively cutting discretionary spending, leading to historic lows in constant currency growth (2.5%)."
        },
        {
          heading: "Operating Margin Compression",
          detail: "Operating margins compressed by 80 bps to 20.2%, driven by rising salary costs and low bench utilization."
        }
      ],
      marketSentiment: [
        {
          heading: "Macro Bearishness",
          detail: "Analyst sentiment is highly cautious due to soft near-term guidance and global IT spending bottlenecks."
        },
        {
          heading: "Low Valuation Beta",
          detail: "Stock exhibits low volatility, trading sideways as market awaits global interest rate cuts."
        }
      ],
      finalReasoning: [
        {
          heading: "Sluggish Near-Term Outlook",
          detail: "While Infosys has deep defensive strength and yields high dividends, the structural slowdown in US enterprise IT projects limits upside potential."
        },
        {
          heading: "Awaiting Re-entry Signals",
          detail: "We recommend a Pass for active capital appreciation. Recommend re-entering when constant currency guidance crosses 5%."
        }
      ],
      financialHighlights: [
        { label: "FY26 Revenue Growth", value: "+2.5% CC (Missed guidance)" },
        { label: "Operating Margin", value: "20.2% (-80 bps YoY)" },
        { label: "Annual Net Profit", value: "INR 26,400 Cr (+1.8% YoY)" }
      ]
    };
  }

  if (lower.includes("saasify") || lower.includes("startup")) {
    return {
      verdict: "INVEST",
      confidenceScore: 78,
      growthOutlook: [
        {
          heading: "Exceptional ARR Expansion",
          detail: "ARR surged by 250% YoY to $2.4M, indicating a high product-market fit in enterprise workflow automation."
        },
        {
          heading: "Outstanding Retention Dynamics",
          detail: "Net Revenue Retention (NRR) is at 132%, highlighting high upsell capabilities and customer dependency."
        }
      ],
      riskFactors: [
        {
          heading: "Imminent Cash Runway Crunch",
          detail: "The startup is burning $300k/month against its Series A reserves, leaving only 8 months of operational runway."
        },
        {
          heading: "GPU Infrastructure Burn",
          detail: "High dependency on raw cloud GPU servers pushes gross cost of goods sold, putting stress on operating cash flows."
        }
      ],
      marketSentiment: [
        {
          heading: "Early Stage VC Interest",
          detail: "Top-tier VCs are tracking the upcoming Series B round, driven by excellent retention numbers."
        },
        {
          heading: "Enterprise Trust Hurdles",
          detail: "Some mid-market clients express concern over the long-term survival and hosting stability of early-stage SaaS vendors."
        }
      ],
      finalReasoning: [
        {
          heading: "Strong Product Velocity",
          detail: "SaaSify is capturing market share from legacy ERP integrations due to its localized LLM deployment capability."
        },
        {
          heading: "High-Risk, High-Reward Buy",
          detail: "We recommend an Invest verdict, contingent on securing the Series B term sheet in the next 90 days. The unit economics (78% gross margin) are stellar."
        }
      ],
      financialHighlights: [
        { label: "Annual Recurring Revenue", value: "$2.4M (+250% YoY)" },
        { label: "Gross Profit Margin", value: "78.0%" },
        { label: "Net Revenue Retention", value: "132.0%" }
      ]
    };
  }

  // General default fallback
  return {
    verdict: "PASS",
    confidenceScore: 55,
    growthOutlook: [
      {
        heading: "Stable Core Revenue",
        detail: "The company maintains stable operations with GDP-correlated revenue growth between 4-6% annually."
      }
    ],
    riskFactors: [
      {
        heading: "Market Squeeze & Pricing Pressure",
        detail: "Low technological barriers expose the company to price wars from larger scale competitors."
      }
    ],
    marketSentiment: [
      {
        heading: "Neutral Market Coverage",
        detail: "Limited institutional coverage and quiet social media metrics reflect low volatility and momentum."
      }
    ],
    finalReasoning: [
      {
        heading: "Insufficient Growth Catalysts",
        detail: "Without clear market differentiators or scalability hooks, capital is better allocated to higher-alpha positions."
      }
    ],
    financialHighlights: [
      { label: "Estimated Growth Rate", value: "+4.5% YoY" },
      { label: "Operating Margin", value: "13.0%" }
    ]
  };
}
