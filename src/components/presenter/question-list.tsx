"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Question } from "@/types/domain";

const statusMap: Record<Question["status"], string> = {
  draft: "Szkic",
  open: "Otwarte",
  closed: "Zamknięte",
};

export function QuestionList({
  questions,
  activeQuestionId,
  onActivate,
  onOpenClose,
  onResetVotes,
}: {
  questions: Question[];
  activeQuestionId: string | null;
  onActivate: (questionId: string) => Promise<void>;
  onOpenClose: (questionId: string, status: "open" | "closed") => Promise<void>;
  onResetVotes: (questionId: string) => Promise<void>;
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Pytania i historia</h2>
      <div className="space-y-3">
        {questions.map((question) => {
          const isActive = activeQuestionId === question.id;
          const canOpen = question.status !== "open";
          return (
            <motion.div
              key={question.id}
              layout
              className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{question.title}</p>
                  <p className="text-sm text-slate-400">{question.options.length} odpowiedzi</p>
                </div>
                <Badge className={isActive ? "border-blue-300/30 bg-blue-500/20 text-blue-100" : ""}>
                  {isActive ? "Aktywne" : statusMap[question.status]}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => onActivate(question.id)}>
                  Ustaw aktywne
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onOpenClose(question.id, canOpen ? "open" : "closed")}
                >
                  {canOpen ? "Otwórz" : "Zamknij"}
                </Button>
                <Button variant="destructive" onClick={() => onResetVotes(question.id)}>
                  Reset wyników
                </Button>
              </div>
            </motion.div>
          );
        })}
        {!questions.length && <p className="text-sm text-slate-400">Brak pytań w sesji.</p>}
      </div>
    </Card>
  );
}

