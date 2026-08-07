import { query } from "@/lib/db";
import { sanitizeHtml } from "@/lib/sanitizer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const getClientIp = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
};

async function isVisitorBlocked(ip, email, phone) {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanPhone = (phone || "").replace(/\D/g, "");

  const checks = await query(
    `SELECT * FROM chat_blocked_entities 
     WHERE (type = 'ip' AND value = ?)
        OR (type = 'email' AND value = ? AND ? != '')
        OR (type = 'phone' AND value = ? AND ? != '')
     LIMIT 1`,
    [ip, cleanEmail, cleanEmail, cleanPhone, cleanPhone]
  );

  return checks && checks.length > 0;
}

async function blockVisitorEntities(ip, email, phone, reason = "Spam/Abuse") {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanPhone = (phone || "").replace(/\D/g, "");

  if (ip) {
    await query(`INSERT IGNORE INTO chat_blocked_entities (type, value, reason) VALUES ('ip', ?, ?)`, [ip, reason]);
  }
  if (cleanEmail) {
    await query(`INSERT IGNORE INTO chat_blocked_entities (type, value, reason) VALUES ('email', ?, ?)`, [cleanEmail, reason]);
  }
  if (cleanPhone) {
    await query(`INSERT IGNORE INTO chat_blocked_entities (type, value, reason) VALUES ('phone', ?, ?)`, [cleanPhone, reason]);
  }
}

async function isAdminOffline() {
  const res = await query(`SELECT TIMESTAMPDIFF(SECOND, last_seen, NOW()) as seconds_since_last_seen FROM chat_admin_status WHERE id = 1 LIMIT 1`);
  if (!res || res.length === 0) return true;
  const seconds = res[0].seconds_since_last_seen;
  return seconds === null || seconds > 15;
}

async function checkAndSendTelegramNotification({ senderName, email, phone, messageText, title = "BALASAN CHAT BARU" }) {
  try {
    const offline = await isAdminOffline();
    if (!offline) return; // Admin is online, skip Telegram alert!

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId = process.env.TELEGRAM_CHAT_ID || "";

    if (!botToken || !chatId) return;

    const cleanText = (messageText || "").replace(/<[^>]+>/g, "").trim();

    const text = `🚨 *${title} (ADMIN OFFLINE)* 🚨\n\n` +
      `👤 *Nama:* ${senderName}\n` +
      `📧 *Email:* ${email}\n` +
      `📱 *No. HP:* ${phone}\n` +
      `💬 *Pesan:* ${cleanText}\n` +
      `🕒 *Waktu:* ${new Date().toLocaleString("id-ID")}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    }).catch((err) => console.error("Telegram notify fetch error:", err));
  } catch (e) {
    console.error("Telegram notification error:", e);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Session token is required" }, { status: 400 });
    }

    const sessions = await query("SELECT * FROM chat_sessions WHERE session_token = ? LIMIT 1", [token]);
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 444 });
    }

    const session = sessions[0];
    const messages = await query(
      "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
      [session.id]
    );

    // Reset user unread counter since user is viewing messages
    if (session.unread_user > 0) {
      await query("UPDATE chat_sessions SET unread_user = 0 WHERE id = ?", [session.id]);
    }
    // Mark admin messages as read
    await query("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender_type = 'admin' AND is_read = 0", [session.id]);

    // Check if Admin is currently typing
    let isAdminTyping = false;
    try {
      const typingRes = await query(
        "SELECT TIMESTAMPDIFF(SECOND, admin_typing_at, NOW()) as diff FROM chat_sessions WHERE id = ?",
        [session.id]
      );
      if (typingRes && typingRes[0] && typingRes[0].diff !== null) {
        isAdminTyping = typingRes[0].diff <= 4;
      }
    } catch (e) {}

    return NextResponse.json({
      session,
      messages,
      is_admin_typing: isAdminTyping
    });
  } catch (error) {
    console.error("GET chat messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json();
    const { session_token, action, message_html, attachment_url, attachment_name, attachment_size } = body;

    if (!session_token) {
      return NextResponse.json({ error: "Session token is required" }, { status: 400 });
    }

    const sessions = await query("SELECT * FROM chat_sessions WHERE session_token = ? LIMIT 1", [session_token]);
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 444 });
    }

    const session = sessions[0];

    // Handle Visitor action: Re-open closed session
    if (action === "reopen_session") {
      await query(
        "UPDATE chat_sessions SET status = 'active', closed_by = NULL, updated_at = NOW() WHERE id = ?",
        [session.id]
      );
      return NextResponse.json({ success: true, message: "Sesi percakapan berhasil dibuka kembali." });
    }

    // Handle Visitor action: User Typing Heartbeat
    if (action === "typing") {
      await query("UPDATE chat_sessions SET user_typing_at = NOW() WHERE id = ?", [session.id]);
      return NextResponse.json({ success: true });
    }

    // Handle Visitor action: Close Session
    if (action === "close_session") {
      await query(
        "UPDATE chat_sessions SET status = 'closed', closed_by = 'user', updated_at = NOW() WHERE id = ?",
        [session.id]
      );
      return NextResponse.json({ success: true, message: "Sesi obrolan berhasil diakhiri." });
    }

    // Silent Block Check for IP, Email, Phone
    const blocked = await isVisitorBlocked(clientIp, session.email, session.phone_number);
    if (blocked || session.status === "blocked") {
      return NextResponse.json(
        { error: "Maaf, layanan obrolan saat ini sedang tidak dapat memproses permintaan Anda." },
        { status: 400 }
      );
    }

    if (session.status === "closed") {
      return NextResponse.json(
        { error: "Sesi percakapan ini telah ditutup." },
        { status: 400 }
      );
    }

    // ── ANTI-SPAM RATE-LIMITING ── (Max 4 messages within 10 seconds)
    const rateCheck = await query(
      `SELECT COUNT(*) as msg_count FROM chat_messages 
       WHERE session_id = ? AND sender_type = 'user' AND created_at >= NOW() - INTERVAL 10 SECOND`,
      [session.id]
    );

    const recentMsgCount = rateCheck[0]?.msg_count || 0;
    if (recentMsgCount >= 4) {
      // Silent Auto-Block IP, Email, Phone and Session for Spam (No user notification)
      await blockVisitorEntities(clientIp, session.email, session.phone_number, "Sistem otomatis: Rate limit spam (>4 pesan / 10s)");

      await query(
        `UPDATE chat_sessions SET status = 'blocked', closed_by = 'system_spam', updated_at = NOW() WHERE id = ?`,
        [session.id]
      );

      return NextResponse.json(
        { error: "Maaf, layanan obrolan saat ini sedang tidak dapat memproses permintaan Anda." },
        { status: 400 }
      );
    }

    const cleanMessage = sanitizeHtml(message_html || "");

    if (!cleanMessage && !attachment_url) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, message_html, attachment_url, attachment_name, attachment_size, is_read)
       VALUES (?, 'user', ?, ?, ?, ?, ?, 0)`,
      [
        session.id,
        session.full_name,
        cleanMessage,
        attachment_url || null,
        attachment_name || null,
        attachment_size || null
      ]
    );

    // Increment unread_admin counter
    await query(
      `UPDATE chat_sessions SET unread_admin = unread_admin + 1, user_typing_at = NULL, updated_at = NOW() WHERE id = ?`,
      [session.id]
    );

    // Send Telegram Notification if Admin is Offline
    checkAndSendTelegramNotification({
      senderName: session.full_name,
      email: session.email,
      phone: session.phone_number,
      messageText: cleanMessage || attachment_name || "Lampiran Berkas",
      title: "PESAN CHAT MASUK"
    });

    return NextResponse.json({
      success: true,
      message_id: res.insertId,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("POST chat message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
