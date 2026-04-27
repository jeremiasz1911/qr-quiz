"use client";

import { motion } from "framer-motion";
import { use, useMemo } from "react";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { LiveVotingStage } from "@/components/presentation/live-voting-stage";
import { ResultsChart } from "@/components/presentation/results-chart";
import { Card } from "@/components/ui/card";
import { useSessionData } from "@/hooks/use-session-data";
import { getBaseUrl } from "@/lib/utils";

export default function PresentationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = decodeURIComponent(resolvedParams.sessionId);
  const { session, activeQuestion, votes, results } = useSessionData(sessionId);
  const baseUrl = useMemo(() => getBaseUrl(), []);

  if (!session || !activeQuestion) {
    return (
      <FirebaseEnvGuard>
        <PageShell>
          <Card className="p-10 text-center text-xl text-slate-200">
            Brak aktywnego pytania do prezentacji.
          </Card>
        </PageShell>
      </FirebaseEnvGuard>
    );
  }

  const publicLink = `${baseUrl}/s/${sessionId}/q/${activeQuestion.id}`;

  return (
    <FirebaseEnvGuard>
      <PageShell className="h-[100dvh] w-[100dvw] max-w-none overflow-hidden px-4 py-4 md:px-6 md:py-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-0 flex-col gap-3 md:gap-4">
          {session.presentationMode === "qr" ? (
            <LiveVotingStage
              title={activeQuestion.title}
              link={publicLink}
              rows={results}
              totalVotes={votes.length}
              chartType={session.resultsChartType ?? "bar"}
              subtitle="Głosowanie + wyniki na bieżąco"
            />
          ) : (
            <>
              <h1 className="shrink-0 text-center text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
                {activeQuestion.title}
              </h1>
              <ResultsChart
                rows={results}
                totalVotes={votes.length}
                chartType={session.resultsChartType ?? "bar"}
                className="min-h-0 flex-1"
              />
            </>
          )}
        </motion.div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
