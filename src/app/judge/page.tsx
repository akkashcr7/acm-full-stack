"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DynamicScoringForm } from "@/components/scoring/dynamic-form";
import { RotateCw } from "lucide-react";

function JudgeContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") || undefined;

  return <DynamicScoringForm initialTeamId={teamId} />;
}

export default function JudgePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <RotateCw className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-xs font-mono text-slate-400">Loading scoring rubric...</p>
        </div>
      }
    >
      <JudgeContent />
    </Suspense>
  );
}
