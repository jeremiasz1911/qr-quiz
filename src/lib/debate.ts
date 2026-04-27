import { calculateResults } from "@/lib/results";
import type { Question, QuestionResultRow, Vote } from "@/types/domain";

export interface DebateComparisonRow {
  label: string;
  beforeCount: number;
  afterCount: number;
  beforePercentage: number;
  afterPercentage: number;
  deltaCount: number;
  deltaPercentage: number;
}

export interface DebateAnalysis {
  comparisonRows: DebateComparisonRow[];
  commonVoters: number;
  changedVoters: number;
  unchangedVoters: number;
  effectivenessPercent: number;
  participationDelta: number;
  participationDeltaPercent: number;
  turnoutBefore: number;
  turnoutAfter: number;
  thesisWon: boolean;
  thesisOutcome: "win" | "loss" | "draw";
  thesisShift: number;
  supportBefore: QuestionResultRow;
  supportAfter: QuestionResultRow;
  neutralBefore: QuestionResultRow;
  neutralAfter: QuestionResultRow;
  oppositionBefore: QuestionResultRow;
  oppositionAfter: QuestionResultRow;
  summary: string;
  discussionWorthIt: boolean;
  discussionLabel: string;
}

function serializeAnswers(answers: string[]) {
  return [...answers].sort().join("|");
}

function getAnswerRows(question: Question, votes: Vote[]) {
  const rows = calculateResults(question, votes);
  return {
    support: rows[0],
    neutral: rows[1],
    opposition: rows[2],
    rows,
  };
}

export function analyzeDebate(before: Question, after: Question, beforeVotes: Vote[], afterVotes: Vote[]): DebateAnalysis {
  const beforeRows = getAnswerRows(before, beforeVotes);
  const afterRows = getAnswerRows(after, afterVotes);
  const comparisonRows = beforeRows.rows.map((beforeRow, index) => {
    const afterRow = afterRows.rows[index] ?? beforeRow;
    return {
      label: beforeRow.label,
      beforeCount: beforeRow.count,
      afterCount: afterRow.count,
      beforePercentage: beforeRow.percentage,
      afterPercentage: afterRow.percentage,
      deltaCount: afterRow.count - beforeRow.count,
      deltaPercentage: afterRow.percentage - beforeRow.percentage,
    };
  });

  const beforeByVoter = new Map(beforeVotes.map((vote) => [vote.voterToken, vote.answers]));
  const afterByVoter = new Map(afterVotes.map((vote) => [vote.voterToken, vote.answers]));
  let changedVoters = 0;
  let unchangedVoters = 0;

  beforeByVoter.forEach((answers, voterToken) => {
    const afterAnswers = afterByVoter.get(voterToken);
    if (!afterAnswers) {
      return;
    }
    if (serializeAnswers(answers) === serializeAnswers(afterAnswers)) {
      unchangedVoters += 1;
      return;
    }
    changedVoters += 1;
  });

  const commonVoters = changedVoters + unchangedVoters;
  const supportShift = afterRows.support.percentage - beforeRows.support.percentage;
  const effectivenessPercent =
    commonVoters === 0 ? 0 : Math.round((changedVoters / commonVoters) * 100);
  const participationDelta = afterVotes.length - beforeVotes.length;
  const participationDeltaPercent =
    beforeVotes.length === 0 ? 0 : Math.round((participationDelta / beforeVotes.length) * 100);
  const thesisWon =
    afterRows.support.count > afterRows.opposition.count
      ? true
      : afterRows.support.count < afterRows.opposition.count
        ? false
        : afterRows.support.count === afterRows.opposition.count
          ? false
          : false;
  const thesisOutcome = afterRows.support.count === afterRows.opposition.count ? "draw" : thesisWon ? "win" : "loss";

  const summary =
    commonVoters === 0
      ? "Brak wspólnych głosów do porównania między pierwszym i drugim pytaniem."
      : changedVoters === 0
        ? "Nikt nie zmienił odpowiedzi między pierwszym i drugim głosowaniem."
        : changedVoters >= Math.max(3, Math.ceil(commonVoters * 0.25))
          ? "Warto rozmawiać — sporo osób zmieniło zdanie po debacie."
          : "Debata poruszyła część uczestników, ale zmiana była umiarkowana.";
  const discussionWorthIt = changedVoters >= Math.max(2, Math.ceil(commonVoters * 0.2));
  const discussionLabel = discussionWorthIt ? "Warto rozmawiać" : "Zmiana była niewielka";

  return {
    comparisonRows,
    commonVoters,
    changedVoters,
    unchangedVoters,
    effectivenessPercent,
    participationDelta,
    participationDeltaPercent,
    turnoutBefore: beforeVotes.length,
    turnoutAfter: afterVotes.length,
    thesisWon,
    thesisOutcome,
    thesisShift: supportShift,
    supportBefore: beforeRows.support,
    supportAfter: afterRows.support,
    neutralBefore: beforeRows.neutral,
    neutralAfter: afterRows.neutral,
    oppositionBefore: beforeRows.opposition,
    oppositionAfter: afterRows.opposition,
    summary,
    discussionWorthIt,
    discussionLabel,
  };
}
