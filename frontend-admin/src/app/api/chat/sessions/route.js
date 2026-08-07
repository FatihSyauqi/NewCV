import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auto-create chat tables if not exist
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

    // Migrate and Cleanup old non-prefixed / redundant tables safely
    try {
      const checkEntities = await query(`SHOW TABLES LIKE 'blocked_entities'`);
      if (checkEntities && checkEntities.length > 0) {
        await query(`INSERT IGNORE INTO \`chat_blocked_entities\` (type, value, reason, created_at) SELECT type, value, reason, created_at FROM \`blocked_entities\``);
        await query(`DROP TABLE IF EXISTS \`blocked_entities\``);
      }
    } catch (e) {}

    try {
      const checkIps = await query(`SHOW TABLES LIKE 'blocked_ips'`);
      if (checkIps && checkIps.length > 0) {
        await query(`INSERT IGNORE INTO \`chat_blocked_entities\` (type, value, reason, created_at) SELECT 'ip', ip_address, reason, created_at FROM \`blocked_ips\``);
        await query(`DROP TABLE IF EXISTS \`blocked_ips\``);
      }
    } catch (e) {}

    try {
      const checkAdmin = await query(`SHOW TABLES LIKE 'admin_status'`);
      if (checkAdmin && checkAdmin.length > 0) {
        await query(`DROP TABLE IF EXISTS \`admin_status\``);
      }
    } catch (e) {}

    try {
      const checkSettings = await query(`SHOW TABLES LIKE 'chat_settings'`);
      if (checkSettings && checkSettings.length > 0) {
        await query(`DROP TABLE IF EXISTS \`chat_settings\``);
      }
    } catch (e) {}

    // Record Admin Online Heartbeat
    await query(`INSERT INTO chat_admin_status (id, last_seen) VALUES (1, NOW()) ON DUPLICATE KEY UPDATE last_seen = NOW()`);

    const sessions = await query("SELECT * FROM chat_sessions ORDER BY updated_at DESC");
    const totalUnreadRes = await query("SELECT SUM(unread_admin) as total_unread FROM chat_sessions");
    const totalUnread = totalUnreadRes[0]?.total_unread || 0;
    const blockedEntities = await query("SELECT * FROM chat_blocked_entities ORDER BY created_at DESC");

    return NextResponse.json({
      sessions,
      totalUnread: Number(totalUnread),
      blockedEntities
    });
  } catch (error) {
    console.error("GET admin chat sessions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
