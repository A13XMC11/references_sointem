import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { referidoSchema } from "@/lib/validations";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, number[]>();

function getRateLimitKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const remoteAddr = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0].trim() || remoteAddr || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const recentTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(key, recentTimestamps);

  // Cleanup old entries
  if (rateLimitMap.size > 1000) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey) {
      rateLimitMap.delete(oldestKey);
    }
  }

  return false;
}

export async function POST(request: Request) {
  // Rate limiting
  const clientKey = getRateLimitKey(request);
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { success: false, errors: [{ message: "Demasiadas solicitudes. Intenta en unos momentos." }] },
      { status: 429 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, errors: [{ message: "JSON invalido" }] },
      { status: 400 },
    );
  }

  const parsed = referidoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from("referidos").insert(parsed.data);

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { success: false, errors: [{ message: "Error al guardar el registro. Intenta nuevamente." }] },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
