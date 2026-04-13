# REAUX Labs — Frontend API Reference

**Base URL:** `https://reaux-labs-be.onrender.com/api`
**Auth:** All protected routes require `Authorization: Bearer <JWT>` header

**Standard response:**
```json
{ "success": true, "data": <payload>, "message": "..." }
```
**Paginated response:**
```json
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 10, "total": 50, "pages": 5 } }
```

---

## 1. REELS — `commentsCount` in Responses

**Status: DONE**

`commentsCount` is included in all reel responses. Auto-incremented when a comment is added.

### `GET /api/reels?page=1&limit=10`
**Auth:** Optional (adds `isLiked` if authenticated)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a92750f1",
      "author": {
        "_id": "67b7ea11db0a66a9a92750cd",
        "name": "Arjun Mehta",
        "avatar": "https://images.unsplash.com/..."
      },
      "videoUrl": "https://videos.pexels.com/...",
      "caption": "Morning workout session 💪",
      "likesCount": 12,
      "commentsCount": 5,
      "isLiked": false,
      "createdAt": "2026-03-15T10:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 6, "pages": 1 }
}
```

### `GET /api/reels/:id`
**Auth:** Optional

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a92750f1",
    "author": {
      "_id": "67b7ea11db0a66a9a92750cd",
      "name": "Arjun Mehta",
      "avatar": "https://images.unsplash.com/..."
    },
    "videoUrl": "https://videos.pexels.com/...",
    "caption": "Morning workout session 💪",
    "linkedProduct": null,
    "likesCount": 12,
    "commentsCount": 5,
    "isLiked": false,
    "createdAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### `POST /api/reels/:id/like`
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a92750f1",
    "likesCount": 13,
    "commentsCount": 5,
    "isLiked": true
  }
}
```

### `POST /api/reels/:id/comments`
**Auth:** Required

**Request:**
```json
{ "content": "Great form! Keep it up 🔥" }
```

**Response:** (commentsCount on the reel is incremented by 1)
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a92750ff",
    "reelId": "67b7ea11db0a66a9a92750f1",
    "author": {
      "_id": "67b7ea11db0a66a9a92750ce",
      "name": "Sneha Gupta",
      "avatar": "https://images.unsplash.com/..."
    },
    "content": "Great form! Keep it up 🔥",
    "createdAt": "2026-03-21T14:00:00.000Z"
  }
}
```

### `GET /api/reels/:id/comments?page=1&limit=20`
**Auth:** Not required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a92750ff",
      "reelId": "67b7ea11db0a66a9a92750f1",
      "author": {
        "_id": "67b7ea11db0a66a9a92750ce",
        "name": "Sneha Gupta",
        "avatar": "https://images.unsplash.com/..."
      },
      "content": "Great form! Keep it up 🔥",
      "createdAt": "2026-03-21T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

---

## 2. MEMBERSHIPS — Fee Fields Always Present

**Status: DONE**

All fee fields have defaults in the schema:
- `feesAmount` → default `0`
- `feesPaid` → default `0`
- `feesDue` → default `0`
- `advanceCredit` → default `0`
- `lastPaymentDate` → default `null` (null means no payment recorded yet)

These fields are returned in **every** membership response — never omitted.

### Membership Object Shape (used across all endpoints)
```json
{
  "_id": "67b7ea11db0a66a9a9275100",
  "userId": {
    "_id": "67b7ea11db0a66a9a92750cd",
    "name": "Arjun Mehta",
    "email": "arjun@gmail.com",
    "avatar": "https://images.unsplash.com/..."
  },
  "planId": {
    "_id": "67b7ea11db0a66a9a92750e0",
    "name": "Elite Yearly",
    "durationDays": 365,
    "price": 12999,
    "features": ["Personal Trainer", "Locker", "Spa"]
  },
  "gymId": {
    "_id": "67b7ea11db0a66a9a92750c0",
    "name": "REAUX Fitness — Delhi",
    "slug": "reaux-fitness-delhi"
  },
  "startDate": "2026-01-15T00:00:00.000Z",
  "endDate": "2027-01-15T00:00:00.000Z",
  "status": "active",
  "feesAmount": 12999,
  "feesPaid": 12999,
  "feesDue": 0,
  "advanceCredit": 0,
  "lastPaymentDate": "2026-01-15T00:00:00.000Z",
  "paymentHistory": [
    {
      "amount": 12999,
      "date": "2026-01-15T00:00:00.000Z",
      "note": "Full payment at enrollment"
    }
  ],
  "assignedBy": "67b7ea11db0a66a9a92750c8",
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-03-10T00:00:00.000Z"
}
```

### Affected Endpoints
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/memberships` | GET | List (paginated) — includes fee fields |
| `/api/memberships/:id` | GET | Single membership — includes fee fields |
| `/api/memberships/my` | GET | Current user's memberships |
| `/api/memberships/assign` | POST | Response includes computed fee fields |
| `/api/memberships/:id/fees` | PUT | Response includes updated fee fields |
| `/api/memberships/:id/apply-credit` | POST | Response includes updated fee fields |
| `/api/memberships/:id/fees/adjust` | PATCH | Response includes updated fee fields |
| `/api/memberships/:id/cancel` | PATCH | Response includes fee fields |

---

## 3. MEMBERSHIPS — Record Payment with `extendDays`

**Status: DONE**

### `PUT /api/memberships/:id/fees`
**Auth:** Required (admin/superadmin)

**Request:**
```json
{
  "amount": 1499,
  "note": "April monthly fees",
  "extendDays": 30
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `amount` | number | Yes | Non-zero. Positive = payment. Negative = deduct from advance credit |
| `note` | string | No | Payment description |
| `extendDays` | integer | No | Days to add to `endDate`. Also reactivates expired memberships |

**Logic:**
1. `feesPaid += amount`
2. `balance = feesAmount - feesPaid`
3. If `balance > 0` → `feesDue = balance`, `advanceCredit = 0`
4. If `balance < 0` → `feesDue = 0`, `advanceCredit = abs(balance)`
5. If `extendDays > 0` → `endDate += extendDays` days. If status was `expired`, sets to `active`
6. `lastPaymentDate = now`
7. Appends `{ amount, date, note }` to `paymentHistory`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a9275100",
    "userId": "67b7ea11db0a66a9a92750cd",
    "planId": "67b7ea11db0a66a9a92750e0",
    "gymId": "67b7ea11db0a66a9a92750c0",
    "startDate": "2026-01-15T00:00:00.000Z",
    "endDate": "2026-05-15T00:00:00.000Z",
    "status": "active",
    "feesAmount": 1499,
    "feesPaid": 1499,
    "feesDue": 0,
    "advanceCredit": 0,
    "lastPaymentDate": "2026-03-21T12:00:00.000Z",
    "paymentHistory": [
      {
        "amount": 1499,
        "date": "2026-03-21T12:00:00.000Z",
        "note": "April monthly fees"
      }
    ]
  },
  "message": "Payment recorded successfully"
}
```

**Negative amount example (deduct advance credit):**
```json
{ "amount": -500, "note": "Corrected overpayment" }
```

**Common `extendDays` values:**
| Plan | extendDays |
|------|-----------|
| Monthly | `30` |
| Quarterly | `90` |
| Half-yearly | `180` |
| Yearly | `365` |

**Tip:** Read `planId.durationDays` from the membership object and pre-fill `extendDays` on the frontend.

---

## 4. MEMBERSHIPS — Apply Advance Credit

**Status: DONE**

### `POST /api/memberships/:id/apply-credit`
**Auth:** Required (admin/superadmin)

**Request:**
```json
{
  "amount": 500,
  "note": "Applied credit toward renewal"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `amount` | number | Yes | Must be positive and `<= advanceCredit` |
| `note` | string | No | Defaults to "Applied ₹X from advance credit to dues" |

**Logic:**
1. `applyAmount = min(amount, advanceCredit)`
2. `advanceCredit -= applyAmount`
3. `feesPaid += applyAmount`
4. Recalculate `feesDue = max(0, feesAmount - feesPaid)`
5. Appends to `paymentHistory`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a9275103",
    "feesAmount": 3999,
    "feesPaid": 5500,
    "feesDue": 0,
    "advanceCredit": 501,
    "lastPaymentDate": "2026-03-21T12:00:00.000Z",
    "paymentHistory": [
      { "amount": 5000, "date": "2026-02-01T00:00:00.000Z", "note": "Initial payment" },
      { "amount": 500, "date": "2026-03-21T12:00:00.000Z", "note": "Applied credit toward renewal" }
    ]
  },
  "message": "Credit applied successfully"
}
```

**Error response (no credit):**
```json
{
  "success": false,
  "message": "No advance credit available"
}
```

---

## 5. MEMBERSHIPS — Filtering and Sorting

**Status: DONE**

### `GET /api/memberships`
**Auth:** Required (admin/superadmin)

| Query Param | Type | Example | Notes |
|-------------|------|---------|-------|
| `status` | string | `active`, `expired`, `cancelled` | Filter by status |
| `userId` | string | `67b7ea...` | Filter by specific user |
| `gymId` | string | `67b7ea...` | Filter by gym (superadmin only; admin auto-scoped) |
| `sortBy` | string | `endDate`, `feesDue`, `createdAt` | Sort field (default: `createdAt`) |
| `order` | string | `asc`, `desc` | Sort order (default: `desc`) |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Results per page (max 100) |

**Examples:**
```
GET /api/memberships?status=active&sortBy=endDate&order=asc
→ Active memberships, soonest-to-expire first

GET /api/memberships?status=active&sortBy=feesDue&order=desc
→ Active memberships, highest debt first

GET /api/memberships?gymId=67b7ea...&status=active&page=1&limit=20
→ All active memberships for a specific gym
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a9275100",
      "userId": { "_id": "...", "name": "Arjun Mehta", "email": "arjun@gmail.com", "avatar": "..." },
      "planId": { "_id": "...", "name": "Elite Yearly", "durationDays": 365, "price": 12999, "features": [...] },
      "gymId": { "_id": "...", "name": "REAUX Fitness — Delhi", "slug": "reaux-fitness-delhi" },
      "startDate": "2026-01-15T00:00:00.000Z",
      "endDate": "2027-01-15T00:00:00.000Z",
      "status": "active",
      "feesAmount": 12999,
      "feesPaid": 12999,
      "feesDue": 0,
      "advanceCredit": 0,
      "lastPaymentDate": "2026-01-15T00:00:00.000Z",
      "paymentHistory": [...]
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 15, "pages": 2 }
}
```

---

## 6. USERS — Birthday Endpoints

**Status: DONE**

### `GET /api/users/birthdays/today`
**Auth:** Required (admin/superadmin)

Returns users whose birthday (day + month) is today. Admin sees only their gym's users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a92750d0",
      "name": "Riya Kapoor",
      "email": "riya@gmail.com",
      "avatar": "https://images.unsplash.com/...",
      "dateOfBirth": "2001-04-18T00:00:00.000Z",
      "gymId": { "_id": "...", "name": "REAUX Fitness — Delhi", "slug": "reaux-fitness-delhi" }
    }
  ]
}
```

### `GET /api/users/birthdays/upcoming?days=7`
**Auth:** Required (admin/superadmin)

Returns users with birthdays in the next N days (default 7). Sorted by soonest first.

| Query Param | Type | Default | Notes |
|-------------|------|---------|-------|
| `days` | number | `7` | Look-ahead window |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a92750cd",
      "name": "Arjun Mehta",
      "email": "arjun@gmail.com",
      "avatar": "https://images.unsplash.com/...",
      "dateOfBirth": "2000-01-25T00:00:00.000Z",
      "gymId": { "_id": "...", "name": "REAUX Fitness — Delhi", "slug": "reaux-fitness-delhi" },
      "daysUntil": 3
    },
    {
      "_id": "67b7ea11db0a66a9a92750d3",
      "name": "Kavya Reddy",
      "email": "kavya@gmail.com",
      "avatar": "https://images.unsplash.com/...",
      "dateOfBirth": "2002-06-22T00:00:00.000Z",
      "gymId": { "_id": "...", "name": "REAUX Fitness — Mumbai" },
      "daysUntil": 5
    }
  ]
}
```

---

## 7. USERS — Saved Addresses CRUD

**Status: DONE**

### `GET /api/users/addresses`
**Auth:** Required

Returns all saved addresses for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a9275200",
      "label": "Home",
      "street": "10 Sector 18, Dwarka",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110075",
      "phone": "9876543213",
      "isDefault": true
    },
    {
      "_id": "67b7ea11db0a66a9a9275201",
      "label": "Work",
      "street": "22 Nehru Place",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110019",
      "phone": "9876543213",
      "isDefault": false
    }
  ]
}
```

### `POST /api/users/addresses`
**Auth:** Required

**Request:**
```json
{
  "label": "Parents",
  "street": "15 Civil Lines",
  "city": "Hoshiarpur",
  "state": "Punjab",
  "pincode": "146001",
  "phone": "9811223344",
  "isDefault": false
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `label` | string | Yes | e.g. "Home", "Work", "Parents" |
| `street` | string | Yes | Street address |
| `city` | string | Yes | City name |
| `state` | string | Yes | State name |
| `pincode` | string | Yes | 6-digit pincode |
| `phone` | string | Yes | 10-digit phone number |
| `isDefault` | boolean | No | Default `false`. If `true`, all other addresses become non-default |

**Auto-behavior:** First address added is automatically set as default.

**Response:** Returns the full `savedAddresses` array after adding.
```json
{
  "success": true,
  "data": [
    { "_id": "...", "label": "Home", "street": "...", "isDefault": true },
    { "_id": "...", "label": "Work", "street": "...", "isDefault": false },
    { "_id": "...", "label": "Parents", "street": "15 Civil Lines", "city": "Hoshiarpur", "state": "Punjab", "pincode": "146001", "phone": "9811223344", "isDefault": false }
  ]
}
```

### `PUT /api/users/addresses/:addressId`
**Auth:** Required

**Request:** (partial update — only send fields you want to change)
```json
{
  "phone": "9876501234",
  "isDefault": true
}
```

**Response:** Returns the full `savedAddresses` array after update.

### `DELETE /api/users/addresses/:addressId`
**Auth:** Required

**Response:** Returns the remaining `savedAddresses` array. If deleted address was default, the first remaining address becomes default.
```json
{
  "success": true,
  "data": [
    { "_id": "...", "label": "Work", "street": "...", "isDefault": true }
  ]
}
```

---

## 8. DIETS — Suggested Plans Based on BMI

**Status: DONE**

### `GET /api/diets/suggested?page=1&limit=10`
**Auth:** Required

Uses the authenticated user's latest BMI record to suggest matching diet plans.

| Query Param | Type | Notes |
|-------------|------|-------|
| `page` | number | Page number |
| `limit` | number | Results per page |
| `goal` | string | `lose`, `gain`, `maintain` — overrides BMI-based mapping |
| `dietType` | string | `veg`, `non-veg`, `both` — filters by diet type |

**BMI → Category mapping:**
| BMI Category | Diet Categories | Calorie Range |
|-------------|----------------|---------------|
| Underweight | `muscle-gain` | 2500–3500 |
| Normal | `bulking` | 1800–2500 |
| Overweight | `weight-loss` | 1200–1800 |
| Obese | `cutting` | 1000–1500 |

**Goal override:**
| Goal | Categories |
|------|-----------|
| `lose` | `weight-loss`, `cutting` |
| `gain` | `muscle-gain`, `bulking` |
| `maintain` | Uses BMI mapping |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a92750e5",
      "title": "Weight Loss Veg Plan",
      "slug": "weight-loss-veg-plan",
      "category": "weight-loss",
      "dietType": "veg",
      "totalCalories": 1500,
      "description": "Low calorie veg diet for weight loss",
      "image": "https://images.unsplash.com/...",
      "createdBy": { "_id": "...", "name": "Rahul Sharma", "avatar": "..." },
      "likesCount": 8,
      "followersCount": 3,
      "isLiked": false,
      "isFollowed": true,
      "createdAt": "2026-03-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 2, "pages": 1 },
  "suggestion": {
    "bmiCategory": "overweight",
    "bmi": 27.5,
    "goal": null,
    "recommendedCategories": ["weight-loss"],
    "calorieRange": { "min": 1200, "max": 1800 }
  }
}
```

**Error (no BMI record):**
```json
{
  "success": false,
  "message": "No BMI record found. Please record your BMI first."
}
```

---

## 9. NOTIFICATIONS — FCM + Push Triggers

**Status: DONE**

### `POST /api/notifications/device-token`
**Auth:** Required

Registers a device push token. Supports multiple tokens per user (multiple devices). Call this on login.

**Request:**
```json
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

**Response:**
```json
{
  "success": true,
  "data": { "message": "Token registered" }
}
```

### `DELETE /api/notifications/device-token`
**Auth:** Required

Removes a device token. Call this on logout.

**Request:**
```json
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

**Response:**
```json
{
  "success": true,
  "data": { "message": "Token removed" }
}
```

### `POST /api/notifications/test`
**Auth:** Required

Sends a test push notification to all of the current user's registered devices.

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "67b7ea11db0a66a9a9275300",
    "message": "Test notification sent successfully"
  }
}
```

### `GET /api/notifications?page=1&limit=20`
**Auth:** Required (all roles — user, admin, superadmin)

No role restriction. Returns only the authenticated user's notifications.

| Query Param | Type | Notes |
|-------------|------|-------|
| `page` | number | Page number |
| `limit` | number | Results per page |
| `type` | string | Filter: `system`, `community`, `order`, `diet`, `announcement` |
| `isRead` | string | `true` or `false` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67b7ea11db0a66a9a9275300",
      "userId": "67b7ea11db0a66a9a92750cd",
      "title": "Payment Received",
      "message": "₹1499 payment recorded for your membership",
      "type": "system",
      "isRead": false,
      "metadata": { "membershipId": "67b7ea11db0a66a9a9275100" },
      "createdAt": "2026-03-21T12:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "pages": 1 }
}
```

### `PUT /api/notifications/read/:id`
**Auth:** Required

Marks a single notification as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a9275300",
    "isRead": true,
    "title": "Payment Received",
    "message": "₹1499 payment recorded"
  }
}
```

### `PATCH /api/notifications/mark-all-read`
**Auth:** Required

Marks all unread notifications as read.

**Response:**
```json
{
  "success": true,
  "data": { "modifiedCount": 5 }
}
```

### Push Notification Triggers (automatic)

| Event | Recipients | Title | Message |
|-------|-----------|-------|---------|
| New order placed | Superadmins | "New Order" | "New order placed by {userName}" |
| Order status updated | Order's user | "Order Update" | "Your order status is now {status}" |
| Membership assigned | The member | "Membership Assigned" | "You've been assigned the \"{planName}\" plan at {gymName}" |
| Membership cancelled | The member | "Membership Cancelled" | "Your \"{planName}\" has been cancelled" |
| Reel liked | Reel author | "New Like" | "{userName} liked your reel" |
| Reel commented | Reel author | "New Comment" | "{userName} commented on your reel" |
| Diet liked | Diet author | "New Like" | "{userName} liked your diet plan \"{title}\"" |
| Diet followed | Diet author | "New Follower" | "{userName} followed your diet plan \"{title}\"" |

### `POST /api/notifications/broadcast`
**Auth:** Required (admin/superadmin only)

Sends a notification to all active users.

**Request:**
```json
{
  "title": "Gym Holiday Notice",
  "message": "The gym will be closed on March 25th for Holi. Happy Holi! 🎨",
  "type": "announcement"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 10,
    "failed": 0,
    "total": 10,
    "message": "Broadcast sent to 10 users"
  }
}
```

---

## 10. USERS — Multi-Gym Support (`gymIds`)

**Status: DONE**

User model supports both `gymId` (single, backward compatible) and `gymIds` (array for multi-gym admins).

### User Model Fields
```json
{
  "gymId": "67b7ea11db0a66a9a92750c0",
  "gymIds": [
    "67b7ea11db0a66a9a92750c0",
    "67b7ea11db0a66a9a92750c2"
  ]
}
```

### `PUT /api/users/:id` (admin/superadmin)
**Auth:** Required (superadmin can set gymIds, admin cannot change gymId/gymIds)

**Request:**
```json
{
  "gymIds": ["67b7ea11db0a66a9a92750c0", "67b7ea11db0a66a9a92750c2"]
}
```

**How it works:**
- Admin scoped queries check **both** `gymIds` and `gymId` fields
- If `gymIds` has entries, it takes priority over `gymId`
- Used in: membership listing, user listing, birthday endpoints, fee recording

### `GET /api/users/:id`
**Response includes both fields:**
```json
{
  "success": true,
  "data": {
    "_id": "67b7ea11db0a66a9a92750c8",
    "name": "Rahul Sharma",
    "email": "rahul@reauxlabs.com",
    "role": "admin",
    "gymId": { "_id": "...", "name": "REAUX Fitness — Delhi", "slug": "reaux-fitness-delhi", "logo": "..." },
    "gymIds": [
      "67b7ea11db0a66a9a92750c0",
      "67b7ea11db0a66a9a92750c2"
    ],
    "phone": "9876543211",
    "avatar": "https://images.unsplash.com/...",
    "status": "active"
  }
}
```

---

## 11. MEMBERSHIPS — `gymId` Filter

**Status: DONE**

### `GET /api/memberships?gymId=<id>`

- **Admin:** Automatically scoped to their gym(s) via `gymIds`/`gymId`. No need to pass `gymId`.
- **Superadmin:** Can filter by any gym using `?gymId=<id>`. Without it, returns all gyms.

**Example:**
```
GET /api/memberships?gymId=67b7ea11db0a66a9a92750c0&status=active&page=1&limit=20
```

**Response:** Standard paginated membership list (see #2 for shape).

---

## 12. MEMBERSHIPS — `paymentHistory[].date` Always Present

**Status: DONE**

The `paymentHistory.date` field has `default: Date.now` in the schema. Every payment record has a date — it's never null or missing.

```json
"paymentHistory": [
  {
    "amount": 5000,
    "date": "2026-01-15T00:00:00.000Z",
    "note": "Initial payment at enrollment"
  },
  {
    "amount": 1499,
    "date": "2026-03-21T12:00:00.000Z",
    "note": "Monthly renewal"
  }
]
```

---

## Bonus Endpoints

### Fees Overview Dashboard
### `GET /api/memberships/fees-overview?gymId=<id>`
**Auth:** Required (admin/superadmin)

Returns 4 grouped sections for the fees dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "feesDue": [
      {
        "_id": "...",
        "userId": { "_id": "...", "name": "Riya Kapoor", "email": "riya@gmail.com", "avatar": "..." },
        "planId": { "_id": "...", "name": "Basic Monthly", "price": 1499 },
        "gymId": { "_id": "...", "name": "REAUX Fitness — Delhi" },
        "feesAmount": 1499,
        "feesPaid": 699,
        "feesDue": 800,
        "advanceCredit": 0,
        "endDate": "2026-04-01T00:00:00.000Z",
        "status": "active"
      }
    ],
    "fullyPaid": [
      {
        "userId": { "name": "Arjun Mehta" },
        "feesAmount": 12999,
        "feesPaid": 12999,
        "feesDue": 0,
        "advanceCredit": 0
      }
    ],
    "credit": [
      {
        "userId": { "name": "Vikram Singh" },
        "feesAmount": 3999,
        "feesPaid": 5000,
        "feesDue": 0,
        "advanceCredit": 1001
      }
    ],
    "upcomingRenewals": [
      {
        "userId": { "name": "Sneha Gupta" },
        "endDate": "2026-04-10T00:00:00.000Z",
        "status": "active"
      }
    ]
  }
}
```

### Adjust Fees Override
### `PATCH /api/memberships/:id/fees/adjust`
**Auth:** Required (admin/superadmin)

Directly override fee values. At least one of `feesAmount`, `feesPaid`, `advanceCredit` required.

**Request:**
```json
{
  "feesAmount": 2999,
  "feesPaid": 2999,
  "note": "Corrected to actual plan price"
}
```

**Response:** Full membership object with recalculated fields.

### Diets — Filter by Type
### `GET /api/diets?dietType=veg&category=weight-loss`

| `dietType` param | Returns |
|------------------|---------|
| `veg` | Plans tagged `veg` + `both` |
| `non-veg` | Plans tagged `non-veg` + `both` |
| `both` or omitted | All plans |

---

## 13. PRODUCTS — Visibility by Role

**Status: DONE**

### `GET /api/products?category=supplements&page=1&limit=10`
**Auth:** Optional (`optionalAuth` — sends token if logged in)

Products have a `visibility` field: `all`, `admin`, or `user`.

**Visibility matrix:**

| `visibility` | User sees | Admin sees | Superadmin sees | No auth |
|---|---|---|---|---|
| `all` | Yes | Yes | Yes | Yes |
| `admin` | No | Yes | Yes | No |
| `user` | Yes | No | Yes | No |

**Query params:**

| Param | Type | Notes |
|---|---|---|
| `category` | string | `supplements`, `equipment`, `apparel`, `accessories`, `supplies` |
| `search` | string | Full-text search on name + description |
| `page` | number | Default 1 |
| `limit` | number | Default 10, max 100 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "REAUX Whey Protein Isolate 1kg",
      "description": "Premium whey protein isolate with 28g protein per scoop.",
      "price": 2499,
      "compareAtPrice": 2999,
      "images": ["https://images.unsplash.com/..."],
      "category": "supplements",
      "stock": 120,
      "visibility": "all",
      "isActive": true,
      "createdBy": "...",
      "createdAt": "2026-03-01T00:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 6, "pages": 1 }
}
```

### `POST /api/products`
**Auth:** Required (admin/superadmin)

**Body (multipart/form-data):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Product name |
| `price` | number | Yes | Price in INR |
| `description` | string | No | |
| `compareAtPrice` | number | No | Strike-through price |
| `category` | string | No | e.g. `supplements`, `equipment` |
| `stock` | number | No | Default 0 |
| `visibility` | string | No | `all` (default), `admin`, or `user` |
| `nutrition` | object | No | `{ servingSize, calories, protein, carbs, fat, sugar }` |
| `images` | files | No | Max 5, jpeg/png/webp, 5MB each |

**Example — admin-only product:**
```json
{ "name": "Gym Floor Cleaner 5L", "price": 1499, "category": "supplies", "visibility": "admin" }
```

**Example — user-exclusive product:**
```json
{ "name": "Members-Only Gloves", "price": 899, "category": "accessories", "visibility": "user" }
```

### `PUT /api/products/:id`
**Auth:** Required (admin/superadmin)

Same fields as create (all optional) + `isActive: boolean`. Can change visibility:
```json
{ "visibility": "user" }
```

---

## Summary

| # | Feature | Status | Endpoint |
|---|---------|--------|----------|
| 1 | Reel commentsCount | DONE | `GET /reels`, `GET /reels/:id`, `POST /reels/:id/like` |
| 2 | Membership fee fields always present | DONE | All membership endpoints |
| 3 | Record fees + extendDays | DONE | `PUT /memberships/:id/fees` |
| 4 | Apply advance credit | DONE | `POST /memberships/:id/apply-credit` |
| 5 | Membership sorting | DONE | `GET /memberships?sortBy=&order=` |
| 6 | Birthday endpoints | DONE | `GET /users/birthdays/today`, `GET /users/birthdays/upcoming` |
| 7 | Saved addresses CRUD | DONE | `GET/POST/PUT/DELETE /users/addresses` |
| 8 | Suggested diets (BMI) | DONE | `GET /diets/suggested` |
| 9 | FCM push tokens + triggers | DONE | `POST/DELETE /notifications/device-token`, `POST /notifications/test` |
| 10 | Multi-gym admin (`gymIds`) | DONE | User model + all admin-scoped queries |
| 11 | Membership gymId filter | DONE | `GET /memberships?gymId=` |
| 12 | paymentHistory date always present | DONE | Schema default `Date.now` |
| 13 | Product visibility by role | DONE | `GET /products` with `optionalAuth`, `visibility` field on create/update |
