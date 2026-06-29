"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Target,
  Dumbbell,
  Activity,
  Check,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/layout/shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DossierStat } from "@/components/ui/dossier-stat";
import { Eyebrow } from "@/components/ui/eyebrow";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/notify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: number;
  name: string;
  primary_muscle: string;
  category: string;
  equipment: string;
}

interface Goal {
  id: number;
  user: number;
  goal_type: "strength" | "bodyweight" | "body_fat" | "performance" | "habit";
  title: string;
  exercise: number | null;
  target_mode: "one_rm" | "weight_for_reps" | "x_bodyweight" | null;
  target_value: number | null;
  target_reps: number | null;
  target_weight: number | null;
  target_bodyfat: number | null;
  baseline_value: number;
  target_date: string | null;
  status: "active" | "achieved" | "abandoned";
  status_changed_at: string | null;
  superseded_by: number | null;
  created_at: string;
  progress: {
    baseline: number;
    current: number;
    target: number;
    percent_to_target: number;
    on_pace: boolean;
    projected_completion_date: string | null;
  } | null;
}

interface BodyweightEntry {
  date: string;
  weight: number;
}

interface BodyCompEntry {
  date: string;
  body_fat_pct?: number | null;
}

// ─── Shared Primitives ────────────────────────────────────────────────────────

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
      <label
        htmlFor={htmlFor}
        className="text-xs text-ash uppercase tracking-widest"
      >
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

const inputCls =
  "bg-slate border-ash/40 text-bone placeholder:text-ash/50 focus-visible:border-bronze focus-visible:ring-bronze/30";

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── Exercise Search ──────────────────────────────────────────────────────────

function ExerciseSearch({
  onSelect,
}: {
  onSelect: (exercise: Exercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    apiClient<Exercise[]>(`/api/exercises/?search=${encodeURIComponent(q)}`)
      .then((data) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handleSelect(ex: Exercise) {
    onSelect(ex);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search exercises…"
        value={query}
        onChange={handleChange}
        className={inputCls}
      />
      {(results.length > 0 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-slate border border-ash/30 rounded-[var(--radius-md)] shadow-[var(--shadow-warm)] overflow-hidden">
          {loading && (
            <div className="px-3 py-2 text-xs text-ash">Searching…</div>
          )}
          {results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleSelect(ex)}
              className="w-full text-left px-3 py-2 text-sm text-bone hover:bg-ash/10 transition-colors border-b border-ash/10 last:border-0"
            >
              <span className="font-medium">{ex.name}</span>
              {ex.primary_muscle && (
                <span className="ml-2 text-xs text-ash">{ex.primary_muscle}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Workout Tab ──────────────────────────────────────────────────────────────

interface SetEntry {
  id: string;
  weight: string;
  reps: string;
  rpe: string;
  set_type: string;
}

interface ExerciseEntry {
  id: string;
  exercise: Exercise;
  sets: SetEntry[];
}

function newSetEntry(): SetEntry {
  return {
    id: crypto.randomUUID(),
    weight: "",
    reps: "",
    rpe: "",
    set_type: "working",
  };
}

function WorkoutTab() {
  const [date, setDate] = useState(today());
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addExercise(ex: Exercise) {
    setExercises((prev) => [
      ...prev,
      { id: crypto.randomUUID(), exercise: ex, sets: [newSetEntry()] },
    ]);
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function addSet(exerciseId: string) {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: [...e.sets, newSetEntry()] }
          : e
      )
    );
  }

  function removeSet(exerciseId: string, setId: string) {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          : e
      )
    );
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    field: keyof SetEntry,
    value: string
  ) {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : e
      )
    );
  }

  async function handleSubmit() {
    if (exercises.length === 0) {
      notify.error("Add at least one exercise before logging.");
      return;
    }
    setSubmitting(true);
    try {
      const sessionPayload: Record<string, unknown> = { date };
      if (duration) sessionPayload.duration_minutes = parseInt(duration, 10);
      if (notes) sessionPayload.notes = notes;

      const session = await apiClient<{ id: number }>("/api/sessions/", {
        method: "POST",
        body: JSON.stringify(sessionPayload),
      });

      const setPromises: Promise<unknown>[] = [];
      for (const exEntry of exercises) {
        exEntry.sets.forEach((s, idx) => {
          const setPayload: Record<string, unknown> = {
            session: session.id,
            exercise: exEntry.exercise.id,
            set_index: idx + 1,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            set_type: s.set_type,
          };
          if (s.rpe) setPayload.rpe = parseFloat(s.rpe);
          setPromises.push(
            apiClient("/api/session-sets/", {
              method: "POST",
              body: JSON.stringify(setPayload),
            })
          );
        });
      }

      await Promise.all(setPromises);

      notify.success("Workout logged");
      setDate(today());
      setDuration("");
      setNotes("");
      setExercises([]);
    } catch {
      notify.error("Failed to log workout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
        <Eyebrow className="mb-4">Session details</Eyebrow>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Date" htmlFor="w-date">
            <Input
              id="w-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Duration (min)" htmlFor="w-dur">
            <Input
              id="w-dur"
              type="number"
              placeholder="e.g. 60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Notes" htmlFor="w-notes">
          <textarea
            id="w-notes"
            placeholder="Optional session notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-[var(--radius)] bg-slate border border-ash/40 text-bone px-3 py-2 text-sm placeholder:text-ash/50 focus:outline-none focus:border-bronze focus:ring-1 focus:ring-bronze/30 resize-none"
          />
        </Field>
      </div>

      <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)]">
        <Eyebrow className="mb-4">Exercises</Eyebrow>
        <Field label="Search exercise">
          <ExerciseSearch onSelect={addExercise} />
        </Field>

        {exercises.length > 0 && (
          <div className="mt-5 space-y-5">
            {exercises.map((exEntry) => (
              <div
                key={exEntry.id}
                className="border border-ash/20 rounded-[var(--radius-md)] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={14} strokeWidth={1.5} className="text-bronze" />
                    <span className="text-sm font-medium text-bone">
                      {exEntry.exercise.name}
                    </span>
                    {exEntry.exercise.primary_muscle && (
                      <Eyebrow className="inline">{exEntry.exercise.primary_muscle}</Eyebrow>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exEntry.id)}
                    className="text-ash hover:text-cordovan transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Set header */}
                <div className="grid grid-cols-[1fr_1fr_1fr_2fr_auto] gap-2 text-xs text-ash uppercase tracking-widest">
                  <span>Weight</span>
                  <span>Reps</span>
                  <span>RPE</span>
                  <span>Type</span>
                  <span />
                </div>

                {exEntry.sets.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_1fr_1fr_2fr_auto] gap-2 items-center"
                  >
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="kg"
                      value={s.weight}
                      onChange={(e) =>
                        updateSet(exEntry.id, s.id, "weight", e.target.value)
                      }
                      className={`${inputCls} h-7 text-xs px-2`}
                    />
                    <Input
                      type="number"
                      placeholder="reps"
                      value={s.reps}
                      onChange={(e) =>
                        updateSet(exEntry.id, s.id, "reps", e.target.value)
                      }
                      className={`${inputCls} h-7 text-xs px-2`}
                    />
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      max="10"
                      placeholder="1–10"
                      value={s.rpe}
                      onChange={(e) =>
                        updateSet(exEntry.id, s.id, "rpe", e.target.value)
                      }
                      className={`${inputCls} h-7 text-xs px-2`}
                    />
                    <select
                      value={s.set_type}
                      onChange={(e) =>
                        updateSet(exEntry.id, s.id, "set_type", e.target.value)
                      }
                      className="rounded-[var(--radius)] bg-slate border border-ash/40 text-bone px-2 py-1 text-xs focus:outline-none focus:border-bronze cursor-pointer appearance-none h-7"
                    >
                      <option value="working">Working</option>
                      <option value="warmup">Warm-up</option>
                      <option value="backoff">Back-off</option>
                      <option value="dropset">Drop set</option>
                      <option value="failure">Failure</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSet(exEntry.id, s.id)}
                      className="text-ash hover:text-cordovan transition-colors"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSet(exEntry.id)}
                  className="flex items-center gap-1.5 text-xs text-bronze hover:text-bronze/80 transition-colors mt-1"
                >
                  <Plus size={12} strokeWidth={1.5} />
                  Add set
                </button>
              </div>
            ))}
          </div>
        )}

        {exercises.length === 0 && (
          <p className="mt-4 text-sm text-ash/60 text-center py-4 border border-dashed border-ash/20 rounded-[var(--radius-md)]">
            Search for an exercise above to get started
          </p>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || exercises.length === 0}
        className="w-full bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
      >
        {submitting ? (
          "Logging…"
        ) : (
          <>
            <Check size={14} strokeWidth={1.5} />
            Log workout
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Bodyweight Tab ───────────────────────────────────────────────────────────

function BodyweightTab() {
  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!weight) {
      notify.error("Enter a weight value.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient("/api/bodyweight/", {
        method: "POST",
        body: JSON.stringify({ date, weight: parseFloat(weight) }),
      });
      notify.success("Weight logged");
      setDate(today());
      setWeight("");
    } catch {
      notify.error("Failed to log weight. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)] space-y-5">
      <Eyebrow>Log bodyweight</Eyebrow>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" htmlFor="bw-date">
          <Input
            id="bw-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Weight (kg)" htmlFor="bw-weight">
          <Input
            id="bw-weight"
            type="number"
            step="0.1"
            placeholder="e.g. 80.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={submitting || !weight}
        className="w-full bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
      >
        {submitting ? "Logging…" : (
          <>
            <Check size={14} strokeWidth={1.5} />
            Log weight
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Body Comp Tab ────────────────────────────────────────────────────────────

function BodyCompTab() {
  const [date, setDate] = useState(today());
  const [weightKg, setWeightKg] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [leanMass, setLeanMass] = useState("");
  const [waist, setWaist] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { date };
      if (weightKg) payload.weight_kg = parseFloat(weightKg);
      if (bodyFat) payload.body_fat_pct = parseFloat(bodyFat);
      if (leanMass) payload.lean_mass = parseFloat(leanMass);
      const measurements: Record<string, number> = {};
      if (waist) measurements.waist_cm = parseFloat(waist);
      if (Object.keys(measurements).length) payload.measurements = measurements;

      await apiClient("/api/body-composition/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      notify.success("Body composition logged");
      setDate(today());
      setWeightKg("");
      setBodyFat("");
      setLeanMass("");
      setWaist("");
    } catch {
      notify.error("Failed to log body composition. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)] space-y-5">
      <Eyebrow>Log body composition</Eyebrow>
      <Field label="Date" htmlFor="bc-date">
        <Input
          id="bc-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Weight (kg)" htmlFor="bc-weight">
          <Input
            id="bc-weight"
            type="number"
            step="0.1"
            placeholder="e.g. 80.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Body fat %" htmlFor="bc-bf">
          <Input
            id="bc-bf"
            type="number"
            step="0.1"
            placeholder="e.g. 18.0"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Lean mass (kg)" htmlFor="bc-lean">
          <Input
            id="bc-lean"
            type="number"
            step="0.1"
            placeholder="e.g. 65.0"
            value={leanMass}
            onChange={(e) => setLeanMass(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Waist (cm)" htmlFor="bc-waist">
          <Input
            id="bc-waist"
            type="number"
            step="0.1"
            placeholder="e.g. 82.0"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
      >
        {submitting ? "Logging…" : (
          <>
            <Check size={14} strokeWidth={1.5} />
            Log body comp
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Cardio Tab ───────────────────────────────────────────────────────────────

function CardioTab() {
  const [date, setDate] = useState(today());
  const [modality, setModality] = useState("steady");
  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const [maxHr, setMaxHr] = useState("");
  const [avgPace, setAvgPace] = useState("");
  const [paceUnit, setPaceUnit] = useState("min_per_km");
  const [z1, setZ1] = useState("");
  const [z2, setZ2] = useState("");
  const [z3, setZ3] = useState("");
  const [z4, setZ4] = useState("");
  const [z5, setZ5] = useState("");
  const [perceivedExertion, setPerceivedExertion] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!activity || !duration) {
      notify.error("Activity and duration are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        date,
        modality,
        activity,
        duration_minutes: parseInt(duration, 10),
      };
      if (distance) payload.distance_km = parseFloat(distance);
      if (avgHr) payload.avg_heart_rate = parseInt(avgHr, 10);
      if (maxHr) payload.max_heart_rate = parseInt(maxHr, 10);
      if (avgPace) {
        payload.avg_pace = parseFloat(avgPace);
        payload.pace_unit = paceUnit;
      }
      if (perceivedExertion) payload.perceived_exertion = parseInt(perceivedExertion, 10);
      if (notes) payload.notes = notes;

      const zoneMinutes: Record<string, number> = {};
      if (z1 && parseInt(z1, 10)) zoneMinutes.z1 = parseInt(z1, 10);
      if (z2 && parseInt(z2, 10)) zoneMinutes.z2 = parseInt(z2, 10);
      if (z3 && parseInt(z3, 10)) zoneMinutes.z3 = parseInt(z3, 10);
      if (z4 && parseInt(z4, 10)) zoneMinutes.z4 = parseInt(z4, 10);
      if (z5 && parseInt(z5, 10)) zoneMinutes.z5 = parseInt(z5, 10);
      if (Object.keys(zoneMinutes).length) payload.zone_minutes = zoneMinutes;

      await apiClient("/api/cardio/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      notify.success("Cardio logged");
      setDate(today());
      setModality("steady");
      setActivity("");
      setDuration("");
      setDistance("");
      setAvgHr("");
      setMaxHr("");
      setAvgPace("");
      setPaceUnit("min/km");
      setZ1("");
      setZ2("");
      setZ3("");
      setZ4("");
      setZ5("");
      setPerceivedExertion("");
      setNotes("");
    } catch {
      notify.error("Failed to log cardio. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)] space-y-5">
      <Eyebrow>Log cardio</Eyebrow>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" htmlFor="c-date">
          <Input
            id="c-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Modality" htmlFor="c-modality">
          <NativeSelect id="c-modality" value={modality} onChange={setModality}>
            <option value="steady">Steady state</option>
            <option value="hiit">HIIT</option>
            <option value="sport">Sport</option>
          </NativeSelect>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Activity" htmlFor="c-activity">
          <Input
            id="c-activity"
            type="text"
            placeholder="e.g. Running"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Duration (min)" htmlFor="c-dur">
          <Input
            id="c-dur"
            type="number"
            placeholder="e.g. 45"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Distance (km)" htmlFor="c-dist">
          <Input
            id="c-dist"
            type="number"
            step="0.01"
            placeholder="e.g. 5.00"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Perceived exertion (1–10)" htmlFor="c-pe">
          <Input
            id="c-pe"
            type="number"
            min="1"
            max="10"
            placeholder="1–10"
            value={perceivedExertion}
            onChange={(e) => setPerceivedExertion(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Avg heart rate (bpm)" htmlFor="c-avhr">
          <Input
            id="c-avhr"
            type="number"
            placeholder="e.g. 145"
            value={avgHr}
            onChange={(e) => setAvgHr(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Max heart rate (bpm)" htmlFor="c-mxhr">
          <Input
            id="c-mxhr"
            type="number"
            placeholder="e.g. 178"
            value={maxHr}
            onChange={(e) => setMaxHr(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Avg pace" htmlFor="c-pace">
          <Input
            id="c-pace"
            type="number"
            step="0.01"
            placeholder="e.g. 5.30"
            value={avgPace}
            onChange={(e) => setAvgPace(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Pace unit" htmlFor="c-punit">
          <NativeSelect id="c-punit" value={paceUnit} onChange={setPaceUnit}>
            <option value="min_per_km">min/km</option>
            <option value="min_per_mile">min/mile</option>
          </NativeSelect>
        </Field>
      </div>

      <div>
        <Eyebrow className="mb-3">Zone minutes (optional)</Eyebrow>
        <div className="grid grid-cols-5 gap-2">
          {([
            ["Z1", z1, setZ1],
            ["Z2", z2, setZ2],
            ["Z3", z3, setZ3],
            ["Z4", z4, setZ4],
            ["Z5", z5, setZ5],
          ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]).map(
            ([label, val, setter]) => (
              <div key={label} className="space-y-1">
                <label className="text-xs text-ash uppercase tracking-widest block">
                  {label}
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  className={`${inputCls} text-xs px-2`}
                />
              </div>
            )
          )}
        </div>
      </div>

      <Field label="Notes" htmlFor="c-notes">
        <textarea
          id="c-notes"
          placeholder="Optional notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-[var(--radius)] bg-slate border border-ash/40 text-bone px-3 py-2 text-sm placeholder:text-ash/50 focus:outline-none focus:border-bronze focus:ring-1 focus:ring-bronze/30 resize-none"
        />
      </Field>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !activity || !duration}
        className="w-full bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
      >
        {submitting ? "Logging…" : (
          <>
            <Activity size={14} strokeWidth={1.5} />
            Log cardio
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const pct = goal.progress?.percent_to_target ?? 0;
  const onPace = goal.progress?.on_pace ?? false;
  const projDate = goal.progress?.projected_completion_date ?? null;

  return (
    <div className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-warm)] space-y-4">
      <div>
        <Eyebrow className="mb-1.5">{goal.goal_type}</Eyebrow>
        <h3
          className="text-xl font-light text-bone"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {goal.title}
        </h3>
      </div>

      {goal.progress && (
        <div>
          <DossierStat
            value={pct.toFixed(0)}
            unit="%"
            label="progress"
          />
          <div className="h-1 bg-ash/20 rounded-full mt-2">
            <div
              className="h-1 bg-bronze rounded-full transition-all"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <span
          className={`text-xs font-mono uppercase tracking-widest ${
            onPace ? "text-bronze" : "text-ash"
          }`}
        >
          {onPace ? "On pace" : "Behind pace"}
        </span>
        {projDate && (
          <span className="text-xs text-ash">
            Est. {formatMonthYear(projDate)}
          </span>
        )}
        {goal.target_date && (
          <span className="text-xs text-ash">
            Target: {formatMonthYear(goal.target_date)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatMonthYear(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── Set Goal Dialog ──────────────────────────────────────────────────────────

function SetGoalDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("strength");
  const [targetMode, setTargetMode] = useState("one_rm");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [baselineValue, setBaselineValue] = useState("");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseResults, setExerciseResults] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-populate baseline for bodyweight/body_fat goals
  useEffect(() => {
    if (goalType === "bodyweight") {
      apiClient<BodyweightEntry[]>("/api/bodyweight/")
        .then((entries) => {
          if (entries.length > 0) {
            setBaselineValue(String(entries[0].weight));
          }
        })
        .catch(() => {});
    } else if (goalType === "body_fat") {
      apiClient<BodyCompEntry[]>("/api/body-composition/")
        .then((entries) => {
          const entry = entries.find((e) => e.body_fat_pct != null);
          if (entry?.body_fat_pct != null) {
            setBaselineValue(String(entry.body_fat_pct));
          }
        })
        .catch(() => {});
    } else {
      setBaselineValue("");
    }
  }, [goalType]);

  function searchExercises(q: string) {
    if (!q.trim()) {
      setExerciseResults([]);
      return;
    }
    apiClient<Exercise[]>(`/api/exercises/?search=${encodeURIComponent(q)}`)
      .then(setExerciseResults)
      .catch(() => setExerciseResults([]));
  }

  function handleExerciseInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setExerciseQuery(val);
    setSelectedExercise(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchExercises(val), 400);
  }

  async function handleSubmit() {
    if (!title || !baselineValue) {
      notify.error("Title and baseline value are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        goal_type: goalType,
        title,
        baseline_value: parseFloat(baselineValue),
      };
      if (targetValue) payload.target_value = parseFloat(targetValue);
      if (targetDate) payload.target_date = targetDate;
      if (goalType === "strength") {
        if (selectedExercise) payload.exercise = selectedExercise.id;
        payload.target_mode = targetMode;
      }

      await apiClient("/api/goals/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      notify.success("Goal set");
      onSuccess();
      setOpen(false);
      setTitle("");
      setGoalType("strength");
      setTargetMode("one_rm");
      setTargetValue("");
      setTargetDate("");
      setBaselineValue("");
      setExerciseQuery("");
      setSelectedExercise(null);
      setExerciseResults([]);
    } catch {
      notify.error("Failed to set goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-bronze/50 text-bronze hover:bg-bronze/10 gap-2" />}>
        <Plus size={14} strokeWidth={1.5} />
        Set new goal
      </DialogTrigger>
      <DialogContent className="bg-slate border-ash/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-bone" style={{ fontFamily: "var(--font-fraunces)" }}>
            Set a new goal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Goal title" htmlFor="g-title">
            <Input
              id="g-title"
              type="text"
              placeholder="e.g. 100kg squat"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Goal type" htmlFor="g-type">
            <NativeSelect id="g-type" value={goalType} onChange={setGoalType}>
              <option value="strength">Strength</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="body_fat">Body fat</option>
              <option value="performance">Performance</option>
              <option value="habit">Habit</option>
            </NativeSelect>
          </Field>

          {goalType === "strength" && (
            <>
              <Field label="Exercise">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search exercise…"
                    value={selectedExercise ? selectedExercise.name : exerciseQuery}
                    onChange={handleExerciseInput}
                    className={inputCls}
                  />
                  {exerciseResults.length > 0 && !selectedExercise && (
                    <div className="absolute z-10 w-full mt-1 bg-slate border border-ash/30 rounded-[var(--radius-md)] shadow-[var(--shadow-warm)] overflow-hidden">
                      {exerciseResults.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            setSelectedExercise(ex);
                            setExerciseQuery(ex.name);
                            setExerciseResults([]);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-bone hover:bg-ash/10 transition-colors border-b border-ash/10 last:border-0"
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Target mode" htmlFor="g-tmode">
                <NativeSelect id="g-tmode" value={targetMode} onChange={setTargetMode}>
                  <option value="one_rm">1RM</option>
                  <option value="weight_for_reps">Weight for reps</option>
                </NativeSelect>
              </Field>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Target value" htmlFor="g-tval">
              <Input
                id="g-tval"
                type="number"
                step="0.1"
                placeholder="e.g. 100"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Baseline value" htmlFor="g-bval">
              <Input
                id="g-bval"
                type="number"
                step="0.1"
                placeholder="e.g. 80"
                value={baselineValue}
                onChange={(e) => setBaselineValue(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Target date" htmlFor="g-tdate">
            <Input
              id="g-tdate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          <p className="text-xs text-ash/60 italic">
            Feasibility analysis available once AI coaching is set up (Step 14)
          </p>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !title || !baselineValue}
            className="w-full bg-bronze text-graphite hover:bg-bronze/85 font-medium gap-2"
          >
            {submitting ? "Saving…" : (
              <>
                <Target size={14} strokeWidth={1.5} />
                Set goal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Goals Tab ────────────────────────────────────────────────────────────────

function GoalsTab() {
  const qc = useQueryClient();

  const {
    data: activeGoals,
    isLoading: goalsLoading,
  } = useQuery({
    queryKey: ["goals", "active"],
    queryFn: () => apiClient<Goal[]>("/api/goals/?status=active"),
  });

  const {
    data: timeline,
    isLoading: timelineLoading,
  } = useQuery({
    queryKey: ["goals", "timeline"],
    queryFn: () => apiClient<Goal[]>("/api/goals/timeline/"),
  });

  function handleGoalCreated() {
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  return (
    <div className="space-y-8">
      {/* Active goals header */}
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Active goals</Eyebrow>
        </div>
        <SetGoalDialog onSuccess={handleGoalCreated} />
      </div>

      {/* Active goal cards */}
      {goalsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate border border-ash/20 rounded-[var(--radius-md)] p-6 h-40 animate-pulse"
            />
          ))}
        </div>
      ) : activeGoals && activeGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-ash/20 rounded-[var(--radius-md)] p-8 text-center">
          <Target size={24} strokeWidth={1.5} className="text-ash/40 mx-auto mb-2" />
          <p className="text-sm text-ash/60">No active goals. Set your first goal ↓</p>
        </div>
      )}

      {/* Goal history timeline */}
      <div>
        <Eyebrow className="mb-5">Goal history</Eyebrow>
        {timelineLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-ash/10 rounded animate-pulse" />
            ))}
          </div>
        ) : timeline && timeline.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-ash/20" />
            <div className="space-y-0">
              {timeline.map((goal) => (
                <div key={goal.id} className="relative pl-8 pb-6 last:pb-0">
                  {/* Dot */}
                  <div
                    className={`absolute left-0 top-1 size-4 rounded-full border flex items-center justify-center ${
                      goal.status === "achieved"
                        ? "border-bronze bg-bronze/20"
                        : goal.status === "abandoned"
                        ? "border-ash/40 bg-ash/10"
                        : "border-bone/40 bg-transparent"
                    }`}
                  >
                    {goal.status === "achieved" && (
                      <Check size={8} strokeWidth={2} className="text-bronze" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-bone font-medium">{goal.title}</span>
                      <Eyebrow className="inline">{goal.goal_type}</Eyebrow>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full border font-mono uppercase tracking-widest ${
                          goal.status === "achieved"
                            ? "border-bronze/40 text-bronze"
                            : goal.status === "abandoned"
                            ? "border-ash/30 text-ash"
                            : "border-bone/30 text-bone/60"
                        }`}
                      >
                        {goal.status}
                      </span>
                      {goal.superseded_by && (
                        <span className="text-xs text-ash">→ superseded</span>
                      )}
                    </div>
                    <p className="text-xs text-ash">
                      {formatMonthYear(goal.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ash/60">No goal history yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1
          className="text-4xl font-light text-bone"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Training
        </h1>
      </div>

      <Tabs defaultValue="log">
        <TabsList className="mb-6 bg-slate border border-ash/20 rounded-[var(--radius-md)] p-1 h-auto w-auto">
          <TabsTrigger
            value="log"
            className="px-5 py-2 text-sm rounded-[var(--radius)] data-active:bg-bronze/20 data-active:text-bronze text-ash"
          >
            <Dumbbell size={14} strokeWidth={1.5} />
            Log
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="px-5 py-2 text-sm rounded-[var(--radius)] data-active:bg-bronze/20 data-active:text-bronze text-ash"
          >
            <Target size={14} strokeWidth={1.5} />
            Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Tabs defaultValue="workout">
            <TabsList className="mb-6 bg-slate border border-ash/20 rounded-[var(--radius-md)] p-1 h-auto w-auto">
              <TabsTrigger
                value="workout"
                className="px-4 py-1.5 text-xs rounded-[var(--radius)] data-active:bg-ash/20 data-active:text-bone text-ash"
              >
                <Dumbbell size={12} strokeWidth={1.5} />
                Workout
              </TabsTrigger>
              <TabsTrigger
                value="bodyweight"
                className="px-4 py-1.5 text-xs rounded-[var(--radius)] data-active:bg-ash/20 data-active:text-bone text-ash"
              >
                Bodyweight
              </TabsTrigger>
              <TabsTrigger
                value="bodycomp"
                className="px-4 py-1.5 text-xs rounded-[var(--radius)] data-active:bg-ash/20 data-active:text-bone text-ash"
              >
                Body Comp
              </TabsTrigger>
              <TabsTrigger
                value="cardio"
                className="px-4 py-1.5 text-xs rounded-[var(--radius)] data-active:bg-ash/20 data-active:text-bone text-ash"
              >
                <Activity size={12} strokeWidth={1.5} />
                Cardio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workout">
              <WorkoutTab />
            </TabsContent>
            <TabsContent value="bodyweight">
              <BodyweightTab />
            </TabsContent>
            <TabsContent value="bodycomp">
              <BodyCompTab />
            </TabsContent>
            <TabsContent value="cardio">
              <CardioTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="goals">
          <GoalsTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
