import { model, Schema } from 'mongoose'
import { ulid } from 'ulid'

export interface RefreshToken {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revotedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshToken>({
  _id: {
    type: String,
    default: () => `rft_${ulid()}`
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    select: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  revotedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
  versionKey: false
})

refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0}
)

export const RefreshTokenModel = model<RefreshToken>('RefreshToken', refreshTokenSchema)
