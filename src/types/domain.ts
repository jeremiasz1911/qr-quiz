export type QuestionType =
  | "single"
  | "multiple"
  | "yes_no"
  | "debate"
  | "survey"
  | "scale_1_5"
  | "scale_1_10"
  | "agreement"
  | "nps_0_10";

export type DebatePhase = "before" | "after";

export type SessionStatus = "draft" | "live" | "ended";
export type QuestionStatus = "draft" | "open" | "closed";
export type PresentationMode = "qr" | "results";
export type ResultsChartType = "bar" | "horizontal_bar" | "line" | "pie" | "donut" | "histogram";

export interface Session {
  id: string;
  title: string;
  hostUid: string;
  status: SessionStatus;
  activeQuestionId: string | null;
  presentationMode: PresentationMode;
  resultsChartType: ResultsChartType;
  createdAt: number;
  updatedAt: number;
}

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  sessionId: string;
  title: string;
  debateTopic: string | null;
  debateGroupId: string | null;
  debatePhase: DebatePhase | null;
  type: QuestionType;
  options: QuestionOption[];
  status: QuestionStatus;
  allowRevoteUntilClosed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Vote {
  id: string;
  sessionId: string;
  questionId: string;
  answers: string[];
  voterToken: string;
  updatedAt: number;
}

export interface QuestionResultRow {
  optionId: string;
  label: string;
  count: number;
  percentage: number;
}
