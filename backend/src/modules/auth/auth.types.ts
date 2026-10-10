import type { z } from 'zod'
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema
} from './auth.validator'


export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type ResentOtpInput = z.infer<typeof resendOtpSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
