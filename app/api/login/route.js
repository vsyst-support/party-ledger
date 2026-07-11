import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_MAX_AGE, createAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (typeof password !== "string" || password !== process.env.LEDGER_PASSWORD) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, await createAuthToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("POST /api/login failed:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
