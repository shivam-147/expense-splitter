# Expense Splitter — System Design Part 1

## Domain & Database Design

### 1. Core domain

Our system has these main concepts:

```text
User
 │
 ├── belongs to → Group
 │
 ├── creates → Expense
 │
 ├── participates in → Expense
 │
 └── makes/receives → Settlement

Group
 │
 ├── has → Members
 ├── has → Expenses
 └── has → Settlements
```

For the first version, I recommend **7 main collections**:

```text
users
groups
expenses
settlements
otps
email_notifications
refresh_tokens
```

`refresh_tokens` can be skipped if we decide to use a short-lived access token only, but for a proper authentication system I'd keep it.

---

# 2. User

The user is the central identity in the application.

### Collection

```text
users
```

### Document

```js
{
  _id: ObjectId,

  name: "Shivam",

  email: "shivam@example.com",

  passwordHash: "...",

  emailVerified: true,

  status: "ACTIVE",

  createdAt: Date,
  updatedAt: Date
}
```

### Important fields

| Field | Purpose |
| --- | --- |
| `_id` | User identifier |
| `name` | Display name |
| `email` | Login/email address |
| `passwordHash` | Hashed password |
| `emailVerified` | OTP verification status |
| `status` | Account status |
| `createdAt` | Creation time |
| `updatedAt` | Last update |

We should **never** store:

```text
password
```

Only:

```text
passwordHash
```

---

# 3. User Status

We'll keep the initial status enum simple:

```text
ACTIVE
INACTIVE
SUSPENDED
```

For example, if a user is suspended, we don't need to delete their historical expenses.

Their historical records remain valid.

---

# 4. Group

A group represents a shared environment.

Examples:

```text
Flatmates
Jabalpur Friends
Office Team
Goa Trip
```

### Collection

```text
groups
```

### Document

```js
{
  _id: ObjectId,

  name: "Flatmates",

  createdBy: ObjectId,

  currency: "INR",

  status: "ACTIVE",

  createdAt: Date,
  updatedAt: Date
}
```

---

# 5. Group Members

Here's an important design decision.

We **should not put all members directly into the Group document** like:

```js
members: [
  {
    userId: ...
  }
]
```

That works for a tiny application, but I'd rather introduce a separate collection:

```text
group_members
```

### Why?

Because membership itself has information.

For example:

```text
User joined group
User removed from group
User is owner
User is member
User joined at X date
```

So:

```js
{
  _id: ObjectId,

  groupId: ObjectId,

  userId: ObjectId,

  role: "OWNER",

  status: "ACTIVE",

  joinedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

### Roles

Initially:

```text
OWNER
MEMBER
```

We don't need 15 different roles.

---

# 6. Group Membership Relationship

Conceptually:

```text
User
  │
  │
  ├──────────────┐
  │              │
  ▼              ▼
Group Member   Group Member
  │              │
  ▼              ▼
Group A        Group B
```

Therefore:

```text
User ←→ Group
```

is a **many-to-many relationship**.

One user:

```text
Shivam
 ├── Flatmates
 ├── College Friends
 └── Goa Trip
```

One group:

```text
Flatmates
 ├── Shivam
 ├── Rahul
 └── Amit
```

`group_members` handles this relationship.

---

# 7. Expense

Now we reach the heart of the application.

An expense represents:

> Someone paid money for something that was shared by one or more group members.

Example:

```text
Groceries
₹900
Paid by Rahul
Shared by Rahul, Shivam and Amit
```

### Collection

```text
expenses
```

A simplified document:

```js
{
  _id: ObjectId,

  groupId: ObjectId,

  title: "Groceries",

  amount: 90000,

  currency: "INR",

  paidBy: ObjectId,

  splitType: "EQUAL",

  participants: [
    {
      userId: ObjectId,
      amount: 30000
    },
    {
      userId: ObjectId,
      amount: 30000
    },
    {
      userId: ObjectId,
      amount: 30000
    }
  ],

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

Notice something important:

```text
₹900
```

is stored as:

```text
90000
```

because we use the smallest monetary unit.

For INR:

```text
₹1     = 100 paise
₹900   = 90000 paise
```

This avoids JavaScript floating-point problems.

---

# 8. Why store participants inside Expense?

We could create another collection:

```text
expense_participants
```

But I don't think we need it initially.

An expense normally has a relatively small number of participants.

So this is perfectly reasonable:

```js
participants: [
  {
    userId,
    amount
  }
]
```

This keeps reading an expense simple.

---

# 9. Split Types

The expense creation request can specify:

```text
EQUAL
CUSTOM
PERCENTAGE
```

Example:

### Equal

```text
₹900

Rahul    ₹300
Shivam   ₹300
Amit     ₹300
```

### Custom

```text
₹900

Rahul    ₹500
Shivam   ₹250
Amit     ₹150
```

### Percentage

```text
₹900

Rahul    50%
Shivam   30%
Amit     20%
```

But after processing, the database stores:

```text
actual amounts
```

not percentages.

So:

```js
participants: [
  { userId: rahul, amount: 45000 },
  { userId: shivam, amount: 27000 },
  { userId: amit, amount: 18000 }
]
```

---

# 10. Expense Business Invariant

This is extremely important.

For every expense:

```text
SUM(participant.amount) === expense.amount
```

For example:

```text
90000
=
30000 + 30000 + 30000
```

If:

```text
30000 + 30000 + 20000
```

then:

```text
80000 !== 90000
```

The API rejects the request.

---

# 11. Settlement

A settlement represents **actual repayment**.

Example:

```text
Shivam paid Rahul ₹300
```

### Collection

```text
settlements
```

### Document

```js
{
  _id: ObjectId,

  groupId: ObjectId,

  fromUserId: ObjectId,

  toUserId: ObjectId,

  amount: 30000,

  currency: "INR",

  createdBy: ObjectId,

  createdAt: Date
}
```

Meaning:

```text
fromUserId
     │
     │ ₹300
     ▼
toUserId
```

---

# 12. Expense vs Settlement

This distinction is **very important**.

Suppose:

```text
Rahul buys groceries ₹900.
```

That's an:

```text
EXPENSE
```

Then:

```text
Shivam gives Rahul ₹300.
```

That's a:

```text
SETTLEMENT
```

We never modify the original expense just because money was repaid.

So:

```text
Expense
₹900
Rahul paid
      │
      ├── Shivam owes ₹300
      └── Amit owes ₹300

Settlement
Shivam → Rahul ₹300
```

This gives us a proper financial history.

---

# 13. OTP

Now authentication.

Collection:

```text
otps
```

Example:

```js
{
  _id: ObjectId,

  email: "shivam@example.com",

  purpose: "EMAIL_VERIFICATION",

  otpHash: "...",

  expiresAt: Date,

  attempts: 0,

  maxAttempts: 5,

  verifiedAt: null,

  createdAt: Date
}
```

### OTP purposes

Initially:

```text
EMAIL_VERIFICATION
PASSWORD_RESET
```

Later we can add:

```text
LOGIN_VERIFICATION
EMAIL_CHANGE
```

if required.

---

# 14. Why hash OTP?

Suppose the database is compromised.

We don't want someone to see:

```text
OTP = 482913
```

Instead:

```text
otpHash = $2b$...
```

When the user enters:

```text
482913
```

we hash/verify it against the stored value.

---

# 15. OTP Expiration

Example:

```text
OTP generated
     │
     ▼
Valid for 10 minutes
     │
     ▼
Expires
```

We can eventually use MongoDB's TTL index so expired OTP documents are automatically removed.

That is a nice real-world MongoDB feature to learn.

---

# 16. Email Notifications

Because you specifically want proper emails, we'll track delivery.

Collection:

```text
email_notifications
```

Example:

```js
{
  _id: ObjectId,

  recipientUserId: ObjectId,

  recipientEmail: "shivam@example.com",

  type: "EXPENSE_CREATED",

  template: "expense-created",

  referenceId: ObjectId,

  status: "SENT",

  attempts: 1,

  sentAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

Possible statuses:

```text
PENDING
SENDING
SENT
FAILED
```

This gives us visibility into email failures.

---

# 17. Email Notification Types

Initially:

```text
OTP_VERIFICATION

GROUP_CREATED

MEMBER_ADDED

EXPENSE_CREATED

SETTLEMENT_CREATED
```

For example:

```text
Expense created
      │
      ▼
Email Notification
      │
      ├── Shivam
      ├── Rahul
      └── Amit
```

Only affected group members should receive the expense email.

---

# 18. Refresh Token

For authentication, we can use:

```text
Access Token
+
Refresh Token
```

The access token is short-lived.

Example:

```text
Access Token
15 minutes
```

Refresh token:

```text
7 days / 30 days
```

The refresh token should be stored securely and preferably represented by a hashed value in MongoDB.

Collection:

```text
refresh_tokens
```

Example:

```js
{
  _id: ObjectId,

  userId: ObjectId,

  tokenHash: "...",

  expiresAt: Date,

  revokedAt: null,

  createdAt: Date
}
```

---

# 19. Complete Data Model

So our initial database becomes:

```text
┌─────────────────┐
│      users      │
└────────┬────────┘
         │
         │
         ▼
┌─────────────────┐
│  group_members  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     groups      │
└───────┬─────────┘
        │
        ├───────────────┐
        │               │
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│   expenses    │ │  settlements  │
└───────────────┘ └───────────────┘


users
  │
  ├── otps
  │
  ├── refresh_tokens
  │
  └── email_notifications
```

---

# 20. The Most Important Part: Balance

Now let's derive the balance.

Suppose:

```text
Group:

Rahul
Shivam
Amit
```

Rahul creates:

```text
Groceries = ₹900
Paid by Rahul
```

Split:

```text
Rahul     ₹300
Shivam    ₹300
Amit      ₹300
```

The financial effect is:

```text
Rahul:
Paid       +₹900
Own share  -₹300
----------------
Net        +₹600
```

Shivam:

```text
Paid       ₹0
Own share  ₹300
----------------
Net        -₹300
```

Amit:

```text
Paid       ₹0
Own share  ₹300
----------------
Net        -₹300
```

Therefore:

```text
Rahul is owed ₹600
Shivam owes ₹300
Amit owes ₹300
```

---

# 21. Balance Formula

For each user:

```text
NET BALANCE =
Amount Paid
-
Own Expense Share
+
Settlements Received
-
Settlements Paid
```

So:

```text
positive balance
      ↓
money should come to me

negative balance
      ↓
I owe money
```

This is the fundamental calculation.

---

# 22. Example With Settlement

Initially:

```text
Rahul    +600
Shivam   -300
Amit     -300
```

Shivam pays Rahul ₹300.

Settlement:

```text
Shivam → Rahul ₹300
```

Now:

```text
Rahul    +300
Shivam    0
Amit     -300
```

Exactly what we want.

---

# 23. Important Design Principle

We will **not store**:

```text
Shivam owes Rahul ₹300
```

as the authoritative database record.

Instead:

```text
Expenses
    +
Settlements
    ↓
Balance Calculation
    ↓
Current Debt
```

This is a much cleaner design.

The database stores **events/facts**.

The service calculates the current state.

---

# 24. Indexes

We should plan indexes from the beginning.

### Users

```text
email → UNIQUE
```

### Group Members

```text
(groupId, userId) → UNIQUE
```

This prevents:

```text
Shivam added twice to Flatmates
```

### Expenses

```text
groupId + createdAt
```

Useful for:

```text
Get latest expenses for group
```

### Settlements

```text
groupId + createdAt
```

### OTP

```text
expiresAt → TTL
```

### Refresh Tokens

```text
expiresAt → TTL
```

---

# 25. One Important Decision We Need to Make

There's one business rule I don't want to silently assume.

Suppose Rahul is a group member but doesn't participate in an expense:

```text
Groceries ₹900

Paid by Shivam

Participants:
Shivam
Rahul
Amit
```

That's straightforward.

But what if:

```text
Participants:
Shivam
Rahul
```

and Amit is also a group member?

I recommend:

> **A group member does NOT automatically participate in every expense.**

The expense creator explicitly selects participants.

That gives us flexibility for things like:

```text
Netflix
→ everyone

Personal groceries
→ only 2 people

Dinner
→ 4 of 5 members
```

This should become an explicit business rule.

---

## Next step

Now that the entities are clear, the next document should be **Database Schema + API Contract Design**.

We'll define things concretely like:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-otp
POST /api/v1/auth/login

POST /api/v1/groups
POST /api/v1/groups/:groupId/members

POST /api/v1/groups/:groupId/expenses

GET  /api/v1/groups/:groupId/balances

POST /api/v1/groups/:groupId/settlements
```

and for each endpoint we'll define:

**request → validation → service logic → repository → response → possible errors.**

That's where our system design starts becoming an actual backend blueprint.
