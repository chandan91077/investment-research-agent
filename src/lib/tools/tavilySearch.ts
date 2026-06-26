import { ResearchLog } from "../../types";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

export async function tavilySearch(
  query: string,
  logCallback?: (log: ResearchLog) => void
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (logCallback) {
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      source: "research",
      message: `Initiating Tavily web search: "${query}"...`,
    });
  }

  // Fallback to mock search if API key is not present or if explicitly configured
  if (!apiKey || apiKey === "mock" || apiKey === "") {
    if (logCallback) {
      logCallback({
        timestamp: new Date().toLocaleTimeString(),
        source: "research",
        message: `[MOCK MODE] No TAVILY_API_KEY detected. Fetching pre-compiled research indices...`,
      });
    }
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getMockSearchResults(query);
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = (data.results || []) as TavilyResult[];

    if (logCallback) {
      logCallback({
        timestamp: new Date().toLocaleTimeString(),
        source: "research",
        message: `Web search completed. Retrieved ${results.length} relevant documents.`,
      });
    }

    return results;
  } catch (error: any) {
    if (logCallback) {
      logCallback({
        timestamp: new Date().toLocaleTimeString(),
        source: "error",
        message: `Tavily query failed: ${error.message}. Defaulting to mock local database...`,
      });
    }
    return getMockSearchResults(query);
  }
}

function getMockSearchResults(query: string): TavilyResult[] {
  const lowercaseQuery = query.toLowerCase();

  if (lowercaseQuery.includes("zomato")) {
    return [
      {
        title: "Zomato Q4 FY26 Financial Highlights: Path to Profitability",
        url: "https://finance.example.com/zomato-q4-fy26",
        content: "Zomato reported a stellar Q4 FY26 performance. Revenue grew 35% Year-on-Year to INR 3,850 Crores, driven by strong growth in Blinkit (Quick Commerce) which grew 90% YoY. EBITDA margins for food delivery reached 6.2%, while Blinkit turned EBITDA positive for the first time. Net Profit stood at INR 250 Crores compared to INR 175 Crores in the previous quarter.",
      },
      {
        title: "Blinkit leads Zomato's Valuation Rerating by Top Brokerages",
        url: "https://brokerage.example.com/zomato-valuation-blinkit",
        content: "Brokerages have upgraded Zomato to a BUY rating, target price INR 280. The primary catalyst is the Quick Commerce division (Blinkit) which is capturing market share from traditional retail and e-commerce players. The average order value (AOV) increased to INR 635. Market share in quick commerce sits at 46%, ahead of Zepto and Instamart.",
      },
      {
        title: "Zomato faces rising delivery partner costs and regulatory hurdles",
        url: "https://regulatory.example.com/zomato-risks-compliance",
        content: "The gig economy faces potential regulatory scrutiny regarding delivery partner benefits and minimum wage policies in India. Furthermore, competitors Swiggy (post-IPO) and Zepto are ramping up promotional spend, potentially leading to margin pressures in Q1 FY27. Employee stock option (ESOP) costs remain high at 8% of revenue.",
      }
    ];
  }

  if (lowercaseQuery.includes("infosys")) {
    return [
      {
        title: "Infosys FY26 Financials: Low Discretionary Spend Drags Revenue Growth",
        url: "https://finance.example.com/infosys-fy26-results",
        content: "Infosys reported FY26 constant currency revenue growth of 2.5%, missing initial guidance of 4-7%. Operating margins contracted by 80 bps to 20.2% due to rising salary costs and lower utilization rates. Digital services accounted for 62.5% of total revenue. Net profit grew 1.8% YoY to INR 26,400 Crores.",
      },
      {
        title: "Infosys signs $1.5 Billion Generative AI Deal with Global Bank",
        url: "https://tech.example.com/infosys-generative-ai-deal",
        content: "Infosys secured a mega-deal worth $1.5B over 5 years to overhaul the core banking system of a tier-1 European financial institution using its Topaz AI suite. However, executive management noted that actual revenue translation will be back-ended and discretionary spending in IT remains depressed across retail and manufacturing sectors.",
      },
      {
        title: "IT Sector Headwinds: Attrition falls but Hiring remains muted at Infosys",
        url: "https://hr.example.com/infosys-attrition-hiring-fy26",
        content: "Infosys' LTM attrition rate fell to a record low of 12.1%, down from 19.5% last year. The company added only 2,500 net new employees in FY26, signaling cautious hiring practices. Talent bench utilization remains high at 84%. Geopolitical conflicts and sluggish US enterprise tech spending remain major headwind factors.",
      }
    ];
  }

  // Custom Startup: Let's invent "SaaSify AI" (an AI-powered workflow automation platform)
  if (lowercaseQuery.includes("saasify") || lowercaseQuery.includes("startup")) {
    return [
      {
        title: "SaaSify AI Series A Funding: Raises $12M led by Sequoia India & Altuni Labs",
        url: "https://crunchbase.example.com/saasify-ai-funding",
        content: "SaaSify AI, an AI-powered agentic workflow builder for mid-market enterprises, announced a $12M Series A funding round. The startup has reached an Annual Recurring Revenue (ARR) of $2.4M, growing at 250% year-on-year. Net Revenue Retention (NRR) is exceptionally high at 132% with active customer accounts doubling in the last 6 months.",
      },
      {
        title: "Enterprise Agent Market Heat: Can SaaSify compete with Salesforce Agentforce?",
        url: "https://techcrunch.example.com/saasify-vs-agentforce",
        content: "SaaSify AI distinguishes itself by offering custom-trained, locally-hosted LLM agents that integrate with legacy ERPs like SAP and Oracle, which cloud-native competitors struggle to support. However, Salesforce's aggressive Agentforce rollout and Microsoft's Copilot Studio represent significant enterprise distribution headwinds for smaller startups.",
      },
      {
        title: "SaaSify AI Unit Economics: High Gross Margin but steep GPU infrastructure costs",
        url: "https://venture.example.com/saasify-unit-economics",
        content: "SaaSify boasts a gross margin of 78%. However, cash burn remains elevated at $300k/month, driven by high GPU fine-tuning and inference costs on AWS. The company has 8 months of runway remaining before needing to raise its Series B. Churn is low at 0.5% monthly.",
      }
    ];
  }

  // Default fallback for any other company search
  return [
    {
      title: `${query} Corporate Profile and Recent Press Releases`,
      url: "https://news.example.com/default-company",
      content: `${query} is showing stable core operations with moderate progress. The company's recent filings indicate focus on digital transformation, process efficiency, and cost reductions. Industry trends remain mixed with general macroeconomic tailwinds but specific regulatory risks relating to data security and labor compliance.`,
    },
    {
      title: `${query} Industry Position and Market Share Analysis`,
      url: "https://market.example.com/default-analysis",
      content: `In terms of competitive positioning, ${query} is a mid-tier operator with moderate market share. Growth rates are currently aligned with the GDP average (4-6%). Operating margin sits at 12-14%. Competitors are investing heavily in automation, creating capital expenditure pressures.`,
    }
  ];
}
