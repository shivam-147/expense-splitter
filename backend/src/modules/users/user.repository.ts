import type { HydratedDocument } from "mongoose";
import { UserModel, type User } from "./user.model.js";

export class UserRepository {
  async findByEmail(
    email: string
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findOne({
      email: email.trim().toLowerCase()
    }).exec();
  }

  async findById(
    userId: string
  ): Promise<HydratedDocument<User> | null> {
    return UserModel.findById(userId).exec();
  }

  async create(
    userData: Pick<User, "name" | "email" | "passwordHash">
  ): Promise<HydratedDocument<User>> {
    return UserModel.create(userData);
  }

  async markEmailVerified(userId: string):Promise<boolean> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { emailVerified: true } },
      { new: true }
    ).exec()

    return user !== null
  }
}
