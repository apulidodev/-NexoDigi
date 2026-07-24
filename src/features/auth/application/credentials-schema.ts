import { z } from "zod";

const password = z.string().min(10, "La contraseña debe tener al menos 10 caracteres.").max(128);
export const signUpSchema = z.object({
  email: z.string().trim().email(),
  password,
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,31}$/, "El alias debe tener 3-32 caracteres: letras, números, _ o -."),
});
export const signInSchema = z.object({ email: z.string().trim().email(), password });