import type { z } from 'zod'
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema
} from './auth.validator'


export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type ResendOtpInput = z.infer<typeof resendOtpSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
export type VerifyResetOtpSchema = z.infer<typeof verifyResetOtpSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
