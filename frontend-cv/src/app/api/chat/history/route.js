import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitor_id = searchParams.get("visitor_id");
    const tokensParam = searchParams.get("tokens");
    const tokens = tokensParam ? tokensParam.split(",").map(t => t.trim()).filter(Boolean) : [];

    if (!visitor_id && tokens.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    let sessions = [];
    if (tokens.length > 0) {
      const placeholders = tokens.map(() => "?").join(",");
      sessions = await query(
        `SELECT id, session_token, full_name, email, phone_number, initial_message, status, closed_by, created_at, updated_at
         FROM chat_sessions 
         WHERE visitor_device_id = ? OR session_token IN (${placeholders})
         ORDER BY updated_at DESC`,
        [visitor_id || "", ...tokens]
      );
    } else if (visitor_id) {
      sessions = await query(
        `SELECT id, session_token, full_name, email, phone_number, initial_message, status, closed_by, created_at, updated_at
         FROM chat_sessions 
         WHERE visitor_device_id = ?
         ORDER BY updated_at DESC`,
        [visitor_id]
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("GET chat history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
