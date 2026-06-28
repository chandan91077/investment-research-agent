import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchSectionProps {
  onAnalyze: (company: string) => void;
  isLoading: boolean;
}

export default function SearchSection({ onAnalyze, isLoading }: SearchSectionProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onAnalyze(query.trim());
    }
  };

  const handleQuickClick = (company: string) => {
    if (!isLoading) {
      setQuery(company);
      onAnalyze(company);
    }
  };

  return (
    <div className="search-card">
      <h2 className="search-title">Company Analysis Console</h2>
      <p className="search-desc">
        Input a stock name, corporate ticker, or startup entity. The AI Research Agent will initiate target web crawls, audit financials, evaluate news sentiment, and return an investment verdict.
      </p>
      
      <form onSubmit={handleSubmit} className="search-input-group">
        <div className="search-input-wrapper">
          <Search className="search-icon-inside" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="e.g., Zomato, Infosys, SaaSify AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn-analyze" disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Target"
          )}
        </button>
      </form>
      
      <div className="quick-examples">
        <span className="quick-examples-label">Evaluation Models:</span>
        <button
          onClick={() => handleQuickClick("Zomato")}
          className="quick-example-btn"
          disabled={isLoading}
        >
          Zomato (Invest Target)
        </button>
        <button
          onClick={() => handleQuickClick("Infosys")}
          className="quick-example-btn"
          disabled={isLoading}
        >
          Infosys (Pass Target)
        </button>
        <button
          onClick={() => handleQuickClick("SaaSify AI")}
          className="quick-example-btn"
          disabled={isLoading}
        >
          SaaSify AI (Startup Target)
        </button>
      </div>
    </div>
  );
}
