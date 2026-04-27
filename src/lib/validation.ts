import { z } from "zod";

export const questionTypeSchema = z.enum([
  "single",
  "multiple",
  "yes_no",
  "debate",
  "survey",
  "scale_1_5",
  "scale_1_10",
  "agreement",
  "nps_0_10",
]);

export const questionFormSchema = z
  .object({
    title: z.string().min(5, "Pytanie musi mieć min. 5 znaków"),
    type: questionTypeSchema,
    allowRevoteUntilClosed: z.boolean(),
    options: z.array(z.string().min(1)).min(2).max(6),
  })
  .superRefine((value, ctx) => {
    if (value.type === "yes_no" && value.options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Pytanie tak/nie musi mieć dokładnie 2 odpowiedzi.",
      });
    }
    if (value.type === "debate" && value.options.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Debata musi mieć dokładnie 3 odpowiedzi.",
      });
    }
    if (value.type === "scale_1_5" && value.options.length !== 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Skala 1-5 musi mieć dokładnie 5 odpowiedzi.",
      });
    }
    if (value.type === "scale_1_10" && value.options.length !== 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Skala 1-10 w MVP ma 6 odpowiedzi (1-2, 3-4, 5-6, 7-8, 9, 10).",
      });
    }
    if (value.type === "agreement" && value.options.length !== 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Skala zgody musi mieć 5 odpowiedzi.",
      });
    }
    if (value.type === "nps_0_10" && value.options.length !== 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "NPS 0-10 w MVP ma 6 grup odpowiedzi (0-1, 2-3, 4-5, 6-7, 8-9, 10).",
      });
    }
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
