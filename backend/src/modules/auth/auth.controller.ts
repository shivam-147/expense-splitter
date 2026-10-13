import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../../constants/http-status.constants";
import { AuthService } from "./auth.service";
import type { LoginInput, RefreshTokenInput, RegisterInput, ResendOtpInput, VerifyOtpInput } from "./auth.types";
import { sendSuccess } from "../../utils/response.util";
import { send } from "process";

export class AuthController {
  private readonly authService = new AuthService()

  register = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = req.body as RegisterInput
      const result = await this.authService.register(input)

      sendSuccess(res, result, HTTP_STATUS.CREATED)
    } catch (error) {
      next(error)
    }
  }

  resendOtp = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = req.body as ResendOtpInput
      const result = await this.authService.resendOtp(input)
      sendSuccess(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  verifyOtp = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = req.body as VerifyOtpInput
      const result = await this.authService.verifyEmailOtp(input)

      sendSuccess(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  login = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = req.body as LoginInput
      const result = await this.authService.login(input)
      sendSuccess(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  refrshToken = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = req.body as RefreshTokenInput
      const result = await this.authService.refreshToken(input)

      sendSuccess(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }

  logout = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = req.body as RefreshTokenInput
      const result = await this.authService.logout(input)

      sendSuccess(res, result, HTTP_STATUS.OK)
    } catch (error) {
      next(error)
    }
  }
}
