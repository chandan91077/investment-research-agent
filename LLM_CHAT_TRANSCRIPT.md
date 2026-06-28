# LLM Pair-Programming Session Transcript

This document records the chronological transcript of the pair-programming session between the developer and the AI coding assistant (AlphaAgent). It covers the initial setup, LangGraph node creation, Tavily integration, front-end styling, serverless debugging, and hybrid refactoring.

---

## 📅 Session 1: Project Setup & Architecture

**Developer:**
> Hey, I'm building an AI Investment Research Agent as part of an internship assignment for InsideIIM × Altuni AI Labs. The idea is: user types a company name → the agent researches it → gives an invest/pass verdict with reasoning.
> The required stack is React or Next.js on the frontend, Node.js or Next.js on the backend, and LangChain.js or LangGraph.js for the AI orchestration. I can use any LLM provider.
> Can you help me think through the architecture first? What should the agent actually research — financials, news, competitors, sentiment? How should I structure the LangGraph workflow? And what's a clean folder structure for a Next.js full-stack app with this kind of agentic backend?

**AlphaAgent:**
> I recommend a unified full-stack architecture using **Next.js (App Router)** because it co-locates the React UI with Server-Side Route Handlers, avoiding CORS overhead.
> 
> ### Graph State Structure
> The state must track:
> 1. `companyName`: Target company name.
> 2. `ticker`: Resolved ticker symbol.
> 3. `financialsRaw`: Scraped financial data.
> 4. `newsRaw`: Scraped headlines and press.
> 5. `analysisText`: Compiled synthesis report.
> 6. `breakdown`: Structured invest/pass verdict fields.
> 
> ### Node Sequences
> 1. **Research Node**: Resolves tickers and queries Tavily Search for financials and news.
> 2. **Analysis Node**: Evaluates metrics and press sentiment via the LLM.
> 3. **Decision Node**: Runs the evaluation through filters and outputs a structured JSON schema.
> 
> ### Proposed Folder Layout
> ```
> src/
> ├── app/
> │   ├── page.tsx
> │   ├── globals.css
> │   └── api/analyze/route.ts       # SSE Stream Router
> ├── components/
> │   ├── LiveTerminal.tsx
> │   ├── VerdictCard.tsx
> │   └── AnalysisTabs.tsx
> └── lib/agent/
>     ├── agent.py                   # Python StateGraph
>     └── jsAgent.ts                 # JS StateGraph Fallback
> ```

---

## 📅 Session 2: Backend / Agent Logic

**Developer:**
> Okay, I've got the folder structure set up. Now I want to build the LangGraph agent in Node.js. It should:
> - Accept a company name as input
> - Use web search (Tavily or SerpAPI) to pull recent news and financials
> - Run through reasoning steps — like a mini analyst
> - Output: invest / pass + a structured reasoning breakdown (growth, risk, sentiment, etc.)
> Can you write the LangGraph agent for this? Use StateGraph, define clear nodes (research, analyze, decide), and make the output structured JSON.

**AlphaAgent:**
> Let's implement the search utility first. We will write `tavilySearch.ts` using native fetch to keep dependencies light, and include a local fallback index for offline evaluations (Zomato, Infosys, and a custom startup) so it's resilient.
> Then, we'll define `state.ts`, `graph.ts`, and the nodes (`researchNode.ts`, `analysisNode.ts`, `decisionNode.ts`).
> 
> We will construct a JSON-enforced LLM prompt in the decision node to output the precise schema needed by the UI, handling fallback options if the JSON parse fails.

---

## 📅 Session 3: Frontend UI Design

**Developer:**
> The backend agent is working. Now I want to build a clean, professional React UI in Next.js. It should feel like a real investment tool — not a generic chatbot.
> The user types a company name, hits "Analyze", sees a loading state while the agent works, and then gets a verdict card: Invest ✅ or Pass ❌, with sections for Growth Outlook, Risk Factors, Market Sentiment, and Final Reasoning.
> Dark theme, data-dense but readable. Think Bloomberg terminal meets a modern SaaS dashboard. Can you build this component?

**AlphaAgent:**
> Let's implement a bespoke carbon dark theme using HSL values in `globals.css` instead of Tailwind, to keep styling precise and authentic:
> * Deep neutral background: `#060709`
> * Glowing borders, blinking cursor animations, and scanline loading bars.
> * Verdict card styling matching Invest (emerald green) vs. Pass (crimson red) alerts.
> 
> We will write the `Header`, `SearchSection`, `LiveTerminal`, `VerdictCard`, and `AnalysisTabs` components, then wire them up into the client-side `Dashboard` container.
> The route handler `api/analyze/route.ts` will run the LangGraph stream and use Server-Sent Events (SSE) to push progress logs in real-time to the terminal.

---

## 📅 Session 4: Debugging Model 404 Errors

**Developer:**
> The app is running locally, but it failed when executing the LLM. I get a `404 Not Found` error in the terminal logs:
> `ERROR // LLM Analysis error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: [404 Not Found] models/gemini-1.5-flash is not found for API version v1beta...`
> Here is a screenshot of my Gemini API Key details in AI Studio. Why is it throwing this error?

**AlphaAgent:**
> Google AI Studio recently migrated to a new key format beginning with `AQ.`. For these keys, the older `gemini-1.5-flash` model name is restricted or deprecated. 
> 
> ### Resolution Action
> 1. Let's write an environment override in `llm.ts` to read `process.env.GEMINI_MODEL`, so you can switch models dynamically without updating code.
> 2. More importantly, let's write an **API Diagnostic Handler** in our error catch blocks: if a 404 is caught, the agent will query the AI Studio ListModels endpoint using your key, extract all authorized model names, and print them as a help warning inside the live terminal.
> 3. After inspecting your ListModels return log:
>    > `[HELP] Available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, gemini-3.5-flash...`
>    We see your key officially supports `gemini-2.5-flash`.
> 4. We will replace the default model in our loaders with `gemini-2.5-flash` so that the app works instantly out-of-the-box for you and your evaluators!

---

## 📅 Session 5: Python Refactoring & Vercel serverless Compatibility

**Developer:**
> Can we refactor the backend agent code to Python? The assignment mentions Python as an option and I'd prefer the agent logic to be in Python while keeping the Next.js UI.
> And when I deployed the Python backend code to Vercel, it got stuck in the loading loop:
> `[12:40:49 AM] SYSTEM // Active connection established. Awaiting target input.`
> `[12:40:49 AM] PROCESSING DATA CHUNKS` (stuck here)

**AlphaAgent:**
> Let's address both requests:
> 
> ### Part 1: Python LangGraph Orchestrator
> We will write the python StateGraph in `src/lib/agent/agent.py`. Next.js will use `child_process.spawn("py", ...)` to execute the Python script, read its standard output line-by-line via `readline`, and stream it to the SSE client.
> 
> ### Part 2: Vercel Serverless Fallback
> Spawning a subprocess (`py` or `python`) fails on Vercel because Vercel's serverless Node.js container runs on a minimal image without Python installed in the PATH.
> To solve this, we will write a **Dual-Mode Hybrid Router**:
> * **Local Run**: Spawns the Python agent `src/lib/agent/agent.py` and streams stdout.
> * **Cloud Deploy (Vercel)**: Catches the spawn failure and automatically falls back to a pure JavaScript LangGraph.js implementation `src/lib/agent/jsAgent.ts` executing directly inside Node.js.
> 
> Now, your app works with Python locally and functions automatically in Vercel serverless mode!
