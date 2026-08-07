/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Custom Next.js Server — frontend-cv
 * Runs Next.js + WebSocket Server on the same port (3000).
 * WebSocket server polls DB every 2s for new admin messages
 * and pushes real-time notifications to connected visitor clients.
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer, OPEN } = require("ws");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// ── Load .env manually ──────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) {
    console.error("[server] Failed to load .env:", e.message);
  }
}
loadEnv();

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3001", 10);

// ── DB Query Helper (CommonJS) ──────────────────────────────────────────────
async function dbQuery(sql, params = []) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || "db_cv_fatih",
      port: parseInt(process.env.DB_PORT || "3306", 10),
    });
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    if (connection) await connection.end();
  }
}

// ── State: token → last message count ──────────────────────────────────────
const tokenMsgCount = new Map();
const tokenAdminTyping = new Map();

// ── Poll and push to visitors ───────────────────────────────────────────────
async function pollAndBroadcast(wss) {
  if (wss.clients.size === 0) return;

  // Collect all subscribed session tokens
  const tokens = new Set();
  wss.clients.forEach((client) => {
    if (client.readyState === OPEN && client.sessionToken) {
      tokens.add(client.sessionToken);
    }
  });

  for (const token of tokens) {
    try {
      const res = await dbQuery(
        `SELECT COUNT(*) as cnt, s.updated_at, s.status,
                (s.admin_typing_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, s.admin_typing_at, NOW()) <= 4) as is_admin_typing
         FROM chat_sessions s
         LEFT JOIN chat_messages cm ON cm.session_id = s.id
         WHERE s.session_token = ?
         GROUP BY s.id`,
        [token]
      );
      const row = res?.[0];
      if (!row) continue;

      // 1. Detect message count changes
      const count = Number(row.cnt || 0);
      const prev = tokenMsgCount.get(token) ?? -1;

      if (prev !== -1 && count > prev) {
        // New messages detected — notify all visitors subscribed with this token
        const data = JSON.stringify({ type: "messages_update" });
        wss.clients.forEach((client) => {
          if (client.readyState === OPEN && client.sessionToken === token) {
            client.send(data);
          }
        });
      }
      tokenMsgCount.set(token, count);

      // 2. Detect admin typing changes
      const isAdminTyping = !!row.is_admin_typing;
      const prevTyping = tokenAdminTyping.get(token) ?? false;
      if (isAdminTyping !== prevTyping) {
        tokenAdminTyping.set(token, isAdminTyping);
        const data = JSON.stringify({ type: "admin_typing", typing: isAdminTyping });
        wss.clients.forEach((client) => {
          if (client.readyState === OPEN && client.sessionToken === token) {
            client.send(data);
          }
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[ws-poll-cv] DB poll error:", err.message);
      }
    }
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, () => {
    console.log(
      `> CV server ready (${dev ? "dev" : "production"}) on http://localhost:${port}`
    );
  });
});
