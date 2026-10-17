import { AppStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot
      const initialData = JSON.stringify({
        type: "INITIAL_STATE",
        timestamp: Date.now(),
        leaderboard: AppStore.getLeaderboard(),
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Register listener for live updates
      const unsubscribe = AppStore.addSSEClient((payload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive heartbeat ping every 15 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(interval);
          unsubscribe();
        }
      }, 15000);

      // Cleanup when stream closes
      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
