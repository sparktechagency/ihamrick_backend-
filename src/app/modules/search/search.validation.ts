import { z } from "zod";

const searchSchema = z.object({
  query: z.object({
    keyword: z
      .string({
        required_error: "Keyword is required",
      })
      .min(1),
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.enum(["true", "false"]).optional(),
  }),
});

export const SearchValidation = {
  searchSchema,
};
