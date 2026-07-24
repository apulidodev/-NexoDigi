import { z } from "zod";

export const updateProfileSchema = z.object({
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,31}$/, "El alias debe tener 3-32 caracteres: letras, números, _ o -.").optional(),
  avatarUrl: z.string().url().max(2_048).nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
});