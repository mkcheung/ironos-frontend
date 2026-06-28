import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "text-xs tracking-widest uppercase text-ash font-mono block",
        className
      )}
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {children}
    </span>
  );
}
