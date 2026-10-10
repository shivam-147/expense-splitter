import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error";
import { ERROR_CODE } from "../constants/error-code.contants";
import { HTTP_STATUS } from "../constants/http-status.constants";
import { MESSAGE } from "../constants/message.constants";

export function validate(schema: ZodType): RequestHandler{
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      next(
        new AppError({
          code: ERROR_CODE.VALIDATION_ERROR,
          message: MESSAGE.VALIDATION_FAILED,
          statusCode: HTTP_STATUS.BAD_REQUEST,
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            code: issue.code,
            message: issue.message
          }))
        })
      )

      return
    }

    req.body = result.data
    next()
  }
}
