import React, { useEffect, useRef } from "react";
import { ResearchLog } from "../types";

interface LiveTerminalProps {
  logs: ResearchLog[];
  isLoading: boolean;
}

export default function LiveTerminal({ logs, isLoading }: LiveTerminalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="terminal-card">
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot-ui red" />
          <div className="terminal-dot-ui yellow" />
          <div className="terminal-dot-ui green" />
        </div>
        <div className="terminal-title">AGENT_ORCHESTRATOR_STREAM // CLI</div>
        <div style={{ width: 36 }} />
      </div>
      
      <div className="terminal-body" ref={bodyRef}>
        <div className="terminal-line">
          <span className="terminal-timestamp">[{new Date().toLocaleTimeString()}]</span>
          <span className="terminal-msg system">SYSTEM // Active connection established. Awaiting target input.</span>
        </div>
        
        {logs.map((log, index) => (
          <div key={index} className="terminal-line">
            <span className="terminal-timestamp">[{log.timestamp}]</span>
            <span className={`terminal-msg ${log.source}`}>
              {log.source === "system" ? "SYSTEM" : log.source.toUpperCase()} // {log.message}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="terminal-line">
            <span className="terminal-timestamp">[{new Date().toLocaleTimeString()}]</span>
            <span className="terminal-msg system">
              PROCESSING DATA CHUNKS
              <span className="terminal-cursor" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
