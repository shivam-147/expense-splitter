export const MESSAGE = {
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  EMAIL_VERIFICATION_OTP_SEND_FAILED: 'Unable to send verification email, Please try again',
  EMAIL_VERIFICATION_OTP_SEND_SUCCESS: 'Verification OTP sent to your email',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  EMAIL_VERIFIED: 'Email verified successfully',

  VALIDATION_FAILED: 'Request validation failed',
  INTERNAL_SERVER_ERROR: 'An unexpecte error occured',
  INVALID_CREDENTIAL: "Invalid email or password",
  EMAIL_NOT_VERIFIED: "Please verify your email before loggin in",
  INVALID_REFRESH_TOKEN: "Refrsh token is invalid, expired or revoked",
  INVALID_ACCESS_TOKEN: "Access token is invalid or expired",


  USER_NOT_FOUND: "User does not exists",
  ACCOUNT_NOT_ACTIVE: "Your account is not active",

  LOGOUT: "Logged out successfully",

  INVALID_OTP: "Invalid or available OTP",
  OTP_EXPIRED: "OTP has expired",
  OTP_MAX_ATTEMPTS: "Maximum OTP attempts exceeded"
  } as const
