import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://localhost:8000";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      // When Google signs in, exchange the Google ID token for Django tokens
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(`${DJANGO_API_URL}/api/auth/google/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (res.ok) {
            const data = (await res.json()) as { access: string; refresh: string };
            token.djangoAccess = data.access;
            token.djangoRefresh = data.refresh;
          }
        } catch {
          // Exchange failed — tokens will be undefined
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose Django access token on the session (used by finalize route)
      const s = session as unknown as Record<string, unknown>;
      s.djangoAccess = token.djangoAccess;
      s.djangoRefresh = token.djangoRefresh;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
