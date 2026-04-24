import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

// Configuration
const SCORES_DIR = resolve(process.env.ENSI_SCORES_DIR || resolve(process.cwd(), "public", "inc", "appscores"));
const PORT = Number(process.env.PORT || 3000);

const isInsideDirectory = (baseDir: string, targetPath: string) => {
  const relativePath = relative(baseDir, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
};

const toScoreId = (filePath: string) => relative(SCORES_DIR, filePath).split(sep).join("/");

const getScorePath = (id: string) => {
  const decodedId = decodeURIComponent(id);
  const targetPath = resolve(SCORES_DIR, decodedId);

  if (!decodedId.endsWith(".txt") || !isInsideDirectory(SCORES_DIR, targetPath)) {
    throw new Error("Invalid score path");
  }

  return targetPath;
};

const listScoreFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(dir, entry.name);
    if (entry.isDirectory()) return listScoreFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".txt") ? [entryPath] : [];
  }));

  return files.flat();
};

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
    assets: resolve(process.cwd(), "public")
  }))
  
  // Health check
  .get("/", () => ({ status: "ENSi Backend Running", timestamp: new Date().toISOString() }))

  // Scores API
  .group("/api/scores", (group) =>
    group
      // List all scores
      .get("/", async () => {
        try {
          const files = await listScoreFiles(SCORES_DIR);
          const scores = files
            .map(filePath => {
              const id = toScoreId(filePath);
              const label = id.replace(/\.txt$/, "");
              return {
                id,
                fileName: id.split("/").at(-1) || id,
                label,
                url: `/api/scores/${encodeURIComponent(id)}`
              };
            });
          return scores;
        } catch (error) {
          return { error: "Failed to list scores", details: String(error) };
        }
      })

      // Get specific score content
      .get("/:id", async ({ params: { id } }) => {
        try {
          const content = await readFile(getScorePath(id), "utf8");
          return { id, text: content };
        } catch (error) {
          return { error: `Failed to read score ${id}`, details: String(error) };
        }
      })

      // Save/Update score
      .post("/:id", async ({ params: { id }, body }) => {
        try {
          const { text } = body as { text: string };
          const scorePath = getScorePath(id);
          await mkdir(dirname(scorePath), { recursive: true });
          await writeFile(scorePath, text, "utf8");
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
