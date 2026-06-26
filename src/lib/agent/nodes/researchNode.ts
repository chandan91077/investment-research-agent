import { tavilySearch } from "../../tools/tavilySearch";
import { ResearchLog } from "../../../types";

export async function researchNode(state: any) {
  const companyName = state.companyName;
  const logs: ResearchLog[] = [];
  
  const pushLog = (msg: string, source: 'system' | 'research' | 'analyze' | 'decision' | 'error' = 'research') => {
    logs.push({
      timestamp: new Date().toLocaleTimeString(),
      source,
      message: msg
    });
  };

  pushLog(`Initializing comprehensive research pipeline for "${companyName}"...`, 'system');

  // Search 1: Financials
  pushLog(`Querying financial statements, revenue margins, and balance sheet indicators...`);
  const financialResults = await tavilySearch(
    `${companyName} recent financial results revenue growth operating profit margin debt cash`,
    (l) => logs.push(l)
  );
  
  // Search 2: News & Sentiment
  pushLog(`Querying current press coverage, industry developments, and operational risk factors...`);
  const newsResults = await tavilySearch(
    `${companyName} recent news developments products controversies executive leadership`,
    (l) => logs.push(l)
  );

  // Resolve a likely ticker from findings
  let ticker = "";
  const combinedText = [...financialResults, ...newsResults].map(r => r.title + " " + r.content).join(" ");
  
  // Attempt to parse ticker (e.g. NYSE: INFY, NASDAQ: MSFT, NSE: ZOMATO)
  const tickerMatch = combinedText.match(/\b(NASDAQ|NYSE|NSE|BSE|TADAWUL)\s*:\s*([A-Z0-9.\-]+)\b/i) ||
                      combinedText.match(/\b([A-Z0-9.\-]+)\s*\((NASDAQ|NYSE|NSE|BSE|TADAWUL)\)/i);
  if (tickerMatch) {
    ticker = (tickerMatch[2] || tickerMatch[1]).toUpperCase();
    pushLog(`Identified stock symbol: [${ticker}] from web indexing.`);
  } else {
    // Heuristics mapping
    const lower = companyName.toLowerCase();
    if (lower.includes("zomato")) ticker = "ZOMATO";
    else if (lower.includes("infosys")) ticker = "INFY";
    else if (lower.includes("saasify")) ticker = "SAAS";
    else ticker = companyName.split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
    pushLog(`Symbol resolved to [${ticker}] via corporate database heuristics.`);
  }

  const financialsRaw = financialResults.map(r => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n---\n\n");
  const newsRaw = newsResults.map(r => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n---\n\n");

  pushLog(`Data ingestion completed. Forwarding research data packet to the Analyst Node...`, 'system');

  return {
    ticker,
    logs,
    financialsRaw,
    newsRaw
  };
}
