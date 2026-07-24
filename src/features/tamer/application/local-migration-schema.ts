import { z } from "zod";

const dapiId = z.number().int().positive();
export const localMigrationSchema = z.object({
  collection: z.array(dapiId).max(5_000).default([]),
  team: z.array(z.object({ id: dapiId })).max(6).default([]),
  evoNotes: z.record(z.string().regex(/^\d+$/), z.string().max(280)).default({}),
  savedFilters: z.array(z.object({ label: z.string().trim().min(1).max(80), filters: z.record(z.string(), z.unknown()) })).max(20).default([]),
  history: z.array(z.object({ id: dapiId, scannedAt: z.string().datetime() })).max(100).default([]),
  quizCorrectDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(366).default([]),
});