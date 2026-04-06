import { z } from "zod";

export const visitorRegistrationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^\+?[0-9]{7,15}$/, "Invalid mobile number"),
  purposeOfVisit: z
    .string()
    .min(1, "Purpose of visit is required")
    .max(500, "Purpose must be 500 characters or less"),
  companyToVisit: z
    .string()
    .min(1, "Company to visit is required")
    .max(200, "Company name must be 200 characters or less"),
  personToVisit: z
    .string()
    .min(1, "Person to visit is required")
    .max(200, "Person name must be 200 characters or less"),
  gadgetType: z.string().optional(),
  gadgetSerial: z.string().optional(),
});

export const existingUserLoginSchema = z
  .object({
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    mobile: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.email || data.mobile, {
    message: "Either email or mobile number is required",
  });

export const otpVerifySchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  code: z
    .string()
    .min(1, "OTP code is required")
    .length(6, "OTP must be 6 digits"),
});

export const visitSubmitSchema = z.object({
  purposeOfVisit: z
    .string()
    .min(1, "Purpose of visit is required")
    .max(500, "Purpose must be 500 characters or less"),
  companyToVisit: z
    .string()
    .min(1, "Company to visit is required")
    .max(200, "Company name must be 200 characters or less"),
  personToVisit: z
    .string()
    .min(1, "Person to visit is required")
    .max(200, "Person name must be 200 characters or less"),
  gadgetType: z.string().optional(),
  gadgetSerial: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type VisitorRegistrationInput = z.infer<typeof visitorRegistrationSchema>;
export type ExistingUserLoginInput = z.infer<typeof existingUserLoginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type VisitSubmitInput = z.infer<typeof visitSubmitSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
