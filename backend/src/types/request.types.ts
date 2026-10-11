import 'express'

declare global {
  namespace Express {
    interface UserContext {
      userId: string;
      email: string;
    }

    interface Request {
      user?: UserContext
    }
  }
}

export {}
