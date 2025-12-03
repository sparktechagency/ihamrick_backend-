import { z } from "zod";

const createSocialLink = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
    }).min(1, "Name cannot be empty").trim(),
    url: z.string({
      required_error: "URL is required",
    }).url("Invalid URL format"),
  }),
});

const updateSocialLink = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").trim().optional(),
    url: z.string().url("Invalid URL format").optional(),
  }),
});

export const socialLinkValidation = {
  createSocialLink,
  updateSocialLink,
};
