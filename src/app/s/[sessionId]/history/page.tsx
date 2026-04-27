"use client";

import { use, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { useSessionData } from "@/hooks/use-session-data";
import { calculateResults } from "@/lib/results";
import { getDb, hasFirebaseEnv } from "@/lib/firebase";
import type { Question, Vote } from "@/types/domain";

function formatDelta(delta: number) {
  return `${delta > 0 ? "+" : ""}${delta} pp`;
}

export default function SessionHistoryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const { questions } = useSessionData(sessionId);
  const [votesByQuestion, setVotesByQuestion] = useState<Record<string, Vote[]>>({});
  const firebaseConfigured = hasFirebaseEnv();
  const debateGroups = questions
    .filter((question) => question.debateGroupId && question.debatePhase)
    .reduce<Record<string, Question[]>>((groups, question) => {
      const key = question.debateGroupId as string;
      groups[key] = [...(groups[key] ?? []), question];
      return groups;
    }, {});

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }
    void (async () => {
      const db = getDb();
      const entries = await Promise.all(
        questions.map(async (question) => {
          const snap = await getDocs(collection(db, "sessions", sessionId, "questions", question.id, "votes"));
          const votes = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Vote, "id">) }));
          return [question.id, votes] as const;
        })
      );
      setVotesByQuestion(Object.fromEntries(entries));
    })();
  }, [firebaseConfigured, questions, sessionId]);

  return (
    <FirebaseEnvGuard>
      <PageShell className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Historia pytań i wyników</h1>

        {Object.entries(debateGroups).map(([groupId, groupQuestions]) => {
          const ordered = [...groupQuestions].sort((a) => (a.debatePhase === "before" ? -1 : 1));
          const before = ordered.find((q) => q.debatePhase === "before");
          const after = ordered.find((q) => q.debatePhase === "after");
          if (!before || !after) {
            return null;
          }
          const beforeVotes = votesByQuestion[before.id] ?? [];
          const afterVotes = votesByQuestion[after.id] ?? [];
          const beforeRows = calculateResults(before, beforeVotes);
          const afterRows = calculateResults(after, afterVotes);
          const tableRows = beforeRows.map((beforeRow, index) => {
            const afterRow = afterRows[index] ?? beforeRow;
            const deltaCount = afterRow.count - beforeRow.count;
            const deltaPercentage = afterRow.percentage - beforeRow.percentage;
            return {
              label: beforeRow.label,
              beforeCount: beforeRow.count,
              afterCount: afterRow.count,
              beforePercentage: beforeRow.percentage,
              afterPercentage: afterRow.percentage,
              deltaCount,
              deltaPercentage,
            };
          });
          const strongestShift =
            tableRows.reduce((best, row) =>
              Math.abs(row.deltaPercentage) > Math.abs(best.deltaPercentage) ? row : best
            , tableRows[0]) ?? null;

          return (
            <Card key={groupId} className="space-y-4 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-200">Debata</p>
                <h2 className="text-lg font-semibold text-white">{before.debateTopic ?? before.title}</h2>
                <p className="text-sm text-slate-300">
                  {beforeVotes.length} głosów przed • {afterVotes.length} głosów po
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-700">
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
                    {tableRows.map((row) => (
                      <tr key={row.label} className="border-t border-slate-800 bg-slate-950/50">
                        <td className="px-3 py-2 text-slate-100">{row.label}</td>
                        <td className="px-3 py-2 text-right text-slate-300">
                          {row.beforeCount} ({row.beforePercentage}%)
                        </td>
                        <td className="px-3 py-2 text-right text-slate-300">
                          {row.afterCount} ({row.afterPercentage}%)
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-cyan-200">
                          {row.deltaCount > 0 ? "+" : ""}
                          {row.deltaCount} / {formatDelta(row.deltaPercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {strongestShift && (
                <p className="text-sm text-slate-300">
                  Największa zmiana: <span className="font-semibold text-white">{strongestShift.label}</span>{" "}
                  ({formatDelta(strongestShift.deltaPercentage)}).
                </p>
              )}
            </Card>
          );
        })}

        <div className="space-y-3">
          {questions.map((question) => {
            const votes = votesByQuestion[question.id] ?? [];
            const rows = calculateResults(question, votes);
            return (
              <Card key={question.id} className="p-4">
                <p className="font-semibold text-slate-100">{question.title}</p>
                <p className="text-sm text-slate-300">Status: {question.status}</p>
                <p className="text-sm text-slate-300">Głosy: {votes.length}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {rows.map((row) => `${row.label}: ${row.count}`).join(" • ")}
                </p>
              </Card>
            );
          })}
        </div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
