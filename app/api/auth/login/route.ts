import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as { username: string; password: string };
  const { username, password } = body;

  const djangoRes = await fetch(`${DJANGO_API_URL}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!djangoRes.ok) {
    const error = (await djangoRes.json().catch(() => ({ detail: "Invalid credentials" }))) as {
      detail?: string;
    };
    return NextResponse.json(
      { error: error.detail ?? "Login failed" },
      { status: djangoRes.status }
    );
  }

  const tokens = (await djangoRes.json()) as { access: string; refresh: string };

  // Fetch the user profile
  const meRes = await fetch(`${DJANGO_API_URL}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });

  const user = meRes.ok ? await meRes.json() : null;

  const cookieStore = await cookies();
  cookieStore.set("iron-refresh", tokens.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ access: tokens.access, user });
}
