"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { QuestionResultRow, ResultsChartType } from "@/types/domain";
import {
  Bar,
  BarChart,
  LabelList,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#00e5ff", "#7c4dff", "#00e676", "#ff9100", "#ff4081", "#40c4ff"];

export function ResultsChart({
  rows,
  totalVotes,
  chartType,
  className,
}: {
  rows: QuestionResultRow[];
  totalVotes: number;
  chartType: ResultsChartType;
  className?: string;
}) {
  const donut = chartType === "donut";
  const pie = chartType === "pie";
  const histogram = chartType === "histogram";
  const bar = chartType === "bar";
  const horizontalBar = chartType === "horizontal_bar";
  const line = chartType === "line";
  const [showCounts, setShowCounts] = useState(true);
  const [showPercentages, setShowPercentages] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [votePulseKey, setVotePulseKey] = useState(0);
  const previousTotalVotesRef = useRef(totalVotes);

  const topOption = useMemo(() => {
    if (!rows.length) {
      return null;
    }
    return rows.reduce((best, row) => (row.count > best.count ? row : best), rows[0]);
  }, [rows]);

  const formatRowValue = useCallback(
    (row: QuestionResultRow) => {
      const parts: string[] = [];
      if (showCounts) {
        parts.push(`${row.count} gł.`);
      }
      if (showPercentages) {
        parts.push(`${row.percentage}%`);
      }
      return parts.join(" • ") || "—";
    },
    [showCounts, showPercentages]
  );

  const renderTooltip = (row: QuestionResultRow) => (
    <div className="space-y-1">
      <p className="font-semibold text-cyan-200">{row.label}</p>
      {showCounts && <p className="text-sm text-slate-100">Głosów: {row.count}</p>}
      {showPercentages && <p className="text-sm text-slate-100">Procent: {row.percentage}%</p>}
    </div>
  );

  const chartRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        valueLabel: formatRowValue(row),
      })),
    [formatRowValue, rows]
  );

  const tooltipContent = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length || !payload[0]?.payload) {
      return null;
    }
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
        {renderTooltip(payload[0].payload as QuestionResultRow)}
      </div>
    );
  };

  const pieLabelRenderer = useCallback(
    ({
      cx = 0,
      cy = 0,
      midAngle = 0,
      outerRadius = 0,
      index = 0,
    }: {
      cx?: number;
      cy?: number;
      midAngle?: number;
      outerRadius?: number;
      index?: number;
    }) => {
      const RADIAN = Math.PI / 180;
      const radius = outerRadius + 28;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const row = chartRows[index];
      if (!row || row.count === 0) {
        return null;
      }
      const anchor = x > cx ? "start" : "end";
      return (
        <text x={x} y={y} fill="#e2e8f0" textAnchor={anchor} dominantBaseline="central">
          <tspan x={x} dy={-4} fontSize={22} fontWeight={900}>
            {row.label}
          </tspan>
          <tspan x={x} dy={24} fontSize={26} fontWeight={900} fill="#67e8f9">
            {row.valueLabel}
          </tspan>
        </text>
      );
    },
    [chartRows]
  );

  useEffect(() => {
    const previous = previousTotalVotesRef.current;
    if (totalVotes > previous) {
      setVotePulseKey((current) => current + 1);
      previousTotalVotesRef.current = totalVotes;
      return;
    }
    previousTotalVotesRef.current = totalVotes;
  }, [totalVotes]);

  return (
    <Card
      className={cn(
        "relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden border-cyan-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 shadow-[0_0_40px_rgba(34,211,238,0.16)] md:gap-4 md:p-5",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, 10, 35, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 bottom-6 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl"
        animate={{ x: [0, -20, 10, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-h-0 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/40 p-2">
          {(bar || histogram) && (
            <motion.div
              className="h-full w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} barCategoryGap={histogram ? 0 : 16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2f53" />
                  <XAxis dataKey="label" stroke="#bfdbfe" />
                  <YAxis allowDecimals={false} stroke="#bfdbfe" />
                  <Tooltip content={tooltipContent} />
                  <Bar
                    dataKey={histogram ? "percentage" : "count"}
                    radius={histogram ? [0, 0, 0, 0] : [10, 10, 0, 0]}
                    animationDuration={550}
                    animationBegin={0}
                  >
                    {rows.map((_, idx) => (
                      <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                    {(showCounts || showPercentages) && (
                      <LabelList dataKey="valueLabel" position="top" fill="#f8fafc" fontSize={24} fontWeight={900} />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {horizontalBar && (
            <motion.div
              className="h-full w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2f53" />
                  <XAxis type="number" allowDecimals={false} stroke="#bfdbfe" />
                  <YAxis type="category" dataKey="label" stroke="#bfdbfe" width={180} />
                  <Tooltip content={tooltipContent} />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]} animationDuration={550} animationBegin={0}>
                    {rows.map((_, idx) => (
                      <Cell key={`hbar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                    {(showCounts || showPercentages) && (
                      <LabelList dataKey="valueLabel" position="right" fill="#f8fafc" fontSize={24} fontWeight={900} />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {line && (
            <motion.div
              className="h-full w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2f53" />
                  <XAxis dataKey="label" stroke="#bfdbfe" />
                  <YAxis allowDecimals={false} stroke="#bfdbfe" />
                  <Tooltip content={tooltipContent} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#00e5ff"
                    strokeWidth={4}
                    dot={{ r: 6, fill: "#7c4dff", strokeWidth: 0 }}
                    activeDot={{ r: 8 }}
                    animationDuration={650}
                  >
                    {(showCounts || showPercentages) && (
                      <LabelList dataKey="valueLabel" position="top" fill="#f8fafc" fontSize={22} fontWeight={900} />
                    )}
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {(pie || donut) && (
            <motion.div
              className="h-full w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartRows}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={donut ? 100 : 0}
                    outerRadius={160}
                    label={showCounts || showPercentages ? pieLabelRenderer : false}
                    labelLine={showCounts || showPercentages}
                    animationDuration={650}
                  >
                    {rows.map((_, idx) => (
                      <Cell key={`pie-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={tooltipContent} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
        <aside className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-slate-700/70 bg-slate-950/70 p-3">
          <div className="rounded-lg border border-cyan-400/25 bg-slate-900/60 p-3">
            <p className="text-xs uppercase tracking-wide text-cyan-200/80">Łącznie głosów</p>
            <motion.p
              key={votePulseKey}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-4xl font-black text-cyan-300"
            >
              {totalVotes}
            </motion.p>
            <p className="mt-1 text-xs text-slate-300">Opcji: {rows.length}</p>
          </div>

          <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3 text-sm text-slate-100">
            <label className="mb-2 inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan-400"
                checked={showCounts}
                onChange={(event) => setShowCounts(event.target.checked)}
              />
              Pokaż liczbę głosów
            </label>
            <label className="mb-2 inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-400"
                checked={showPercentages}
                onChange={(event) => setShowPercentages(event.target.checked)}
              />
              Pokaż procenty
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-400"
                checked={showBreakdown}
                onChange={(event) => setShowBreakdown(event.target.checked)}
              />
              Pokaż legendę odpowiedzi
            </label>
          </div>

          <div className="rounded-lg border border-emerald-400/25 bg-slate-900/60 p-3">
            <p className="text-xs uppercase tracking-wide text-emerald-200/80">Lider</p>
            <p className="truncate text-sm font-semibold text-emerald-200">{topOption?.label ?? "Brak danych"}</p>
            <p className="text-base font-black text-emerald-300">{topOption ? formatRowValue(topOption) : "—"}</p>
          </div>

          {showBreakdown && (
            <div className="min-h-0 flex-1 space-y-2 overflow-hidden rounded-lg border border-slate-700/70 bg-slate-900/60 p-2">
              {rows.map((row, idx) => (
                <div key={row.optionId} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate text-sm font-medium text-slate-100">{row.label}</span>
                  </div>
                  <span className="whitespace-nowrap text-sm font-semibold text-cyan-200">{formatRowValue(row)}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </Card>
  );
}
