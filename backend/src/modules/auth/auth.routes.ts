import { Router } from "express";
import { AuthController } from "./auth.controller";
import { loginSchema, refreshTokenSchema, registerSchema, verifyOtpSchema } from "./auth.validator";
import { validate } from "../../middlewares/validation.middleware";

const authRouter = Router()
const authController = new AuthController()

authRouter.post(
  '/register',
  validate(registerSchema),
  authController.register
)

authRouter.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  authController.verifyOtp
)

authRouter.post(
  '/login',
  validate(loginSchema),
  authController.login
)

authRouter.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refrshToken
)

export default authRouter
