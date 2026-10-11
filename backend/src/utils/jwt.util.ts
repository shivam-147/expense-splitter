import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

interface TokenPayload {
  userId: string;
  email: string,
  iat?: number;
  exp?: number;
}

export function generateAccessToken(
  payload: TokenPayload
): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"],
    issuer: 'expense-splitter',
    subject: payload.userId
  })
}

export function generateRefreshToken(
  payload: TokenPayload
): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"],
    issuer: 'expense-splitter',
    subject: payload.userId,
    jwtid: randomUUID()
  })
}

export function verifyAccessToken(
  token: string
): TokenPayload {
  return jwt.verify(token, env.jwtAccessSecret, {
    issuer: 'expense-splitter'
  }) as TokenPayload
}

export function verifyRefreshToken(
  token: string
): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret, {
    issuer: 'expense-splitter'
  }) as TokenPayload
}
