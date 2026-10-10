interface OtpEmailData {
  name: string;
  otp: string;
}

export function getOtpVerificationTemplate(data: OtpEmailData) {
  return {
    subject: 'Verify your Expense Splitter Account',
    htmt: `
      <div style="font-family:Arial, Sans-serif; max-width: 600px; margin: auto">
        <h2 Welcom to Expense Splitter, ${data.name}!</h2>
        <p> Use the OTP below to verify your email address. </p>
        <h1 style="letter-spacing: 6px;">${data.otp}</h1>
        <p> This OTP is valid for 10 minutes. </p>
        <p> If you did not request thsi verification, please ignore this email. </p>
      </div>
    `
  }
}
