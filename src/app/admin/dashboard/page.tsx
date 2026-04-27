"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
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
  createDebatePair,
  createSession,
  ensurePublicSession,
  PUBLIC_HOST_UID,
  PUBLIC_SESSION_ID,
  resetQuestionVotes,
  setActiveQuestion,
  setPresentationMode,
  setResultsChartType,
  setQuestionVotingStatus,
} from "@/lib/firestore";
import { getBaseUrl } from "@/lib/utils";
import type { ResultsChartType } from "@/types/domain";

const DEFAULT_SESSION_TITLE = "Sesja Live Polling";
const PUBLIC_SESSION_TITLE = "Konto Katolik - panel ogólnodostępny";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("live-poll-session-id") : null
  );
  const [debateStatement, setDebateStatement] = useState("");
  const [debateBusy, setDebateBusy] = useState(false);
  const effectiveSessionId = user?.isAnonymous ? PUBLIC_SESSION_ID : sessionId;
  const { session, questions, activeQuestion, votes, results } = useSessionData(effectiveSessionId ?? "");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAnonymous) {
      return;
    }

    localStorage.setItem("live-poll-session-id", PUBLIC_SESSION_ID);
    void ensurePublicSession(PUBLIC_SESSION_TITLE);
  }, [user]);

  useEffect(() => {
    if (sessionId) {
      return;
    }
    if (!user) {
      return;
    }
    if (user.isAnonymous) {
      return;
    }
    void createSession(user.uid, DEFAULT_SESSION_TITLE).then((id) => {
      setSessionId(id);
      localStorage.setItem("live-poll-session-id", id);
    });
  }, [sessionId, user]);

  useEffect(() => {
    if (!user || !effectiveSessionId || !session) {
      return;
    }
    if (user.isAnonymous && effectiveSessionId === PUBLIC_SESSION_ID) {
      if (session.hostUid === PUBLIC_HOST_UID) {
        return;
      }
      void ensurePublicSession(PUBLIC_SESSION_TITLE);
      return;
    }
    if (session.hostUid === user.uid) {
      return;
    }
    void createSession(user.uid, DEFAULT_SESSION_TITLE).then((id) => {
      setSessionId(id);
      localStorage.setItem("live-poll-session-id", id);
    });
  }, [effectiveSessionId, session, user]);

  const baseUrl = useMemo(() => getBaseUrl(), []);
  const currentChartType: ResultsChartType = session?.resultsChartType ?? "bar";
  const currentPresentationMode = session?.presentationMode ?? "qr";
  const debatePairs = useMemo(() => {
    const groups = new Map<
      string,
      {
        topic: string;
        beforeTitle: string;
        afterTitle: string;
      }
    >();

    questions.forEach((question) => {
      if (!question.debateGroupId || !question.debatePhase) {
        return;
      }
      const current = groups.get(question.debateGroupId) ?? {
        topic: question.debateTopic ?? question.title,
        beforeTitle: "",
        afterTitle: "",
      };
      if (question.debatePhase === "before") {
        current.beforeTitle = question.title;
      }
      if (question.debatePhase === "after") {
        current.afterTitle = question.title;
      }
      current.topic = question.debateTopic ?? current.topic;
      groups.set(question.debateGroupId, current);
    });

    return [...groups.entries()].map(([groupId, value]) => ({
      groupId,
      ...value,
    }));
  }, [questions]);
  const publicActiveLink = useMemo(() => {
    if (!effectiveSessionId || !activeQuestion) return "";
    return `${baseUrl}/s/${effectiveSessionId}/q/${activeQuestion.id}`;
  }, [activeQuestion, baseUrl, effectiveSessionId]);

  if (!user || !effectiveSessionId) {
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
            <Button
              variant={currentPresentationMode === "qr" ? "default" : "secondary"}
              onClick={() => void setPresentationMode(effectiveSessionId, "qr")}
            >
              Tryb QR
            </Button>
            <Button
              variant={currentPresentationMode === "results" ? "default" : "secondary"}
              onClick={() => void setPresentationMode(effectiveSessionId, "results")}
            >
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
                  onClick={() => void setResultsChartType(effectiveSessionId, item.value as ResultsChartType)}
                >
                  {item.label}
                </Button>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <QuestionForm
              onCreate={async (values) => {
                try {
                  await createQuestion(effectiveSessionId, values);
                } catch (error) {
                  if (!(error instanceof FirebaseError) || error.code !== "permission-denied" || user.isAnonymous) {
                    throw error;
                  }
                  const newSessionId = await createSession(user.uid, DEFAULT_SESSION_TITLE);
                  setSessionId(newSessionId);
                  localStorage.setItem("live-poll-session-id", newSessionId);
                  await createQuestion(newSessionId, values);
                }
              }}
            />

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-white">Debata QR (2 pytania)</h2>
              <p className="mt-2 text-sm text-slate-300">
                Utworzy parę pytań: przed debatą i po debacie, z tymi samymi odpowiedziami.
              </p>
              <textarea
                value={debateStatement}
                onChange={(event) => setDebateStatement(event.target.value)}
                placeholder="Np. Obowiązek szczepień jest niezbędny dla ochrony zdrowia publicznego i zapobiegania epidemiom."
                className="mt-4 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <Button
                className="mt-4 w-full"
                disabled={debateBusy || debateStatement.trim().length < 10}
                onClick={async () => {
                  const statement = debateStatement.trim();
                  if (statement.length < 10) {
                    return;
                  }
                  setDebateBusy(true);
                  try {
                    await createDebatePair(effectiveSessionId, statement);
                    setDebateStatement("");
                  } catch (error) {
                    if (!(error instanceof FirebaseError) || error.code !== "permission-denied" || user.isAnonymous) {
                      throw error;
                    }
                    const newSessionId = await createSession(user.uid, DEFAULT_SESSION_TITLE);
                    setSessionId(newSessionId);
                    localStorage.setItem("live-poll-session-id", newSessionId);
                    await createDebatePair(newSessionId, statement);
                    setDebateStatement("");
                  } finally {
                    setDebateBusy(false);
                  }
                }}
              >
                {debateBusy ? "Tworzę debatę..." : "Utwórz debatę"}
              </Button>
            </Card>
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
                  <p className="text-sm text-slate-300">
                    Aktywny ekran prezentacji:{" "}
                    <span className="font-medium text-slate-100">
                      {currentPresentationMode === "qr" ? "Tryb QR (link + kod QR)" : "Tryb wyników"}
                    </span>
                  </p>
                  <p className={`mt-2 truncate text-sm ${currentPresentationMode === "qr" ? "text-blue-200" : "text-slate-400"}`}>
                    {currentPresentationMode === "qr"
                      ? publicActiveLink
                      : "W trybie wyników prezentacja pokazuje wykres zamiast kodu QR."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => void setQuestionVotingStatus(effectiveSessionId, activeQuestion.id, "open")}
                    >
                      Otwórz
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void setQuestionVotingStatus(effectiveSessionId, activeQuestion.id, "closed")}
                    >
                      Zamknij
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => void resetQuestionVotes(effectiveSessionId, activeQuestion.id)}
                    >
                      Reset wyników
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-300">Ustaw aktywne pytanie, aby rozpocząć głosowanie.</p>
              )}
            </Card>

            <Card className="flex flex-wrap gap-2 p-5">
              <Link href={`/s/${effectiveSessionId}/present`} className="inline-flex">
                <Button>
                  <MonitorPlay className="mr-2 h-4 w-4" />
                  Ekran prezentacyjny
                </Button>
              </Link>
              <Link href={`/s/${effectiveSessionId}/vote`} className="inline-flex">
                <Button variant="secondary">
                  Widok uczestnika
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/s/${effectiveSessionId}/history`} className="inline-flex">
                <Button variant="ghost">Historia sesji</Button>
              </Link>
              <p className="w-full pt-2 text-sm text-slate-300">
                Wyniki (sumarycznie):{" "}
                {results.map((row) => `${row.label}: ${row.count} (${row.percentage}%)`).join(" • ")}
              </p>
            </Card>

            {debatePairs.length > 0 && (
              <Card className="space-y-3 p-5">
                <h2 className="text-lg font-semibold text-white">Debaty</h2>
                <div className="space-y-2">
                  {debatePairs.map((debate) => (
                    <div key={debate.groupId} className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                        <p className="font-medium text-slate-100">{debate.topic}</p>
                        <p className="text-sm text-slate-400">
                          {debate.beforeTitle} • {debate.afterTitle}
                        </p>
                        </div>
                        <Link href={`/s/${effectiveSessionId}/debate/${debate.groupId}`}>
                          <Button variant="secondary">Otwórz debatę</Button>
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { step: 1, label: "QR 1" },
                          { step: 2, label: "Wyniki 1" },
                          { step: 3, label: "QR 2" },
                          { step: 4, label: "Wyniki 2" },
                          { step: 5, label: "Analiza" },
                          { step: 6, label: "Trend" },
                          { step: 7, label: "Efekt" },
                        ].map((item) => (
                          <Link key={item.step} href={`/s/${effectiveSessionId}/debate/${debate.groupId}/${item.step}`}>
                            <Button variant="ghost" className="h-9 px-3">
                              {item.label}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <QuestionList
              questions={questions}
              activeQuestionId={session?.activeQuestionId ?? null}
              onActivate={async (questionId) => setActiveQuestion(effectiveSessionId, questionId)}
              onOpenClose={async (questionId, status) => setQuestionVotingStatus(effectiveSessionId, questionId, status)}
              onResetVotes={async (questionId) => resetQuestionVotes(effectiveSessionId, questionId)}
            />
          </div>
        </div>
      </PageShell>
    </FirebaseEnvGuard>
  );
}
