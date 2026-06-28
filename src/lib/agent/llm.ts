import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getLLM() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "mock" && process.env.GEMINI_API_KEY !== "") {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      apiVersion: process.env.GEMINI_API_VERSION || undefined,
      temperature: 0.2,
    });
  } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "mock" && process.env.OPENAI_API_KEY !== "") {
    return new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
    });
  }
  return null;
}
