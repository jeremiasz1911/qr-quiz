"use client";

import { use, useEffect, useState } from "react";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { VoteForm } from "@/components/participant/vote-form";
import { getQuestionById } from "@/lib/firestore";
import type { Question } from "@/types/domain";

export default function QuestionVotePage({
  params,
}: {
  params: Promise<{ sessionId: string; questionId: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const questionId = decodeURIComponent(resolvedParams.questionId);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getQuestionById(sessionId, questionId).then((q) => {
      setQuestion(q);
      setLoading(false);
    });
  }, [questionId, sessionId]);

  return (
    <FirebaseEnvGuard>
      <PageShell className="min-h-[100dvh] max-w-none px-3 py-3 md:px-6 md:py-6">
        {loading && <p className="text-slate-300">Ładowanie pytania...</p>}
        {!loading && question && <VoteForm question={question} sessionId={sessionId} />}
        {!loading && !question && (
          <p className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
            To pytanie nie istnieje lub zostało usunięte.
          </p>
        )}
      </PageShell>
    </FirebaseEnvGuard>
  );
}
