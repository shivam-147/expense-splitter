import { afterAll, beforeAll, beforeEach, describe, it, expect } from "vitest";
import request from 'supertest'
import mongoose from "mongoose";

import { app } from "../src/app";
import { UserModel } from "../src/modules/users/user.model";
import { hashPassword } from "../src/utils/password.util";
import { vi } from "vitest";
import { OtpModel } from "../src/modules/auth/otp.model";

vi.mock('../src/modules/notifications/email.service', () => {
  return {
    EmailService: class EmailServiceMock {
      async sendOtp(): Promise<void> {
        return;
      }
    }
  }
})

const testMongoUri = process.env.TEST_MONGO_URI ?? "mongodb://127.0.0.1:27017/expense_splitter_test"

describe('Authentication integration test', () => {
  beforeAll(async () => {
    if (!testMongoUri) {
      throw new Error('TEST_MONGO_URI must be configured')
    }

    await mongoose.connect(testMongoUri)
  })

  beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) {
      await collection.deleteMany()
    }

    await UserModel.create({
      name: "Test User",
      email: "test-user@yopmail.com",
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: true,
      status: 'ACTIVE'
    })
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })


  it("should reject registration with an already verified email", async () => {

    const email = 'new-test-user@yopmail.com'

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "New Test User",
        email,
        password: "Secure@123"
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.email).toBe(email)
    expect(response.body.data.userId).toBeTruthy()

    const otpRecord = await OtpModel.findOne({
      email,
      purpose: 'EMAIL_VERIFICATION'
    }).select("+otpHash")

    expect(otpRecord).not.toBeNull()
    expect(otpRecord?.otpHash).toBeTruthy()
    expect(otpRecord?.expiresAt.getTime()).toBeGreaterThan(Date.now())

  })

  it("should reject registration with invalid input", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "",
        email: "invalid-email",
        password: "123"
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('should register a new user and create an email verification OTP', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: "New Test User",
        email: "new-test-user@yopmail.com",
        password: "Secure@123"
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.email).toBe('new-test-user@yopmail.com')
    expect(response.body.data.userId).toBeTruthy()
  })

  it("should reject an incorrect password", async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: "test-user@yopmail.com",
        password: "WrongPassword123"
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it("should reject the request without an access token", async () => {
    const response = await request(app).get('/api/v1/users/me')

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it("should reject the request with invalid access token", async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })


  it('should login and access the protected the profile', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: "test-user@yopmail.com",
        password: "Secure@123"
      })

    expect(loginResponse.status).toBe(200)
    const accessToken = loginResponse.body.data.tokens.accessToken
    const refreshToken = loginResponse.body.data.tokens.refreshToken

    expect(accessToken).toBeTruthy()
    expect(refreshToken).toBeTruthy()

    const profileResponse = await request(app)
      .get("/api/v1/users/me")
      .set('Authorization', `Bearer ${accessToken}`)

    expect(profileResponse.status).toBe(200)
    expect(profileResponse.body.data.email).toBe("test-user@yopmail.com")

    expect(profileResponse.body.data.passwordHash).toBeUndefined()
  })

  it('should rotate refresh tokens and revoke them on logout', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-user@yopmail.com',
        password: 'Secure@123'
      })

    expect(loginResponse.status).toBe(200)

    const oldRefreshToken = loginResponse.body.data.tokens.refreshToken
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({refreshToken: oldRefreshToken})

    expect(refreshResponse.status).toBe(200)

    const newTokens = refreshResponse.body.data.tokens

    expect(newTokens.accessToken).toBeTruthy()
    expect(newTokens.refreshToken).toBeTruthy()
    expect(newTokens.refreshToken).not.toBe(oldRefreshToken)

    const oldTokenReuseResponse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({refreshToken: oldRefreshToken})

    expect(oldTokenReuseResponse.status).toBe(401)

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .send({refreshToken: newTokens.refreshToken})

    expect(logoutResponse.status).toBe(200)

    const revokedTokenResponse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({refreshToken: newTokens.refreshToken})

    expect(revokedTokenResponse.status).toBe(401)

  })

})
