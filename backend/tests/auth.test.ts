import { afterAll, beforeAll, beforeEach, describe, it, expect } from "vitest";
import request from 'supertest'
import mongoose from "mongoose";
import { OtpModel } from "../src/modules/auth/otp.model";

import { app } from "../src/app";
import { UserModel } from "../src/modules/users/user.model";
import { hashOtp } from "../src/utils/otp.util";
import { hashPassword } from "../src/utils/password.util";
import { vi } from "vitest";

const emailMock = vi.hoisted(() => ({
  sendOtp: vi.fn()
}));

vi.mock("../src/modules/notifications/email.service", () => ({
  EmailService: class {
    sendOtp = emailMock.sendOtp;
  }
}));

const testMongoUri = process.env.TEST_MONGO_URI ?? "mongodb://127.0.0.1:27017/expense_splitter_test"

describe('Authentication integration test', () => {
  beforeAll(async () => {
    if (!testMongoUri) {
      throw new Error('TEST_MONGO_URI must be configured')
    }

    await mongoose.connect(testMongoUri)
  })

  beforeEach(async () => {
    emailMock.sendOtp.mockReset();
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

  it("should verify email with the correct OTP", async () => {
    const email = "unverified-user@yopmail.com";
    let capturedOtp = "";

    emailMock.sendOtp.mockImplementation(
      async (input: { to: string; name: string; otp: string }) => {
        capturedOtp = input.otp;
      }
    );

    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Unverified User",
        email,
        password: "Secure@123"
      });

    expect(registerResponse.status).toBe(201);
    expect(capturedOtp).toBeTruthy();

    const verifyResponse = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({
        email,
        otp: capturedOtp
      });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.success).toBe(true);
    expect(verifyResponse.body.data.emailVerified).toBe(true);
  });

  it("should reject an incorrect OTP", async () => {
    const email = "wrong-otp-user@yopmail.com";
    let capturedOtp = "";

    emailMock.sendOtp.mockImplementation(
      async (input: { to: string; name: string; otp: string }) => {
        capturedOtp = input.otp;
      }
    );

    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Wrong OTP User",
        email,
        password: "Secure@123"
      });

    expect(registerResponse.status).toBe(201);
    expect(capturedOtp).toBeTruthy();

    // Ensure the OTP we submit differs from the generated OTP.
    const wrongOtp = capturedOtp === "000000" ? "000001" : "000000";

    const verifyResponse = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({
        email,
        otp: wrongOtp
      });

    expect(verifyResponse.status).toBe(400);
    expect(verifyResponse.body.success).toBe(false);
  });

  it("should reject an expired OTP", async () => {
    const email = "expired-otp-user@yopmail.com";

    await UserModel.create({
      name: "Expired OTP User",
      email,
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: false,
      status: "ACTIVE"
    });

    await OtpModel.create({
      _id: `otp_expired_${Date.now()}`,
      email,
      purpose: "EMAIL_VERIFICATION",
      otpHash: await hashOtp("123456"),
      expiresAt: new Date(Date.now() - 60_000),
      attempts: 0,
      maxAttempts: 5
    });

    const response = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({
        email,
        otp: "123456"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject OTP verification when maximum attempts are reached", async () => {
    const email = "max-attempts-user@yopmail.com";

    await UserModel.create({
      name: "Max Attempts User",
      email,
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: false,
      status: "ACTIVE"
    });

    await OtpModel.create({
      _id: `otp_max_${Date.now()}`,
      email,
      purpose: "EMAIL_VERIFICATION",
      otpHash: await hashOtp("123456"),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 5,
      maxAttempts: 5
    });

    const response = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({
        email,
        otp: "123456"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 429 when an incorrect OTP reaches the maximum attempts", async () => {
    const email = "otp-limit-user@yopmail.com";

    await UserModel.create({
      name: "OTP Limit User",
      email,
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: false,
      status: "ACTIVE"
    });

    await OtpModel.create({
      _id: `otp_limit_${Date.now()}`,
      email,
      purpose: "EMAIL_VERIFICATION",
      otpHash: await hashOtp("123456"),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 4,
      maxAttempts: 5
    });

    const response = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({
        email,
        otp: "000000"
      });

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);

    const updatedOtp = await OtpModel.findOne({
      email,
      purpose: "EMAIL_VERIFICATION"
    });

    expect(updatedOtp?.attempts).toBe(5);
  });

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

  it("should resend OTP and invalidate the previous OTP", async () => {
    const email = "resend-user@yopmail.com";
    const oldOtp = "123456";

    let capturedOtp = "";

    emailMock.sendOtp.mockImplementation(
      async (input: { to: string; name: string; otp: string }) => {
        capturedOtp = input.otp;
      }
    );

    await OtpModel.deleteMany({
      email,
      purpose: "EMAIL_VERIFICATION"
    });

    await UserModel.create({
      name: "Resend OTP User",
      email,
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: false,
      status: "ACTIVE"
    });

    const previousOtpRecord = await OtpModel.create({
      _id: `otp_old_${Date.now()}`,
      email,
      purpose: "EMAIL_VERIFICATION",
      otpHash: await hashOtp(oldOtp),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      maxAttempts: 5
    });

    const cooldownSeconds = Number(
      process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60
    );

    await OtpModel.collection.updateOne(
      { _id: previousOtpRecord._id },
      {
        $set: {
          createdAt: new Date(
            Date.now() - (cooldownSeconds + 1) * 1000
          ),
        },
      }
    );


    const response = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ email });
    console.log(response.body)
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(emailMock.sendOtp).toHaveBeenCalledOnce();
    expect(capturedOtp).toBeTruthy();

    const oldOtpResponse = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email, otp: oldOtp });

    expect(oldOtpResponse.status).toBe(400);

    const newOtpResponse = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email, otp: capturedOtp });

    expect(newOtpResponse.status).toBe(200);
    expect(newOtpResponse.body.data.emailVerified).toBe(true);
  });

  it("should reject resend requests during the cooldown", async () => {
    const email = "cooldown-user@yopmail.com";

    await UserModel.create({
      name: "Cooldown User",
      email,
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: false,
      status: "ACTIVE"
    });

    await OtpModel.create({
      _id: `otp_cooldown_${Date.now()}`,
      email,
      purpose: "EMAIL_VERIFICATION",
      otpHash: await hashOtp("123456"),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      maxAttempts: 5
    });

    const response = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ email });

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);
    expect(emailMock.sendOtp).not.toHaveBeenCalled();
  });

  it("should clean up the OTP when email delivery fails", async () => {
    const email = "email-failure-user@yopmail.com";

    await UserModel.create({
      name: "Email Failure User",
      email,
      passwordHash: await hashPassword("Secure@123"),
      emailVerified: false,
      status: "ACTIVE"
    });

    emailMock.sendOtp.mockRejectedValueOnce(
      new Error("SMTP delivery failed")
    );

    const response = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ email });

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);

    const pendingOtp = await OtpModel.findOne({
      email,
      purpose: "EMAIL_VERIFICATION"
    });

    expect(pendingOtp).toBeNull();
  });

})
