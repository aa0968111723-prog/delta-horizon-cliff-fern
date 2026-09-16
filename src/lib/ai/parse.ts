import { z } from "zod";

export function parseFnInput<T>(schema: z.ZodType<T>, input: unknown): T {
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data);
  }
  return schema.parse(input);
}
