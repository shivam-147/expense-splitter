import { Schema, model } from "mongoose";

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'

export interface Otp {
  _id: string;
  email: string;
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<Otp>({
  _id: {
    type: String,
    require: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  purpose: {
    type: String,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
    required: true,
  },
  otpHash: {
    type: String,
    required: true,
    select: false
  },
  expiresAt: {
    type: Date,
    require: true
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    required: true,
    default: 5
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
})

otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

otpSchema.index({
  email: 1,
  purpose: 1,
  createdAt: -1
})

export const OtpModel = model<Otp>('Otp', otpSchema)
