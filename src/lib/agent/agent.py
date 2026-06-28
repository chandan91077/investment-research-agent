import sys
import os
import json
import time
import re
from datetime import datetime
from typing import Dict, Any, List, TypedDict

# Load environment variables from local Next.js env configuration
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env.local")

# Import LangChain / LangGraph items
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

# Pydantic support
from pydantic import BaseModel, Field

# Ensure output buffering doesn't delay SSE stream
sys.stdout.reconfigure(line_buffering=True)

# Define Helper Log Pushers
def push_log(message: str, source: str = "system"):
    log_payload = {
        "type": "log",
        "message": {
            "timestamp": datetime.now().strftime("%I:%M:%S %p"),
            "source": source,
            "message": message
        }
    }
    print(json.dumps(log_payload), flush=True)

# ----------------------------------------------------
# 1. State and Schemas
# ----------------------------------------------------
class BulletPoint(BaseModel):
    heading: str
    detail: str

class Highlight(BaseModel):
    label: str
    value: str

class VerdictBreakdown(BaseModel):
    verdict: str
    confidenceScore: int
    growthOutlook: List[BulletPoint]
    riskFactors: List[BulletPoint]
    marketSentiment: List[BulletPoint]
    finalReasoning: List[BulletPoint]
    financialHighlights: List[Highlight]

class AgentState(TypedDict):
    companyName: str
    ticker: str
    financialsRaw: str
    newsRaw: str
    analysisText: str
    breakdown: Dict[str, Any]

# ----------------------------------------------------
# 2. Dynamic LLM Factory
# ----------------------------------------------------
def get_llm():
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if gemini_key and gemini_key != "mock" and gemini_key != "":
        from langchain_google_genai import ChatGoogleGenerativeAI
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        version = os.getenv("GEMINI_API_VERSION")
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=gemini_key,
            apiVersion=version if version else None,
            temperature=0.2
        )
    elif openai_key and openai_key != "mock" and openai_key != "":
        from langchain_openai import ChatOpenAI
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return ChatOpenAI(
            model=model_name,
            api_key=openai_key,
            temperature=0.2
        )
    return None

# ----------------------------------------------------
# 3. Web Search (Tavily HTTP Client)
# ----------------------------------------------------
def tavily_search(query: str) -> List[Dict[str, str]]:
    api_key = os.getenv("TAVILY_API_KEY")
    push_log(f"Initiating Tavily web search: \"{query}\"...", "research")

    # Fallback to local indexes if API Key is not set or configured as mock
    if not api_key or api_key == "mock" or api_key == "":
        push_log("[MOCK MODE] No TAVILY_API_KEY detected. Fetching pre-compiled research indices...", "research")
        time.sleep(0.8)
        return get_mock_search_results(query)

    try:
        import requests
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": 5
            },
            timeout=10
        )
        if response.status_code != 200:
            raise Exception(f"Tavily search API error: {response.reason}")
        
        data = response.json()
        results = data.get("results", [])
        push_log(f"Web search completed. Retrieved {len(results)} relevant documents.", "research")
        return [{"title": r["title"], "url": r["url"], "content": r["content"]} for r in results]
    except Exception as e:
        push_log(f"Tavily query failed: {str(e)}. Defaulting to mock local database...", "error")
        return get_mock_search_results(query)

def get_mock_search_results(query: str) -> List[Dict[str, str]]:
    q = query.lower()
    if "zomato" in q:
        return [
            {
                "title": "Zomato Q4 FY26 Financial Highlights: Path to Profitability",
                "url": "https://finance.example.com/zomato-q4-fy26",
                "content": "Zomato reported a stellar Q4 FY26 performance. Revenue grew 35% Year-on-Year to INR 3,850 Crores, driven by strong growth in Blinkit (Quick Commerce) which grew 90% YoY. EBITDA margins for food delivery reached 6.2%, while Blinkit turned EBITDA positive for the first time. Net Profit stood at INR 250 Crores compared to INR 175 Crores in the previous quarter."
            },
            {
                "title": "Blinkit leads Zomato's Valuation Rerating by Top Brokerages",
                "url": "https://brokerage.example.com/zomato-valuation-blinkit",
                "content": "Brokerages have upgraded Zomato to a BUY rating, target price INR 280. The primary catalyst is the Quick Commerce division (Blinkit) which is capturing market share from traditional retail and e-commerce players. The average order value (AOV) increased to INR 635. Market share in quick commerce sits at 46%, ahead of Zepto and Instamart."
            },
            {
                "title": "Zomato faces rising delivery partner costs and regulatory hurdles",
                "url": "https://regulatory.example.com/zomato-risks-compliance",
                "content": "The gig economy faces potential regulatory scrutiny regarding delivery partner benefits and minimum wage policies in India. Furthermore, competitors Swiggy (post-IPO) and Zepto are ramping up promotional spend, potentially leading to margin pressures in Q1 FY27. Employee stock option (ESOP) costs remain high at 8% of revenue."
            }
        ]
    elif "infosys" in q:
        return [
            {
                "title": "Infosys FY26 Financials: Low Discretionary Spend Drags Revenue Growth",
                "url": "https://finance.example.com/infosys-fy26-results",
                "content": "Infosys reported FY26 constant currency revenue growth of 2.5%, missing initial guidance of 4-7%. Operating margins contracted by 80 bps to 20.2% due to rising salary costs and lower utilization rates. Digital services accounted for 62.5% of total revenue. Net profit grew 1.8% YoY to INR 26,400 Crores."
            },
            {
                "title": "Infosys signs $1.5 Billion Generative AI Deal with Global Bank",
                "url": "https://tech.example.com/infosys-generative-ai-deal",
                "content": "Infosys secured a mega-deal worth $1.5B over 5 years to overhaul the core banking system of a tier-1 European financial institution using its Topaz AI suite. However, executive management noted that actual revenue translation will be back-ended and discretionary spending in IT remains depressed across retail and manufacturing sectors."
            },
            {
                "title": "IT Sector Headwinds: Attrition falls but Hiring remains muted at Infosys",
                "url": "https://hr.example.com/infosys-attrition-hiring-fy26",
                "content": "Infosys' LTM attrition rate fell to a record low of 12.1%, down from 19.5% last year. The company added only 2,500 net new employees in FY26, signaling cautious hiring practices. Talent bench utilization remains high at 84%. Geopolitical conflicts and sluggish US enterprise tech spending remain major headwind factors."
            }
        ]
    elif "saasify" in q or "startup" in q:
        return [
            {
                "title": "SaaSify AI Series A Funding: Raises $12M led by Sequoia India & Altuni Labs",
                "url": "https://crunchbase.example.com/saasify-ai-funding",
                "content": "SaaSify AI, an AI-powered agentic workflow builder for mid-market enterprises, announced a $12M Series A funding round. The startup has reached an Annual Recurring Revenue (ARR) of $2.4M, growing at 250% year-on-year. Net Revenue Retention (NRR) is exceptionally high at 132% with active customer accounts doubling in the last 6 months."
            },
            {
                "title": "Enterprise Agent Market Heat: Can SaaSify compete with Salesforce Agentforce?",
                "url": "https://techcrunch.example.com/saasify-vs-agentforce",
                "content": "SaaSify AI distinguishes itself by offering custom-trained, locally-hosted LLM agents that integrate with legacy ERPs like SAP and Oracle, which cloud-native competitors struggle to support. However, Salesforce's aggressive Agentforce rollout and Microsoft's Copilot Studio represent significant enterprise distribution headwinds for smaller startups."
            },
            {
                "title": "SaaSify AI Unit Economics: High Gross Margin but steep GPU infrastructure costs",
                "url": "https://venture.example.com/saasify-unit-economics",
                "content": "SaaSify boasts a gross margin of 78%. However, cash burn remains elevated at $300k/month, driven by high GPU fine-tuning and inference costs on AWS. The company has 8 months of runway remaining before needing to raise its Series B. Churn is low at 0.5% monthly."
            }
        ]
    return [
        {
            "title": f"{query} Corporate Profile and Recent Press Releases",
            "url": "https://news.example.com/default-company",
            "content": f"{query} is showing stable core operations with moderate progress. The company's recent filings indicate focus on digital transformation, process efficiency, and cost reductions. Industry trends remain mixed with general macroeconomic tailwinds but specific regulatory risks relating to data security and labor compliance."
        },
        {
            "title": f"{query} Industry Position and Market Share Analysis",
            "url": "https://market.example.com/default-analysis",
            "content": f"In terms of competitive positioning, {query} is a mid-tier operator with moderate market share. Growth rates are currently aligned with the GDP average (4-6%). Operating margin sits at 12-14%. Competitors are investing heavily in automation, creating capital expenditure pressures."
        }
    ]

# ----------------------------------------------------
# 4. Graph Nodes Implementation
# ----------------------------------------------------
async def research_node(state: AgentState) -> Dict[str, Any]:
    company_name = state["companyName"]
    push_log(f"Initializing comprehensive research pipeline for \"{company_name}\"...", "system")

    # Search 1: Financials
    push_log("Querying financial statements, revenue margins, and balance sheet indicators...", "research")
    financial_results = tavily_search(f"{company_name} recent financial results revenue growth operating profit margin debt cash")

    # Search 2: News & Sentiment
    push_log("Querying current press coverage, industry developments, and operational risk factors...", "research")
    news_results = tavily_search(f"{company_name} recent news developments products controversies executive leadership")

    # Resolve symbol ticker
    ticker = ""
    combined_text = " ".join([r["title"] + " " + r["content"] for r in financial_results + news_results])
    ticker_match = re.search(r"\b(NASDAQ|NYSE|NSE|BSE|TADAWUL)\s*:\s*([A-Z0-9.\-]+)\b", combined_text, re.IGNORECASE) or \
                   re.search(r"\b([A-Z0-9.\-]+)\s*\((NASDAQ|NYSE|NSE|BSE|TADAWUL)\)", combined_text, re.IGNORECASE)
    
    if ticker_match:
        ticker = (ticker_match.group(2) or ticker_match.group(1)).upper()
        push_log(f"Identified stock symbol: [{ticker}] from web indexing.", "research")
    else:
        lower = company_name.lower()
        if "zomato" in lower:
            ticker = "ZOMATO"
        elif "infosys" in lower:
            ticker = "INFY"
        elif "saasify" in lower:
            ticker = "SAAS"
        else:
            ticker = re.sub(r"[^a-zA-Z]", "", company_name.split(" ")[0]).upper()
        push_log(f"Symbol resolved to [{ticker}] via corporate database heuristics.", "research")

    financials_raw = "\n\n---\n\n".join([f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}" for r in financial_results])
    news_raw = "\n\n---\n\n".join([f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}" for r in news_results])

    push_log("Data ingestion completed. Forwarding research data packet to the Analyst Node...", "system")

    return {
        "ticker": ticker,
        "financialsRaw": financials_raw,
        "newsRaw": news_raw
    }

async def analysis_node(state: AgentState) -> Dict[str, Any]:
    company_name = state["companyName"]
    ticker = state["ticker"]
    push_log(f"Analyzing compiled financials and sentiment trackers for \"{company_name}\"...", "system")
    push_log("Running corporate valuation checks and assessing regulatory exposure...", "analyze")

    model = get_llm()
    analysis_text = ""

    if model:
        try:
            prompt = f"""You are a Senior Investment Analyst. You need to analyze the following raw research data for the company "{company_name}" (Ticker: "{ticker}").
            
            === RAW FINANCIALS ===
            {state['financialsRaw']}
            
            === RAW NEWS & SENTIMENT ===
            {state['newsRaw']}
            
            Conduct a thorough analysis covering:
            1. Growth Outlook: Core revenue drivers, expansion velocity, margin changes.
            2. Risk Factors: Macro, competitive, operational, or compliance threats.
            3. Market Sentiment: Media tone, sentiment direction (bullish/bearish/neutral).
            4. Financial Highlights: Core metrics like margins, revenue totals, profits.
            
            Write a highly analytical, concise report outlining these points."""
            
            response = model.invoke([HumanMessage(content=prompt)])
            analysis_text = response.content
            push_log("Analyst model completed processing. Synthesis report generated.", "analyze")
        except Exception as e:
            extra = ""
            if "404" in str(e):
                extra = fetch_available_models_help()
            push_log(f"LLM Analysis error: {str(e)}{extra}. Falling back to pre-compiled reports.", "error")
            analysis_text = get_mock_analysis_text(company_name)
    else:
        push_log("Utilizing local financial index databases to extract analyst reviews...", "analyze")
        time.sleep(1.0)
        analysis_text = get_mock_analysis_text(company_name)
        push_log("Heuristic profiling loaded successfully.", "analyze")

    push_log("Analyst evaluation complete. Passing report to Decision Node...", "system")
    return {
        "analysisText": analysis_text
    }

async def decision_node(state: AgentState) -> Dict[str, Any]:
    company_name = state["companyName"]
    ticker = state["ticker"]
    push_log(f"Formulating final investment verdict for \"{company_name}\"...", "system")
    push_log("Running analytical findings through investment filters (Growth vs Risk vs Sentiment)...", "decision")

    model = get_llm()
    breakdown = {}

    if model:
        try:
            prompt = f"""You are the Investment Committee Chair. You must review the following analyst report for "{company_name}" (Ticker: "{ticker}") and make a final investment decision: either "INVEST" or "PASS".
            
            === ANALYST REPORT ===
            {state['analysisText']}
            
            Based on this report, formulate a definitive verdict.
            You must respond with a JSON object. Ensure it is valid JSON enclosed in a ```json ``` code block.
            
            JSON Schema required:
            {{
              "verdict": "INVEST" | "PASS",
              "confidenceScore": number (0 to 100),
              "growthOutlook": [
                {{ "heading": "Short heading", "detail": "Detailed explanation" }}
              ],
              "riskFactors": [
                {{ "heading": "Short heading", "detail": "Detailed explanation" }}
              ],
              "marketSentiment": [
                {{ "heading": "Short heading", "detail": "Detailed explanation" }}
              ],
              "finalReasoning": [
                {{ "heading": "Short heading", "detail": "Detailed explanation" }}
              ],
              "financialHighlights": [
                {{ "label": "Label", "value": "Value" }}
              ]
            }}
            
            Provide 2-3 points for each list section. Be sharp, confident, and professional."""
            
            response = model.invoke([HumanMessage(content=prompt)])
            content_text = response.content
            
            # Extract JSON block
            json_match = re.search(r"```json\s*([\s\S]*?)\s*```", content_text) or \
                         re.search(r"{[\s\S]*}", content_text)
            
            json_str = json_match.group(1) if json_match else content_text
            breakdown = json.loads(json_str.strip())
            push_log(f"Structured decision JSON successfully compiled. Verdict: [{breakdown.get('verdict')}] with confidence {breakdown.get('confidenceScore')}%", "decision")
        except Exception as e:
            extra = ""
            if "404" in str(e):
                extra = fetch_available_models_help()
            push_log(f"Decision structuring failed: {str(e)}{extra}. Defaulting to pre-compiled structured layout.", "error")
            breakdown = get_mock_verdict(company_name)
    else:
        push_log(f"Committee reviewing pre-analyzed filings for \"{company_name}\"...", "decision")
        time.sleep(1.2)
        breakdown = get_mock_verdict(company_name)
        push_log(f"Investment verdict rendered: [{breakdown['verdict']}] (Confidence: {breakdown['confidenceScore']}%)", "system")

    push_log("Investment Research Dossier compiled and locked. Ready for rendering.", "system")
    return {
        "breakdown": breakdown
    }

# ----------------------------------------------------
# 5. Diagnostic Help function (ListModels API)
# ----------------------------------------------------
def fetch_available_models_help() -> str:
    try:
        import requests
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key != "mock" and api_key != "":
            res = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}", timeout=5)
            if res.status_code == 200:
                data = res.json()
                models = [m["name"].replace("models/", "") for m in data.get("models", [])]
                return f" // [HELP] Available models: {', '.join(models)}. Override using GEMINI_MODEL in your env."
    except Exception:
        pass
    return ""

# ----------------------------------------------------
# 6. Mock Data Fallbacks
# ----------------------------------------------------
def get_mock_analysis_text(company_name: str) -> str:
    lower = company_name.lower()
    if "zomato" in lower:
        return """ZOMATO ANALYST REPORT:
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
        - Food Delivery EBITDA: 6.2%"""
    elif "infosys" in lower:
        return """INFOSYS ANALYST REPORT:
        Growth Outlook:
        - Constant currency revenue growth is slow (2.5% YoY) due to contraction in discretionary enterprise software upgrades.
        - Strong performance in long-term deals, including a $1.5B bank deal utilizing their Topaz Generative AI framework.
        
        Risk Factors:
        - Corporate cost reductions in Europe/US drag immediate revenue.
        - Margin compression to 20.2% driven by employee retention costs and lower pricing power.
        
        Sentiment:
        - Neutral/Bearish: Investors are cautious due to low guidance and general enterprise tech headwinds.
        
        Financial Highlights:
        - CC Rev Growth: 2.5% (Missed expectations)
        - Operating Margin: 20.2% (-80 bps)
        - Net Profit: INR 26,400 Cr (+1.8% YoY)"""
    elif "saasify" in lower or "startup" in lower:
        return """SAASIFY AI ANALYST REPORT:
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
        - Monthly Burn: $300k"""
    return f"""{company_name} ANALYST REPORT:
    Growth Outlook:
    - Stable growth aligned with macroeconomic expansion (4-6% YoY). Stable digital transition.
    
    Risk Factors:
    - Low competitive barriers, high pressure from larger scale competitors.
    
    Sentiment:
    - Neutral, low social and news media volatility.
    
    Financial Highlights:
    - Revenue Growth: +5.0%
    - Operating Margin: 12.0%"""

def get_mock_verdict(company_name: str) -> Dict[str, Any]:
    lower = company_name.lower()
    if "zomato" in lower:
        return {
            "verdict": "INVEST",
            "confidenceScore": 85,
            "growthOutlook": [
                {
                    "heading": "Blinkit Hyper-Scale",
                    "detail": "Quick commerce division grew 90% YoY, representing a monumental shift in retail distribution and capturing significant market share in tier-1 cities."
                },
                {
                    "heading": "Food Delivery Profitability",
                    "detail": "Food delivery contribution margins have solidified at 6.2%, generating reliable, recurring cash flows to finance expansion."
                }
            ],
            "riskFactors": [
                {
                    "heading": "Intense Hyperlocal Competition",
                    "detail": "Aggressive discounting and capital deployment from Swiggy (post-IPO) and Zepto could squeeze take-rates in the near term."
                },
                {
                    "heading": "Gig Economy Regulation",
                    "detail": "Potential social security compliance and minimum wage regulations for delivery partners could inflate operating costs."
                }
            ],
            "marketSentiment": [
                {
                    "heading": "Brokerage Upgrade Cycle",
                    "detail": "Major institutional desks have upgraded the stock to a Strong Buy, following EBITDA positive execution at Blinkit."
                },
                {
                    "heading": "Retail Enthusiasm",
                    "detail": "Retail momentum remains high as the brand demonstrates consistent execution in digital food convenience."
                }
            ],
            "finalReasoning": [
                {
                    "heading": "Market Dominance & Margin Expansion",
                    "detail": "Zomato has successfully navigated the scale phase and is now entering a monetization phase, with Blinkit acting as an explosive call option."
                },
                {
                    "heading": "High-Confidence Buy",
                    "detail": "Despite premium valuations (PE ratios), the sheer growth velocity in Quick Commerce justifies the entry point."
                }
            ],
            "financialHighlights": [
                { "label": "Q4 FY26 Revenue", "value": "INR 3,850 Cr (+35% YoY)" },
                { "label": "Consolidated Net Profit", "value": "INR 250 Cr (vs 175 Cr QoQ)" },
                { "label": "Quick Commerce Growth", "value": "+90% YoY (EBITDA Breakeven)" }
            ]
        }
    elif "infosys" in lower:
        return {
            "verdict": "PASS",
            "confidenceScore": 72,
            "growthOutlook": [
                {
                    "heading": "Generative AI Tailwinds",
                    "detail": "The Topaz AI suite is driving large enterprise deal signings, including a $1.5B multi-year banking contract."
                },
                {
                    "heading": "Digital Services Resilience",
                    "detail": "Digital services remain a core revenue base, accounting for over 62.5% of total business."
                }
            ],
            "riskFactors": [
                {
                    "heading": "Discretionary Tech Squeeze",
                    "detail": "Enterprise clients are aggressively cutting discretionary spending, leading to historic lows in constant currency growth (2.5%)."
                },
                {
                    "heading": "Operating Margin Compression",
                    "detail": "Operating margins compressed by 80 bps to 20.2%, driven by rising salary costs and low bench utilization."
                }
            ],
            "marketSentiment": [
                {
                    "heading": "Macro Bearishness",
                    "detail": "Analyst sentiment is highly cautious due to soft near-term guidance and global IT spending bottlenecks."
                },
                {
                    "heading": "Low Valuation Beta",
                    "detail": "Stock exhibits low volatility, trading sideways as market awaits global interest rate cuts."
                }
            ],
            "finalReasoning": [
                {
                    "heading": "Sluggish Near-Term Outlook",
                    "detail": "While Infosys has deep defensive strength and yields high dividends, the structural slowdown in US enterprise IT projects limits upside potential."
                },
                {
                    "heading": "Awaiting Re-entry Signals",
                    "detail": "We recommend a Pass for active capital appreciation. Recommend re-entering when constant currency guidance crosses 5%."
                }
            ],
            "financialHighlights": [
                { "label": "FY26 Revenue Growth", "value": "+2.5% CC (Missed guidance)" },
                { "label": "Operating Margin", "value": "20.2% (-80 bps YoY)" },
                { "label": "Annual Net Profit", "value": "INR 26,400 Cr (+1.8% YoY)" }
            ]
        }
    elif "saasify" in lower or "startup" in lower:
        return {
            "verdict": "INVEST",
            "confidenceScore": 78,
            "growthOutlook": [
                {
                    "heading": "Exceptional ARR Expansion",
                    "detail": "ARR surged by 250% YoY to $2.4M, indicating a high product-market fit in enterprise workflow automation."
                },
                {
                    "heading": "Outstanding Retention Dynamics",
                    "detail": "Net Revenue Retention (NRR) is at 132%, highlighting high upsell capabilities and customer dependency."
                }
            ],
            "riskFactors": [
                {
                    "heading": "Imminent Cash Runway Crunch",
                    "detail": "The startup is burning $300k/month against its Series A reserves, leaving only 8 months of operational runway."
                },
                {
                    "heading": "GPU Infrastructure Burn",
                    "detail": "High dependency on raw cloud GPU servers pushes gross cost of goods sold, putting stress on operating cash flows."
                }
            ],
            "marketSentiment": [
                {
                    "heading": "Early Stage VC Interest",
                    "detail": "Top-tier VCs are tracking the upcoming Series B round, driven by excellent retention numbers."
                },
                {
                    "heading": "Enterprise Trust Hurdles",
                    "detail": "Some mid-market clients express concern over the long-term survival and hosting stability of early-stage SaaS vendors."
                }
            ],
            "finalReasoning": [
                {
                    "heading": "Strong Product Velocity",
                    "detail": "SaaSify is capturing market share from legacy ERP integrations due to its localized LLM deployment capability."
                },
                {
                    "heading": "High-Risk, High-Reward Buy",
                    "detail": "We recommend an Invest verdict, contingent on securing the Series B term sheet in the next 90 days. The unit economics (78% gross margin) are stellar."
                }
            ],
            "financialHighlights": [
                { "label": "ARR", "value": "$2.4M (+250% YoY)" },
                { "label": "Gross Profit Margin", "value": "78.0%" },
                { "label": "Net Revenue Retention", "value": "132.0%" }
            ]
        }
    
    return {
        "verdict": "PASS",
        "confidenceScore": 55,
        "growthOutlook": [
            {
                "heading": "Stable Core Revenue",
                "detail": "The company maintains stable operations with GDP-correlated revenue growth between 4-6% annually."
            }
        ],
        "riskFactors": [
            {
                "heading": "Market Squeeze & Pricing Pressure",
                "detail": "Low technological barriers expose the company to price wars from larger scale competitors."
            }
        ],
        "marketSentiment": [
            {
                "heading": "Neutral Market Coverage",
                "detail": "Limited institutional coverage and quiet social media metrics reflect low volatility and momentum."
            }
        ],
        "finalReasoning": [
            {
                "heading": "Insufficient Growth Catalysts",
                "detail": "Without clear market differentiators or scalability hooks, capital is better allocated to higher-alpha positions."
            }
        ],
        "financialHighlights": [
            { "label": "Estimated Growth Rate", "value": "+4.5% YoY" },
            { "label": "Operating Margin", "value": "13.0%" }
        ]
    }

# ----------------------------------------------------
# 7. Main Orchestration Runtime
# ----------------------------------------------------
async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"type": "error", "message": "Company query argument is required."}))
        sys.exit(1)

    company_query = sys.argv[1]

    # Initialize Graph
    builder = StateGraph(AgentState)
    builder.add_node("research", research_node)
    builder.add_node("analyze", analysis_node)
    builder.add_node("decide", decision_node)

    builder.add_edge(START, "research")
    builder.add_edge("research", "analyze")
    builder.add_edge("analyze", "decide")
    builder.add_edge("decide", END)

    graph = builder.compile()

    try:
        # Run graph execution
        result = await graph.ainvoke({"companyName": company_query})
        
        # Output final result package to stdout
        final_payload = {
            "type": "result",
            "result": {
                "companyName": company_query,
                "ticker": result.get("ticker", company_query.upper()),
                "breakdown": result.get("breakdown", {})
            }
        }
        print(json.dumps(final_payload), flush=True)

    except Exception as e:
        print(json.dumps({"type": "error", "message": f"Execution error: {str(e)}"}), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
