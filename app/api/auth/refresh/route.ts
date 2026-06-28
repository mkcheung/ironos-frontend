import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("iron-refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const djangoRes = await fetch(`${DJANGO_API_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!djangoRes.ok) {
    // Refresh failed — clear the stale cookie
    cookieStore.delete("iron-refresh");
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
  }

  const data = (await djangoRes.json()) as { access: string; refresh?: string };

  // Django Simple JWT may rotate the refresh token
  if (data.refresh) {
    cookieStore.set("iron-refresh", data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  return NextResponse.json({ access: data.access });
}
