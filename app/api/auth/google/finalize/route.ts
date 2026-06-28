import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export async function POST(): Promise<NextResponse> {
  const session = await auth();

  const djangoAccess = (session as Record<string, unknown> | null)?.djangoAccess as
    | string
    | undefined;
  const djangoRefresh = (session as Record<string, unknown> | null)?.djangoRefresh as
    | string
    | undefined;

  if (!session || !djangoAccess || !djangoRefresh) {
    return NextResponse.json(
      { error: "No authenticated Google session" },
      { status: 401 }
    );
  }

  // Fetch Django user profile
  const meRes = await fetch(`${DJANGO_API_URL}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${djangoAccess}` },
  });

  const user = meRes.ok ? await meRes.json() : null;

  // Store refresh token in httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set("iron-refresh", djangoRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ access: djangoAccess, user });
}
