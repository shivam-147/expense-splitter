Cammand to run test with custom database
```bash
TEST_MONGODB_URI="mongodb://127.0.0.1:27017/expense_splitter_test" npm test
```
Command to run single test

```bash
npm test -- tests/auth.test.ts -t "should resend OTP and invalidate the previous OTP"
```
