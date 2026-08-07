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

  // Launch WebSocket server on dedicated port 3003
  // This completely avoids any conflict with Next.js HMR upgrade listeners
  const wss = new WebSocketServer({ port: 3003 });

  // Expose globally
  global.adminWss = wss;

  // Helper: get session ID from token
  async function getSessionIdByToken(token) {
    try {
      const res = await dbQuery("SELECT id FROM chat_sessions WHERE session_token = ? LIMIT 1", [token]);
      return res?.[0]?.id || null;
    } catch (_) {
      return null;
    }
  }

  // Helper: get session token from ID
  async function getSessionTokenById(id) {
    try {
      const res = await dbQuery("SELECT session_token FROM chat_sessions WHERE id = ? LIMIT 1", [id]);
      return res?.[0]?.session_token || null;
    } catch (_) {
      return null;
    }
  }

  wss.on("connection", (ws) => {
    ws.subscribedSession = null;
    ws.visitorToken = null;

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        
        // Admin subscribe to active session
        if (msg.type === "subscribe_session") {
          ws.subscribedSession = msg.sessionId;
          if (msg.sessionId) {
            sessionMsgCount.set(String(msg.sessionId), -1);
          }
        }
        
        // Visitor subscribe to session token
        else if (msg.type === "subscribe") {
          ws.visitorToken = msg.token;
        }

        // Instant notification: Visitor sent a message
        else if (msg.type === "visitor_message_sent") {
          const sid = await getSessionIdByToken(msg.token);
          if (sid) {
            // Notify all admins to reload sessions and messages
            const adminMsg = JSON.stringify({ type: "sessions_update" });
            const detailMsg = JSON.stringify({ type: "messages_update", sessionId: sid });
            wss.clients.forEach((client) => {
              if (client.readyState === OPEN) {
                if (client.subscribedSession) {
                  client.send(adminMsg);
                  if (String(client.subscribedSession) === String(sid)) {
                    client.send(detailMsg);
                  }
                } else if (!client.visitorToken) {
                  client.send(adminMsg);
                }
              }
            });
          }
        }

        // Instant notification: Admin sent a message
        else if (msg.type === "admin_message_sent") {
          const token = await getSessionTokenById(msg.sessionId);
          if (token) {
            // Notify the specific visitor client
            const data = JSON.stringify({ type: "messages_update" });
            wss.clients.forEach((client) => {
              if (client.readyState === OPEN && client.visitorToken === token) {
                client.send(data);
              }
            });
          }
        }

        // Instant notification: Visitor typing status
        else if (msg.type === "visitor_typing") {
          // Broadcast session update to admins instantly to update typing indicator spinner
          const data = JSON.stringify({ type: "sessions_update" });
          wss.clients.forEach((client) => {
            if (client.readyState === OPEN && !client.visitorToken) {
              client.send(data);
            }
          });
        }

        // Instant notification: Admin typing status
        else if (msg.type === "admin_typing") {
          const token = await getSessionTokenById(msg.sessionId);
          if (token) {
            const data = JSON.stringify({ type: "admin_typing", typing: !!msg.typing });
            wss.clients.forEach((client) => {
              if (client.readyState === OPEN && client.visitorToken === token) {
                client.send(data);
              }
            });
          }
        }

      } catch (_) {
        // ignore malformed
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

  // Keep background polling loop at 2 seconds as a secondary fallback
  setInterval(() => pollAndBroadcast(wss), 2000);

  server.listen(port, () => {
    console.log(
      `> Admin server ready (${dev ? "dev" : "production"}) on http://localhost:${port}`
    );
    console.log(`> WebSocket server attached on ws://localhost:${port}`);
  });
});
