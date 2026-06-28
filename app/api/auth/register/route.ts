import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as {
    username: string;
    password: string;
    email: string;
  };
  const { username, password, email } = body;

  const djangoRes = await fetch(`${DJANGO_API_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });

  if (!djangoRes.ok) {
    const error = (await djangoRes.json().catch(() => ({ detail: "Registration failed" }))) as
      | Record<string, unknown>
      | { detail?: string };
    const message =
      "detail" in error
        ? (error.detail as string)
        : Object.values(error).flat().join(" ");
    return NextResponse.json(
      { error: message || "Registration failed" },
      { status: djangoRes.status }
    );
  }

  const data = (await djangoRes.json()) as {
    access: string;
    refresh: string;
    user: unknown;
  };

  const cookieStore = await cookies();
  cookieStore.set("iron-refresh", data.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ access: data.access, user: data.user });
}
