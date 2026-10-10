
import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { ERROR_CODE } from "../constants/error-code.contants";
import { HTTP_STATUS } from "../constants/http-status.constants";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  _next
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && {
          details: error.details
        })
      },
      meta: {
        request_id: req.requestId ?? "unknown",
        timestamp: new Date().toISOString()
      }
    });

    return;
  }

  console.error("Unexpected error:", error);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred"
    },
    meta: {
      request_id: req.requestId ?? "unknown",
      timestamp: new Date().toISOString()
    }
  });
};
