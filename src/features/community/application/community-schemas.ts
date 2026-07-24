import { z } from "zod";

const sourceSchema = z.object({ url: z.string().url().max(2_048), title: z.string().trim().min(1).max(180), note: z.string().trim().max(500).optional() });
export const appearanceSuggestionSchema = z.object({
  dapiId: z.number().int().positive(),
  seriesId: z.number().int().positive(),
  season: z.number().int().min(1).max(99).nullable().optional(),
  characterName: z.string().trim().max(120).nullable().optional(),
  kind: z.enum(["partner", "main", "supporting", "cameo", "reference"]),
  explanation: z.string().trim().min(20).max(1_500),
  sources: z.array(sourceSchema).min(1).max(5),
});
export const moderationDecisionSchema = z.object({ suggestionId: z.string().uuid(), decision: z.enum(["approved", "rejected", "changes_requested"]), note: z.string().trim().max(800).optional() });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(1_000) });
export const reportSchema = z.object({ targetType: z.enum(["appearance", "comment", "suggestion"]), targetId: z.string().uuid(), reason: z.enum(["spam", "incorrect", "copyright", "abuse", "other"]), details: z.string().trim().max(1_000).optional() });