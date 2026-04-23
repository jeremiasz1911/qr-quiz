"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { submitVote } from "@/lib/firestore";
import { getOrCreateVoterToken } from "@/lib/utils";
import type { Question } from "@/types/domain";

export function VoteForm({ question, sessionId }: { question: Question; sessionId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isMultiple = question.type === "multiple";

  const canSubmit = selected.length > 0;

  const locked = useMemo(() => question.status !== "open", [question.status]);

  const toggle = (optionId: string) => {
    if (locked) {
      return;
    }
    if (isMultiple) {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]));
      return;
    }
    setSelected([optionId]);
  };

  const onSubmit = async () => {
    if (!canSubmit || locked) {
      return;
    }
    setSubmitting(true);
    await submitVote({
      sessionId,
      questionId: question.id,
      voterToken: getOrCreateVoterToken(),
      answers: selected,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const canRevote = question.allowRevoteUntilClosed && question.status === "open";
  const disableOptions = locked || (submitted && !canRevote);

  return (
    <Card className="p-5">
      <h1 className="mb-2 text-xl font-bold text-white">{question.title}</h1>
      <p className="mb-4 text-sm text-slate-300">
        {locked ? "Głosowanie zamknięte" : isMultiple ? "Wybierz jedną lub więcej odpowiedzi" : "Wybierz jedną odpowiedź"}
      </p>

      <div className="space-y-3">
        {question.options.map((opt) => {
          const isActive = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`w-full rounded-2xl border p-4 text-left text-base transition ${
                isActive
                  ? "border-blue-300/50 bg-blue-500/20 text-blue-50"
                  : "border-slate-700 bg-slate-900 text-slate-100"
              }`}
              aria-pressed={isActive}
              disabled={disableOptions}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <Button
          size="xl"
          className="w-full"
          disabled={!canSubmit || isSubmitting || locked || (submitted && !canRevote)}
          onClick={onSubmit}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Wyślij głos"}
        </Button>
      </div>

      <AnimatePresence>
        {submitted && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 inline-flex items-center gap-2 text-green-300"
          >
            <CheckCircle2 className="h-4 w-4" />
            Głos zapisany.
          </motion.p>
        )}
      </AnimatePresence>
    </Card>
  );
}
