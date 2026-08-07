import { query } from "@/lib/db";
import { sanitizeHtml } from "@/lib/sanitizer";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const messages = await query(
      "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
      [sessionId]
    );

    // Reset unread_admin counter when Admin opens this session
    await query("UPDATE chat_sessions SET unread_admin = 0 WHERE id = ?", [sessionId]);
    // Mark user messages as read
    await query("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender_type = 'user' AND is_read = 0", [sessionId]);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET admin chat messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session_id, message_html, attachment_url, attachment_name, attachment_size } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const sessions = await query("SELECT * FROM chat_sessions WHERE id = ? LIMIT 1", [session_id]);
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    const cleanMessage = sanitizeHtml(message_html || "");

    if (!cleanMessage && !attachment_url) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, message_html, attachment_url, attachment_name, attachment_size, is_read)
       VALUES (?, 'admin', 'Fatih Syauqi (Admin)', ?, ?, ?, ?, 0)`,
      [
        session.id,
        cleanMessage,
        attachment_url || null,
        attachment_name || null,
        attachment_size || null
      ]
    );

    // Increment unread_user counter
    await query(
      `UPDATE chat_sessions SET unread_user = unread_user + 1, updated_at = NOW() WHERE id = ?`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      message_id: res.insertId,
      message: "Admin message sent successfully"
    });
  } catch (error) {
    console.error("POST admin chat message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
