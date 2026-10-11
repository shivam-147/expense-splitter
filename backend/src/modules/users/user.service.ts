import { UserRepository } from "./user.repository";
import { AppError } from "../../errors/app-error";
import { ERROR_CODE } from "../../constants/error-code.contants";
import { HTTP_STATUS } from "../../constants/http-status.constants";
import { MESSAGE } from "../../constants/message.constants";

export class UserService {
  constructor(
    private readonly userRepository = new UserRepository()
  ) { }

  async getMe(userId: string) {
    const user =  await this.userRepository.findById(userId)

    if (!user) {
      throw new AppError({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: MESSAGE.USER_NOT_FOUND,
        statusCode: HTTP_STATUS.NOT_FOUND
      })
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError({
        code: ERROR_CODE.ACCOUNT_NOT_ACTIVE,
        message: MESSAGE.ACCOUNT_NOT_ACTIVE,
        statusCode: HTTP_STATUS.FORBIDDEN
      })
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      status: user.status,
      createdAt: user.createAt
    }
  }
}
