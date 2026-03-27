import { z } from "zod";

export const transferSchema = z.object({
  fromCompanyId: z.string().min(1),
  toName: z.string().min(2),
  assetTypeId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  location: z.string().min(2),
  transferDate: z.string().min(1),
  notes: z.string().optional()
});
