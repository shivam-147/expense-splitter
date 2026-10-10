import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      request_id: res.req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}
