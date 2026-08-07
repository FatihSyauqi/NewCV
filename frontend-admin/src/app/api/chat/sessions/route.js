import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// Helper: Delete single physical attachment file from disk
async function deletePhysicalAttachment(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return;
  try {
    const filename = path.basename(fileUrl);
    if (!filename) return;

    const possiblePaths = [
      path.join(process.cwd(), "public", "uploads", "chat", filename),
      path.join(process.cwd(), "..", "frontend-cv", "public", "uploads", "chat", filename),
      path.join(process.cwd(), "..", "frontend-admin", "public", "uploads", "chat", filename)
    ];

    for (const p of possiblePaths) {
      await fs.unlink(p).catch(() => {});
    }
  } catch (e) {
    console.error("Error deleting physical attachment file:", e);
  }
}

// Helper: Empty ALL physical files in chat upload directories (even if not in DB)
async function emptyAllChatUploadFolders() {
  const uploadDirs = [
    path.join(process.cwd(), "public", "uploads", "chat"),
    path.join(process.cwd(), "..", "frontend-cv", "public", "uploads", "chat"),
    path.join(process.cwd(), "..", "frontend-admin", "public", "uploads", "chat")
  ];

  for (const dirPath of uploadDirs) {
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        await fs.unlink(fullPath).catch(() => {});
      }
    } catch (e) {}
  }
}

export async function GET() {
  try {
    // 1. Auto-create chat tables if not exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS \`chat_sessions\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`session_token\` varchar(64) NOT NULL,
          \`full_name\` varchar(100) NOT NULL,
          \`email\` varchar(100) NOT NULL,
          \`phone_number\` varchar(50) NOT NULL,
          \`ip_address\` varchar(45) DEFAULT NULL,
          \`visitor_device_id\` varchar(64) DEFAULT NULL,
          \`initial_message\` text DEFAULT NULL,
          \`status\` varchar(20) DEFAULT 'active',
          \`closed_by\` varchar(20) DEFAULT NULL,
          \`unread_user\` int(11) DEFAULT 0,
          \`unread_admin\` int(11) DEFAULT 0,
          \`user_typing_at\` timestamp NULL DEFAULT NULL,
          \`admin_typing_at\` timestamp NULL DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`session_token\` (\`session_token\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS \`chat_messages\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`session_id\` int(11) NOT NULL,
          \`sender_type\` enum('user','admin') NOT NULL,
          \`sender_name\` varchar(100) NOT NULL,
          \`message_html\` text NOT NULL,
          \`attachment_url\` varchar(255) DEFAULT NULL,
          \`attachment_name\` varchar(255) DEFAULT NULL,
          \`attachment_size\` int(11) DEFAULT NULL,
          \`is_read\` tinyint(1) DEFAULT 0,
          \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`session_id\` (\`session_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS \`chat_blocked_entities\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`type\` enum('ip','email','phone') NOT NULL,
          \`value\` varchar(150) NOT NULL,
          \`reason\` varchar(255) DEFAULT 'Spam/Abuse',
          \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`type_value\` (\`type\`, \`value\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS \`chat_admin_status\` (
          \`id\` int(11) NOT NULL PRIMARY KEY,
          \`last_seen\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Safely check and add missing columns without throwing ER_DUP_FIELDNAME
      const columns = await query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_sessions'`
      );
      const columnNames = (columns || []).map((c) => (c.COLUMN_NAME || c.column_name || "").toLowerCase());
      if (!columnNames.includes("user_typing_at")) {
        await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`user_typing_at\` timestamp NULL DEFAULT NULL`);
      }
      if (!columnNames.includes("admin_typing_at")) {
        await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`admin_typing_at\` timestamp NULL DEFAULT NULL`);
      }
    } catch (tblErr) {
      console.error("Table creation check warning:", tblErr);
    }

    // 2. Record Admin Online Heartbeat
    try {
      await query(`INSERT INTO chat_admin_status (id, last_seen) VALUES (1, NOW()) ON DUPLICATE KEY UPDATE last_seen = NOW()`);
    } catch (hbErr) {}

    // 3. Query Sessions with User Typing status check and last message info
    const rawSessions = await query(
      `SELECT s.*, 
              (s.user_typing_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, s.user_typing_at, NOW()) <= 4) as is_user_typing,
              (SELECT message_html FROM chat_messages WHERE session_id = s.id ORDER BY id DESC LIMIT 1) as last_message_html,
              (SELECT attachment_name FROM chat_messages WHERE session_id = s.id ORDER BY id DESC LIMIT 1) as last_attachment_name
       FROM chat_sessions s 
       ORDER BY s.updated_at DESC`
    );
    const sessions = Array.isArray(rawSessions) ? rawSessions : [];

    let totalUnread = 0;
    try {
      const totalUnreadRes = await query("SELECT SUM(unread_admin) as total_unread FROM chat_sessions");
      totalUnread = Number(totalUnreadRes?.[0]?.total_unread || 0);
    } catch (uErr) {}

    let blockedEntities = [];
    try {
      const rawBlocked = await query("SELECT * FROM chat_blocked_entities ORDER BY created_at DESC");
      blockedEntities = Array.isArray(rawBlocked) ? rawBlocked : [];
    } catch (bErr) {}

    return NextResponse.json({
      sessions,
      totalUnread,
      blockedEntities
    });
  } catch (error) {
    console.error("GET admin chat sessions error:", error);
    return NextResponse.json(
      { sessions: [], totalUnread: 0, blockedEntities: [], error: error.message },
      { status: 200 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { session_id, status, action } = body;

    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const sessions = await query("SELECT * FROM chat_sessions WHERE id = ? LIMIT 1", [session_id]);
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const session = sessions[0];

    const cleanEmail = (session.email || "").toLowerCase().trim();
    const cleanPhone = (session.phone_number || "").replace(/\D/g, "");
    const ipAddress = session.ip_address || "127.0.0.1";

    // Admin Action: Admin Typing Heartbeat
    if (action === "typing") {
      await query("UPDATE chat_sessions SET admin_typing_at = NOW() WHERE id = ?", [session_id]);
      return NextResponse.json({ success: true });
    }

    // Admin Action: Block User (IP + Email + Phone Number)
    if (action === "block_user") {
      if (ipAddress) {
        await query(`INSERT IGNORE INTO chat_blocked_entities (type, value, reason) VALUES ('ip', ?, 'Diblokir manual oleh Admin')`, [ipAddress]);
      }
      if (cleanEmail) {
        await query(`INSERT IGNORE INTO chat_blocked_entities (type, value, reason) VALUES ('email', ?, 'Diblokir manual oleh Admin')`, [cleanEmail]);
      }
      if (cleanPhone) {
        await query(`INSERT IGNORE INTO chat_blocked_entities (type, value, reason) VALUES ('phone', ?, 'Diblokir manual oleh Admin')`, [cleanPhone]);
      }

      await query(
        "UPDATE chat_sessions SET status = 'blocked', closed_by = 'admin', updated_at = NOW() WHERE id = ?",
        [session_id]
      );

      return NextResponse.json({ success: true, message: `IP (${ipAddress}), Email (${cleanEmail}), & Phone (${cleanPhone}) berhasil diblokir.` });
    }

    // Admin Action: Unblock User
    if (action === "unblock_user") {
      if (ipAddress) {
        await query("DELETE FROM chat_blocked_entities WHERE type = 'ip' AND value = ?", [ipAddress]);
      }
      if (cleanEmail) {
        await query("DELETE FROM chat_blocked_entities WHERE type = 'email' AND value = ?", [cleanEmail]);
      }
      if (cleanPhone) {
        await query("DELETE FROM chat_blocked_entities WHERE type = 'phone' AND value = ?", [cleanPhone]);
      }

      await query(
        "UPDATE chat_sessions SET status = 'active', closed_by = NULL, updated_at = NOW() WHERE id = ?",
        [session_id]
      );

      return NextResponse.json({ success: true, message: `Blokir IP, Email, & No. HP untuk ${session.full_name} telah dibuka.` });
    }

    // Toggle status (active / closed)
    const newStatus = status || (session.status === "active" ? "closed" : "active");
    const closedBy = newStatus === "closed" ? "admin" : null;

    await query(
      "UPDATE chat_sessions SET status = ?, closed_by = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, closedBy, session_id]
    );

    return NextResponse.json({ success: true, message: `Status chat berhasil diubah menjadi ${newStatus}` });
  } catch (error) {
    console.error("PUT admin chat session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const action = searchParams.get("action");

    // Action 1: Hapus Semua Sesi Chat & SELURUH File Upload di Folder
    if (action === "delete_all") {
      // 1. Fetch all messages with attachments and delete physical files
      const messagesWithAttachments = await query(
        "SELECT attachment_url FROM chat_messages WHERE attachment_url IS NOT NULL AND attachment_url != ''"
      );
      if (Array.isArray(messagesWithAttachments)) {
        for (const msg of messagesWithAttachments) {
          await deletePhysicalAttachment(msg.attachment_url);
        }
      }

      // 2. Empty ALL chat upload folders physically (EVEN files not in DB)
      await emptyAllChatUploadFolders();

      // 3. Clear DB tables
      await query("DELETE FROM chat_messages");
      await query("DELETE FROM chat_sessions");

      return NextResponse.json({
        success: true,
        message: "Seluruh percakapan chat dan semua file attachment di folder telah berhasil dihapus permanen."
      });
    }

    // Action 2: Hapus Chat per Session
    if (sessionId) {
      // 1. Fetch messages with attachments for this session
      const messages = await query(
        "SELECT attachment_url FROM chat_messages WHERE session_id = ? AND attachment_url IS NOT NULL AND attachment_url != ''",
        [sessionId]
      );
      if (Array.isArray(messages)) {
        for (const msg of messages) {
          await deletePhysicalAttachment(msg.attachment_url);
        }
      }

      // 2. Delete messages and session from DB
      await query("DELETE FROM chat_messages WHERE session_id = ?", [sessionId]);
      await query("DELETE FROM chat_sessions WHERE id = ?", [sessionId]);

      return NextResponse.json({
        success: true,
        message: "Sesi percakapan dan seluruh file lampirannya telah berhasil dihapus permanen."
      });
    }

    return NextResponse.json({ error: "Missing session_id or action parameter" }, { status: 400 });
  } catch (error) {
    console.error("DELETE chat session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
