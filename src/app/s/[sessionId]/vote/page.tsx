"use client";

import { use } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { VoteForm } from "@/components/participant/vote-form";
import { useSessionData } from "@/hooks/use-session-data";

export default function SessionVotePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const { activeQuestion } = useSessionData(sessionId);

  return (
    <FirebaseEnvGuard>
      <PageShell className="max-w-xl py-8">
        {activeQuestion ? (
          <VoteForm question={activeQuestion} sessionId={sessionId} />
        ) : (
          <p className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
            Brak aktywnego pytania. Poczekaj, aż prowadzący je uruchomi.
          </p>
        )}
      </PageShell>
    </FirebaseEnvGuard>
  );
}
