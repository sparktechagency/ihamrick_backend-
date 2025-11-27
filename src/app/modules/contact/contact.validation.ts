import { z } from "zod";

// Simple, permissive phone validator for international formats
const phoneRegex = /^[+()\-.\s\d]{7,20}$/;

const createContactValidationSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
    email: z.string().trim().email("Invalid email"),
    phone: z.string().trim().regex(phoneRegex, "Invalid phone number").max(20),
    message: z.string().trim().min(5, "Message is too short").max(2000),
  }),
});

export const contactValidation = {
  createContactValidationSchema,
};
