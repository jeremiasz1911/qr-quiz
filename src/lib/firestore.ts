"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb, hasFirebaseEnv } from "@/lib/firebase";
import { generateId, nowTs } from "@/lib/utils";
import type {
  DebatePhase,
  PresentationMode,
  Question,
  QuestionType,
  ResultsChartType,
  Session,
  Vote,
} from "@/types/domain";

export const PUBLIC_HOST_UID = "katolik-public";
export const PUBLIC_SESSION_ID = "katolik-public-session";

export function sessionsCollection() {
  const db = getDb();
  return collection(db, "sessions");
}

export function questionsCollection(sessionId: string) {
  const db = getDb();
  return collection(db, "sessions", sessionId, "questions");
}

export function votesCollection(sessionId: string, questionId: string) {
  const db = getDb();
  return collection(db, "sessions", sessionId, "questions", questionId, "votes");
}

export async function createSession(hostUid: string, title: string) {
  const db = getDb();
  const sessionId = generateId("session");
  await setDoc(doc(db, "sessions", sessionId), {
    title,
    hostUid,
    status: "draft",
    activeQuestionId: null,
    presentationMode: "qr",
    resultsChartType: "bar",
    createdAt: nowTs(),
    updatedAt: nowTs(),
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });
  return sessionId;
}

export async function ensurePublicSession(title: string) {
  const db = getDb();
  const sessionRef = doc(db, "sessions", PUBLIC_SESSION_ID);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) {
    await setDoc(sessionRef, {
      title,
      hostUid: PUBLIC_HOST_UID,
      status: "draft",
      activeQuestionId: null,
      presentationMode: "qr",
      resultsChartType: "bar",
      createdAt: nowTs(),
      updatedAt: nowTs(),
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
    return PUBLIC_SESSION_ID;
  }

  await updateDoc(sessionRef, {
    title,
    hostUid: PUBLIC_HOST_UID,
    updatedAt: nowTs(),
    updatedAtServer: serverTimestamp(),
  });
  return PUBLIC_SESSION_ID;
}

export async function createQuestion(
  sessionId: string,
  payload: {
    title: string;
    debateTopic?: string | null;
    debateGroupId?: string | null;
    debatePhase?: DebatePhase | null;
    type: QuestionType;
    options: string[];
    allowRevoteUntilClosed: boolean;
  }
) {
  const db = getDb();
  const questionId = generateId("q");
  await setDoc(doc(db, "sessions", sessionId, "questions", questionId), {
    id: questionId,
    sessionId,
    title: payload.title,
    debateTopic: payload.debateTopic ?? null,
    debateGroupId: payload.debateGroupId ?? null,
    debatePhase: payload.debatePhase ?? null,
    type: payload.type,
    options: payload.options.map((label, i) => ({ id: `opt_${i + 1}`, label })),
    status: "draft",
    allowRevoteUntilClosed: payload.allowRevoteUntilClosed,
    createdAt: nowTs(),
    updatedAt: nowTs(),
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });
  return questionId;
}

export async function createDebatePair(sessionId: string, statement: string) {
  const debateGroupId = generateId("debate");
  const sharedOptions = [
    "Zgadzam się z tezą",
    "Nie mam zdania",
    "Nie zgadzam się z tezą",
  ];

  const beforeId = await createQuestion(sessionId, {
    title: `Przed debatą — ${statement}`,
    debateTopic: statement,
    debateGroupId,
    debatePhase: "before",
    type: "debate",
    options: sharedOptions,
    allowRevoteUntilClosed: true,
  });
  await setQuestionVotingStatus(sessionId, beforeId, "open");

  const afterId = await createQuestion(sessionId, {
    title: `Po debacie — ${statement}`,
    debateTopic: statement,
    debateGroupId,
    debatePhase: "after",
    type: "debate",
    options: sharedOptions,
    allowRevoteUntilClosed: true,
  });
  await setQuestionVotingStatus(sessionId, afterId, "open");

  return { debateGroupId, beforeId, afterId };
}

export async function setActiveQuestion(sessionId: string, questionId: string) {
  const db = getDb();
  const questionsRef = questionsCollection(sessionId);
  const openQuestions = await getDocs(query(questionsRef, where("status", "==", "open")));
  await Promise.all(
    openQuestions.docs.map((qDoc) =>
      updateDoc(qDoc.ref, { status: "closed", updatedAt: nowTs(), updatedAtServer: serverTimestamp() })
    )
  );

  await updateDoc(doc(db, "sessions", sessionId), {
    activeQuestionId: questionId,
    status: "live",
    updatedAt: nowTs(),
    updatedAtServer: serverTimestamp(),
  });

  await updateDoc(doc(db, "sessions", sessionId, "questions", questionId), {
    status: "open",
    updatedAt: nowTs(),
    updatedAtServer: serverTimestamp(),
  });
}

export async function setQuestionVotingStatus(
  sessionId: string,
  questionId: string,
  status: "open" | "closed"
) {
  const db = getDb();
  await updateDoc(doc(db, "sessions", sessionId, "questions", questionId), {
    status,
    updatedAt: nowTs(),
    updatedAtServer: serverTimestamp(),
  });

  if (status === "open") {
    await updateDoc(doc(db, "sessions", sessionId), {
      activeQuestionId: questionId,
      status: "live",
      updatedAt: nowTs(),
      updatedAtServer: serverTimestamp(),
    });
  }
}

export async function setPresentationMode(sessionId: string, mode: PresentationMode) {
  const db = getDb();
  await updateDoc(doc(db, "sessions", sessionId), {
    presentationMode: mode,
    updatedAt: nowTs(),
    updatedAtServer: serverTimestamp(),
  });
}

export async function setResultsChartType(sessionId: string, chartType: ResultsChartType) {
  const db = getDb();
  await updateDoc(doc(db, "sessions", sessionId), {
    resultsChartType: chartType,
    updatedAt: nowTs(),
    updatedAtServer: serverTimestamp(),
  });
}

export async function resetQuestionVotes(sessionId: string, questionId: string) {
  const votes = await getDocs(votesCollection(sessionId, questionId));
  await Promise.all(votes.docs.map((voteDoc) => deleteDoc(voteDoc.ref)));
}

export async function submitVote(params: {
  sessionId: string;
  questionId: string;
  voterToken: string;
  answers: string[];
}) {
  const db = getDb();
  const voteRef = doc(db, "sessions", params.sessionId, "questions", params.questionId, "votes", params.voterToken);
  await setDoc(
    voteRef,
    {
      id: params.voterToken,
      sessionId: params.sessionId,
      questionId: params.questionId,
      voterToken: params.voterToken,
      answers: params.answers,
      updatedAt: nowTs(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeSession(
  sessionId: string,
  cb: (session: Session | null) => void
) {
  if (!hasFirebaseEnv()) {
    cb(null);
    return () => {};
  }
  const db = getDb();
  return onSnapshot(doc(db, "sessions", sessionId), (snapshot) => {
    if (!snapshot.exists()) {
      cb(null);
      return;
    }
    cb({ id: snapshot.id, ...(snapshot.data() as Omit<Session, "id">) });
  });
}

export function subscribeQuestions(
  sessionId: string,
  cb: (questions: Question[]) => void
) {
  if (!hasFirebaseEnv()) {
    cb([]);
    return () => {};
  }
  return onSnapshot(questionsCollection(sessionId), (snapshot) => {
    cb(
      snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Question, "id">) }))
        .sort((a, b) => b.createdAt - a.createdAt)
    );
  });
}

export function subscribeVotes(
  sessionId: string,
  questionId: string,
  cb: (votes: Vote[]) => void
) {
  if (!hasFirebaseEnv()) {
    cb([]);
    return () => {};
  }
  return onSnapshot(votesCollection(sessionId, questionId), (snapshot) => {
    cb(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Vote, "id">) })));
  });
}

export async function getQuestionById(sessionId: string, questionId: string) {
  if (!hasFirebaseEnv()) {
    return null;
  }
  const db = getDb();
  const snapshot = await getDoc(doc(db, "sessions", sessionId, "questions", questionId));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...(snapshot.data() as Omit<Question, "id">) };
}
