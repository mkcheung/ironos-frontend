"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { notify } from "@/lib/notify";
import type { User } from "@/lib/auth-context";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { setTokens } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function finalize() {
      try {
        const res = await fetch("/api/auth/google/finalize", { method: "POST" });
        const data = (await res.json()) as {
          access?: string;
          user?: User;
          error?: string;
        };

        if (!res.ok || !data.access || !data.user) {
          notify.error(data.error ?? "Google sign-in failed");
          router.push("/login");
          return;
        }

        setTokens(data.access, data.user);
        notify.success("Welcome!");

        if (data.user.onboarding_complete === false) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } catch {
        notify.error("Something went wrong completing sign-in.");
        router.push("/login");
      }
    }

    finalize();
  }, [router, setTokens]);

  return (
    <div className="flex flex-col items-center gap-4 text-ash">
      <Activity size={28} strokeWidth={1.5} className="text-bronze animate-pulse" />
      <p className="text-sm font-mono tracking-widest uppercase">Completing sign-in…</p>
    </div>
  );
}
