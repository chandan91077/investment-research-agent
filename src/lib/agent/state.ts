import { Annotation } from "@langchain/langgraph";
import { ResearchLog, VerdictBreakdown } from "../../types";

export const AgentState = Annotation.Root({
  companyName: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  ticker: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  logs: Annotation<ResearchLog[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  financialsRaw: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  newsRaw: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  analysisText: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  breakdown: Annotation<VerdictBreakdown>({
    reducer: (x, y) => y ?? x,
  }),
});
