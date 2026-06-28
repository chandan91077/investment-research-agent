import { getLLM } from "../llm";
import { ResearchLog } from "../../../types";

export async function analysisNode(state: any) {
  const logs: ResearchLog[] = [];
  const pushLog = (msg: string, source: 'system' | 'research' | 'analyze' | 'decision' | 'error' = 'analyze') => {
    logs.push({
      timestamp: new Date().toLocaleTimeString(),
      source,
      message: msg
    });
  };

  pushLog(`Analyzing compiled financials and sentiment trackers for "${state.companyName}"...`, 'system');
  pushLog(`Running corporate valuation checks and assessing regulatory exposure...`);

  const model = getLLM();
  let analysisText = "";

  if (model) {
    try {
      const prompt = `You are a Senior Investment Analyst. You need to analyze the following raw research data for the company "${state.companyName}" (Ticker: "${state.ticker}").
      
      === RAW FINANCIALS ===
      ${state.financialsRaw}
      
      === RAW NEWS & SENTIMENT ===
      ${state.newsRaw}
      
      Conduct a thorough analysis covering:
      1. Growth Outlook: Core revenue drivers, expansion velocity, margin changes.
      2. Risk Factors: Macro, competitive, operational, or compliance threats.
      3. Market Sentiment: Media tone, sentiment direction (bullish/bearish/neutral).
      4. Financial Highlights: Core metrics like margins, revenue totals, profits.
      
      Write a highly analytical, concise report outlining these points.`;
      
      const response = await model.invoke(prompt);
      analysisText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      pushLog(`Analyst model completed processing. Synthesis report generated.`);
    } catch (err: any) {
      let extra = "";
      if (err.message?.includes("404")) {
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey && apiKey !== "mock") {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await res.json();
            if (data.models) {
              const list = data.models.map((m: any) => m.name.replace("models/", ""));
              extra = ` // [HELP] Available models on this key: ${list.join(", ")}. Configure GEMINI_MODEL in your env.`;
            }
          }
        } catch (e) {}
      }
      pushLog(`LLM Analysis error: ${err.message}${extra}. Falling back to pre-compiled reports.`, 'error');
      analysisText = getMockAnalysisText(state.companyName);
    }
  } else {
    pushLog(`[MOCK MODE] Utilizing local financial index databases to extract analyst reviews...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    analysisText = getMockAnalysisText(state.companyName);
    pushLog(`Heuristic profiling loaded successfully.`);
  }

  pushLog(`Analyst evaluation complete. Passing report to Decision Node...`, 'system');

  return {
    logs,
    analysisText
  };
}

function getMockAnalysisText(companyName: string): string {
  const lower = companyName.toLowerCase();
  if (lower.includes("zomato")) {
    return `ZOMATO ANALYST REPORT:
    Growth Outlook:
    - Blinkit quick commerce hypergrowth is the primary valuation driver, with revenue soaring 90% YoY. Blinkit reached operational EBITDA break-even this quarter.
    - Food delivery remains highly stable, serving as a cash generator with a 6.2% contribution margin.
    
    Risk Factors:
    - The gig-work economy faces potential compliance pressure regarding labor welfare laws and benefits.
    - Discount battles with Swiggy and Zepto could erode profitability.
    
    Sentiment:
    - Highly bullish among brokerages due to Blinkit's speed of scale and path to profitability.
    
    Financial Highlights:
    - Revenue: INR 3,850 Cr (+35% YoY)
    - Net Profit: INR 250 Cr
    - Food Delivery EBITDA: 6.2%`;
  }
  if (lower.includes("infosys")) {
    return `INFOSYS ANALYST REPORT:
    Growth Outlook:
    - constant currency revenue growth is slow (2.5% YoY) due to contraction in discretionary enterprise software upgrades.
    - Strong performance in long-term deals, including a $1.5B bank deal utilizing their Topaz Generative AI framework.
    
    Risk Factors:
    - Corporate cost reductions in Europe/US drag immediate revenue.
    - Margin compression to 20.2% driven by employee retention costs and lower pricing power.
    
    Sentiment:
    - Neutral/Bearish: Investors are cautious due to low guidance and general enterprise tech headwinds.
    
    Financial Highlights:
    - CC Rev Growth: 2.5% (Missed expectations)
    - Operating Margin: 20.2% (-80 bps)
    - Net Profit: INR 26,400 Cr (+1.8% YoY)`;
  }
  if (lower.includes("saasify") || lower.includes("startup")) {
    return `SAASIFY AI ANALYST REPORT:
    Growth Outlook:
    - Hypergrowth trajectory with ARR reaching $2.4M, up 250% year-on-year.
    - Exceptionally high Net Revenue Retention (NRR) of 132% indicating strong customer satisfaction and upsells.
    
    Risk Factors:
    - Extreme cash burn at $300k/month against $12M Series A leaves only 8 months of runway before needing a Series B.
    - Highly reliant on expensive GPU hosting on cloud servers, squeezing operating cash flow.
    
    Sentiment:
    - Enthusiastic positive venture buzz, but enterprise clients worry about long-term startup viability.
    
    Financial Highlights:
    - ARR: $2.4M (+250% YoY)
    - Gross Margin: 78%
    - Monthly Burn: $300k`;
  }
  return `${companyName} ANALYST REPORT:
  Growth Outlook:
  - Stable growth aligned with macroeconomic expansion (4-6% YoY). Stable digital transition.
  
  Risk Factors:
  - Low competitive barriers, high pressure from larger scale players.
  
  Sentiment:
  - Neutral, low social and news media volatility.
  
  Financial Highlights:
  - Revenue Growth: +5.0%
  - Operating Margin: 12.0%`;
}
