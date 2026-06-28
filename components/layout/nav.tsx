import Link from "next/link";
import { Activity } from "lucide-react";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ash/20 bg-graphite/95 backdrop-blur supports-[backdrop-filter]:bg-graphite/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-bone hover:text-bronze transition-colors duration-150">
            <Activity size={18} strokeWidth={1.5} />
            <span className="font-mono text-sm tracking-widest uppercase">IronOS</span>
          </Link>
          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
