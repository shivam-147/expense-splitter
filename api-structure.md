# Expense Splitter — System Design Part 2

## REST API Contract

---

# 1. API Standards

Base URL:

```text
/api/v1
```

Every API will use JSON.

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_01JX8K7P2A",
    "timestamp": "2026-10-08T09:30:15.123Z"
  }
}
```

### Error

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
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX8K7P2A",
    "timestamp": "2026-10-08T09:30:15.123Z"
  }
}
```

We'll keep `meta.timestamp` on errors too. Your original example omitted it, but having a consistent metadata contract is useful for debugging.

---

# 2. HTTP Status Code Convention

We'll use normal HTTP semantics.

| Status | Meaning | Example |
| --- | --- | --- |
| `200` | Successful operation | Get/update data |
| `201` | Resource created | Create group |
| `202` | Accepted for async processing | Future notification jobs |
| `204` | Successful, no response body | Some delete operations |
| `400` | Bad request | Invalid business request |
| `401` | Not authenticated | Missing/invalid token |
| `403` | Not authorized | User isn't group member |
| `404` | Resource doesn't exist | Group not found |
| `409` | Conflict | Email already exists |
| `422` | Semantically invalid data | Invalid expense split |
| `429` | Too many requests | Too many OTP attempts |
| `500` | Unexpected server error | Unknown failure |
| `503` | Service unavailable | Temporary dependency failure |

We won't randomly use status codes. Each category gets a clear meaning.

---

# 3. Authentication APIs

## 3.1 Register

```http
POST /api/v1/auth/register
```

### Request

```json
{
  "name": "Shivam",
  "email": "shivam@example.com",
  "password": "Password@123"
}
```

### Flow

```text
Request
  ↓
Validate
  ↓
Check email exists
  ↓
Create user
  ↓
Generate OTP
  ↓
Store hashed OTP
  ↓
Send verification email
  ↓
Response
```

### Response

```json
{
  "success": true,
  "data": {
    "message": "Verification OTP sent to your email",
    "email": "shivam@example.com"
  },
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-10-08T10:00:00.000Z"
  }
}
```

We **don't log the user in immediately**.

They must verify the email first.

---

# 4. Verify OTP

```http
POST /api/v1/auth/verify-otp
```

### Request

```json
{
  "email": "shivam@example.com",
  "otp": "482913"
}
```

### Success

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  },
  "meta": {
    "request_id": "req_124",
    "timestamp": "2026-10-08T10:05:00.000Z"
  }
}
```

### Possible errors

```text
OTP_INVALID
OTP_EXPIRED
OTP_MAX_ATTEMPTS
EMAIL_ALREADY_VERIFIED
USER_NOT_FOUND
```

---

# 5. Resend OTP

```http
POST /api/v1/auth/resend-otp
```

### Request

```json
{
  "email": "shivam@example.com"
}
```

We'll enforce a cooldown.

For example:

```text
Resend allowed every 60 seconds
```

This protects the email service from abuse.

Possible errors:

```text
OTP_RESEND_TOO_SOON
OTP_RESEND_LIMIT_EXCEEDED
USER_NOT_FOUND
```

---

# 6. Login

```http
POST /api/v1/auth/login
```

### Request

```json
{
  "email": "shivam@example.com",
  "password": "Password@123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_8f3a21",
      "name": "Shivam",
      "email": "shivam@example.com"
    },
    "access_token": "eyJ...",
    "refresh_token": "..."
  },
  "meta": {
    "request_id": "req_125",
    "timestamp": "2026-10-08T10:10:00.000Z"
  }
}
```

We'll eventually decide whether the React Native app stores the refresh token in secure device storage.

---

# 7. Refresh Token

```http
POST /api/v1/auth/refresh
```

### Request

```json
{
  "refresh_token": "..."
}
```

### Response

```json
{
  "success": true,
  "data": {
    "access_token": "..."
  },
  "meta": {
    "request_id": "req_126",
    "timestamp": "2026-10-08T10:20:00.000Z"
  }
}
```

---

# 8. Logout

```http
POST /api/v1/auth/logout
```

Authentication required.

The refresh token will be revoked.

---

# 9. Current User

```http
GET /api/v1/users/me
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "usr_8f3a21",
    "name": "Shivam",
    "email": "shivam@example.com",
    "email_verified": true
  },
  "meta": {
    "request_id": "req_127",
    "timestamp": "2026-10-08T10:25:00.000Z"
  }
}
```

---

# 10. Update Profile

```http
PATCH /api/v1/users/me
```

### Request

```json
{
  "name": "Shivam Bathre"
}
```

---

# 11. Change Password

```http
PATCH /api/v1/users/me/password
```

### Request

```json
{
  "current_password": "OldPassword@123",
  "new_password": "NewPassword@123"
}
```

---

# 12. Groups

## Create Group

```http
POST /api/v1/groups
```

### Request

```json
{
  "name": "Flatmates",
  "currency": "INR"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "grp_123",
    "name": "Flatmates",
    "currency": "INR",
    "role": "OWNER"
  },
  "meta": {
    "request_id": "req_200",
    "timestamp": "2026-10-08T10:30:00.000Z"
  }
}
```

---

# 13. List My Groups

```http
GET /api/v1/groups
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "grp_123",
      "name": "Flatmates",
      "currency": "INR",
      "role": "OWNER"
    },
    {
      "id": "grp_456",
      "name": "Goa Trip",
      "currency": "INR",
      "role": "MEMBER"
    }
  ],
  "meta": {
    "request_id": "req_201",
    "timestamp": "2026-10-08T10:31:00.000Z"
  }
}
```

---

# 14. Get Group

```http
GET /api/v1/groups/:groupId
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "grp_123",
    "name": "Flatmates",
    "currency": "INR",
    "role": "OWNER",
    "member_count": 3
  },
  "meta": {
    "request_id": "req_202",
    "timestamp": "2026-10-08T10:32:00.000Z"
  }
}
```

---

# 15. Add Group Member

Here's an important real-world decision.

We shouldn't require a person to already have an account before adding them.

The owner can enter:

```text
rahul@example.com
```

and the system can invite them.

So:

```http
POST /api/v1/groups/:groupId/members
```

### Request

```json
{
  "email": "rahul@example.com"
}
```

### Flow

```text
Owner
  ↓
Enter email
  ↓
Check existing user
  ↓
Create membership/invitation
  ↓
Send email
```

If Rahul already has an account:

```text
Rahul added to group
```

If Rahul doesn't have an account:

```text
Invitation sent
```

This gives us a much better real-world experience.

---

# 16. Group Invitations

This reveals something important in our database design.

We need a concept of **invitation**.

So I would add:

```text
group_invitations
```

### Document

```js
{
  _id: ObjectId,

  groupId: ObjectId,

  email: "rahul@example.com",

  invitedBy: ObjectId,

  status: "PENDING",

  expiresAt: Date,

  createdAt: Date
}
```

Statuses:

```text
PENDING
ACCEPTED
DECLINED
EXPIRED
CANCELLED
```

This is better than creating a fake `User` before registration.

---

# 17. Accept Invitation

If Rahul doesn't have an account:

```text
Email
  ↓
Invitation link
  ↓
Register
  ↓
Verify email
  ↓
Accept invitation
  ↓
Become group member
```

If Rahul already has an account:

```text
Email
  ↓
Open invitation
  ↓
Login
  ↓
Accept
```

We'll design this properly when we define invitation APIs.

---

# 18. List Members

```http
GET /api/v1/groups/:groupId/members
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "user_id": "usr_1",
      "name": "Shivam",
      "email": "shivam@example.com",
      "role": "OWNER"
    },
    {
      "user_id": "usr_2",
      "name": "Rahul",
      "email": "rahul@example.com",
      "role": "MEMBER"
    }
  ],
  "meta": {
    "request_id": "req_210",
    "timestamp": "2026-10-08T10:40:00.000Z"
  }
}
```

---

# 19. Remove Member

```http
DELETE /api/v1/groups/:groupId/members/:userId
```

But this has an important business rule:

> We should not simply remove someone who has financial activity in the group.

For example:

```text
Rahul owes Shivam ₹500
```

If we delete Rahul from the group, what happens to that debt?

Therefore member removal will have guardrails.

Possible result:

```text
MEMBER_HAS_OUTSTANDING_BALANCE
```

We'll define the exact behavior in the business-rules document.

---

# 20. Expenses

## Create Expense

```http
POST /api/v1/groups/:groupId/expenses
```

### Equal split request

```json
{
  "title": "Groceries",
  "amount": 90000,
  "paid_by": "usr_rahul",
  "split_type": "EQUAL",
  "participants": [
    "usr_rahul",
    "usr_shivam",
    "usr_amit"
  ]
}
```

Notice the API accepts:

```text
90000
```

rather than:

```text
900.00
```

because the backend uses paise.

The mobile app can convert:

```text
₹900
```

to:

```text
90000
```

before sending it.

---

# 21. Custom Split

```json
{
  "title": "Groceries",
  "amount": 90000,
  "paid_by": "usr_rahul",
  "split_type": "CUSTOM",
  "participants": [
    {
      "user_id": "usr_rahul",
      "amount": 50000
    },
    {
      "user_id": "usr_shivam",
      "amount": 25000
    },
    {
      "user_id": "usr_amit",
      "amount": 15000
    }
  ]
}
```

Backend validates:

```text
50000 + 25000 + 15000 = 90000
```

---

# 22. Percentage Split

```json
{
  "title": "Electricity",
  "amount": 180000,
  "paid_by": "usr_shivam",
  "split_type": "PERCENTAGE",
  "participants": [
    {
      "user_id": "usr_shivam",
      "percentage": 50
    },
    {
      "user_id": "usr_rahul",
      "percentage": 30
    },
    {
      "user_id": "usr_amit",
      "percentage": 20
    }
  ]
}
```

Backend converts:

```text
50% → 90000
30% → 54000
20% → 36000
```

and stores actual amounts.

---

# 23. List Expenses

```http
GET /api/v1/groups/:groupId/expenses
```

We'll eventually support:

```text
?page=1
&limit=20
&from=2026-10-01
&to=2026-10-31
```

For V1, pagination is enough.

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "exp_123",
      "title": "Groceries",
      "amount": 90000,
      "paid_by": {
        "id": "usr_2",
        "name": "Rahul"
      },
      "created_at": "2026-10-08T11:00:00.000Z"
    }
  ],
  "meta": {
    "request_id": "req_300",
    "timestamp": "2026-10-08T11:01:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

---

# 24. Expense Details

```http
GET /api/v1/groups/:groupId/expenses/:expenseId
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "exp_123",
    "title": "Groceries",
    "amount": 90000,
    "paid_by": {
      "id": "usr_2",
      "name": "Rahul"
    },
    "split_type": "EQUAL",
    "participants": [
      {
        "user_id": "usr_2",
        "name": "Rahul",
        "amount": 30000
      },
      {
        "user_id": "usr_1",
        "name": "Shivam",
        "amount": 30000
      },
      {
        "user_id": "usr_3",
        "name": "Amit",
        "amount": 30000
      }
    ]
  },
  "meta": {
    "request_id": "req_301",
    "timestamp": "2026-10-08T11:05:00.000Z"
  }
}
```

---

# 25. Balance API

This is one of the most important endpoints.

```http
GET /api/v1/groups/:groupId/balances
```

Response:

```json
{
  "success": true,
  "data": {
    "group_balance": 0,

    "members": [
      {
        "user_id": "usr_rahul",
        "name": "Rahul",
        "net_balance": 60000
      },
      {
        "user_id": "usr_shivam",
        "name": "Shivam",
        "net_balance": -30000
      },
      {
        "user_id": "usr_amit",
        "name": "Amit",
        "net_balance": -30000
      }
    ],

    "debts": [
      {
        "from_user": {
          "id": "usr_shivam",
          "name": "Shivam"
        },
        "to_user": {
          "id": "usr_rahul",
          "name": "Rahul"
        },
        "amount": 30000
      },
      {
        "from_user": {
          "id": "usr_amit",
          "name": "Amit"
        },
        "to_user": {
          "id": "usr_rahul",
          "name": "Rahul"
        },
        "amount": 30000
      }
    ]
  },
  "meta": {
    "request_id": "req_400",
    "timestamp": "2026-10-08T11:10:00.000Z"
  }
}
```

This endpoint will be generated by the **Balance Service**.

---

# 26. Personal Balance

We also need a simpler endpoint for the home screen.

```http
GET /api/v1/groups/:groupId/my-balance
```

Response:

```json
{
  "success": true,
  "data": {
    "net_balance": -45000,

    "you_owe": [
      {
        "user_id": "usr_rahul",
        "name": "Rahul",
        "amount": 30000
      },
      {
        "user_id": "usr_amit",
        "name": "Amit",
        "amount": 15000
      }
    ],

    "you_are_owed": [
      {
        "user_id": "usr_vikas",
        "name": "Vikas",
        "amount": 20000
      }
    ]
  },
  "meta": {
    "request_id": "req_401",
    "timestamp": "2026-10-08T11:11:00.000Z"
  }
}
```

---

# 27. Create Settlement

```http
POST /api/v1/groups/:groupId/settlements
```

Request:

```json
{
  "from_user_id": "usr_shivam",
  "to_user_id": "usr_rahul",
  "amount": 30000
}
```

Backend checks:

1. Both users belong to group.
2. Amount > 0.
3. User is actually allowed to make this settlement.
4. The settlement doesn't exceed the outstanding debt.

Then:

```text
Settlement created
        ↓
Balance recalculated
```

---

# 28. Settlement History

```http
GET /api/v1/groups/:groupId/settlements
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "set_123",
      "from": {
        "id": "usr_shivam",
        "name": "Shivam"
      },
      "to": {
        "id": "usr_rahul",
        "name": "Rahul"
      },
      "amount": 30000,
      "created_at": "2026-10-08T12:00:00.000Z"
    }
  ],
  "meta": {
    "request_id": "req_500",
    "timestamp": "2026-10-08T12:01:00.000Z"
  }
}
```

---

# 29. Email Architecture

We now have an important separation:

```text
Business Operation
       │
       ▼
Service
       │
       ├── Database operation
       │
       └── Email Service
                 │
                 ▼
            Email Provider
```

For example:

```text
Create Expense
     │
     ▼
Expense Service
     │
     ├── Validate
     ├── Create Expense
     ├── Calculate affected users
     │
     └── Email Service
             │
             ▼
       Expense Template
             │
             ▼
        Email Provider
```

The expense should **not disappear just because email delivery fails**.

---

# 30. Email Templates

Since you already have templates, we'll keep them outside the business logic.

Something like:

```text
src/
└── templates/
    └── email/
        ├── otp/
        ├── group-created/
        ├── member-added/
        ├── expense-created/
        └── settlement-created/
```

The service will pass data to the template:

```text
template
+
variables
    ↓
HTML
    ↓
Email provider
```

For example:

```text
expense-created
    ↓
{
  userName,
  groupName,
  expenseTitle,
  totalAmount,
  paidBy,
  participants,
  yourShare,
  yourBalance
}
```

---

# 31. API Error Codes

We'll centralize them.

Example:

```ts
export const ERROR_CODE = {
  VALIDATION_ERROR: "VALIDATION_ERROR",

  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PASSWORD: "INVALID_PASSWORD",

  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",

  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_MAX_ATTEMPTS: "OTP_MAX_ATTEMPTS",
  OTP_RESEND_TOO_SOON: "OTP_RESEND_TOO_SOON",

  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  GROUP_NOT_FOUND: "GROUP_NOT_FOUND",
  NOT_GROUP_MEMBER: "NOT_GROUP_MEMBER",

  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  INVITATION_EXPIRED: "INVITATION_EXPIRED",

  EXPENSE_NOT_FOUND: "EXPENSE_NOT_FOUND",
  INVALID_EXPENSE_AMOUNT: "INVALID_EXPENSE_AMOUNT",
  INVALID_EXPENSE_SPLIT: "INVALID_EXPENSE_SPLIT",

  SETTLEMENT_NOT_FOUND: "SETTLEMENT_NOT_FOUND",
  INVALID_SETTLEMENT: "INVALID_SETTLEMENT",

  MEMBER_HAS_OUTSTANDING_BALANCE: "MEMBER_HAS_OUTSTANDING_BALANCE"
} as const;
```

The exact list will grow naturally as we implement.

---

# 32. API Flow Example

Let's trace one real operation.

### Shivam creates a grocery expense

```text
React Native
     │
     │ POST /groups/grp1/expenses
     ▼
Route
     │
     ▼
Auth Middleware
     │
     ▼
Validation Middleware
     │
     ▼
Expense Controller
     │
     ▼
Expense Service
     │
     ├── Check group membership
     ├── Validate participants
     ├── Validate split
     ├── Calculate shares
     │
     ▼
Expense Repository
     │
     ▼
MongoDB
     │
     ▼
Expense Service
     │
     └── Email Service
              │
              ▼
          Email Provider
```

Response:

```text
MongoDB success
      ↓
201 Created
```

---

# 33. What We've Added to the Original Design

Our initial database had:

```text
users
groups
group_members
expenses
settlements
otps
email_notifications
refresh_tokens
```

Now we've identified one more:

```text
group_invitations
```

So the current domain model is:

```text
                 ┌───────────────┐
                 │     User      │
                 └───────┬───────┘
                         │
          ┌──────────────┼─────────────────┐
          │              │                 │
          ▼              ▼                 ▼
        OTPs       Refresh Tokens    Email Notifications
                         │
                         │
                         ▼
                 ┌───────────────┐
                 │ Group Members │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │     Group     │
                 └───────┬───────┘
                         │
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
             Expenses        Settlements

                 Group
                   │
                   ▼
             Invitations
```

---

# 34. One architectural change I'd make now

Earlier we discussed:

```text
controllers/
services/
repositories/
models/
```

That's okay for a small application.

But because we're deliberately using this project to learn system design, I'd eventually prefer **feature-oriented organization** while keeping MVC internally:

```text
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.validator.ts
│   │   └── auth.types.ts
│   │
│   ├── users/
│   ├── groups/
│   ├── expenses/
│   ├── settlements/
│   └── notifications/
│
├── common/
│   ├── constants/
│   ├── errors/
│   ├── middleware/
│   ├── types/
│   └── utils/
│
├── config/
├── app.ts
└── server.ts
```

But **I would not change to this yet**.

Let's first finish the system design. Then we'll decide the final structure based on the actual modules. That's better system design than blindly choosing a folder structure at the beginning.

---

## Next: the really interesting part 🔥

We've now established:

**Requirements → Entities → Collections → API contract.**

The next step should be:

### **Part 3 — Complete Business Rules & Balance Engine**

We'll mathematically define:

- Equal split
- Custom split
- Percentage split
- Rounding
- Who can create an expense
- Who can edit/delete one
- What happens when a member leaves
- Settlement validation
- Partial settlement
- Overpayment
- Circular debts
- Debt simplification
- Expense deletion after settlement
- Balance calculation
- Transaction/consistency rules

This is where this stops being a simple MERN CRUD app and becomes a genuinely useful **system-design project**.
