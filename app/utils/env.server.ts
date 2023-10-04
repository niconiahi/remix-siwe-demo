import { z } from "zod";

export const envSchema = z.object({
  SESSION_SECRET: z.string().nonempty(),
});
