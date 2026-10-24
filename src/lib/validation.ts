import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants";
import { isValidGstin, isValidIndianPhone } from "@/lib/utils";

const emailField = z
  .email("Enter a valid email address.")
  .max(254, "That email address is too long.")
  .transform((value) => value.trim().toLowerCase());

const nameField = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(90, "That name is too long.");

const optionalPhoneField = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine(
    (value) => value === "" || isValidIndianPhone(value),
    "Enter a valid 10-digit Indian mobile number.",
  )
  .transform((value) => (value === "" ? null : value));

const requiredPhoneField = z
  .string()
  .trim()
  .min(1, "Enter a contact phone number.")
  .refine(isValidIndianPhone, "Enter a valid 10-digit Indian mobile number.");

const passwordField = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Passwords cannot be longer than 72 characters.");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  fullName: nameField,
  email: emailField,
  phone: optionalPhoneField,
  password: passwordField,
  terms: z.literal("on", { error: "Please accept the terms to create an account." }),
});

export const emailOnlySchema = z.object({
  email: emailField,
});

export const newPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: nameField,
  phone: optionalPhoneField,
});

export const businessSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "Enter the registered business name.")
    .max(140, "That name is too long."),
  tradeName: z
    .string()
    .trim()
    .max(140, "That name is too long.")
    .optional()
    .transform((value) => (value ? value : null)),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isValidGstin, "Enter a valid 15-character GSTIN."),
  email: emailField,
  phone: requiredPhoneField,
  addressLine1: z
    .string()
    .trim()
    .min(4, "Enter the registered street address.")
    .max(180, "That address is too long."),
  addressLine2: z
    .string()
    .trim()
    .max(180, "That address is too long.")
    .optional()
    .transform((value) => (value ? value : null)),
  city: z.string().trim().min(2, "Enter the city.").max(90, "That city name is too long."),
  state: z.enum(INDIAN_STATES, { error: "Choose a state." }),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code."),
});

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Enter your order number.")
    .max(40, "That order number looks too long."),
  email: emailField,
});

const couponCodeField = z
  .string()
  .trim()
  .toUpperCase()
  .max(32, "That coupon code is too long.")
  .refine(
    (value) => value === "" || /^[A-Z0-9_-]{3,32}$/.test(value),
    "Enter a valid coupon code.",
  )
  .transform((value) => (value === "" ? null : value));

const checkoutLineSchema = z.object({
  kind: z.enum(["product", "combo"]),
  id: z.uuid("That bag item is not valid."),
  quantity: z
    .number()
    .int("Quantities must be whole numbers.")
    .min(1, "Quantities must be at least 1.")
    .max(1000, "That quantity is too large."),
});

export const checkoutQuoteSchema = z.object({
  lines: z.array(checkoutLineSchema).min(1, "Your bag is empty.").max(50),
  couponCode: couponCodeField.optional(),
});

export const checkoutDetailsSchema = checkoutQuoteSchema.extend({
  fullName: nameField,
  email: emailField,
  phone: requiredPhoneField,
  addressLine1: z
    .string()
    .trim()
    .min(4, "Enter the delivery street address.")
    .max(180, "That address is too long."),
  addressLine2: z
    .string()
    .trim()
    .max(180, "That address is too long.")
    .optional()
    .transform((value) => (value ? value : null)),
  city: z.string().trim().min(2, "Enter the city.").max(90, "That city name is too long."),
  state: z.enum(INDIAN_STATES, { error: "Choose a state." }),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code."),
  customerNote: z
    .string()
    .trim()
    .max(600, "Please keep your note under 600 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
  terms: z.literal(true, { error: "Please accept the order terms to continue." }),
});

export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;
export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteSchema>;
export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;

export type BusinessInput = z.infer<typeof businessSchema>;
