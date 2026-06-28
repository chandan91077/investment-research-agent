import React, { useState } from "react";
import Header from "./Header";
import SearchSection from "./SearchSection";
import LiveTerminal from "./LiveTerminal";
import VerdictCard from "./VerdictCard";
import AnalysisTabs from "./AnalysisTabs";
import { ResearchLog, AgentResult } from "../types";
import { Database } from "lucide-react";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<ResearchLog[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = (company: string) => {
    setIsLoading(true);
    setLogs([]);
    setResult(null);
    setError(null);

    // Initialize Server-Sent Events (SSE) connection to Next.js API
    const eventSource = new EventSource(`/api/analyze?company=${encodeURIComponent(company)}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "log" && payload.message) {
          setLogs((prev) => [...prev, payload.message]);
        } else if (payload.type === "result" && payload.result) {
          setResult(payload.result);
          setIsLoading(false);
          eventSource.close();
        } else if (payload.type === "error") {
          setError(payload.message || "An execution error occurred.");
          setIsLoading(false);
          eventSource.close();
        }
      } catch (err: any) {
        console.error("Error decoding SSE stream payload:", err);
      }
    };

    eventSource.onerror = (err) => {
      // EventSource triggers onerror when the server closes the stream, check if we already got the result
      console.log("EventSource closed or disconnected.", err);
      setIsLoading(false);
      eventSource.close();
    };
  };

  return (
    <div className="app-container">
      <Header isLoading={isLoading} />
      
      <SearchSection onAnalyze={startAnalysis} isLoading={isLoading} />
      
      {isLoading && (
        <div className="pulse-loading-bar">
          <div className="pulse-loading-bar-inner" />
        </div>
      )}
      
      <div className="dashboard-grid">
        <div className="dashboard-left">
          <LiveTerminal logs={logs} isLoading={isLoading} />
          
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--verdict-pass)",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.4"
            }}>
              [CRITICAL ERROR] // {error}
            </div>
          )}
        </div>
        
        <div className="dashboard-right">
          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <VerdictCard
                companyName={result.companyName}
                ticker={result.ticker}
                breakdown={result.breakdown}
              />
              <AnalysisTabs breakdown={result.breakdown} />
            </div>
          ) : (
            <div className="welcome-panel">
              <div className="welcome-icon-box">
                <Database size={24} />
              </div>
              <h3 className="welcome-title">Console Inactive // Waiting for Input</h3>
              <p className="welcome-desc">
                Select one of the quick presets or type a company name above to launch the autonomous agent research graph.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
