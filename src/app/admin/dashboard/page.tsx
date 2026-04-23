"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, MonitorPlay } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { FirebaseEnvGuard } from "@/components/layout/firebase-env-guard";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuestionForm } from "@/components/presenter/question-form";
import { QuestionList } from "@/components/presenter/question-list";
import { useSessionData } from "@/hooks/use-session-data";
import {
  createQuestion,
  createSession,
  resetQuestionVotes,
  setActiveQuestion,
  setPresentationMode,
  setResultsChartType,
  setQuestionVotingStatus,
} from "@/lib/firestore";
import { getBaseUrl } from "@/lib/utils";
import type { ResultsChartType } from "@/types/domain";

const DEFAULT_SESSION_TITLE = "Sesja Live Polling";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("live-poll-session-id") : null
  );
  const { session, questions, activeQuestion, votes, results } = useSessionData(sessionId ?? "");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (sessionId) {
      return;
    }
    if (!user) {
      return;
    }
    void createSession(user.uid, DEFAULT_SESSION_TITLE).then((id) => {
      setSessionId(id);
      localStorage.setItem("live-poll-session-id", id);
    });
  }, [sessionId, user]);

  useEffect(() => {
    if (!user || !sessionId || !session) {
      return;
    }
    if (session.hostUid === user.uid) {
      return;
    }
    void createSession(user.uid, DEFAULT_SESSION_TITLE).then((id) => {
      setSessionId(id);
      localStorage.setItem("live-poll-session-id", id);
    });
  }, [session, sessionId, user]);

  const baseUrl = useMemo(() => getBaseUrl(), []);
  const currentChartType: ResultsChartType = session?.resultsChartType ?? "bar";
  const publicActiveLink = useMemo(() => {
    if (!sessionId || !activeQuestion) return "";
    return `${baseUrl}/s/${sessionId}/q/${activeQuestion.id}`;
  }, [activeQuestion, baseUrl, sessionId]);

  if (!user || !sessionId) {
    return (
      <PageShell className="py-16">
        <p className="text-slate-300">Ładowanie panelu prowadzącego...</p>
      </PageShell>
    );
  }

  return (
    <FirebaseEnvGuard>
      <PageShell className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel prowadzącego</h1>
            <p className="text-sm text-slate-300">Sesja: {session?.title ?? DEFAULT_SESSION_TITLE}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void setPresentationMode(sessionId, "qr")}>
              Tryb QR
            </Button>
            <Button variant="secondary" onClick={() => void setPresentationMode(sessionId, "results")}>
              Tryb wyników
            </Button>
            <Button variant="ghost" onClick={() => void logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Wyloguj
            </Button>
          </div>
        </header>

        <Card className="p-4">
          <p className="mb-2 text-sm text-slate-300">Format wykresu wyników</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "bar", label: "Słupkowy" },
              { value: "horizontal_bar", label: "Poziomy słupkowy" },
              { value: "line", label: "Liniowy" },
              { value: "pie", label: "Kołowy" },
              { value: "donut", label: "Donut" },
              { value: "histogram", label: "Histogram %" },
            ].map((item) => (
              <Button
                key={item.value}
                variant={currentChartType === item.value ? "default" : "secondary"}
                onClick={() => void setResultsChartType(sessionId, item.value as ResultsChartType)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <QuestionForm
              onCreate={async (values) => {
                await createQuestion(sessionId, values);
              }}
            />
          </div>

          <div className="space-y-4 lg:col-span-3">
            <Card className="p-5">
              <h2 className="mb-2 text-lg font-semibold text-white">Aktywne pytanie</h2>
              {activeQuestion ? (
                <>
                  <p className="text-slate-100">{activeQuestion.title}</p>
                  <p className="mt-1 text-sm text-slate-300">Oddane głosy: {votes.length}</p>
                  <p className="text-sm text-slate-300">
                    Status: <span className="font-medium text-slate-100">{activeQuestion.status}</span>
                  </p>
                  <p className="mt-2 truncate text-sm text-blue-200">{publicActiveLink}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => void setQuestionVotingStatus(sessionId, activeQuestion.id, "open")}
                    >
                      Otwórz
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void setQuestionVotingStatus(sessionId, activeQuestion.id, "closed")}
                    >
                      Zamknij
                    </Button>
                    <Button variant="destructive" onClick={() => void resetQuestionVotes(sessionId, activeQuestion.id)}>
                      Reset wyników
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-300">Ustaw aktywne pytanie, aby rozpocząć głosowanie.</p>
              )}
            </Card>

            <Card className="flex flex-wrap gap-2 p-5">
              <Link href={`/s/${sessionId}/present`} className="inline-flex">
                <Button>
                  <MonitorPlay className="mr-2 h-4 w-4" />
                  Ekran prezentacyjny
                </Button>
              </Link>
              <Link href={`/s/${sessionId}/vote`} className="inline-flex">
                <Button variant="secondary">
                  Widok uczestnika
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/s/${sessionId}/history`} className="inline-flex">
                <Button variant="ghost">Historia sesji</Button>
              </Link>
              <p className="w-full pt-2 text-sm text-slate-300">
                Wyniki (sumarycznie):{" "}
                {results.map((row) => `${row.label}: ${row.count} (${row.percentage}%)`).join(" • ")}
              </p>
            </Card>

            <QuestionList
              questions={questions}
              activeQuestionId={session?.activeQuestionId ?? null}
              onActivate={async (questionId) => setActiveQuestion(sessionId, questionId)}
              onOpenClose={async (questionId, status) => setQuestionVotingStatus(sessionId, questionId, status)}
              onResetVotes={async (questionId) => resetQuestionVotes(sessionId, questionId)}
            />
          </div>
        </div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
