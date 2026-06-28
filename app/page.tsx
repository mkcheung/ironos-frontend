"use client";

import { AppShell } from "@/components/layout/shell";
import { DossierStat } from "@/components/ui/dossier-stat";
import { Eyebrow } from "@/components/ui/eyebrow";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function Home() {
  return (
    <AppShell>
      {/* Hero section */}
      <section className="mb-16">
        <Eyebrow className="mb-3">Weekly Performance Summary</Eyebrow>
        <h1
          className="text-6xl font-light tracking-tight text-bone mb-2"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Week 24
        </h1>
        <p className="text-ash text-sm max-w-md">
          Your training data, analysed. Recommendations follow the evidence.
        </p>
      </section>

      {/* Stat block row */}
      <section className="mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <DossierStat value="4" label="Sessions" unit="wk" />
          <DossierStat value="12,480" label="Total Volume" unit="kg" />
          <DossierStat value="87" label="Readiness" unit="%" />
          <DossierStat value="142" label="PR Distance" unit="days" />
        </div>
      </section>

      {/* Card row */}
      <section className="mb-12 grid sm:grid-cols-2 gap-4">
        <Card className="bg-slate border-ash/20 p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-warm)]">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} strokeWidth={1.5} className="text-bronze" />
            <Eyebrow>Goal Progress</Eyebrow>
          </div>
          <DossierStat value="68" label="Strength Score" unit="pts" className="mb-2" />
          <p className="text-ash text-xs mt-3">
            On track — 32 points to target by Q3.
          </p>
        </Card>

        <Card className="bg-slate border-ash/20 p-6 rounded-[var(--radius-md)] shadow-[var(--shadow-warm)]">
          <Eyebrow className="mb-4">Next Session</Eyebrow>
          <DossierStat value="Tue" label="Recommended Day" className="mb-2" />
          <p className="text-ash text-xs mt-3">
            Lower body — squat progression continues.
          </p>
        </Card>
      </section>

      {/* Toast test */}
      <section className="flex gap-3 flex-wrap">
        <Button
          onClick={() => notify.success("Workout logged")}
          className="bg-bronze/10 text-bronze border border-bronze/30 hover:bg-bronze/20 transition-colors"
          variant="outline"
        >
          Test success toast
        </Button>
        <Button
          onClick={() => notify.error("Something went wrong — try again.")}
          variant="outline"
          className="border-ash/30 text-ash hover:text-bone hover:border-ash/60 transition-colors"
        >
          Test error toast
        </Button>
      </section>
    </AppShell>
  );
}
