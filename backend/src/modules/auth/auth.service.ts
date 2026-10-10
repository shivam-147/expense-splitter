import { ulid } from "ulid";
import { AppError } from "../../errors/app-error";
import { env } from "../../config/env";
import { UserRepository } from "../users/user.repository";
import { AuthRepository } from "./auth.repository";
import { EmailService } from "../notifications/email.service";
import { hashPassword, verifyPassword } from "../../utils/password.util";
import { generateOtp, hashOtp } from "../../utils/otp.util";
import type { LoginInput, RegisterInput, VerifyOtpInput, RefreshTokenInput } from "./auth.types";
import { ERROR_CODE } from "../../constants/error-code.contants";
import { MESSAGE } from "../../constants/message.constants";
import { HTTP_STATUS } from "../../constants/http-status.constants";
import { verifyOtp } from "../../utils/otp.util"
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.util";
import { hashToken } from "../../utils/token-hash.util";
import { RefreshTokenRepository } from "./refresh-token.repository";

export class AuthService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly authRepository = new AuthRepository(),
    private readonly emailService = new EmailService(),
    private readonly refreshTokenRepository = new RefreshTokenRepository()
  ) { }

  async register(input: RegisterInput) {
    let user = await this.userRepository.findByEmail(input.email)

    if (user?.emailVerified) {
      throw new AppError({
        code: ERROR_CODE.EMAIL_ALREADY_EXISTS,
        message: MESSAGE.EMAIL_ALREADY_EXISTS,
        statusCode: HTTP_STATUS.CONFLICT,
        details: []
      })
    }

    if (!user) {
      const passwordHash = await hashPassword(input.password)
      user = await this.userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash
      })
    }

    await this.authRepository.deletePendingOtps(user.email, 'EMAIL_VERIFICATION')

    const otp = generateOtp();
    const otpHash = await hashOtp(otp)

    await this.authRepository.createOtp({
      _id: `otp_${ulid}`,
      email: user.email,
      purpose: 'EMAIL_VERIFICATION',
      otpHash,
      expiresAt: new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000),
      maxAttempts: env.otpMaxAttemps
    })

    try {
      await this.emailService.sendOtp({
        to: user.email,
        name: user.name,
        otp
      })
    } catch {
      throw new AppError({
        code: ERROR_CODE.EMAIL_DELIVERY_FAILED,
        message: MESSAGE.EMAIL_VERIFICATION_OTP_SEND_FAILED,
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        details: []
      })
    }

    return {
      userId: user._id,
      email: user.email,
      message: MESSAGE.EMAIL_VERIFICATION_OTP_SEND_SUCCESS
    }
    }

  async verifyEmailOtp(input: VerifyOtpInput) {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new AppError({
        code: ERROR_CODE.INVALID_OTP,
        message: MESSAGE.INVALID_OTP,
        statusCode: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (user.emailVerified) {
      return {
        userId: user._id,
        email: user.email,
        message: MESSAGE.EMAIL_ALREADY_EXISTS
      }
    }

    const otpRecord = await this.authRepository.findLatestOtp(input.email, 'EMAIL_VERIFICATION')

    if (!otpRecord) {
      throw new AppError({
        code: ERROR_CODE.INVALID_OTP,
        message: MESSAGE.INVALID_OTP,
        statusCode: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      throw new AppError({
        code: ERROR_CODE.OTP_EXPIRED,
        message: MESSAGE.OTP_EXPIRED,
        statusCode: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new AppError({
        code: ERROR_CODE.OTP_MAX_ATTEMPTS,
        message: MESSAGE.OTP_MAX_ATTEMPTS,
        statusCode: HTTP_STATUS.BAD_REQUEST
      })
    }

    const isValid = await verifyOtp(input.otp, otpRecord?.otpHash)

    if (!isValid) {
      await this.authRepository.incrementOtpAttempts(otpRecord._id)

      if (otpRecord.attempts + 1 >= otpRecord.maxAttempts) {
        throw new AppError({
          code: ERROR_CODE.OTP_MAX_ATTEMPTS,
          message: MESSAGE.OTP_MAX_ATTEMPTS,
          statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
        })
      }

      throw new AppError({
        code: ERROR_CODE.INVALID_OTP,
        message: MESSAGE.INVALID_OTP,
        statusCode: HTTP_STATUS.BAD_REQUEST
      })
    }

    const isUserUpdated = await this.userRepository.markEmailVerified(user._id)

    if (!isUserUpdated) {
      throw new AppError({
        code: ERROR_CODE.INVALID_OTP,
        message: MESSAGE.INVALID_OTP,
        statusCode: HTTP_STATUS.BAD_REQUEST
      })
    }

    await this.authRepository.markOtpVerified(otpRecord._id)

    return {
      userId: user._id,
      email: user.email,
      emailVerified: true,
      message: MESSAGE.EMAIL_VERIFIED
    }


  }

  async login(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new AppError({
        code: ERROR_CODE.INVALID_CREDENTIAL,
        message: MESSAGE.INVALID_CREDENTIAL,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new AppError({
        code: ERROR_CODE.INVALID_CREDENTIAL,
        message: MESSAGE.INVALID_CREDENTIAL,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    if (!user.emailVerified) {
      throw new AppError({
        code: ERROR_CODE.EMAIL_NOT_VERIFIED,
        message: MESSAGE.EMAIL_NOT_VERIFIED,
        statusCode: HTTP_STATUS.FORBIDDEN
      })
    }

    const tokenPaylaod = {
      userId: user._id,
      email: user.email
    }

    const accessToken = generateAccessToken(tokenPaylaod)
    const refreshToken = generateRefreshToken(tokenPaylaod)

    const decodedRefreshToken = verifyRefreshToken(refreshToken)

    await this.refreshTokenRepository.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(decodedRefreshToken.exp! * 1000)
    })

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer'
      }
    }
  }

  async refreshToken(input: RefreshTokenInput) {
    let payload: ReturnType<typeof verifyRefreshToken>

    try {
      payload = verifyRefreshToken(input.refreshToken)
    } catch {
      throw new AppError({
        code: ERROR_CODE.INVALID_REFRESH_TOKEN,
        message: MESSAGE.INVALID_REFRESH_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    if (
      !payload.exp ||
      !payload.userId ||
      !payload.userId
    ) {
      throw new AppError({
        code: ERROR_CODE.INVALID_REFRESH_TOKEN,
        message: MESSAGE.INVALID_REFRESH_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    const oldToken = await this.refreshTokenRepository.findActiveByHash(hashToken(input.refreshToken))

    if (!oldToken || oldToken.userId !== payload.userId) {
      throw new AppError({
        code: ERROR_CODE.INVALID_REFRESH_TOKEN,
        message: MESSAGE.INVALID_REFRESH_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    const user = await this.userRepository.findById(payload.userId)

    if (!user || !user.emailVerified) {
      throw new AppError({
        code: ERROR_CODE.INVALID_REFRESH_TOKEN,
        message: MESSAGE.INVALID_REFRESH_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    const revoked = await this.refreshTokenRepository.revoke(oldToken._id)

    if (!revoked) {
      throw new AppError({
        code: ERROR_CODE.INVALID_REFRESH_TOKEN,
        message: MESSAGE.INVALID_REFRESH_TOKEN,
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    }

    const tokenPaylaod = {
      userId: user._id,
      email: user.email
    }

    const accessToken = generateAccessToken(tokenPaylaod)
    const refreshToken = generateRefreshToken(tokenPaylaod)
    const decoded = verifyRefreshToken(refreshToken)

    if (!decoded.exp) {
      throw new AppError({
        code: ERROR_CODE.INTERNAL_SERVER_ERROR,
        message: "Refresh token expiry is missing",
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    await this.refreshTokenRepository.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000)
    })

    return {
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer'
      }
    }
  }
}
