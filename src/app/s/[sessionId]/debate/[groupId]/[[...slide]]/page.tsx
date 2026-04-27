"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { BarChart3, ChevronLeft, ChevronRight, QrCode, Sparkles } from "lucide-react";
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

  const beforeVotes = useMemo(() => (before ? votesByQuestion[before.id] ?? [] : []), [before, votesByQuestion]);
  const afterVotes = useMemo(() => (after ? votesByQuestion[after.id] ?? [] : []), [after, votesByQuestion]);
  const analysis = useMemo(() => {
    if (!before || !after) {
      return null;
    }
    return analyzeDebate(before, after, beforeVotes, afterVotes);
  }, [after, before, beforeVotes, afterVotes]);

  if (!before || !after || !analysis) {
    return (
      <FirebaseEnvGuard>
        <PageShell className="py-16">
          <Card className="p-8 text-center text-slate-200">Nie znaleziono pełnej pary debaty.</Card>
        </PageShell>
      </FirebaseEnvGuard>
    );
  }

  const beforeLink = `${baseUrl}/s/${sessionId}/q/${before.id}`;
  const afterLink = `${baseUrl}/s/${sessionId}/q/${after.id}`;
  const slideHref = (nextSlide: number) => `/s/${sessionId}/debate/${groupId}/${nextSlide}`;
  const title = before.debateTopic ?? before.title;

  return (
    <FirebaseEnvGuard>
      <PageShell className="h-[100dvh] w-[100dvw] max-w-none overflow-hidden px-4 py-4 md:px-6 md:py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-200">Debata QR</p>
            <h1 className="text-xl font-bold text-white md:text-2xl">{title}</h1>
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
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <Link key={step} href={slideHref(step)}>
              <Button variant={slide === step ? "default" : "secondary"} className="h-8 w-8 px-0">
                {step}
              </Button>
            </Link>
          ))}
        </div>

        <div className="h-[calc(100dvh-190px)] min-h-0">
          {slide === 1 && <QrStage title={`1. Głosowanie przed debatą — ${before.title}`} link={beforeLink} />}

          {slide === 2 && (
            <div className="flex h-full min-h-0 flex-col gap-3">
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

          {slide === 3 && <QrStage title={`3. Głosowanie po debacie — ${after.title}`} link={afterLink} />}

          {slide === 4 && (
            <div className="flex h-full min-h-0 flex-col gap-3">
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
            <Card className="h-full min-h-0 overflow-auto p-5">
              <div className="mb-4 flex items-center gap-2 text-cyan-200">
                <Sparkles className="h-5 w-5" />
                <p className="font-semibold">Analiza debaty</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-300">Wynik tezy</p>
                  <p className="text-2xl font-bold text-white">
                    {analysis.thesisOutcome === "win" ? "Teza wygrała" : analysis.thesisOutcome === "loss" ? "Teza nie wygrała" : "Remis"}
                  </p>
                  <p className="text-sm text-slate-300">
                    Zmiana poparcia: <span className="font-semibold text-cyan-200">{analysis.thesisShift > 0 ? "+" : ""}{analysis.thesisShift}%</span>
                  </p>
                  <p className="text-sm text-slate-300">
                    Zmieniło zdanie: <span className="font-semibold text-white">{analysis.changedVoters}</span> z{" "}
                    <span className="font-semibold text-white">{analysis.commonVoters}</span>
                  </p>
                  <p className="text-sm text-slate-300">{analysis.summary}</p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
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

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-700">
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
                <Link href={slideHref(1)}>
                  <Button variant="secondary">
                    <QrCode className="mr-2 h-4 w-4" />
                    Slajd 1
                  </Button>
                </Link>
                <Link href={slideHref(2)}>
                  <Button variant="secondary">Slajd 2</Button>
                </Link>
                <Link href={slideHref(3)}>
                  <Button variant="secondary">Slajd 3</Button>
                </Link>
                <Link href={slideHref(4)}>
                  <Button variant="secondary">Slajd 4</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
