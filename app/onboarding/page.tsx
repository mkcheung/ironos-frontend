"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useAuth, getAccessToken } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/notify";

interface FormData {
  // Pane 0 — profile basics
  units: string;
  date_of_birth: string;
  sex: string;
  height_cm: string;
  experience_level: string;
  primary_goal: string;
  equipment_access: string;
  activity_level: string;
  weekly_training_days: string;
  // Pane 1 — body metrics
  bodyweight: string;
  waist_cm: string;
  body_fat_pct: string;
  lean_mass: string;
  resting_heart_rate: string;
  max_heart_rate: string;
}

const INITIAL: FormData = {
  units: "metric",
  date_of_birth: "",
  sex: "",
  height_cm: "",
  experience_level: "",
  primary_goal: "",
  equipment_access: "",
  activity_level: "",
  weekly_training_days: "3",
  bodyweight: "",
  waist_cm: "",
  body_fat_pct: "",
  lean_mass: "",
  resting_heart_rate: "",
  max_heart_rate: "",
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs text-ash uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

function NativeSelect({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[var(--radius)] bg-slate border border-ash/40 text-bone px-3 py-2 text-sm focus:outline-none focus:border-bronze focus:ring-1 focus:ring-bronze/30 cursor-pointer appearance-none"
    >
      {children}
    </select>
  );
}

// ─── Pane 0: Profile basics ───────────────────────────────────────────────────

function PaneProfile({
  data,
  set,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
}) {
  const isMetric = data.units === "metric";

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl font-light text-bone mb-1"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Tell us about yourself
        </h2>
        <p className="text-sm text-ash">
          Help IronOS personalise your coaching. Every field is optional.
        </p>
      </div>

      {/* Units toggle */}
      <Field label="Units">
        <div className="flex gap-3">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set("units", u)}
              className={`flex-1 py-2 rounded-[var(--radius)] text-sm border transition-colors ${
                data.units === u
                  ? "border-bronze bg-bronze/10 text-bronze"
                  : "border-ash/30 text-ash hover:border-ash/60 hover:text-bone"
              }`}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of birth" htmlFor="dob">
          <Input
            id="dob"
            type="date"
            value={data.date_of_birth}
            onChange={(e) => set("date_of_birth", e.target.value)}
            className="bg-slate border-ash/40 text-bone focus-visible:border-bronze focus-visible:ring-bronze/30"
          />
        </Field>

        <Field label="Sex" htmlFor="sex">
          <NativeSelect id="sex" value={data.sex} onChange={(v) => set("sex", v)}>
            <option value="">— choose —</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / prefer not to say</option>
          </NativeSelect>
        </Field>
      </div>

      <Field label={`Height (${isMetric ? "cm" : "in"})`} htmlFor="height">
        <Input
          id="height"
          type="number"
          step="0.1"
          placeholder={isMetric ? "e.g. 178" : "e.g. 70"}
          value={data.height_cm}
          onChange={(e) => set("height_cm", e.target.value)}
          className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
        />
      </Field>

      <Field label="Experience level" htmlFor="exp">
        <NativeSelect
          id="exp"
          value={data.experience_level}
          onChange={(v) => set("experience_level", v)}
        >
          <option value="">— choose —</option>
          <option value="beginner">Beginner (0–1 yr)</option>
          <option value="intermediate">Intermediate (1–4 yr)</option>
          <option value="advanced">Advanced (4+ yr)</option>
        </NativeSelect>
      </Field>

      <Field label="Primary goal" htmlFor="goal">
        <NativeSelect
          id="goal"
          value={data.primary_goal}
          onChange={(v) => set("primary_goal", v)}
        >
          <option value="">— choose —</option>
          <option value="fat_loss">Fat loss</option>
          <option value="lean_bulk">Lean bulk</option>
          <option value="recomp">Body recomposition</option>
          <option value="maintenance">Maintenance</option>
          <option value="general">General fitness</option>
        </NativeSelect>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Equipment" htmlFor="equip">
          <NativeSelect
            id="equip"
            value={data.equipment_access}
            onChange={(v) => set("equipment_access", v)}
          >
            <option value="">— choose —</option>
            <option value="full_gym">Full gym</option>
            <option value="home_gym">Home gym</option>
            <option value="dumbbells_only">Dumbbells only</option>
            <option value="bodyweight">Bodyweight only</option>
          </NativeSelect>
        </Field>

        <Field label="Activity level" htmlFor="activity">
          <NativeSelect
            id="activity"
            value={data.activity_level}
            onChange={(v) => set("activity_level", v)}
          >
            <option value="">— choose —</option>
            <option value="sedentary">Sedentary</option>
            <option value="lightly_active">Lightly active</option>
            <option value="moderately_active">Moderately active</option>
            <option value="very_active">Very active</option>
            <option value="extremely_active">Extremely active</option>
          </NativeSelect>
        </Field>
      </div>

      <Field label="Training days / week" htmlFor="days">
        <Input
          id="days"
          type="number"
          min={1}
          max={7}
          value={data.weekly_training_days}
          onChange={(e) => set("weekly_training_days", e.target.value)}
          className="bg-slate border-ash/40 text-bone focus-visible:border-bronze focus-visible:ring-bronze/30"
        />
      </Field>
    </div>
  );
}

// ─── Pane 1: Body metrics ─────────────────────────────────────────────────────

function PaneMetrics({
  data,
  set,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
}) {
  const isMetric = data.units === "metric";

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl font-light text-bone mb-1"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Baseline body metrics
        </h2>
        <p className="text-sm text-ash">
          All optional — fill in what you have. These seed your first trend points.
        </p>
      </div>

      <Field label={`Bodyweight (${isMetric ? "kg" : "lbs"})`} htmlFor="bw">
        <Input
          id="bw"
          type="number"
          step="0.1"
          placeholder={isMetric ? "e.g. 80.5" : "e.g. 177"}
          value={data.bodyweight}
          onChange={(e) => set("bodyweight", e.target.value)}
          className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label={`Waist (${isMetric ? "cm" : "in"})`} htmlFor="waist">
          <Input
            id="waist"
            type="number"
            step="0.1"
            placeholder={isMetric ? "80" : "32"}
            value={data.waist_cm}
            onChange={(e) => set("waist_cm", e.target.value)}
            className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
          />
        </Field>

        <Field label="Body fat %" htmlFor="bf">
          <Input
            id="bf"
            type="number"
            step="0.1"
            placeholder="e.g. 18"
            value={data.body_fat_pct}
            onChange={(e) => set("body_fat_pct", e.target.value)}
            className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
          />
        </Field>

        <Field label={`Lean mass (${isMetric ? "kg" : "lbs"})`} htmlFor="lean">
          <Input
            id="lean"
            type="number"
            step="0.1"
            placeholder={isMetric ? "65" : "143"}
            value={data.lean_mass}
            onChange={(e) => set("lean_mass", e.target.value)}
            className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
          />
        </Field>
      </div>

      <div className="pt-1">
        <Eyebrow className="mb-3">Heart rate</Eyebrow>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Resting HR (bpm)" htmlFor="rhr">
            <Input
              id="rhr"
              type="number"
              placeholder="e.g. 60"
              value={data.resting_heart_rate}
              onChange={(e) => set("resting_heart_rate", e.target.value)}
              className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
            />
          </Field>

          <Field label="Max HR (bpm)" htmlFor="mhr">
            <Input
              id="mhr"
              type="number"
              placeholder="e.g. 185"
              value={data.max_heart_rate}
              onChange={(e) => set("max_heart_rate", e.target.value)}
              className="bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Pane 2: Review ───────────────────────────────────────────────────────────

function ReviewRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-ash/10 last:border-0">
      <span className="text-xs text-ash uppercase tracking-widest">{label}</span>
      <span className="text-sm text-bone">
        {value}
        {unit && <span className="text-ash ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

function fmt(s: string) {
  return s.replace(/_/g, " ");
}

function PaneReview({ data }: { data: FormData }) {
  const isMetric = data.units === "metric";

  const hasProfileFields =
    data.date_of_birth ||
    data.sex ||
    data.height_cm ||
    data.experience_level ||
    data.primary_goal ||
    data.equipment_access ||
    data.activity_level;

  const hasMetricFields =
    data.bodyweight ||
    data.waist_cm ||
    data.body_fat_pct ||
    data.lean_mass ||
    data.resting_heart_rate ||
    data.max_heart_rate;

  const hasAnything = hasProfileFields || hasMetricFields;

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl font-light text-bone mb-1"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Review your setup
        </h2>
        <p className="text-sm text-ash">
          {hasAnything
            ? "Confirm what you've entered. You can update everything from settings later."
            : "Nothing entered — you can always add baseline data from settings. IronOS will still coach you from day one."}
        </p>
      </div>

      {hasAnything && (
        <div className="bg-slate/60 rounded-[var(--radius-md)] p-4 space-y-0 divide-y divide-ash/10">
          {hasProfileFields && (
            <div className="pb-3 mb-1">
              <Eyebrow className="mb-2">Profile</Eyebrow>
              <ReviewRow label="Units" value={data.units} />
              <ReviewRow label="Date of birth" value={data.date_of_birth} />
              <ReviewRow label="Sex" value={data.sex} />
              <ReviewRow label="Height" value={data.height_cm} unit={isMetric ? "cm" : "in"} />
              <ReviewRow label="Experience" value={fmt(data.experience_level)} />
              <ReviewRow label="Goal" value={fmt(data.primary_goal)} />
              <ReviewRow label="Equipment" value={fmt(data.equipment_access)} />
              <ReviewRow label="Activity" value={fmt(data.activity_level)} />
              <ReviewRow
                label="Training days / wk"
                value={data.weekly_training_days}
              />
            </div>
          )}

          {hasMetricFields && (
            <div className="pt-3">
              <Eyebrow className="mb-2">Body metrics</Eyebrow>
              <ReviewRow
                label="Bodyweight"
                value={data.bodyweight}
                unit={isMetric ? "kg" : "lbs"}
              />
              <ReviewRow
                label="Waist"
                value={data.waist_cm}
                unit={isMetric ? "cm" : "in"}
              />
              <ReviewRow label="Body fat" value={data.body_fat_pct} unit="%" />
              <ReviewRow
                label="Lean mass"
                value={data.lean_mass}
                unit={isMetric ? "kg" : "lbs"}
              />
              <ReviewRow
                label="Resting HR"
                value={data.resting_heart_rate}
                unit="bpm"
              />
              <ReviewRow label="Max HR" value={data.max_heart_rate} unit="bpm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

const STEPS = ["Profile", "Metrics", "Review"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setTokens } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  function set(k: keyof FormData, v: string) {
    setData((prev) => ({ ...prev, [k]: v }));
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Profile PATCH — always fires (carries onboarding_complete: true)
      const profilePatch: Record<string, unknown> = { onboarding_complete: true };
      if (data.units) profilePatch.units = data.units;
      if (data.date_of_birth) profilePatch.date_of_birth = data.date_of_birth;
      if (data.sex) profilePatch.sex = data.sex;
      if (data.height_cm) profilePatch.height_cm = parseFloat(data.height_cm);
      if (data.experience_level) profilePatch.experience_level = data.experience_level;
      if (data.primary_goal) profilePatch.primary_goal = data.primary_goal;
      if (data.equipment_access) profilePatch.equipment_access = data.equipment_access;
      if (data.activity_level) profilePatch.activity_level = data.activity_level;
      if (data.weekly_training_days)
        profilePatch.weekly_training_days = parseInt(data.weekly_training_days, 10);
      if (data.resting_heart_rate)
        profilePatch.resting_heart_rate = parseInt(data.resting_heart_rate, 10);
      if (data.max_heart_rate)
        profilePatch.max_heart_rate = parseInt(data.max_heart_rate, 10);

      const calls: Promise<unknown>[] = [
        apiClient("/api/auth/profile/", {
          method: "PATCH",
          body: JSON.stringify(profilePatch),
        }),
      ];

      // Bodyweight entry (optional)
      if (data.bodyweight) {
        calls.push(
          apiClient("/api/bodyweight/", {
            method: "POST",
            body: JSON.stringify({ date: today, weight: parseFloat(data.bodyweight) }),
          })
        );
      }

      // Body composition entry (optional — any one field triggers it)
      const hasBodyComp = data.waist_cm || data.body_fat_pct || data.lean_mass;
      if (hasBodyComp) {
        const payload: Record<string, unknown> = { date: today };
        // carry bodyweight alongside if provided
        if (data.bodyweight) payload.weight_kg = parseFloat(data.bodyweight);
        if (data.body_fat_pct) payload.body_fat_pct = parseFloat(data.body_fat_pct);
        if (data.lean_mass) payload.lean_mass = parseFloat(data.lean_mass);
        const measurements: Record<string, number> = {};
        if (data.waist_cm) measurements.waist_cm = parseFloat(data.waist_cm);
        if (Object.keys(measurements).length) payload.measurements = measurements;
        calls.push(
          apiClient("/api/body-composition/", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        );
      }

      // Heart-rate entry (optional — written to both profile fields and entries table)
      if (data.resting_heart_rate || data.max_heart_rate) {
        const hrPayload: Record<string, unknown> = { date: today, source: "manual" };
        if (data.resting_heart_rate)
          hrPayload.resting_hr = parseInt(data.resting_heart_rate, 10);
        if (data.max_heart_rate)
          hrPayload.max_hr = parseInt(data.max_heart_rate, 10);
        calls.push(
          apiClient("/api/heart-rate/", {
            method: "POST",
            body: JSON.stringify(hrPayload),
          })
        );
      }

      await Promise.all(calls);

      // Sync auth context so login redirect won't re-trigger onboarding.
      // Use module-level getAccessToken() so we pick up any mid-flow token refresh.
      const currentToken = getAccessToken();
      if (user && currentToken) {
        setTokens(currentToken, { ...user, onboarding_complete: true });
      }

      notify.success("You're all set — let's train!");
      router.push("/");
    } catch {
      notify.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="w-full max-w-xl">
      {/* Brand + step indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Activity size={18} strokeWidth={1.5} className="text-bronze" />
          <span className="font-mono text-xs tracking-widest uppercase text-ash">IronOS</span>
        </div>

        <div className="flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`size-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                  i < step
                    ? "bg-bronze text-graphite"
                    : i === step
                    ? "border border-bronze text-bronze"
                    : "border border-ash/25 text-ash/40"
                }`}
              >
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px ${i < step ? "bg-bronze/50" : "bg-ash/20"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard card */}
      <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-8 shadow-[var(--shadow-warm)]">
        {step === 0 && <PaneProfile data={data} set={set} />}
        {step === 1 && <PaneMetrics data={data} set={set} />}
        {step === 2 && <PaneReview data={data} />}

        {/* Navigation row */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-ash/10">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="text-ash hover:text-bone gap-1.5"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {!isLast && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="text-xs text-ash hover:text-bone transition-colors underline-offset-4 hover:underline"
              >
                Skip
              </button>
            )}

            {isLast ? (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
              >
                {submitting ? "Saving…" : "Finish setup"}
                {!submitting && <Check size={14} />}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
              >
                Continue
                <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Skip directly to review */}
      {step < STEPS.length - 1 && (
        <p className="text-center text-xs text-ash/50 mt-4">
          <button
            type="button"
            onClick={() => setStep(STEPS.length - 1)}
            className="hover:text-ash transition-colors"
          >
            Skip to review →
          </button>
        </p>
      )}
    </div>
  );
}
