"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import type { User } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = (await res.json()) as {
        access?: string;
        user?: User;
        error?: string;
      };

      if (!res.ok) {
        notify.error(data.error ?? "Registration failed");
        return;
      }

      if (!data.access || !data.user) {
        notify.error("Unexpected response from server");
        return;
      }

      setTokens(data.access, data.user);
      notify.success("Account created! Let's get you set up.");
      router.push("/onboarding");
    } catch {
      notify.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3">
        <Activity size={28} strokeWidth={1.5} className="text-bronze" />
        <h1 className="font-mono text-xs tracking-widest uppercase text-ash">IronOS</h1>
        <p className="text-bone text-xl font-light">Create your account</p>
      </div>

      {/* Registration form */}
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
          <label htmlFor="email" className="text-xs text-ash uppercase tracking-widest">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="new-password"
            required
            minLength={8}
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
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-ash">
        Already have an account?{" "}
        <Link href="/login" className="text-bronze hover:text-bronze/80 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
