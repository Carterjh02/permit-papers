import { z } from "zod";

export const ExtractedInfoSchema = z.object({
  name: z.string().optional(),
  nameConfidence: z.number().min(0).max(1).optional(),

  address: z.string().optional(),
  addressConfidence: z.number().min(0).max(1).optional(),

  city: z.string().optional(),
  cityConfidence: z.number().min(0).max(1).optional(),

  state: z.string().optional(),
  stateConfidence: z.number().min(0).max(1).optional(),

  zip: z.string().optional(),
  zipConfidence: z.number().min(0).max(1).optional(),

  folio: z.string().optional(),
  folioConfidence: z.number().min(0).max(1).optional(),

  subdivision: z.string().optional(),
  subdivisionConfidence: z.number().min(0).max(1).optional(),

  rawText: z.string().optional(),
});

export type ExtractedInfo = z.infer<typeof ExtractedInfoSchema>;
