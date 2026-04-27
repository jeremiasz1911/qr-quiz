"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { BarChart3, Check, Copy, ChevronLeft, ChevronRight, QrCode, Sparkles } from "lucide-react";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { QrStage } from "@/components/presentation/qr-stage";
import { ResultsChart } from "@/components/presentation/results-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionData } from "@/hooks/use-session-data";
import { analyzeDebate } from "@/lib/debate";
import { getDb, hasFirebaseEnv } from "@/lib/firebase";
import { getBaseUrl } from "@/lib/utils";
import type { Vote } from "@/types/domain";

function parseSlide(value?: string[]) {
  const raw = value?.[0] ?? "1";
  const slide = Number.parseInt(raw, 10);
  if (Number.isNaN(slide) || slide < 1) return 1;
  if (slide > 5) return 5;
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
    if (!hasFirebaseEnv() || !before || !after) {
      return;
    }
    void (async () => {
      const db = getDb();
      const entries = await Promise.all(
        [before, after].map(async (question) => {
          const snap = await getDocs(collection(db, "sessions", sessionId, "questions", question.id, "votes"));
          const votes = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Vote, "id">) }));
          return [question.id, votes] as const;
        })
      );
      setVotesByQuestion(Object.fromEntries(entries));
    })();
  }, [after, before, sessionId]);

  const beforeVotes = before ? votesByQuestion[before.id] ?? [] : [];
  const afterVotes = after ? votesByQuestion[after.id] ?? [] : [];
  const analysis = before && after ? analyzeDebate(before, after, beforeVotes, afterVotes) : null;

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
              <p className="text-sm text-slate-300">Slajd {slide}/5</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={slide > 1 ? slideHref(slide - 1) : slideHref(5)}>
                <Button variant="secondary">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Poprzedni
                </Button>
              </Link>
              <Link href={slide < 5 ? slideHref(slide + 1) : slideHref(1)}>
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
                  1 QR przed • 2 wyniki przed • 3 QR po • 4 wyniki po • 5 analiza końcowa
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
              <QrStage
                title={`1. Głosowanie przed debatą — ${before.title}`}
                link={beforeLink}
              />
            )}

            {slide === 2 && (
              <div className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BarChart3 className="h-5 w-5" />
                  <p className="font-semibold">Wyniki przed debatą</p>
                </div>
                <ResultsChart
                  rows={analysis.comparisonRows.map((row) => ({
                    optionId: row.label,
                    label: row.label,
                    count: row.beforeCount,
                    percentage: row.beforePercentage,
                  }))}
                  totalVotes={analysis.turnoutBefore}
                  chartType="donut"
                  className="min-h-0 flex-1"
                />
              </div>
            )}

            {slide === 3 && (
              <QrStage title={`3. Głosowanie po debacie — ${after.title}`} link={afterLink} />
            )}

            {slide === 4 && (
              <div className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BarChart3 className="h-5 w-5" />
                  <p className="font-semibold">Wyniki po debacie</p>
                </div>
                <ResultsChart
                  rows={analysis.comparisonRows.map((row) => ({
                    optionId: row.label,
                    label: row.label,
                    count: row.afterCount,
                    percentage: row.afterPercentage,
                  }))}
                  totalVotes={analysis.turnoutAfter}
                  chartType="donut"
                  className="min-h-0 flex-1"
                />
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
          </main>
        </div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
