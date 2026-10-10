import type { HydratedDocument } from "mongoose";
import { OtpModel, type Otp } from "./otp.model";
import { ZodMiniE164 } from "zod/mini";

export class AuthRepository {
  async findActiveOtp(
    email: string,
    purpose: Otp['purpose']
  ): Promise<HydratedDocument<Otp> | null> {
    return OtpModel.findOne({
      email: email.trim().toLowerCase(),
      purpose,
      expiresAt: { $gt: new Date() },
      verifiedAt: null
    }).sort({ createAt: -1 })
      .select("+otpHash")
      .exec()
  }

  async findLatestOtp(
    email: string,
    purpose: Otp['purpose']
  ): Promise<HydratedDocument<Otp> | null>{
    return OtpModel.findOne({
      email: email.trim().toLowerCase(),
      purpose,
      verifiedAt: null
    })
      .sort({ createdAt: -1 })
      .select("+otpHash")
      .exec()
  }

  async incrementOtpAttempts(otpId: string): Promise<void>{
    await OtpModel.updateOne(
      { _id: otpId, verifiedAt: null },
      { $inc: { attempts: 1}}
    ).exec()
  }

  async markOtpVerified(otpId: string): Promise<void> {
    await OtpModel.updateOne(
      { _id: otpId, varifiedAt: null },
      { $set: {verifiedAt: new Date() }}
    ).exec()
  }

  async createOtp(
    otpData: Pick<
      Otp,
      | '_id'
      | 'email'
      | 'purpose'
      | 'otpHash'
      | 'expiresAt'
      | 'maxAttempts'>
  ): Promise<HydratedDocument<Otp>> {
    return OtpModel.create(otpData)
  }

  async deletePendingOtps(
    email: string,
    purpose: Otp['purpose']
  ): Promise<void> {
    await OtpModel.deleteMany({
      email: email.trim().toLowerCase(),
      purpose,
      verifiedAt: null
    }).exec()
  }
}
