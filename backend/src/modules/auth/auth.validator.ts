import { z } from 'zod'

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required')
})

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((email) => email.toLowerCase()),
  otp: z
    .string()
    .regex(/^\d{6}$/, 'OTP must contain exactly 6 digit'),
})

export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((email) => email.toLowerCase()),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})
