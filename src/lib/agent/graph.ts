import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { researchNode } from "./nodes/researchNode";
import { analysisNode } from "./nodes/analysisNode";
import { decisionNode } from "./nodes/decisionNode";

// Build the state-based agent workflow graph
const workflow = new StateGraph(AgentState)
  .addNode("research", researchNode)
  .addNode("analyze", analysisNode)
  .addNode("decide", decisionNode)
  
  // Sequence flow: Start -> Research -> Analysis -> Decision -> End
  .addEdge(START, "research")
  .addEdge("research", "analyze")
  .addEdge("analyze", "decide")
  .addEdge("decide", END);

// Compile the runnable graph
export const graph = workflow.compile();
export type InvestmentGraphType = typeof graph;
