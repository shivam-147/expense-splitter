import { RefreshTokenModel } from "./refresh-token.model";

interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date
}

export class RefreshTokenRepository {
  async create(input: CreateRefreshTokenInput) {
    return RefreshTokenModel.create(input)
  }

  async findActiveByHash(tokenHash: string) {
    return RefreshTokenModel.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date()}
    })
      .select('+tokenHash')
      .exec()
  }

  async revoke(tokenId: string): Promise<boolean> {
    const result = await RefreshTokenModel.updateOne({
      _id: tokenId,
      revokedAt: null,
      expiresAt: { $gt: new Date()}
    }, {
      $set: { revoked: new Date()}
    }).exec()

    return result.modifiedCount === 1
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      {
        userId,
        revokedAt: null
      },
      {
        $set: { revokedAt: new Date() }
      }
    ).exec()
  }

}
