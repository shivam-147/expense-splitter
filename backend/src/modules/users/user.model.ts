import { model, Schema } from 'mongoose'
import { ulid } from 'ulid'
import {  } from 'bcryptjs';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  status: UserStatus;
  createAt: Date;
  updateAt: Date;
}

const userSchema = new Schema < User > ({
  _id: {
    type: String,
    default: () => `usr_${ulid()}`
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true,
  versionKey: false
})

export const UserModel = model<User>('User', userSchema)
