
import type { Request, Response, NextFunction } from "express";
import { ulid } from "ulid";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = `req_${ulid()}`;

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}
