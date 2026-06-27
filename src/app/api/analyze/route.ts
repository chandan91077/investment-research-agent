import { NextRequest } from "next/server";
import { graph } from "../../../lib/agent/graph";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");

  if (!company) {
    return new Response(JSON.stringify({ error: "Company name parameter is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  // Create a readable stream for Server-Sent Events (SSE)
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: "log" | "result" | "error" | "ping", data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          );
        } catch (e) {
          // Stream might have closed already
        }
      };

      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        sendEvent("ping", {});
      }, 5000);

      try {
        sendEvent("log", {
          message: {
            timestamp: new Date().toLocaleTimeString(),
            source: "system",
            message: `Establishing connection with Investment Research Agent...`,
          },
        });

        let ticker = company.toUpperCase();

        // Stream LangGraph updates node by node
        const graphStream = await graph.stream({ companyName: company });

        for await (const chunk of graphStream) {
          const nodeName = Object.keys(chunk)[0];
          const nodeOutput = (chunk as any)[nodeName];

          if (!nodeOutput) continue;

          // Capture the ticker symbol from the research node
          if (nodeName === "research" && nodeOutput.ticker) {
            ticker = nodeOutput.ticker;
          }

          // Stream logs from the executing node in real-time
          if (nodeOutput.logs && Array.isArray(nodeOutput.logs)) {
            for (const log of nodeOutput.logs) {
              sendEvent("log", { message: log });
              // Small artificial delay to let UI read logs smoothly
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          }

          // Stream the final verdict breakdown from the decision node
          if (nodeName === "decide" && nodeOutput.breakdown) {
            sendEvent("result", {
              result: {
                companyName: company,
                ticker: ticker,
                breakdown: nodeOutput.breakdown,
              },
            });
          }
        }
      } catch (error: any) {
        console.error("Agent execution error:", error);
        sendEvent("error", { message: error.message || "Execution encountered an error." });
      } finally {
        clearInterval(pingInterval);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx/Vercel proxies
    },
  });
}
