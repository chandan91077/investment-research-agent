import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { VerdictBreakdown } from "../types";

interface VerdictCardProps {
  companyName: string;
  ticker: string;
  breakdown: VerdictBreakdown;
}

export default function VerdictCard({ companyName, ticker, breakdown }: VerdictCardProps) {
  const isInvest = breakdown.verdict === "INVEST";

  return (
    <div className={`verdict-card ${isInvest ? "invest" : "pass"}`}>
      <div className="verdict-header">
        <div className="verdict-title-box">
          <span className="verdict-label">INVESTMENT VERDICT</span>
          <span className="verdict-company-name">
            {companyName} <span style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontFamily: "var(--font-mono)" }}>({ticker})</span>
          </span>
        </div>
        <div className="verdict-badge">
          {isInvest ? (
            <>
              <CheckCircle2 size={16} />
              <span>INVEST</span>
            </>
          ) : (
            <>
              <XCircle size={16} />
              <span>PASS</span>
            </>
          )}
        </div>
      </div>
      
      <div className="verdict-body">
        <div className="score-widget">
          <div className="score-label">
            <span className="score-title">Committee Confidence</span>
            <span className="score-subtitle">Composite agent matching score</span>
          </div>
          <span className="score-value">{breakdown.confidenceScore}%</span>
        </div>
        
        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem", fontWeight: 700, letterSpacing: "0.08em" }}>
          Key Financial Highlights
        </h3>
        <div className="verdict-highlights">
          {breakdown.financialHighlights && breakdown.financialHighlights.map((stat, idx) => (
            <div key={idx} className="highlight-item">
              <span className="highlight-bullet">&gt;&gt;</span>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>{stat.label}:</strong>{" "}
                <span>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
