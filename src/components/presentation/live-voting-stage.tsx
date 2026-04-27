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
}: {
  title: string;
  link: string;
  rows: QuestionResultRow[];
  totalVotes: number;
  chartType: ResultsChartType;
}) {
  return (
    <Card className="relative h-full min-h-0 overflow-hidden border-cyan-400/25 bg-slate-950/80 p-3 backdrop-blur md:p-4">
      <div className="relative h-full min-h-0 overflow-hidden rounded-3xl">
        <ResultsChart rows={rows} totalVotes={totalVotes} chartType={chartType} className="h-full" />

        <div className="absolute left-3 bottom-3 w-[160px] rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-2 shadow-2xl shadow-cyan-500/10 backdrop-blur md:w-[180px] md:p-3">
          <div className="mx-auto w-fit rounded-xl bg-white p-2">
            <QRCodeSVG value={link} size={88} includeMargin />
          </div>
        </div>
      </div>
    </Card>
  );
}
