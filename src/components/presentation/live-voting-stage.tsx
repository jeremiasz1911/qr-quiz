"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { ResultsChart } from "@/components/presentation/results-chart";
import type { QuestionResultRow, ResultsChartType } from "@/types/domain";

export function LiveVotingStage({
  title,
  link,
  rows,
  totalVotes,
  chartType,
  subtitle = "Głosowanie trwa",
}: {
  title: string;
  link: string;
  rows: QuestionResultRow[];
  totalVotes: number;
  chartType: ResultsChartType;
  subtitle?: string;
}) {
  return (
    <Card className="relative h-full min-h-0 overflow-hidden border-cyan-400/25 bg-slate-950/80 p-4 backdrop-blur md:p-5">
      <div className="flex h-full min-h-0 flex-col gap-3 md:gap-4">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Na żywo</p>
            <h1 className="truncate text-2xl font-black leading-tight text-white md:text-4xl">{title}</h1>
          </div>
          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
            {subtitle}
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl">
          <ResultsChart rows={rows} totalVotes={totalVotes} chartType={chartType} className="h-full" />

          <div className="absolute left-4 bottom-4 w-[220px] rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-3 shadow-2xl shadow-cyan-500/10 backdrop-blur">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200">Zeskanuj</p>
            <div className="mx-auto w-fit rounded-2xl bg-white p-2">
              <QRCodeSVG value={link} size={120} includeMargin />
            </div>
            <p className="mt-2 truncate text-[11px] text-slate-300">{link}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
