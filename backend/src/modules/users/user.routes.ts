import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { UserController } from "./user.controller";

const userRouter = Router()
const userController = new UserController()

userRouter.get(
  '/me',
  authenticate,
  userController.getMe
)

export default userRouter
