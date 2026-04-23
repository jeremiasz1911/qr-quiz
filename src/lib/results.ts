import type { Question, QuestionResultRow, Vote } from "@/types/domain";

export function calculateResults(question: Question, votes: Vote[]): QuestionResultRow[] {
  const counts = new Map<string, number>();
  question.options.forEach((opt) => counts.set(opt.id, 0));

  votes.forEach((vote) => {
    vote.answers.forEach((answer) => {
      counts.set(answer, (counts.get(answer) ?? 0) + 1);
    });
  });

  const total = votes.length;

  return question.options.map((opt) => {
    const count = counts.get(opt.id) ?? 0;
    return {
      optionId: opt.id,
      label: opt.label,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

