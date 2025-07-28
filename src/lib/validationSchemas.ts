import { z } from "zod";

// Password validation with security requirements
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain uppercase, lowercase, number, and special character");

// Staff number validation
export const staffNumberSchema = z.string()
  .min(6, "Staff number must be at least 6 characters")
  .max(20, "Staff number cannot exceed 20 characters")
  .regex(/^[A-Za-z0-9]+$/, "Staff number can only contain letters and numbers");

// Email validation
export const emailSchema = z.string()
  .email("Invalid email format")
  .max(100, "Email cannot exceed 100 characters");

// Name validation
export const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name cannot exceed 50 characters")
  .regex(/^[A-Za-z\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens");

// Role validation
export const roleSchema = z.enum(['student', 'admin', 'technician']);

// Registration form schema
export const registrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  staffNum: staffNumberSchema,
});

// Login form schema
export const loginSchema = z.object({
  staffNum: staffNumberSchema,
  password: z.string().min(1, "Password is required"),
});

// Computer fault report schema
export const faultReportSchema = z.object({
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters")
    .trim(),
  isEmergency: z.boolean().default(false),
});

// Reservation schema
export const reservationSchema = z.object({
  startTime: z.date(),
  duration: z.number().min(30).max(480), // 30 minutes to 8 hours
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type FaultReportFormData = z.infer<typeof faultReportSchema>;
export type ReservationFormData = z.infer<typeof reservationSchema>;