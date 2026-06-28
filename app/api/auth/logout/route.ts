import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("iron-refresh")?.value;

  // Try to read access token from Authorization header
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (refreshToken && accessToken) {
    // Blacklist the refresh token on the Django side
    await fetch(`${DJANGO_API_URL}/api/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {
      // Best-effort: clear the cookie regardless
    });
  }

  cookieStore.delete("iron-refresh");

  return NextResponse.json({ success: true });
}
