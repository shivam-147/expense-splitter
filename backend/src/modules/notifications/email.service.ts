import nodemailer from "nodemailer";
import { env } from '../../config/env'
import { getOtpVerificationTemplate } from "./templates/otp/otp-verification.template";

interface SendOtpEmailInput {
  to: string;
  name: string;
  otp: string;
}

export class EmailService {
  async sendOtp(input: SendOtpEmailInput) {
    if (
      !env.smtpHost ||
      !env.smtpUser ||
      !env.smtpPassword ||
      !env.emailFrom ||
      !env.smtpPort
    ) {
      throw new Error('SMTP configuration is incomplete')
    }

    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword
      }
    })

    const template = getOtpVerificationTemplate({
      name: input.name,
      otp: input.otp
    })

    await transporter.sendMail({
      from: env.emailFrom,
      to: input.to,
      subject: template.subject,
      html: template.htmt
    })
  }
}
