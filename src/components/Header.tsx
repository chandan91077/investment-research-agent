import React from "react";
import { TrendingUp } from "lucide-react";

interface HeaderProps {
  isLoading: boolean;
}

export default function Header({ isLoading }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="logo-container">
        <TrendingUp className="logo-icon" size={24} />
        <h1 className="logo-title">AlphaAgent</h1>
        <span className="logo-badge">V1.0 // INVESTMENT CO-PILOT</span>
      </div>
      
      <div className="system-status">
        <div className={`status-dot ${isLoading ? "loading" : ""}`} />
        <span>{isLoading ? "AGENT BUSY // RESEARCHING" : "SYSTEM READY // IDLE"}</span>
      </div>
    </header>
  );
}
