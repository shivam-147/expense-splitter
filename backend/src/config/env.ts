import dotenv from 'dotenv'

dotenv.config()

const REQUIRED_VAR = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'OTP_EXPIRES_IN_MINUTES',
  'OTP_MAX_ATTEMPTS',
  'OTP_RESEND_COOLDOWN_SECONDS',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM'
]
const MISSING_VAR = []
const ENV_VAR = process.env

for (const variable of REQUIRED_VAR) {
  if (!ENV_VAR[variable] || ENV_VAR[variable] == '')
    MISSING_VAR.push(variable)
}

if (MISSING_VAR.length != 0) {
  console.log('Missing Environment Variables')
  console.log(MISSING_VAR)
  process.exit(1)
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8000),
  mongodbUri: process.env.MONGODB_URI ?? '',

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',

  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  otpExpiresInMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES ?? 10),
  otpMaxAttemps: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
  otpResentCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60),

  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",

}
