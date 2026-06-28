import { NextRequest } from "next/server";
import { spawn } from "child_process";
import readline from "readline";

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

      // Spawn the Python agent using the Windows 'py' launcher (Python 3.11.4)
      const pyProcess = spawn("py", ["src/lib/agent/agent.py", company], {
        windowsHide: true,
      });

      // Use readline to parse the Python stdout line by line
      const rl = readline.createInterface({
        input: pyProcess.stdout,
        terminal: false,
      });

      rl.on("line", (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        try {
          // The Python agent outputs pre-formatted JSON lines matching our SSE protocol
          JSON.parse(trimmed); // Validate it's JSON
          controller.enqueue(encoder.encode(`data: ${trimmed}\n\n`));
        } catch (e) {
          // If stdout was not structured JSON, send as raw system log
          sendEvent("log", {
            message: {
              timestamp: new Date().toLocaleTimeString(),
              source: "system",
              message: trimmed,
            },
          });
        }
      });

      // Listen to subprocess stderr for stack traces and warnings
      pyProcess.stderr.on("data", (data) => {
        const errStr = data.toString().trim();
        if (!errStr) return;

        console.error("Python Stderr:", errStr);

        // If the stderr looks like a trace or real exception, stream it to UI
        if (errStr.toLowerCase().includes("error") || errStr.toLowerCase().includes("exception")) {
          sendEvent("log", {
            message: {
              timestamp: new Date().toLocaleTimeString(),
              source: "error",
              message: errStr,
            },
          });
        }
      });

      // Handle process close
      pyProcess.on("close", (code) => {
        clearInterval(pingInterval);
        if (code !== 0) {
          sendEvent("error", { message: `Python agent exited with error code ${code}` });
        }
        controller.close();
      });

      // Terminate Python process if the client aborts the network connection
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        pyProcess.kill();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering on proxies
    },
  });
}
