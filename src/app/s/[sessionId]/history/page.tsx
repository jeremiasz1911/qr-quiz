"use client";

import { use, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { useSessionData } from "@/hooks/use-session-data";
import { calculateResults } from "@/lib/results";
import { getDb, hasFirebaseEnv } from "@/lib/firebase";
import type { Vote } from "@/types/domain";

export default function SessionHistoryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const { questions } = useSessionData(sessionId);
  const [votesByQuestion, setVotesByQuestion] = useState<Record<string, Vote[]>>({});
  const firebaseConfigured = hasFirebaseEnv();

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
