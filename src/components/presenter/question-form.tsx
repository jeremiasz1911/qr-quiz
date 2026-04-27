"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionFormSchema, type QuestionFormValues } from "@/lib/validation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { QuestionType } from "@/types/domain";
import { Plus, Trash2 } from "lucide-react";

const typeOptions: { label: string; value: QuestionType }[] = [
  { label: "Jednokrotny wybór", value: "single" },
  { label: "Wielokrotny wybór", value: "multiple" },
  { label: "Tak / Nie", value: "yes_no" },
  { label: "Debata (3 opcje)", value: "debate" },
  { label: "Ankieta (2-6 odpowiedzi)", value: "survey" },
  { label: "Skala 1-5", value: "scale_1_5" },
  { label: "Skala 1-10 (zgrupowana)", value: "scale_1_10" },
  { label: "Skala zgody (Likert)", value: "agreement" },
  { label: "NPS 0-10 (zgrupowany)", value: "nps_0_10" },
];

export function QuestionForm({ onCreate }: { onCreate: (values: QuestionFormValues) => Promise<void> }) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: "",
      type: "single",
      allowRevoteUntilClosed: true,
      options: ["", ""],
    },
  });

  const options = useWatch({ control: form.control, name: "options" }) ?? [];
  const selectedType = useWatch({ control: form.control, name: "type" });
  const isYesNo = selectedType === "yes_no";
  const isDebate = selectedType === "debate";
  const isScale15 = selectedType === "scale_1_5";
  const isScale110 = selectedType === "scale_1_10";
  const isAgreement = selectedType === "agreement";
  const isNps = selectedType === "nps_0_10";
  const isPresetType = isYesNo || isDebate || isScale15 || isScale110 || isAgreement || isNps;

  useEffect(() => {
    if (isYesNo) {
      form.setValue("options", ["Tak", "Nie"], { shouldDirty: true });
      return;
    }
    if (isDebate) {
      form.setValue("options", ["Zgadzam się z tezą", "Nie mam zdania", "Nie zgadzam się z tezą"], {
        shouldDirty: true,
      });
      return;
    }
    if (isScale15) {
      form.setValue("options", ["1", "2", "3", "4", "5"], { shouldDirty: true });
      return;
    }
    if (isScale110) {
      form.setValue("options", ["1-2", "3-4", "5-6", "7-8", "9", "10"], { shouldDirty: true });
      return;
    }
    if (isAgreement) {
      form.setValue("options", ["Zdecydowanie nie", "Raczej nie", "Neutralnie", "Raczej tak", "Zdecydowanie tak"], {
        shouldDirty: true,
      });
      return;
    }
    if (isNps) {
      form.setValue("options", ["0-1", "2-3", "4-5", "6-7", "8-9", "10"], { shouldDirty: true });
    }
  }, [form, isAgreement, isDebate, isNps, isScale110, isScale15, isYesNo]);

  const onSubmit = form.handleSubmit(async (values) => {
    await onCreate(values);
    form.reset({ title: "", type: "single", allowRevoteUntilClosed: true, options: ["", ""] });
  });

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Nowe pytanie</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-slate-300">Treść pytania</label>
          <Input {...form.register("title")} placeholder="Np. Który temat był najciekawszy?" />
          {form.formState.errors.title && (
            <p className="text-sm text-rose-400">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-300">Typ pytania</label>
          <Select {...form.register("type")}>
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Odpowiedzi</label>
            {!isPresetType && options.length < 6 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.setValue("options", [...options, ""], { shouldDirty: true })}
                className="h-8 px-3"
              >
                <Plus className="mr-1 h-4 w-4" />
                Dodaj
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {options.map((_, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  {...form.register(`options.${index}`)}
                  disabled={isPresetType}
                  placeholder={`Odpowiedź ${index + 1}`}
                />
                {!isPresetType && options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      form.setValue(
                        "options",
                        options.filter((__, i) => i !== index),
                        { shouldDirty: true }
                      )
                    }
                    aria-label="Usuń odpowiedź"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {form.formState.errors.options && (
            <p className="text-sm text-rose-400">
              {form.formState.errors.options.message?.toString() ?? "Niepoprawne odpowiedzi"}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
            {...form.register("allowRevoteUntilClosed")}
          />
          Uczestnik może zmienić odpowiedź do zamknięcia pytania
        </label>

        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          Utwórz pytanie
        </Button>
      </form>
    </Card>
  );
}
