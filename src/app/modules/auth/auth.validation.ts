import { z } from "zod";

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({
        required_error: "Old password is required",
      })
      .min(8, "Old password must be at least 8 characters long"),
    newPassword: z
      .string({
        required_error: "New password is required",
      })
      .min(8, "New password must be at least 8 characters long"),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: "Email is required",
        })
        .email("Please provide a valid email address"),
      newPassword: z
        .string({
          required_error: "New password is required",
        })
        .min(8, "Password must be at least 8 characters long"),
      confirmPassword: z
        .string({
          required_error: "Confirm password is required",
        })
        .min(8, "Confirm password must be at least 8 characters long"),
      otp: z
        .string({
          required_error: "OTP is required",
        })
        .min(6, "OTP must be at least 6 characters long"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirm password do not match",
      path: ["confirmPassword"],
    }),
});

const updateAdminProfileValidationSchema = z.object({
  body: z.object({
    userName: z.string().trim().optional(),
    email: z.string().email("Please provide a valid email address").optional(),
    phoneNumber: z.string().trim().optional(),
    location: z.string().trim().optional(),
  }),
});

export const authValidation = {
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
  updateAdminProfileValidationSchema,
};
