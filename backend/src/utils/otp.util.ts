import { randomInt } from 'node:crypto'
import { compare, hash } from 'bcryptjs'

export function generateOtp(): string{
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export async function hashOtp(otp: string): Promise<string>{
  return hash(otp, 10)
}

export async function verifyOtp(
  otp: string,
  otpHash: string
): Promise<boolean>{
  return compare(otp, otpHash)
}
