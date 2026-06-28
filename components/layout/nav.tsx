"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";

export function Nav() {
  const router = useRouter();
  const { user, accessToken, clearTokens } = useAuth();
  const isAuthenticated = !!accessToken;

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } catch {
      // Best-effort
    }
    clearTokens();
    notify.success("Signed out");
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-ash/20 bg-graphite/95 backdrop-blur supports-[backdrop-filter]:bg-graphite/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-bone hover:text-bronze transition-colors duration-150"
          >
            <Activity size={18} strokeWidth={1.5} />
            <span className="font-mono text-sm tracking-widest uppercase">IronOS</span>
          </Link>

          <div className="flex items-center gap-6">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-ash hover:text-bone transition-colors duration-150"
                >
                  Dashboard
                </Link>
                <Link
                  href="/training"
                  className="text-sm text-ash hover:text-bone transition-colors duration-150"
                >
                  Training
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.username && (
                  <span className="text-xs text-ash font-mono">{user.username}</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-ash/30 text-ash hover:text-bone hover:border-ash/60"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-bronze/50 text-bronze hover:bg-bronze/10 hover:border-bronze"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
