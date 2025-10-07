import { z } from "zod";

const createSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
    })
    .min(1, "Title cannot be empty"),
  description: z.string().min(1, "Description cannot be empty"),
  coverImage: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  coverImage: z.string().optional(),
});

export const blogValidation = {
  createSchema,
  updateSchema,
};
