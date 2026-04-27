"use client";

import { use, useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { VoteForm } from "@/components/participant/vote-form";
import { getQuestionById } from "@/lib/firestore";
import { useSessionData } from "@/hooks/use-session-data";
import type { Question } from "@/types/domain";

export default function SessionVotePage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ questionId?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const questionId = resolvedSearchParams.questionId ? decodeURIComponent(resolvedSearchParams.questionId) : "";
  const { activeQuestion } = useSessionData(sessionId);
  const [question, setQuestion] = useState<Question | null>(null);
  const loading = Boolean(questionId) && question === null;

  useEffect(() => {
    if (!questionId) return;
    void getQuestionById(sessionId, questionId)
      .then((nextQuestion) => setQuestion(nextQuestion))
  }, [questionId, sessionId]);

  const visibleQuestion = question ?? activeQuestion;

  return (
    <FirebaseEnvGuard>
      <PageShell className="min-h-[100dvh] max-w-none px-3 py-3 md:px-6 md:py-6">
        {loading && <p className="text-slate-300">Ładowanie pytania...</p>}
        {!loading && visibleQuestion ? (
          <VoteForm question={visibleQuestion} sessionId={sessionId} />
        ) : (
          <p className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
            Brak aktywnego pytania. Poczekaj, aż prowadzący je uruchomi.
          </p>
        )}
      </PageShell>
    </FirebaseEnvGuard>
  );
}
