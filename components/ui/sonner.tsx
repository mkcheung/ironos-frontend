"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--slate)",
          color: "var(--bone)",
          border: "1px solid var(--ash)",
          borderRadius: "var(--radius)",
          fontFamily: "var(--font-sans)",
        },
        classNames: {
          success: "!border-l-2 !border-l-[var(--bronze)]",
          error: "!border-l-2 !border-l-[var(--cordovan)]",
          warning: "!border-l-2 !border-l-[var(--warning)]",
        },
      }}
    />
  );
}
