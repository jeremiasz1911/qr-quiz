"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Copy, ChevronLeft, ChevronRight, QrCode, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { LiveVotingStage } from "@/components/presentation/live-voting-stage";
import { ResultsChart } from "@/components/presentation/results-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionData } from "@/hooks/use-session-data";
import { analyzeDebate } from "@/lib/debate";
import { subscribeVotes } from "@/lib/firestore";
import { getBaseUrl } from "@/lib/utils";
import type { Vote } from "@/types/domain";

function parseSlide(value?: string[]) {
  const raw = value?.[0] ?? "1";
  const slide = Number.parseInt(raw, 10);
  if (Number.isNaN(slide) || slide < 1) return 1;
  if (slide > 7) return 7;
  return slide;
}

export default function DebateFlowPage({
  params,
}: {
  params: Promise<{ sessionId: string; groupId: string; slide?: string[] }>;
}) {
  const resolvedParams = use(params);
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const groupId = decodeURIComponent(resolvedParams.groupId);
  const slide = parseSlide(resolvedParams.slide);
  const { questions } = useSessionData(sessionId);
  const [votesByQuestion, setVotesByQuestion] = useState<Record<string, Vote[]>>({});
  const [copied, setCopied] = useState(false);
  const baseUrl = useMemo(() => getBaseUrl(), []);

  const debateQuestions = useMemo(
    () =>
      questions
        .filter((question) => question.debateGroupId === groupId)
        .sort((a, b) => {
          if (a.debatePhase === b.debatePhase) {
            return a.createdAt - b.createdAt;
          }
          return a.debatePhase === "before" ? -1 : 1;
        }),
    [groupId, questions]
  );

  const before = debateQuestions.find((question) => question.debatePhase === "before") ?? null;
  const after = debateQuestions.find((question) => question.debatePhase === "after") ?? null;
  const beforeLink = `${baseUrl}/s/${sessionId}/vote?questionId=${before?.id ?? ""}`;
  const afterLink = `${baseUrl}/s/${sessionId}/vote?questionId=${after?.id ?? ""}`;
  const currentLink = `${baseUrl}/s/${sessionId}/debate/${groupId}/${slide}`;

  useEffect(() => {
    if (!before || !after) {
      return;
    }
    const unsubBefore = subscribeVotes(sessionId, before.id, (votes) =>
      setVotesByQuestion((current) => ({ ...current, [before.id]: votes }))
    );
    const unsubAfter = subscribeVotes(sessionId, after.id, (votes) =>
      setVotesByQuestion((current) => ({ ...current, [after.id]: votes }))
    );
    return () => {
      unsubBefore();
      unsubAfter();
    };
  }, [after, before, sessionId]);

  const beforeVotes = before ? votesByQuestion[before.id] ?? [] : [];
  const afterVotes = after ? votesByQuestion[after.id] ?? [] : [];
  const analysis = before && after ? analyzeDebate(before, after, beforeVotes, afterVotes) : null;
  const beforeChartRows = analysis
    ? analysis.comparisonRows.map((row) => ({
        optionId: row.label,
        label: row.label,
        count: row.beforeCount,
        percentage: row.beforePercentage,
      }))
    : [];
  const afterChartRows = analysis
    ? analysis.comparisonRows.map((row) => ({
        optionId: row.label,
        label: row.label,
        count: row.afterCount,
        percentage: row.afterPercentage,
      }))
    : [];
  const trendData = before && after
    ? [
        {
          phase: "Przed",
          za: analysis?.supportBefore.percentage ?? 0,
          neutralnie: analysis?.neutralBefore.percentage ?? 0,
          przeciw: analysis?.oppositionBefore.percentage ?? 0,
        },
        {
          phase: "Po",
          za: analysis?.supportAfter.percentage ?? 0,
          neutralnie: analysis?.neutralAfter.percentage ?? 0,
          przeciw: analysis?.oppositionAfter.percentage ?? 0,
        },
      ]
    : [];
  const shiftData = analysis
    ? analysis.comparisonRows.map((row) => ({
        label: row.label,
        deltaCount: row.deltaCount,
        deltaPercentage: row.deltaPercentage,
      }))
    : [];
  const turnoutShare = analysis
    ? [
        { name: "Zmieniło zdanie", value: analysis.changedVoters },
        { name: "Bez zmian", value: analysis.unchangedVoters },
      ]
    : [];
  const comparisonColors = ["#22d3ee", "#a78bfa", "#fb7185"];

  if (!before || !after || !analysis) {
    return (
      <FirebaseEnvGuard>
        <PageShell className="flex h-[100dvh] items-center justify-center">
          <Card className="p-8 text-center text-slate-200">Nie znaleziono pełnej pary debaty.</Card>
        </PageShell>
      </FirebaseEnvGuard>
    );
  }

  const slideHref = (nextSlide: number) => `/s/${sessionId}/debate/${groupId}/${nextSlide}`;
  const title = before.debateTopic ?? before.title;

  const slideChips = [
    { step: 1, label: "QR 1" },
    { step: 2, label: "Wyniki 1" },
    { step: 3, label: "QR 2" },
    { step: 4, label: "Wyniki 2" },
    { step: 5, label: "Analiza" },
    { step: 6, label: "Trend" },
    { step: 7, label: "Efekt" },
  ];

  return (
    <FirebaseEnvGuard>
      <PageShell className="relative h-[100dvh] w-[100dvw] max-w-none overflow-hidden p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.15),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.98))]" />
        <div className="absolute inset-0 flex min-h-0 flex-col gap-3 p-3 md:p-5">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-200">Debata QR</p>
              <h1 className="text-lg font-bold text-white md:text-2xl">{title}</h1>
              <p className="text-sm text-slate-300">Slajd {slide}/7</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={slide > 1 ? slideHref(slide - 1) : slideHref(7)}>
                <Button variant="secondary">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Poprzedni
                </Button>
              </Link>
              <Link href={slide < 7 ? slideHref(slide + 1) : slideHref(1)}>
                <Button>
                  Następny
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </header>

          <Card className="border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Przebieg debaty</p>
                <p className="text-sm text-slate-300">
                  1 QR przed • 2 wyniki przed • 3 QR po • 4 wyniki po • 5 analiza • 6 trend • 7 efekt
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(currentLink);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  Kopiuj link slajdu
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {slideChips.map((item) => (
              <Link key={item.step} href={slideHref(item.step)}>
                <Button variant={slide === item.step ? "default" : "secondary"} className="gap-2">
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <main className="min-h-0 flex-1">
            {slide === 1 && (
              <LiveVotingStage
                title={`1. Głosowanie przed debatą — ${before.title}`}
                link={beforeLink}
                rows={beforeChartRows}
                totalVotes={analysis.turnoutBefore}
                chartType="donut"
                subtitle="Głosowanie przed debatą"
              />
            )}

            {slide === 2 && (
              <div className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BarChart3 className="h-5 w-5" />
                  <p className="font-semibold">Wyniki przed debatą</p>
                </div>
                  <ResultsChart rows={beforeChartRows} totalVotes={analysis.turnoutBefore} chartType="donut" className="min-h-0 flex-1" />
                </div>
              )}

            {slide === 3 && (
              <LiveVotingStage
                title={`3. Głosowanie po debacie — ${after.title}`}
                link={afterLink}
                rows={afterChartRows}
                totalVotes={analysis.turnoutAfter}
                chartType="donut"
                subtitle="Głosowanie po debacie"
              />
            )}

            {slide === 4 && (
              <div className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BarChart3 className="h-5 w-5" />
                  <p className="font-semibold">Wyniki po debacie</p>
                </div>
                  <ResultsChart rows={afterChartRows} totalVotes={analysis.turnoutAfter} chartType="donut" className="min-h-0 flex-1" />
                </div>
              )}

            {slide === 5 && (
              <Card className="flex h-full min-h-0 flex-col overflow-auto border-slate-700/70 bg-slate-950/70 p-5 backdrop-blur">
                <div className="mb-4 flex items-center gap-2 text-cyan-200">
                  <Sparkles className="h-5 w-5" />
                  <p className="font-semibold">Analiza debaty</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-300">Wynik tezy</p>
                    <p className="text-2xl font-bold text-white">
                      {analysis.thesisOutcome === "win"
                        ? "Teza wygrała"
                        : analysis.thesisOutcome === "loss"
                          ? "Teza nie wygrała"
                          : "Remis"}
                    </p>
                    <p className="text-sm font-semibold text-cyan-200">{analysis.discussionLabel}</p>
                    <p className="text-sm text-slate-300">
                      Zmiana poparcia:{" "}
                      <span className="font-semibold text-cyan-200">
                        {analysis.thesisShift > 0 ? "+" : ""}
                        {analysis.thesisShift}%
                      </span>
                    </p>
                    <p className="text-sm text-slate-300">
                      Zmieniło zdanie: <span className="font-semibold text-white">{analysis.changedVoters}</span> z{" "}
                      <span className="font-semibold text-white">{analysis.commonVoters}</span>
                    </p>
                    <p className="text-sm text-slate-300">{analysis.summary}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-300">Szybkie podsumowanie</p>
                    <p className="text-base text-slate-100">Przed: {analysis.supportBefore.percentage}% za tezą</p>
                    <p className="text-base text-slate-100">Po: {analysis.supportAfter.percentage}% za tezą</p>
                    <p className="text-base text-slate-100">
                      Neutralni: {analysis.neutralBefore.percentage}% → {analysis.neutralAfter.percentage}%
                    </p>
                    <p className="text-base text-slate-100">
                      Przeciw: {analysis.oppositionBefore.percentage}% → {analysis.oppositionAfter.percentage}%
                    </p>
                    <p className="text-base text-slate-100">
                      Wspólni głosujący: {analysis.commonVoters} • Bez zmian: {analysis.unchangedVoters}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Odpowiedź</th>
                        <th className="px-3 py-2 text-right">Przed</th>
                        <th className="px-3 py-2 text-right">Po</th>
                        <th className="px-3 py-2 text-right">Zmiana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.comparisonRows.map((row) => (
                        <tr key={row.label} className="border-t border-slate-800 bg-slate-950/50">
                          <td className="px-3 py-2 text-slate-100">{row.label}</td>
                          <td className="px-3 py-2 text-right text-slate-300">{row.beforePercentage}%</td>
                          <td className="px-3 py-2 text-right text-slate-300">{row.afterPercentage}%</td>
                          <td className="px-3 py-2 text-right font-semibold text-cyan-200">
                            {row.deltaPercentage > 0 ? "+" : ""}
                            {row.deltaPercentage} pp
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {slideChips.map((item) => (
                    <Link key={item.step} href={slideHref(item.step)}>
                      <Button variant="secondary">
                        <QrCode className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {slide === 6 && (
              <Card className="flex h-full min-h-0 flex-col overflow-hidden border-slate-700/70 bg-slate-950/70 p-5 backdrop-blur">
                <div className="mb-4 flex items-center gap-2 text-cyan-200">
                  <BarChart3 className="h-5 w-5" />
                  <p className="font-semibold">Trend odpowiedzi</p>
                </div>

                <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                  <div className="h-[420px] min-h-0 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="phase" stroke="#cbd5e1" />
                        <YAxis stroke="#cbd5e1" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 16 }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="za" stroke="#22d3ee" strokeWidth={3} dot={{ r: 5 }} />
                        <Line type="monotone" dataKey="neutralnie" stroke="#a78bfa" strokeWidth={3} dot={{ r: 5 }} />
                        <Line type="monotone" dataKey="przeciw" stroke="#fb7185" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid content-start gap-4">
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">Skuteczność debaty</p>
                      <p className="mt-2 text-4xl font-black text-white">
                        {analysis.effectivenessPercent}%
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {analysis.changedVoters} z {analysis.commonVoters} wspólnych głosujących zmieniło zdanie.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">Frekwencja</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {analysis.turnoutBefore} → {analysis.turnoutAfter}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {analysis.participationDelta >= 0 ? "+" : ""}
                        {analysis.participationDelta} głosów / {analysis.participationDeltaPercent >= 0 ? "+" : ""}
                        {analysis.participationDeltaPercent}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">Teza</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {analysis.thesisOutcome === "win"
                          ? "Wygrała"
                          : analysis.thesisOutcome === "loss"
                            ? "Przegrała"
                            : "Remis"}
                      </p>
                      <p className="mt-1 text-sm text-cyan-200">
                        Zmiana poparcia {analysis.thesisShift > 0 ? "+" : ""}
                        {analysis.thesisShift} pp
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {slide === 7 && (
              <Card className="flex h-full min-h-0 flex-col overflow-hidden border-slate-700/70 bg-slate-950/70 p-5 backdrop-blur">
                <div className="mb-4 flex items-center gap-2 text-cyan-200">
                  <Sparkles className="h-5 w-5" />
                  <p className="font-semibold">Efekt końcowy</p>
                </div>

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">Czy warto rozmawiać?</p>
                      <p className="mt-2 text-3xl font-black text-white">{analysis.discussionLabel}</p>
                      <p className="mt-1 text-sm text-slate-300">{analysis.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">Zmiana odpowiedzi</p>
                      <div className="mt-3 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={turnoutShare}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={64}
                              outerRadius={92}
                              paddingAngle={4}
                            >
                              {turnoutShare.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={index === 0 ? "#22d3ee" : "#64748b"}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "#020617",
                                border: "1px solid #334155",
                                borderRadius: 16,
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-h-0 gap-4">
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">Jak zmieniły się odpowiedzi</p>
                      <div className="mt-3 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={shiftData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1" />
                            <Tooltip
                              contentStyle={{
                                background: "#020617",
                                border: "1px solid #334155",
                                borderRadius: 16,
                              }}
                            />
                            <Bar dataKey="deltaCount" radius={[12, 12, 0, 0]}>
                              {shiftData.map((entry, index) => (
                                <Cell
                                  key={entry.label}
                                  fill={entry.deltaCount >= 0 ? comparisonColors[index % comparisonColors.length] : "#fb7185"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Wspólni</p>
                        <p className="mt-2 text-3xl font-black text-white">{analysis.commonVoters}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Zmiana</p>
                        <p className="mt-2 text-3xl font-black text-white">{analysis.effectivenessPercent}%</p>
                      </div>
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Bez zmian</p>
                        <p className="mt-2 text-3xl font-black text-white">{analysis.unchangedVoters}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </main>
        </div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
