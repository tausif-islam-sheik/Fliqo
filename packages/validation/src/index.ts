import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  marketingOptIn: z.boolean().optional()
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const flightSearchSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  adt: z.coerce.number().int().min(1).max(9).default(1)
});
export type FlightSearchInput = z.infer<typeof flightSearchSchema>;

export const passengerSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().optional(),
  passportNo: z.string().optional()
});

export const createFlightBookingSchema = z.object({
  offerId: z.string().min(1),
  passengers: z.array(passengerSchema).min(1).max(9),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6)
});
export type CreateFlightBookingInput = z.infer<typeof createFlightBookingSchema>;
