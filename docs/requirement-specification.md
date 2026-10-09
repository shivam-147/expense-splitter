# Expense Splitter

## 1. Project Overview

Expense Splitter is a collaborative expense management application for people who live together or travel together and regularly share expenses.

Typical users include:

- Students sharing a room/flat
- Employees sharing accommodation
- Friends travelling together
- Families sharing common expenses
- Small groups managing recurring household expenses

The application allows group members to:

- Create groups
- Add members
- Record expenses
- Specify who paid
- Specify who participated in an expense
- Split expenses
- See who owes whom
- Record settlements
- View expense and settlement history
- Maintain an accurate current balance

The primary goal of this project is twofold:

1. Solve a real-world problem.
2. Use the project to learn and practice real system design and software engineering concepts.

---

# 2. Project Goals

## 2.1 Primary Goals

The system should provide a simple way to answer:

> "How much do I owe?"

> "Who owes me?"

> "Why do I owe this amount?"

> "How much have I already paid?"

> "What expenses created my current balance?"

The system should calculate balances automatically rather than requiring users to manually maintain debt records.

---

## 2.2 Learning Goals

This project will also be used to understand:

- System design
- REST API design
- MVC architecture
- Repository pattern
- Service layer
- Controller layer
- Database design
- MongoDB
- TypeScript
- API validation
- Authentication
- Authorization
- Error handling
- Docker
- Docker Compose
- Automated testing
- API documentation
- Logging
- Request tracing
- Database transactions/consistency
- Expense and balance calculation
- Mobile application architecture
- Real-world deployment concepts

The implementation should remain simple enough to understand while still following good engineering practices.

---

# 3. Technology Stack

## Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Zod for request validation
- JWT for authentication
- Docker
- Docker Compose

## Mobile Application

- React Native
- TypeScript

## Web Application

React may be introduced later if a web client is required.

## Development Tools

- Git
- GitHub
- Postman/Bruno
- ESLint
- Prettier
- Jest/Vitest for testing

---

# 4. Architecture

The backend will follow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Model
  ↓
MongoDB
```

Supporting layers:

```text
Middleware
Validation
Error Handling
Authentication
Authorization
Utilities
Constants
Types
Configuration
```

## Responsibility of Each Layer

### Route

Responsible for:

- Defining HTTP endpoints
- Connecting middleware
- Connecting controllers

Routes should not contain business logic.

---

### Controller

Responsible for:

- Receiving HTTP requests
- Reading validated request data
- Calling the service
- Returning the HTTP response

Controllers should remain thin.

---

### Service

Responsible for:

- Business logic
- Expense calculations
- Balance calculations
- Group rules
- Settlement rules
- Calling repositories

The service layer is the main business layer.

---

### Repository

Responsible for:

- Database operations
- Finding documents
- Creating documents
- Updating documents
- Deleting documents

The repository should hide database-specific implementation from the service.

This makes future database changes easier.

---

### Model

Responsible for:

- MongoDB schema
- Database-level model definition
- Mongoose configuration

---

# 5. API Response Standard

Every API response must follow a consistent structure.

## Successful Response

```json
{
  "success": true,
  "data": {
    "id": "usr_8f3a21",
    "name": "Shivam",
    "email": "shivam@example.com"
  },
  "meta": {
    "request_id": "req_01JX8K7P2A",
    "timestamp": "2026-10-08T09:30:15.123Z"
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_EMAIL",
        "message": "Enter a valid email address"
      },
      {
        "field": "password",
        "code": "REQUIRED",
        "message": "Password is required"
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX8K7P2A"
  }
}
```

## API Rules

Every response should have:

### Success

```text
success
data
meta
```

### Error

```text
success
error
meta
```

No endpoint should invent its own response format.

---

# 6. Constants and Types

Application-wide constants must not be scattered throughout the codebase.

Examples:

```text
constants/
├── error-code.constants.ts
├── message.constants.ts
├── http-status.constants.ts
└── app.constants.ts
```

Types should be maintained separately.

```text
types/
├── request.types.ts
├── response.types.ts
├── auth.types.ts
├── user.types.ts
├── group.types.ts
└── expense.types.ts
```

The exact structure may evolve as the application grows, but the principle remains:

> Don't repeat strings, error codes, messages, or shared types throughout the application.

---

# 7. Functional Requirements

## FR-01 — User Registration

The system shall allow a user to create an account.

Required information:

- Name
- Email
- Password

The system shall validate:

- Required fields
- Email format
- Password requirements
- Duplicate email

---

# FR-02 — User Login

A registered user shall be able to log in using:

- Email
- Password

The system shall authenticate the user and provide an authentication token.

---

# FR-03 — User Profile

An authenticated user shall be able to:

- View profile
- Update name
- Update profile information
- Change password

---

# FR-04 — Create Group

An authenticated user shall be able to create a group.

Example:

```text
Flatmates
```

The creator becomes the group owner/member.

---

# FR-05 — Group Members

Group members shall be able to see the members of their group.

The group owner shall be able to:

- Add members
- Remove members
- View members

A user must not be able to access a group they do not belong to.

---

# FR-06 — Add Expense

A group member shall be able to create an expense.

Example:

```text
Title: Groceries
Amount: ₹900
Paid By: Rahul
Participants:
    Rahul
    Shivam
    Amit
```

The system calculates each participant's share.

---

# FR-07 — Expense Split

The initial system shall support:

### Equal Split

Example:

```text
₹900 / 3

Rahul    ₹300
Shivam   ₹300
Amit     ₹300
```

### Custom Amount Split

Example:

```text
Rahul    ₹500
Shivam   ₹250
Amit     ₹150
```

### Percentage Split

Example:

```text
Rahul    50%
Shivam   30%
Amit     20%
```

The system shall convert percentage/equal/custom splits into actual monetary amounts.

The final stored expense participation should contain actual amounts.

---

# FR-08 — Expense Validation

The system must ensure:

```text
sum(participant shares) = expense amount
```

For example:

```text
Expense = ₹900

Valid:
300 + 300 + 300 = 900

Invalid:
300 + 300 + 200 = 800
```

An invalid expense must not be created.

---

# FR-09 — View Expenses

Group members shall be able to view group expenses.

Expenses should contain information such as:

- Expense title
- Amount
- Paid by
- Participants
- Individual shares
- Created date
- Created by

---

# FR-10 — Expense Details

A user shall be able to open an expense and understand:

```text
Who paid?
How much?
Who participated?
How much was each person's share?
```

---

# FR-11 — Balance Calculation

The system shall calculate the current balance of every group member.

Example:

```text
Rahul paid ₹900.

Rahul's share = ₹300
Shivam's share = ₹300
Amit's share = ₹300
```

Therefore:

```text
Shivam owes Rahul ₹300
Amit owes Rahul ₹300
```

The balance must be calculated from expense and settlement data.

The system should not depend on manually maintained debt values as the primary source of truth.

---

# FR-12 — Personal Balance

The user shall be able to see:

```text
You owe
---------
Rahul       ₹300
Amit        ₹150


You are owed
------------
Vikas       ₹500
```

The system should clearly distinguish:

- Money the user owes
- Money owed to the user

---

# FR-13 — Settlement

A user shall be able to record that money was paid between two members.

Example:

```text
Shivam paid Rahul ₹300
```

A settlement shall reduce the outstanding balance.

The original expense should remain unchanged.

---

# FR-14 — Settlement History

Users shall be able to see settlement history.

Example:

```text
03 Oct
Shivam paid Rahul ₹300

05 Oct
Amit paid Rahul ₹300
```

---

# FR-15 — Expense History

Users shall be able to view historical expenses for a group.

---

# FR-16 — Group Balance

The application shall provide an overall group balance.

Example:

```text
Flatmates

Rahul is owed ₹600
Shivam owes ₹300
Amit owes ₹300
```

---

# FR-17 — Debt Explanation

The system should allow a user to understand why their current balance exists.

Example:

```text
You owe Rahul ₹450

Because:

Groceries       ₹300
Electricity     ₹100
Internet        ₹50
---------------------
Total           ₹450
```

This is important because the application should not behave like a black box.

---

# FR-18 — Expense Editing

An expense creator/group-authorized user may be allowed to edit an expense.

When an expense is edited, the system must recalculate the affected balances.

---

# FR-19 — Expense Deletion

An expense may be deleted according to defined group permissions.

Deletion must consider whether settlements or other dependent records exist.

The exact deletion/guardrail rules will be finalized during database and business-rule design.

---

# FR-20 — Group Activity

The system should eventually provide a chronological activity history.

Example:

```text
Rahul added Groceries ₹900

Shivam added Electricity ₹1,200

Amit settled ₹300 with Rahul
```

---

# 8. Non-Functional Requirements

## NFR-01 — Simplicity

The code must be easy for a beginner/fresher to understand.

Avoid:

- Clever abstractions
- Unnecessary design patterns
- Excessive layers
- Premature optimization
- Complex generic utilities

Every abstraction should have a reason.

---

## NFR-02 — Type Safety

The backend shall use TypeScript with strict type checking.

The project should avoid `any`.

Request bodies, service inputs, database entities and API responses should have proper types.

---

## NFR-03 — Validation

Incoming API requests must be validated before reaching business logic.

Zod will be used for request validation.

---

## NFR-04 — Error Handling

The application shall have centralized error handling.

Expected categories include:

```text
Validation errors
Authentication errors
Authorization errors
Not found errors
Conflict errors
Business rule errors
Database errors
Unexpected errors
```

---

## NFR-05 — Consistent Error Codes

Error codes must be centralized.

Examples:

```text
VALIDATION_ERROR
INVALID_EMAIL
REQUIRED
INVALID_PASSWORD
USER_NOT_FOUND
GROUP_NOT_FOUND
NOT_GROUP_MEMBER
EXPENSE_NOT_FOUND
INVALID_EXPENSE_SPLIT
INSUFFICIENT_PERMISSION
```

The list will grow as features are implemented.

---

# 9. Security Requirements

The system shall:

- Hash passwords
- Never store plain-text passwords
- Authenticate protected APIs
- Authorize access to groups
- Validate incoming data
- Prevent users from accessing another user's private data
- Avoid exposing sensitive information in API responses
- Use environment variables for secrets

Authentication and authorization will be implemented before exposing protected group/expense functionality.

---

# 10. Docker Requirements

The backend must be Docker-ready.

The project shall support two development modes.

## Mode 1 — Everything Dockerized

```text
Docker Compose
     │
     ├── Backend
     │
     └── MongoDB
```

Command:

```bash
docker compose up
```

---

## Mode 2 — Database Dockerized, Backend Local

```text
Local Machine

Node.js + TypeScript
       │
       │
       ▼
Docker
 └── MongoDB
```

This mode is important for development because it allows us to:

- Debug backend code easily
- Use local hot reload
- Keep database environment consistent
- Avoid rebuilding the backend container after every code change

---

# 11. Environment Configuration

Configuration must come from environment variables.

Example:

```env
NODE_ENV=development
PORT=8000

MONGODB_URI=mongodb://localhost:27017/expense_splitter

JWT_SECRET=development_secret
JWT_EXPIRES_IN=1d
```

Secrets must not be committed to Git.

A `.env.example` file will document required variables.

---

# 12. Logging and Request Tracking

Each API request should have a request ID.

Example:

```text
req_01JX8K7P2A
```

The request ID should be returned in:

```json
{
  "meta": {
    "request_id": "req_01JX8K7P2A"
  }
}
```

This allows us to trace a request through logs.

Example:

```text
Request received
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
MongoDB
```

The same request ID should help identify the complete operation.

---

# 13. API Design Principles

The backend will expose REST APIs.

Example:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/users/me
PATCH  /api/v1/users/me

POST   /api/v1/groups
GET    /api/v1/groups
GET    /api/v1/groups/:groupId
PATCH  /api/v1/groups/:groupId
DELETE /api/v1/groups/:groupId

POST   /api/v1/groups/:groupId/members
GET    /api/v1/groups/:groupId/members

POST   /api/v1/groups/:groupId/expenses
GET    /api/v1/groups/:groupId/expenses
GET    /api/v1/groups/:groupId/expenses/:expenseId
PATCH  /api/v1/groups/:groupId/expenses/:expenseId
DELETE /api/v1/groups/:groupId/expenses/:expenseId

GET    /api/v1/groups/:groupId/balances

POST   /api/v1/groups/:groupId/settlements
GET    /api/v1/groups/:groupId/settlements
```

The exact API contract will be documented separately before implementation.

---

# 14. What Is NOT in V1

To keep the project manageable, the following will not be part of the initial version.

## Not Included Initially

### Payment Gateway

The app will record settlements.

It will NOT actually transfer money.

For example:

```text
Shivam paid Rahul ₹300
```

means the transaction was recorded manually.

No:

- Razorpay
- Stripe
- UPI integration
- Bank integration

in V1.

---

### Automatic Bank Transactions

The application will not read bank accounts or automatically detect payments.

---

### AI Expense Processing

No AI-based receipt scanning or expense categorization initially.

---

### OCR

Users will manually enter expenses.

Receipt scanning can be considered later.

---

### Complex Notifications

Push notifications will not be part of the first backend milestone.

The notification architecture can be added later.

---

### Real-Time Updates

WebSocket/socket.io is not required for the first version.

The application will initially use normal REST APIs.

Real-time synchronization can be introduced later as a system-design exercise.

---

### Advanced Debt Optimization

The basic balance engine comes first.

Advanced debt simplification such as:

```text
A → B ₹500
B → C ₹500
C → A ₹500
```

will be implemented as a separate phase.

---

### Multi-Currency

V1 will initially use a single currency per group.

Currency support can be considered later.

---

### Recurring Expenses

Recurring expenses such as:

```text
Rent
Electricity
Internet
Netflix
```

will not be automatically generated initially.

---

### Offline-First Synchronization

The initial React Native application will require network connectivity.

Offline synchronization can be a later advanced feature.

---

# 15. Important Business Rules

These rules will become the foundation of the balance engine.

## Rule 1

An expense must belong to exactly one group.

## Rule 2

The person who paid must belong to the group.

## Rule 3

Every participant must belong to the group.

## Rule 4

Expense amount must be greater than zero.

## Rule 5

Participant shares must equal the total expense amount.

```text
sum(shares) === expense.amount
```

## Rule 6

The original expense should not be modified when a settlement occurs.

A settlement is a separate financial event.

## Rule 7

A settlement must involve two members of the same group.

## Rule 8

A user can only access groups they belong to.

## Rule 9

Balances are derived from expenses and settlements.

## Rule 10

Financial amounts should not be represented using floating-point arithmetic where precision problems can occur.

For the initial implementation, monetary values should be represented using the smallest supported currency unit, for example:

```text
₹100.50 → 10050 paise
```

This will prevent floating-point calculation problems.

---

# 16. SDLC Model

## Selected Model

### Agile — Iterative and Incremental Development

We will not build the entire application in one large development cycle.

Instead, the project will be divided into small increments.

Each increment should produce something working.

---

# 17. Development Iterations

## Iteration 0 — Requirements & System Design

Deliverables:

- Requirements document
- Functional requirements
- Non-functional requirements
- Architecture
- API conventions
- Business rules
- Database design
- Docker strategy

This is the current phase.

---

## Iteration 1 — Backend Foundation

Build:

- Node.js
- Express
- TypeScript
- Project structure
- Environment configuration
- MongoDB connection
- Docker configuration
- Global error handling
- Request ID
- API response helpers
- Logging

---

## Iteration 2 — Authentication

Build:

- Registration
- Login
- Password hashing
- JWT authentication
- Authentication middleware
- Current user API

---

## Iteration 3 — Groups

Build:

- Create group
- List groups
- Group details
- Add members
- Remove members
- Group authorization

---

## Iteration 4 — Expenses

Build:

- Add expense
- Equal split
- Custom split
- Percentage split
- Expense validation
- Expense listing
- Expense details

---

## Iteration 5 — Balance Engine

Build:

- Individual balances
- Group balances
- "You owe" calculation
- "You are owed" calculation
- Expense-based balance explanation

This is one of the most important parts of the project.

---

## Iteration 6 — Settlements

Build:

- Create settlement
- Settlement history
- Balance adjustment
- Settlement validation

---

## Iteration 7 — React Native Application

Build:

- Authentication screens
- Group list
- Group details
- Add expense
- Expense history
- Balance screen
- Settlement screen
- Profile

---

## Iteration 8 — Testing

Add:

- Unit tests
- Service tests
- Repository tests where useful
- API/integration tests
- Authentication tests
- Expense calculation tests
- Balance calculation tests

The balance engine should have especially strong test coverage.

---

## Iteration 9 — Advanced System Design

After the basic product works:

- Debt simplification
- Real-time updates
- Notifications
- Offline support
- Caching
- Rate limiting
- Performance improvements
- Monitoring
- CI/CD
- Production deployment

These are deliberately postponed until the basic system is correct.

---

# 18. Definition of Done

A feature is not considered complete simply because the API works.

A feature is complete when:

```text
Requirement defined
       ↓
API designed
       ↓
Validation implemented
       ↓
Business logic implemented
       ↓
Repository implemented
       ↓
Error handling implemented
       ↓
Tests written
       ↓
Docker environment verified
       ↓
Documentation updated
```

---

# 19. Backend Project Structure

The initial structure should remain simple.

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
│   │   └── http-status.constants.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── group.controller.ts
│   │   ├── expense.controller.ts
│   │   └── settlement.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── group.service.ts
│   │   ├── expense.service.ts
│   │   └── settlement.service.ts
│   │
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── group.repository.ts
│   │   ├── expense.repository.ts
│   │   └── settlement.repository.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── group.model.ts
│   │   ├── expense.model.ts
│   │   └── settlement.model.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── group.routes.ts
│   │   ├── expense.routes.ts
│   │   └── settlement.routes.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── request-id.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── group.validator.ts
│   │   ├── expense.validator.ts
│   │   └── settlement.validator.ts
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── group.types.ts
│   │   ├── expense.types.ts
│   │   ├── settlement.types.ts
│   │   └── response.types.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── response.ts
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
├── package.json
├── tsconfig.json
└── README.md
```

This is intentionally **not over-engineered**. We can introduce feature/module folders later if the project becomes large enough to justify them.

---

# 20. Development Philosophy

The project follows these principles:

### Simple before clever

Readable code is more valuable than complicated code.

### Business logic before UI

The balance calculation is the heart of the application.

### Database is not business logic

MongoDB operations belong in repositories.

### Services contain business rules

Controllers should not calculate balances.

### Consistent APIs

Every endpoint follows the same response contract.

### Validate at the boundary

Invalid data should be rejected before entering business logic.

### Design for change, not imaginary scale

We will create abstractions where they solve a real problem.

We will not add Redis, Kafka, microservices, Kubernetes, event sourcing, or other infrastructure merely because they sound impressive.

### Learn from real problems

When a new technical challenge appears, we will solve it rather than hiding it behind an abstraction.

---

# 21. Initial System Boundary

The first version of the system is:

```text
                 ┌─────────────────────┐
                 │   React Native App  │
                 │     TypeScript      │
                 └──────────┬──────────┘
                            │
                          REST
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Express Backend   │
                 │     TypeScript      │
                 └──────────┬──────────┘
                            │
                     Repository
                            │
                            ▼
                 ┌─────────────────────┐
                 │      MongoDB        │
                 └─────────────────────┘
```

Development can run as:

```text
┌────────────────────── Local Machine ──────────────────────┐
│                                                           │
│  React Native          Backend                            │
│  TypeScript            Node + Express + TypeScript        │
│       │                         │                          │
│       │                         │                          │
│       └──────────── REST ───────┤                          │
│                                 │                          │
│                                 ▼                          │
│                         Docker Container                   │
│                         ┌──────────────┐                   │
│                         │   MongoDB    │                   │
│                         └──────────────┘                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

This is the baseline architecture.

---

# 22. Current Phase

We are currently at:

```text
                 PROJECT
                    │
                    ▼
          ┌─────────────────┐
          │ Requirements    │  ← CURRENT
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ System Design   │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ Database Design │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ Backend Setup   │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ Feature Build   │
          └─────────────────┘
```

The next design document should define the **database entities and relationships**, followed by the **complete balance calculation algorithm**.

Those two things are the heart of this application. Once they're solid, we'll start writing the backend.
