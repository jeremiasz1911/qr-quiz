"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeQuestions, subscribeSession, subscribeVotes } from "@/lib/firestore";
import { calculateResults } from "@/lib/results";
import type { Question, QuestionResultRow, Session, Vote } from "@/types/domain";

export function useSessionData(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const isReady = Boolean(sessionId);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const unsubSession = subscribeSession(sessionId, setSession);
    const unsubQuestions = subscribeQuestions(sessionId, setQuestions);
    return () => {
      unsubSession();
      unsubQuestions();
    };
  }, [isReady, sessionId]);

  const visibleSession = useMemo(() => (isReady ? session : null), [isReady, session]);
  const visibleQuestions = useMemo(() => (isReady ? questions : []), [isReady, questions]);

  const activeQuestion = useMemo(
    () => visibleQuestions.find((q) => q.id === visibleSession?.activeQuestionId) ?? null,
    [visibleQuestions, visibleSession?.activeQuestionId]
  );

  useEffect(() => {
    if (!activeQuestion || !isReady) {
      return;
    }
    const unsubVotes = subscribeVotes(sessionId, activeQuestion.id, setVotes);
    return unsubVotes;
  }, [activeQuestion, isReady, sessionId]);

  const visibleVotes = useMemo(() => (activeQuestion ? votes : []), [activeQuestion, votes]);

  const results: QuestionResultRow[] = useMemo(() => {
    if (!activeQuestion) {
      return [];
    }
    return calculateResults(activeQuestion, visibleVotes);
  }, [activeQuestion, visibleVotes]);

  return { session: visibleSession, questions: visibleQuestions, activeQuestion, votes: visibleVotes, results };
}
