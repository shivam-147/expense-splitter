import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { AppError } from "../errors/app-error";
import { ERROR_CODE } from "../constants/error-code.contants";
import { MESSAGE } from "../constants/message.constants";
import { HTTP_STATUS } from "../constants/http-status.constants";

export const authenticate: RequestHandler = (
  req,
  _res,
  next
) => {
  const authorization = req.headers.authorization
  const [scheme, token] = authorization?.split(" ") ?? []

  if (scheme !== 'Bearer' || !token) {

    next(
      new AppError({
        code: ERROR_CODE.INVALID_ACCESS_TOKEN,
        message: "shivam",
        statusCode: HTTP_STATUS.UNAUTHORIZED
      })
    )
    return
  }

  try {
    const payload = verifyAccessToken(token)

    if (!payload.userId || !payload.email) {
      throw new Error('Invalid token paylaod')
    }

    req.user = {
      userId: payload.userId,
      email: payload.email
    }

    next()
  } catch (error) {
    next(
    new AppError({
      code: ERROR_CODE.INVALID_ACCESS_TOKEN,
      message: MESSAGE.INVALID_ACCESS_TOKEN,
      statusCode: HTTP_STATUS.UNAUTHORIZED
    })
    )
  }
}
