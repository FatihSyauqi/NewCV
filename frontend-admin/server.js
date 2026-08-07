/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Custom Next.js Server — frontend-admin
 * Runs Next.js + WebSocket Server on the same port (3002).
 * WebSocket server polls DB every 2s for session/message changes
 * and pushes real-time notifications to all connected admin clients.
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer, OPEN } = require("ws");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// ── Load .env manually (since dotenv may not be available) ──────────────────
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
const port = parseInt(process.env.PORT || "3002", 10);

// ── DB Query Helper (CommonJS version) ────────────────────────────────────
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

// ── Broadcast helper ────────────────────────────────────────────────────────
function broadcast(wss, payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === OPEN) {
      client.send(data);
    }
  });
}

function broadcastToSession(wss, sessionId, payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (
      client.readyState === OPEN &&
      String(client.subscribedSession) === String(sessionId)
    ) {
      client.send(data);
    }
  });
}

// ── State for change detection ──────────────────────────────────────────────
let lastSessionsHash = "";
// Map: sessionId -> last message count
const sessionMsgCount = new Map();

async function pollAndBroadcast(wss) {
  if (wss.clients.size === 0) return;

  try {
    // 1. Check sessions for any changes (updated_at + unread_admin + user typing status)
    const sessRes = await dbQuery(
      `SELECT id, updated_at, unread_admin,
              (user_typing_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, user_typing_at, NOW()) <= 4) as is_user_typing
       FROM chat_sessions ORDER BY updated_at DESC LIMIT 100`
    );
    const currentHash = (sessRes || [])
      .map((s) => `${s.id}:${s.updated_at}:${s.unread_admin}:${s.is_user_typing}`)
      .join("|");

    if (currentHash !== lastSessionsHash) {
      lastSessionsHash = currentHash;
      broadcast(wss, { type: "sessions_update" });
    }

    // 2. Check messages for each session the admin is subscribed to
    const subscribedSessions = new Set();
    wss.clients.forEach((client) => {
      if (client.readyState === OPEN && client.subscribedSession) {
        subscribedSessions.add(String(client.subscribedSession));
      }
    });

    for (const sessionId of subscribedSessions) {
      const msgRes = await dbQuery(
        "SELECT COUNT(*) as cnt FROM chat_messages WHERE session_id = ?",
        [sessionId]
      );
      const count = Number(msgRes?.[0]?.cnt || 0);
      const prev = sessionMsgCount.get(sessionId) ?? -1;
      if (prev !== -1 && count > prev) {
        broadcastToSession(wss, sessionId, {
          type: "messages_update",
          sessionId: parseInt(sessionId, 10),
        });
      }
      sessionMsgCount.set(sessionId, count);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ws-poll] DB poll error:", err.message);
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

  // Attach WebSocket server in noServer mode, then intercept upgrades on /ws-admin path
  // This avoids conflict with Next.js HMR WebSocket connections
  const wss = new WebSocketServer({ noServer: true });

  // Expose globally
  global.adminWss = wss;

  server.on("upgrade", (req, socket, head) => {
    const pathname = parse(req.url).pathname;
    // Only handle our custom WS path; let Next.js handle everything else (HMR, etc.)
    if (pathname === "/ws-admin") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
    // All other upgrade requests (e.g. Next.js HMR) pass through untouched
  });

  wss.on("connection", (ws) => {
    ws.subscribedSession = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe_session") {
          ws.subscribedSession = msg.sessionId;
          // Seed count so first poll does not false-trigger
          if (msg.sessionId) {
            sessionMsgCount.set(String(msg.sessionId), -1);
          }
        }
      } catch (_) {
        // ignore malformed messages
      }
    });

    ws.on("error", () => {});
    ws.on("close", () => {});

    // Keep-alive ping every 30s
    const pingTimer = setInterval(() => {
      if (ws.readyState === OPEN) ws.send(JSON.stringify({ type: "ping" }));
    }, 30000);
    ws.on("close", () => clearInterval(pingTimer));

    // Acknowledge connection
    ws.send(JSON.stringify({ type: "connected" }));
  });

  // Start DB polling loop every 2 seconds
  setInterval(() => pollAndBroadcast(wss), 2000);

  server.listen(port, () => {
    console.log(
      `> Admin server ready (${dev ? "dev" : "production"}) on http://localhost:${port}`
    );
    console.log(`> WebSocket server attached on ws://localhost:${port}`);
  });
});
