import React, { useState } from "react";
import { TrendingUp, ShieldAlert, Sparkles, BarChart3 } from "lucide-react";
import { VerdictBreakdown } from "../types";

interface AnalysisTabsProps {
  breakdown: VerdictBreakdown;
}

type TabType = "growth" | "risk" | "sentiment" | "reasoning";

export default function AnalysisTabs({ breakdown }: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("growth");

  return (
    <div className="detail-tabs-card">
      <nav className="tabs-nav">
        <button
          onClick={() => setActiveTab("growth")}
          className={`tab-btn ${activeTab === "growth" ? "active" : ""}`}
        >
          <TrendingUp size={14} />
          <span>Growth Outlook</span>
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`tab-btn ${activeTab === "risk" ? "active" : ""}`}
        >
          <ShieldAlert size={14} />
          <span>Risk Factors</span>
        </button>
        <button
          onClick={() => setActiveTab("sentiment")}
          className={`tab-btn ${activeTab === "sentiment" ? "active" : ""}`}
        >
          <Sparkles size={14} />
          <span>Sentiment</span>
        </button>
        <button
          onClick={() => setActiveTab("reasoning")}
          className={`tab-btn ${activeTab === "reasoning" ? "active" : ""}`}
        >
          <BarChart3 size={14} />
          <span>Investment Thesis</span>
        </button>
      </nav>
      
      <div className="tab-content-panel">
        {activeTab === "growth" && (
          <div>
            <h3 className="tab-section-title">
              <TrendingUp size={16} style={{ color: "var(--verdict-invest)", marginRight: "0.25rem" }} />
              Growth Outlook & Drivers
            </h3>
            <div className="bullets-list">
              {breakdown.growthOutlook.map((item, idx) => (
                <div key={idx} className="bullet-card">
                  <div className="bullet-icon-box growth">&gt;</div>
                  <div className="bullet-text">
                    <div className="bullet-bold-heading">{item.heading}</div>
                    <div>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "risk" && (
          <div>
            <h3 className="tab-section-title">
              <ShieldAlert size={16} style={{ color: "var(--verdict-pass)", marginRight: "0.25rem" }} />
              Key Corporate & Regulatory Risks
            </h3>
            <div className="bullets-list">
              {breakdown.riskFactors.map((item, idx) => (
                <div key={idx} className="bullet-card">
                  <div className="bullet-icon-box risk">&gt;</div>
                  <div className="bullet-text">
                    <div className="bullet-bold-heading">{item.heading}</div>
                    <div>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "sentiment" && (
          <div>
            <h3 className="tab-section-title">
              <Sparkles size={16} style={{ color: "var(--accent-cyan)", marginRight: "0.25rem" }} />
              Market Coverage & Media Sentiment
            </h3>
            <div className="bullets-list">
              {breakdown.marketSentiment.map((item, idx) => (
                <div key={idx} className="bullet-card">
                  <div className="bullet-icon-box sentiment">&gt;</div>
                  <div className="bullet-text">
                    <div className="bullet-bold-heading">{item.heading}</div>
                    <div>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "reasoning" && (
          <div>
            <h3 className="tab-section-title">
              <BarChart3 size={16} style={{ color: "var(--verdict-warn)", marginRight: "0.25rem" }} />
              Investment Committee Thesis
            </h3>
            <div className="bullets-list">
              {breakdown.finalReasoning.map((item, idx) => (
                <div key={idx} className="bullet-card">
                  <div className="bullet-icon-box reasoning">&gt;</div>
                  <div className="bullet-text">
                    <div className="bullet-bold-heading">{item.heading}</div>
                    <div>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
