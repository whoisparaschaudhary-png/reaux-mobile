# REAUX Labs — Backend Requirements for Frontend Compatibility

**Base URL:** `https://reaux-labs-be.onrender.com/api`
**Auth:** All protected routes require `Authorization: Bearer <JWT>` header
**Standard response envelope:**
```json
{ "success": true, "data": <payload>, "message": "..." }
```
**Paginated response envelope:**
```json
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 10, "total": 50, "pages": 5 } }
```

---

## 1. REELS — `commentsCount` Missing

**Problem:** The frontend renders comment count on every reel card. `commentsCount` is not being returned in reel list/detail responses, so it always shows 0.

**Fix:** Include `commentsCount` in every reel response object.

**Affected endpoints:**
- `GET /reels` (list)
- `GET /reels/:id` (detail)
- `POST /reels/:id/like` (like response)

**Expected reel object shape:**
```json
{
  "_id": "...",
  "author": { "_id": "...", "name": "...", "avatar": "..." },
  "videoUrl": "...",
  "caption": "...",
  "isLiked": false,
  "likesCount": 12,
  "commentsCount": 5,
  "linkedProduct": null,
  "createdAt": "..."
}
```

---

## 2. MEMBERSHIPS — Fee Fields Always Required

**Problem:** `feesDue`, `feesPaid`, `feesAmount`, `advanceCredit`, `lastPaymentDate` are sometimes missing or `null` in membership responses, causing the app to fall back to computed values that may be wrong.

**Fix:** Always return these fields in every membership response. Use `0` as default, never `null` or omit them.

**Affected endpoints:**
- `GET /memberships` (list)
- `GET /memberships/:id`
- `GET /memberships/my`
- `POST /memberships/assign` (response)
- `PUT /memberships/:id/fees` (response)
- `POST /memberships/:id/apply-credit` (response)
- `PATCH /memberships/:id/cancel` (response)

**Expected membership object shape:**
```json
{
  "_id": "...",
  "userId": { "_id": "...", "name": "...", "email": "...", "phone": "...", "avatar": "..." },
  "planId": { "_id": "...", "name": "...", "durationDays": 30, "price": 1500 },
  "gymId": { "_id": "...", "name": "..." },
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-03-31T00:00:00.000Z",
  "status": "active",
  "feesAmount": 1500,
  "feesPaid": 1000,
  "feesDue": 500,
  "advanceCredit": 0,
  "lastPaymentDate": "2026-03-10T00:00:00.000Z",
  "paymentHistory": [
    {
      "amount": 1000,
      "note": "First payment",
      "date": "2026-03-10T00:00:00.000Z",
      "recordedBy": "admin_user_id"
    }
  ],
  "assignedBy": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Key rules:**
- `feesDue` = `feesAmount - feesPaid` (always compute and return this)
- `advanceCredit` = amount paid over and above `feesAmount` (defaults to `0`)
- `paymentHistory[].date` must always be present (use `createdAt` of the record if no explicit date)
- When `extendDays` is provided in `PUT /memberships/:id/fees`, add that many days to `endDate`

---

## 3. MEMBERSHIPS — `PUT /memberships/:id/fees` with `extendDays`

**Endpoint:** `PUT /memberships/:id/fees`

**Request body:**
```json
{
  "amount": 500,
  "note": "Monthly payment",
  "extendDays": 30
}
```

**Logic:**
1. Add `amount` to `feesPaid`
2. Recalculate `feesDue = feesAmount - feesPaid`
3. If `feesDue < 0`: set `advanceCredit += abs(feesDue)`, set `feesDue = 0`
4. If `extendDays` provided and `> 0`: add `extendDays` days to `endDate`
5. Set `lastPaymentDate = now`
6. Append to `paymentHistory`: `{ amount, note, date: now, recordedBy: adminId }`
7. Return full updated membership object

**Negative amount (use advance credit):**
- If `amount < 0`: deduct from `advanceCredit`, reduce `feesPaid` by `abs(amount)`

---

## 4. MEMBERSHIPS — `POST /memberships/:id/apply-credit`

**Endpoint:** `POST /memberships/:id/apply-credit`

**Request body:**
```json
{ "amount": 300 }
```

**Logic:**
1. Validate: `amount <= advanceCredit`
2. `feesPaid += amount`
3. `advanceCredit -= amount`
4. Recalculate `feesDue = max(0, feesAmount - feesPaid)`
5. Append to `paymentHistory`: `{ amount, note: "Applied advance credit", date: now }`
6. Return full updated membership object

---

## 5. MEMBERSHIPS — Filtering and Sorting

**Endpoint:** `GET /memberships`

**Required query params to support:**
```
?status=active               → filter by status (active | expired | cancelled)
?userId=<id>                 → filter by user
?gymId=<id>                  → filter by gym
?sortBy=endDate&order=asc    → sort by endDate ascending (upcoming renewals)
?sortBy=feesDue&order=desc   → sort by feesDue descending (highest debt first)
?page=1&limit=10
```

---

## 6. USERS — Birthday Endpoints

**These endpoints are called in the Admin Dashboard. Implement if not already done.**

### `GET /users/birthdays/today`
Returns users whose `dateOfBirth` day+month matches today.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Ravi Sharma",
      "email": "ravi@example.com",
      "avatar": "https://...",
      "dateOfBirth": "1995-03-20",
      "gymId": { "name": "FitHub Mumbai" }
    }
  ]
}
```

### `GET /users/birthdays/upcoming?days=7`
Returns users whose birthday is within the next N days (excludes today).

**Response:** Same shape as above but each item has:
```json
{ ..., "daysUntil": 3 }
```

---

## 7. USERS — Saved Addresses

**All 4 endpoints are called from the checkout/address flow.**

### `GET /users/addresses`
Returns all saved addresses for the authenticated user.
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "label": "Home",
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "phone": "9876543210",
      "isDefault": true
    }
  ]
}
```

### `POST /users/addresses`
**Body:** `{ label, street, city, state, pincode, phone, isDefault? }`
**Response:** `{ success, data: <SavedAddress> }`

### `PUT /users/addresses/:id`
**Body:** partial address fields
**Response:** `{ success, data: <SavedAddress> }`

### `DELETE /users/addresses/:id`
**Response:** `{ success: true, data: { message: "Address deleted" } }`

---

## 8. DIETS — Suggested Plans Based on BMI

**Endpoint:** `GET /diets/suggested`

**Auth required.** Uses the authenticated user's latest BMI record to suggest matching diet plans.

**Logic:**
- Get user's latest BMI from `/bmi/latest`
- Map BMI category to diet categories:
  - `underweight` → `muscle-gain`, `bulking`
  - `normal` → `maintenance`
  - `overweight` → `weight-loss`, `cutting`
  - `obese` → `weight-loss`, `cutting`
- Return paginated list of matching published diet plans

**Query params:** `?page=1&limit=10`

**Response:** Standard `PaginatedResponse<DietPlan>` (same shape as `GET /diets`)

---

## 9. NOTIFICATIONS — Push Notifications (FCM)

**The frontend already has the API calls ready. These endpoints need to be implemented.**

### `POST /notifications/device-token`
Registers a device's FCM push token for the authenticated user.

**Body:** `{ "token": "<FCM_device_token>" }`
**Response:** `{ "success": true, "data": { "message": "Token registered" } }`

**Behavior:**
- Store the token against the user in DB
- Support multiple tokens per user (user may use multiple devices)
- On login: client will call this with the device token
- On logout: client calls DELETE to remove the token

### `DELETE /notifications/device-token`
Removes a device token (called on logout).

**Body:** `{ "token": "<FCM_device_token>" }`
**Response:** `{ "success": true, "data": { "message": "Token removed" } }`

### `POST /notifications/test`
Sends a test push notification to all of the current user's registered devices.

**Response:** `{ "success": true, "data": { "message": "Test notification sent" } }`

### Notification triggers (send push + create DB record)
When these events happen, create a `Notification` document AND send FCM push:

| Event | Recipients | Title | Message |
|-------|-----------|-------|---------|
| New order placed | Admin/superadmin | "New Order" | "Order #X placed by {userName}" |
| Order status updated | The order's user | "Order Update" | "Your order is now {status}" |
| Membership assigned | The member | "Membership Activated" | "Your {planName} membership starts {date}" |
| Membership expiring in 7 days | The member | "Membership Expiring" | "Your membership expires in 7 days" |
| Payment recorded | The member | "Payment Received" | "₹{amount} payment recorded" |
| Challenge joined | Admin | "Challenge Join" | "{userName} joined {challengeName}" |

### `GET /notifications`
**All users** (not just admin) must be able to call this.
Remove any role-based restriction on this endpoint.

**Query params:** `?page=1&limit=20&isRead=false`

---

## 10. GYMS — `gymId` Field on User (Multi-gym)

**Problem:** Admin users can be assigned to multiple gyms via `gymIds: string[]` but the backend may only support single `gymId`.

**Required changes:**
- `User` model should support both `gymId` (primary gym, backward compat) and `gymIds: string[]` (all assigned gyms)
- `PUT /users/:id` must accept `{ gymIds: string[] }` and update accordingly
- `GET /users/:id` must return `gymIds` array in the response

---

## 11. MEMBERSHIPS — `gymId` filter on list

**Endpoint:** `GET /memberships?gymId=<id>`

Used in "Gym Members" screen (admin sees members for their gym, superadmin filters by any gym).

Must return memberships where `gymId` matches the given value.

---

## Summary Table

| # | Endpoint | Status Needed | Priority |
|---|----------|---------------|----------|
| 1 | `GET /reels` — add `commentsCount` | Add field to response | HIGH |
| 2 | `GET /memberships`, `GET /memberships/:id` — always return fee fields | Fix null fields | HIGH |
| 3 | `PUT /memberships/:id/fees` — support `extendDays`, update `endDate` | Implement logic | HIGH |
| 4 | `POST /memberships/:id/apply-credit` | Implement endpoint | HIGH |
| 5 | `GET /memberships?sortBy=&order=` | Add sort params | MEDIUM |
| 6 | `GET /users/birthdays/today` + `/upcoming` | Implement endpoints | MEDIUM |
| 7 | `GET/POST/PUT/DELETE /users/addresses` | Implement CRUD | HIGH |
| 8 | `GET /diets/suggested` | Implement endpoint | MEDIUM |
| 9 | FCM device token endpoints + push triggers | Implement FCM | MEDIUM |
| 10 | `User.gymIds[]` multi-gym support | Schema + API update | MEDIUM |
| 11 | `GET /notifications` — allow all roles | Remove role guard | HIGH |
| 12 | Membership `paymentHistory[].date` always present | Fix field | HIGH |
