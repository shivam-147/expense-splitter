# Expense Splitter — System Design Part 4

## Backend Architecture & Project Structure

Our goal is:

> **Simple enough for a fresher to understand, structured enough to resemble a real production backend.**

We are going with:

**Node.js + Express + TypeScript + MongoDB + Mongoose + Docker**

and:

**MVC + Repository + Service architecture.**

---

# 1. High-Level Architecture

The backend will look like this:

```text
                     ┌──────────────────────┐
                     │    React Native      │
                     │      Client          │
                     └──────────┬───────────┘
                                │
                              HTTPS
                                │
                                ▼
                     ┌──────────────────────┐
                     │       Express        │
                     │        Server        │
                     └──────────┬───────────┘
                                │
                         Middleware Layer
                                │
                    ┌───────────┴───────────┐
                    │                       │
              Authentication          Validation
                    │                       │
                    └───────────┬───────────┘
                                ▼
                         ┌─────────────┐
                         │ Controller  │
                         └──────┬──────┘
                                ▼
                         ┌─────────────┐
                         │  Service    │
                         └──────┬──────┘
                                │
                     ┌──────────┴──────────┐
                     │                     │
                     ▼                     ▼
               Repository             Other Service
                     │
                     ▼
                ┌─────────┐
                │ MongoDB │
                └─────────┘
```

---

# 2. Why This Architecture?

We don't want this:

```text
Controller
 ├── Validate
 ├── Calculate expense
 ├── Query MongoDB
 ├── Send email
 ├── Calculate balance
 └── Return response
```

That's how controllers become 500-line monsters. 😅

Instead:

```text
Controller
    ↓
Service
    ↓
Repository
```

Each layer has one primary responsibility.

---

# 3. Controller

Controller handles HTTP.

Example:

```ts
async createExpense(req, res) {
  const result = await expenseService.createExpense(
    req.user.id,
    req.params.groupId,
    req.body
  );

  return sendSuccess(res, result);
}
```

Controller should **not** know:

- How MongoDB works
- How equal splitting works
- How balances are calculated
- How email templates work

---

# 4. Service

Service contains business logic.

Example:

```text
ExpenseService
    │
    ├── Verify group membership
    ├── Validate participants
    ├── Calculate split
    ├── Create expense
    └── Trigger notification
```

For example:

```ts
async createExpense(...) {
  // business logic
}
```

This is where the important rules live.

---

# 5. Repository

Repository talks to MongoDB.

Example:

```ts
class ExpenseRepository {

  async create(data) {
    return ExpenseModel.create(data);
  }

  async findById(id) {
    return ExpenseModel.findById(id);
  }

}
```

The service doesn't need to know whether we're using:

```text
MongoDB
PostgreSQL
MySQL
```

It simply calls:

```text
expenseRepository.create()
```

---

# 6. Model

Models define MongoDB structure.

Example:

```text
models/
    user.model.ts
    group.model.ts
    group-member.model.ts
    expense.model.ts
    settlement.model.ts
```

Mongoose schemas live here.

---

# 7. Final Folder Structure

I'm recommending a **module-based structure** while keeping MVC + Repository + Service inside each module.

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── app.ts
│   │
│   ├── constants/
│   │   ├── error-code.constants.ts
│   │   ├── message.constants.ts
│   │   ├── http-status.constants.ts
│   │   ├── app.constants.ts
│   │   └── enum.constants.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validator.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.model.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.validator.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── groups/
│   │   │   ├── group.model.ts
│   │   │   ├── group-member.model.ts
│   │   │   ├── group-invitation.model.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── group.service.ts
│   │   │   ├── group.repository.ts
│   │   │   ├── group.routes.ts
│   │   │   ├── group.validator.ts
│   │   │   └── group.types.ts
│   │   │
│   │   ├── expenses/
│   │   │   ├── expense.model.ts
│   │   │   ├── expense.controller.ts
│   │   │   ├── expense.service.ts
│   │   │   ├── expense.repository.ts
│   │   │   ├── expense.routes.ts
│   │   │   ├── expense.validator.ts
│   │   │   ├── expense.types.ts
│   │   │   └── expense-split.service.ts
│   │   │
│   │   ├── settlements/
│   │   │   ├── settlement.model.ts
│   │   │   ├── settlement.controller.ts
│   │   │   ├── settlement.service.ts
│   │   │   ├── settlement.repository.ts
│   │   │   ├── settlement.routes.ts
│   │   │   ├── settlement.validator.ts
│   │   │   └── settlement.types.ts
│   │   │
│   │   ├── balances/
│   │   │   ├── balance.service.ts
│   │   │   ├── balance.controller.ts
│   │   │   ├── balance.routes.ts
│   │   │   └── balance.types.ts
│   │   │
│   │   └── notifications/
│   │       ├── email.service.ts
│   │       ├── email.repository.ts
│   │       ├── email-notification.model.ts
│   │       ├── notification.types.ts
│   │       └── templates/
│   │           ├── otp/
│   │           ├── group-created/
│   │           ├── member-added/
│   │           ├── expense-created/
│   │           └── settlement-created/
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── request-id.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── rate-limit.middleware.ts
│   │
│   ├── errors/
│   │   ├── app-error.ts
│   │   └── error-handler.ts
│   │
│   ├── types/
│   │   ├── request.types.ts
│   │   ├── response.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   ├── otp.util.ts
│   │   ├── response.util.ts
│   │   └── id.util.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── README.md
```

---

# 8. Why Module-Based Structure?

Compare the traditional structure:

```text
controllers/
services/
repositories/
models/
```

As the application grows:

```text
controllers/
    20 files

services/
    20 files

repositories/
    20 files

models/
    20 files
```

It becomes harder to understand which files belong together.

With modules:

```text
expenses/
    controller
    service
    repository
    model
    validator
    types
```

Everything related to expenses is together.

For our project, this is a good balance between **clean architecture and simplicity**.

---

# 9. Common vs Module Code

A useful rule:

### Module

If something is specific to one business domain:

```text
ExpenseService
GroupService
BalanceService
```

put it inside the module.

### Common

If something is used across multiple modules:

```text
AppError
JWT utility
Response helper
Request ID middleware
```

put it in common/shared folders.

---

# 10. Constants

We'll separate different types of constants.

### Error codes

```text
constants/error-code.constants.ts
```

Example:

```ts
export const ERROR_CODE = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_OTP: "INVALID_OTP",
  GROUP_NOT_FOUND: "GROUP_NOT_FOUND",
  EXPENSE_NOT_FOUND: "EXPENSE_NOT_FOUND",
  INVALID_EXPENSE_SPLIT: "INVALID_EXPENSE_SPLIT"
} as const;
```

---

# 11. Messages

Don't scatter messages everywhere.

Bad:

```ts
throw new Error("User not found");
```

Better:

```ts
throw new AppError(
  ERROR_CODE.USER_NOT_FOUND,
  MESSAGE.USER_NOT_FOUND
);
```

Centralized:

```ts
export const MESSAGE = {
  USER_NOT_FOUND: "User not found",
  GROUP_NOT_FOUND: "Group not found",
  INVALID_OTP: "Invalid OTP",
  EXPENSE_CREATED: "Expense created successfully"
} as const;
```

This also makes future localization easier.

---

# 12. HTTP Status Constants

We'll avoid:

```ts
res.status(404)
```

being scattered everywhere.

Instead:

```ts
HTTP_STATUS.NOT_FOUND
```

Example:

```ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;
```

---

# 13. Application Error

We'll create one custom error class.

Conceptually:

```text
AppError
├── code
├── message
├── statusCode
└── details
```

Example:

```ts
throw new AppError({
  code: ERROR_CODE.GROUP_NOT_FOUND,
  message: MESSAGE.GROUP_NOT_FOUND,
  statusCode: HTTP_STATUS.NOT_FOUND
});
```

The global error middleware converts that into our standard API response.

---

# 14. Error Flow

```text
Controller
    ↓
Service
    ↓
throw AppError
    ↓
Express error middleware
    ↓
Standard error response
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "GROUP_NOT_FOUND",
    "message": "Group not found"
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

---

# 15. Validation Flow

We will use Zod.

```text
Request
   ↓
Route
   ↓
Validation Middleware
   ↓
Valid? ── No ──→ 400/422
   │
  Yes
   ↓
Controller
```

Example:

```ts
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});
```

Controller receives already validated data.

---

# 16. Authentication Middleware

Protected API:

```text
GET /api/v1/groups
```

Flow:

```text
Request
   ↓
Request ID
   ↓
Authentication
   ↓
Validation
   ↓
Controller
```

The middleware extracts:

```text
Authorization: Bearer <token>
```

and creates:

```ts
req.user
```

with something like:

```ts
{
  id: "usr_123",
  email: "shivam@example.com"
}
```

---

# 17. Authorization

Authentication asks:

> Who are you?

Authorization asks:

> Are you allowed to do this?

Example:

```text
Rahul authenticated
       ↓
GET /groups/group-123
       ↓
Does Rahul belong to group-123?
       ↓
YES → continue
NO  → 403
```

This check belongs to business/service logic, not just JWT middleware.

---

# 18. Balance Module

Balance deserves its own module because it is not just CRUD.

```text
balances/
├── balance.service.ts
├── balance.controller.ts
├── balance.routes.ts
└── balance.types.ts
```

The service will contain functions such as:

```text
calculateUserBalance()
calculateGroupBalances()
calculateDebts()
simplifyDebts()
```

Later we can unit-test these functions heavily.

---

# 19. Expense Split Service

Splitting deserves separation too.

```text
expenses/
└── expense-split.service.ts
```

Responsibilities:

```text
calculateEqualSplit()
calculateCustomSplit()
calculatePercentageSplit()
validateSplit()
```

This keeps `expense.service.ts` from becoming huge.

---

# 20. Notification Architecture

Notifications should be independent from financial logic.

```text
notifications/
├── email.service.ts
├── email.repository.ts
├── email-notification.model.ts
└── templates/
```

Example:

```ts
await emailService.sendExpenseCreatedEmail(data);
```

The Expense Service doesn't need to know:

```text
SMTP
SendGrid
Resend
AWS SES
```

We can change providers later.

---

# 21. Docker Architecture

We will support both modes.

## Development Mode A

Backend local:

```text
Your Machine
│
├── Node.js backend
│
└── Docker
      └── MongoDB
```

This will be our **primary development mode initially**.

Why?

Because you get:

- Fast hot reload
- Easy debugging
- Easy breakpoints
- MongoDB environment isolation

---

# 22. Docker Mode B

Everything Dockerized:

```text
Docker Compose
│
├── backend
│
└── mongodb
```

Command:

```bash
docker compose up
```

This will prove that the backend is actually container-ready.

---

# 23. Docker Compose Concept

```yaml
services:

  mongodb:
    image: mongo
    ports:
      - "27017:27017"

  backend:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
```

But we'll write the real configuration later.

---

# 24. Important Docker Detail

When backend runs **inside Docker**, this is wrong:

```env
MONGODB_URI=mongodb://localhost:27017/expense_splitter
```

because inside the backend container:

```text
localhost
```

means:

> backend container itself.

Instead:

```env
MONGODB_URI=mongodb://mongodb:27017/expense_splitter
```

where:

```text
mongodb
```

is the Docker Compose service name.

When backend runs locally and MongoDB runs in Docker:

```env
MONGODB_URI=mongodb://localhost:27017/expense_splitter
```

This is an important Docker networking concept we'll actually learn rather than just copy.

---

# 25. Environment Configuration

We'll have:

```text
.env
.env.example
```

Example:

```env
NODE_ENV=development

PORT=8000

MONGODB_URI=mongodb://localhost:27017/expense_splitter

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

OTP_EXPIRES_IN_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60

EMAIL_PROVIDER=
EMAIL_FROM=
```

Secrets stay in `.env`.

`.env.example` contains only placeholders.

---

# 26. API Versioning

We'll start with:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
```

Why?

Suppose someday we make a breaking API change.

We can have:

```text
/api/v1
/api/v2
```

without breaking an old mobile app immediately.

This becomes especially important because mobile apps aren't updated instantly.

---

# 27. Request ID

Every incoming request gets:

```text
req_01JX8K7P2A
```

Flow:

```text
Request
   ↓
Request ID Middleware
   ↓
req.user
   ↓
Controller
   ↓
Service
   ↓
Logs
```

Response:

```json
{
  "meta": {
    "request_id": "req_01JX8K7P2A"
  }
}
```

This will be extremely useful when debugging mobile API issues.

---

# 28. Logging

We'll start simple.

Development:

```text
INFO
WARN
ERROR
```

Example:

```text
[INFO] Request started
[INFO] Expense created
[ERROR] Email delivery failed
```

We don't need Elasticsearch, Loki, Grafana etc. right now.

Again:

> Don't build infrastructure before we have a problem that requires it.

---

# 29. Testing Structure

Tests should roughly follow modules:

```text
tests/
├── auth/
│   ├── auth.service.test.ts
│   └── auth.api.test.ts
│
├── groups/
│   └── group.service.test.ts
│
├── expenses/
│   ├── expense-split.test.ts
│   └── expense.service.test.ts
│
├── balances/
│   └── balance.service.test.ts
│
└── settlements/
    └── settlement.service.test.ts
```

The most important tests will be:

```text
Expense Split
+
Balance Engine
+
Settlement
```

because those contain the most business logic.

---

# 30. Coding Rules

Let's establish some project rules now.

### Rule 1

Use TypeScript strict mode.

### Rule 2

Avoid `any`.

### Rule 3

Controllers remain thin.

### Rule 4

Business logic belongs in services.

### Rule 5

Database operations belong in repositories.

### Rule 6

Validation happens before business logic.

### Rule 7

No hardcoded error messages.

### Rule 8

No hardcoded error codes.

### Rule 9

No secrets in source code.

### Rule 10

Use meaningful names.

Prefer:

```ts
calculateGroupBalance()
```

over:

```ts
calcBal()
```

### Rule 11

Don't create abstractions without a reason.

### Rule 12

Financial amounts use integer smallest units.

---

# 31. Final Request Lifecycle

Our complete backend request will look like:

```text
                  HTTP Request
                       │
                       ▼
              Request ID Middleware
                       │
                       ▼
              Authentication
               Middleware
                       │
                       ▼
               Validation
                Middleware
                       │
                       ▼
                  Controller
                       │
                       ▼
                   Service
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Business Logic       Repository
                                 │
                                 ▼
                              MongoDB
             │
             ▼
       Notification
          Service
             │
             ▼
       Email Provider
             │
             ▼
          Response
```

That's our backend architecture.

---

# 32. Where We Are Now

We've designed:

```text
                    REQUIREMENTS
                         │
                         ▼
                 DOMAIN ENTITIES
                         │
                         ▼
                  DATABASE MODEL
                         │
                         ▼
                    API CONTRACT
                         │
                         ▼
                 BUSINESS RULES
                         │
                         ▼
                BALANCE ENGINE
                         │
                         ▼
              BACKEND ARCHITECTURE
                         │
                         ▼
                    NEXT STEP
```

## Next: Backend Foundation 🚀

Now we're finally at the point where coding makes sense.

We'll create the backend from **zero**, including:

```text
1. Initialize Node + TypeScript
2. Install dependencies
3. Configure tsconfig
4. Configure ESLint/Prettier
5. Create folder structure
6. Create Express app
7. Create MongoDB connection
8. Create environment configuration
9. Create standard response helper
10. Create AppError
11. Create global error middleware
12. Create request-ID middleware
13. Create Dockerfile
14. Create docker-compose.yml
15. Verify MongoDB-only Docker mode
16. Verify backend + MongoDB Docker mode
17. Create /health endpoint
```

**Only after that will we start Authentication.**

That gives us a clean, working foundation instead of immediately dumping 50 files into the project.
