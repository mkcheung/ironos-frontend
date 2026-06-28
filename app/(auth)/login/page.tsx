"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import type { User } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json()) as { access?: string; user?: User; error?: string };

      if (!res.ok) {
        notify.error(data.error ?? "Login failed");
        return;
      }

      if (!data.access || !data.user) {
        notify.error("Unexpected response from server");
        return;
      }

      setTokens(data.access, data.user);
      notify.success("Welcome back!");

      if (data.user.onboarding_complete === false) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch {
      notify.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/google-callback" });
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3">
        <Activity size={28} strokeWidth={1.5} className="text-bronze" />
        <h1 className="font-mono text-xs tracking-widest uppercase text-ash">IronOS</h1>
        <p className="text-bone text-xl font-light">Sign in to your account</p>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-xs text-ash uppercase tracking-widest">
            Username
          </label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs text-ash uppercase tracking-widest">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-bronze text-graphite hover:bg-bronze/85 font-medium mt-2"
        >
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 border-t border-ash/20" />
        <span className="text-xs text-ash uppercase tracking-widest">or</span>
        <div className="flex-1 border-t border-ash/20" />
      </div>

      {/* Google SSO */}
      <Button
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full border-ash/40 text-bone hover:bg-slate hover:border-ash/60"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 mr-2"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </Button>

      {/* Register link */}
      <p className="text-center text-sm text-ash">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-bronze hover:text-bronze/80 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
