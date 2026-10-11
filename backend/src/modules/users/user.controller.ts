import { Request, Response, NextFunction } from "express"
import { UserService } from "./user.service"
import { sendSuccess } from "../../utils/response.util"
import { HTTP_STATUS } from "../../constants/http-status.constants"
import { AppError } from "../../errors/app-error"
import { ERROR_CODE } from "../../constants/error-code.contants"
import { MESSAGE } from "../../constants/message.constants"

export class UserController {
  constructor(
    private readonly userService = new UserService()
  ) { }

  getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError({
          code: ERROR_CODE.INVALID_ACCESS_TOKEN,
          message: MESSAGE.INVALID_ACCESS_TOKEN,
          statusCode: HTTP_STATUS.UNAUTHORIZED
        })
      }

      const user = await this.userService.getMe(req.user.userId)
      sendSuccess(res, user, HTTP_STATUS.OK)

    } catch(error) {
      next(error)
    }
  }
}
