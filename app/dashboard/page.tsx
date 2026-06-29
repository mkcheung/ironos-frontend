"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { Target } from "lucide-react";

import { AppShell } from "@/components/layout/shell";
import { DossierStat } from "@/components/ui/dossier-stat";
import { Eyebrow } from "@/components/ui/eyebrow";
import { apiClient } from "@/lib/api-client";

// ── Design token literals for Recharts (CSS vars don't work inside SVG props) ─
const BRONZE = "#B08D57";
const ASH = "#8A817A";
const BONE = "#EFEAE0";
const SLATE = "#211C19";

// ── TypeScript interfaces ─────────────────────────────────────────────────────

interface BodyweightPoint {
  date: string;
  weight: number | null;
  rolling_avg: number | null;
}

interface BodyComposition {
  body_fat_pct: number | null;
  lean_mass: number | null;
  date: string | null;
}

interface GoalProgress {
  baseline: number;
  current: number;
  target: number;
  percent_to_target: number;
  on_pace: boolean;
  projected_completion_date: string | null;
}

interface ActiveGoal {
  id: number;
  title: string;
  goal_type: string;
  target_date: string | null;
  progress: GoalProgress;
}

interface CardioZonePoint {
  week_start: string;
  z2_minutes: number;
  total_zone_minutes: number;
}

interface Adherence {
  scheduled_days: number;
  completed_days: number;
  rate: number;
}

interface DashboardSummary {
  bodyweight_trend: BodyweightPoint[];
  body_composition: BodyComposition | null;
  est_1rm_main_lifts: Record<string, number | null>;
  weekly_volume_by_muscle: Record<string, number>;
  cardio_zone_trends: CardioZonePoint[];
  adherence: Adherence;
  active_goals: ActiveGoal[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function fmtWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

function fmtProjectedDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Custom Recharts Tooltip ───────────────────────────────────────────────────

interface TooltipEntry {
  name: string;
  value: number | null;
  color?: string;
}

function ThemedTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: SLATE,
        border: `1px solid ${BRONZE}`,
        borderRadius: 4,
        padding: "8px 12px",
        fontFamily: "var(--font-geist-mono)",
        fontSize: 11,
        color: BONE,
        minWidth: 100,
      }}
    >
      {label && (
        <div style={{ color: ASH, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: entry.color ?? ASH }}>{capitalize(entry.name)}</span>
          <span style={{ color: BONE }}>{entry.value != null ? entry.value : "—"}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ background: "rgba(138,129,122,0.1)", borderRadius: 4, animation: "pulse 2s infinite" }}
    />
  );
}

function LoadingState() {
  return (
    <div className="space-y-10">
      {/* Hero row */}
      <div className="grid grid-cols-3 gap-8">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      {/* Chart placeholders */}
      <Skeleton className="h-48 rounded-[var(--radius-md)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-48 rounded-[var(--radius-md)]" />
      <Skeleton className="h-48 rounded-[var(--radius-md)]" />
      <Skeleton className="h-20" />
      <Skeleton className="h-48 rounded-[var(--radius-md)]" />
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-cordovan/30 bg-slate p-6"
      style={{ color: "#6E2B2B" }}
    >
      <p className="text-sm" style={{ color: ASH }}>
        Failed to load dashboard data.{" "}
        <span style={{ color: "#6E2B2B" }}>{message}</span>
      </p>
    </div>
  );
}

// ── Main dashboard page ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient<DashboardSummary>("/api/dashboard/summary/"),
  });

  return (
    <AppShell>
      {/* Page heading */}
      <div className="mb-10">
        <h1
          className="text-3xl font-light text-bone mb-1"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: ASH }}>
          Your training at a glance
        </p>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={(error as Error).message} />}

      {data && (
        <div className="space-y-12">
          {/* ── Section 1: Est. 1RM Hero Row ─────────────────────────────── */}
          <section>
            <Eyebrow className="mb-4">Estimated 1-rep max</Eyebrow>
            <div
              className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]"
            >
              <div className="grid grid-cols-3 gap-8">
                {(["bench press", "squat", "deadlift"] as const).map((lift) => {
                  const val = data.est_1rm_main_lifts[lift];
                  return (
                    <DossierStat
                      key={lift}
                      value={val != null ? val.toFixed(0) : "—"}
                      unit={val != null ? "kg" : undefined}
                      label={capitalize(lift)}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Section 2: Bodyweight trend chart ─────────────────────────── */}
          <section>
            <Eyebrow className="mb-4">Bodyweight trend (30 days)</Eyebrow>
            <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
              {data.bodyweight_trend.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: ASH }}>
                  No bodyweight data logged yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={data.bodyweight_trend.map((p) => ({ ...p, dateLabel: fmtDate(p.date) }))}
                    margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid stroke={`${ASH}1A`} vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: ASH, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      angle={-30}
                      textAnchor="end"
                      height={36}
                    />
                    <YAxis
                      tick={{ fill: ASH, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(v: number) => `${v}`}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<ThemedTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke={BONE}
                      strokeWidth={1.5}
                      dot={false}
                      name="weight"
                    />
                    <Line
                      type="monotone"
                      dataKey="rolling_avg"
                      stroke={BRONZE}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      name="rolling avg"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* ── Section 3: Body composition ───────────────────────────────── */}
          <section>
            <Eyebrow className="mb-4">Body composition</Eyebrow>
            <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
              {!data.body_composition ||
              (data.body_composition.body_fat_pct == null &&
                data.body_composition.lean_mass == null) ? (
                <p className="text-sm" style={{ color: ASH }}>
                  No body composition data recorded yet.
                </p>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DossierStat
                      value={
                        data.body_composition.body_fat_pct != null
                          ? data.body_composition.body_fat_pct.toFixed(1)
                          : "—"
                      }
                      unit={data.body_composition.body_fat_pct != null ? "%" : undefined}
                      label="Body fat"
                    />
                    <DossierStat
                      value={
                        data.body_composition.lean_mass != null
                          ? data.body_composition.lean_mass.toFixed(1)
                          : "—"
                      }
                      unit={data.body_composition.lean_mass != null ? "kg" : undefined}
                      label="Lean mass"
                    />
                  </div>
                  {data.body_composition.date && (
                    <p
                      className="text-xs mt-4"
                      style={{ color: ASH, fontFamily: "var(--font-geist-mono)" }}
                    >
                      Last recorded: {fmtProjectedDate(data.body_composition.date)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Section 4: Weekly volume by muscle ───────────────────────── */}
          <section>
            <Eyebrow className="mb-4">This week&apos;s volume by muscle</Eyebrow>
            <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
              {Object.keys(data.weekly_volume_by_muscle).length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: ASH }}>
                  No training data this week.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={Object.entries(data.weekly_volume_by_muscle).map(([muscle, volume]) => ({
                      muscle: capitalize(muscle),
                      volume,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 40, left: 0 }}
                  >
                    <CartesianGrid stroke={`${ASH}1A`} vertical={false} />
                    <XAxis
                      dataKey="muscle"
                      tick={{ fill: ASH, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fill: ASH, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={fmtVolume}
                    />
                    <Tooltip content={<ThemedTooltip />} />
                    <Bar dataKey="volume" fill={BRONZE} opacity={0.85} radius={[2, 2, 0, 0]} name="volume" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* ── Section 5: Cardio zone trends ────────────────────────────── */}
          <section>
            <Eyebrow className="mb-4">Weekly zone minutes (8 weeks)</Eyebrow>
            <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
              {data.cardio_zone_trends.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: ASH }}>
                  No cardio zone data recorded yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart
                    data={data.cardio_zone_trends.map((p) => ({
                      ...p,
                      weekLabel: fmtWeek(p.week_start),
                    }))}
                    margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid stroke={`${ASH}1A`} vertical={false} />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{ fill: ASH, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: ASH, fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(v: number) => `${v}m`}
                    />
                    <Tooltip content={<ThemedTooltip />} />
                    <Bar
                      dataKey="total_zone_minutes"
                      fill={ASH}
                      opacity={0.4}
                      radius={[2, 2, 0, 0]}
                      name="total zone"
                    />
                    <Bar
                      dataKey="z2_minutes"
                      fill={BRONZE}
                      opacity={0.85}
                      radius={[2, 2, 0, 0]}
                      name="zone 2"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* ── Section 6: Adherence ─────────────────────────────────────── */}
          <section>
            <Eyebrow className="mb-4">Adherence (last 28 days)</Eyebrow>
            <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
              <div className="flex items-start gap-8">
                <DossierStat
                  value={Math.round(data.adherence.rate * 100)}
                  unit="%"
                  label="Sessions logged"
                />
                <div className="pt-1">
                  <p
                    className="text-xs"
                    style={{
                      color: ASH,
                      fontFamily: "var(--font-geist-mono)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {data.adherence.completed_days} of {data.adherence.scheduled_days} scheduled sessions
                  </p>
                  {/* Mini progress bar */}
                  <div
                    className="mt-3 rounded-full overflow-hidden"
                    style={{ height: 4, width: 180, background: `${ASH}33` }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.round(data.adherence.rate * 100))}%`,
                        background: BRONZE,
                        borderRadius: 999,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 7: Active goals ───────────────────────────────────── */}
          <section>
            <Eyebrow className="mb-4">Active goals</Eyebrow>
            {data.active_goals.length === 0 ? (
              <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)] text-center">
                <Target
                  size={24}
                  strokeWidth={1.5}
                  style={{ color: ASH, margin: "0 auto 12px" }}
                />
                <p className="text-sm mb-3" style={{ color: ASH }}>
                  No active goals yet.
                </p>
                <Link
                  href="/training"
                  className="text-xs underline underline-offset-2 transition-colors"
                  style={{ color: BRONZE }}
                >
                  Set a training goal →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.active_goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]"
                  >
                    {/* Goal title */}
                    <h3
                      className="text-lg font-light text-bone mb-4 leading-snug"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      {goal.title}
                    </h3>

                    {/* Progress bar */}
                    <div
                      className="rounded-full overflow-hidden mb-4"
                      style={{ height: 4, background: `${ASH}33` }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, goal.progress.percent_to_target)}%`,
                          background: BRONZE,
                          borderRadius: 999,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>

                    {/* Stat + badge row */}
                    <div className="flex items-end justify-between">
                      <DossierStat
                        value={goal.progress.percent_to_target.toFixed(0)}
                        unit="%"
                        label="complete"
                      />
                      <div className="text-right pb-1">
                        <span
                          className="text-xs font-mono uppercase tracking-widest"
                          style={{
                            color: goal.progress.on_pace ? BRONZE : ASH,
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          {goal.progress.on_pace ? "on pace" : "behind"}
                        </span>
                        {goal.progress.projected_completion_date && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: ASH, fontFamily: "var(--font-geist-mono)" }}
                          >
                            Est. {fmtProjectedDate(goal.progress.projected_completion_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
