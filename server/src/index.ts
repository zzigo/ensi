import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// Configuration
const SCORES_DIR = process.env.ENSI_SCORES_DIR || join(process.cwd(), "..", "scores");
const PORT = process.env.PORT || 3000;

// Ensure scores directory exists
try {
  await mkdir(SCORES_DIR, { recursive: true });
} catch (e) {
  console.error("Failed to create scores directory:", e);
}

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({
    prefix: '/public',
    assets: join(process.cwd(), "public")
  }))
  
  // Health check
  .get("/", () => ({ status: "ENSi Backend Running", timestamp: new Date().toISOString() }))

  // Scores API
  .group("/api/scores", (group) =>
    group
      // List all scores
      .get("/", async () => {
        try {
          const files = await readdir(SCORES_DIR);
          const scores = files
            .filter(f => f.endsWith(".txt"))
            .map(f => ({
              id: f.replace(".txt", ""),
              fileName: f,
              label: f.replace(".txt", ""),
              url: `/api/scores/${f.replace(".txt", "")}`
            }));
          return scores;
        } catch (error) {
          return { error: "Failed to list scores", details: String(error) };
        }
      })

      // Get specific score content
      .get("/:id", async ({ params: { id } }) => {
        try {
          const content = await readFile(join(SCORES_DIR, `${id}.txt`), "utf8");
          return { id, text: content };
        } catch (error) {
          return { error: `Failed to read score ${id}`, details: String(error) };
        }
      })

      // Save/Update score
      .post("/:id", async ({ params: { id }, body }) => {
        try {
          const { text } = body as { text: string };
          await writeFile(join(SCORES_DIR, `${id}.txt`), text, "utf8");
          return { success: true, id };
        } catch (error) {
          return { error: `Failed to save score ${id}`, details: String(error) };
        }
      }, {
        body: t.Object({
          text: t.String()
        })
      })
  )

  // WebSocket for WebRTC Signaling & Remote Sync
  .ws("/ws", {
    open(ws) {
      console.log(`🔌 Client connected: ${ws.id}`);
      ws.subscribe("ensi-broadcast");
    },
    message(ws, message) {
      // Broadcast everything for now (simple sync pattern)
      ws.publish("ensi-broadcast", message);
    },
    close(ws) {
      console.log(`🔌 Client disconnected: ${ws.id}`);
    }
  })

  .listen(PORT);

console.log(
  `🚀 ENSi Backend is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`📂 Scores directory: ${SCORES_DIR}`);
