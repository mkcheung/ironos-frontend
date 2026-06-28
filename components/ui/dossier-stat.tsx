import { cn } from "@/lib/utils";

interface DossierStatProps {
  value: string | number;
  label: string;
  unit?: string;
  className?: string;
}

export function DossierStat({ value, label, unit, className }: DossierStatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-1">
        <span
          className="font-display text-5xl font-light tracking-tight text-bone leading-none"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-sm text-ash font-mono tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        className="text-xs tracking-widest uppercase text-ash font-mono"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {label}
      </div>
      {/* Bronze under-rule */}
      <div className="h-px w-12 bg-bronze mt-1" />
    </div>
  );
}
