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

## 12. CYCLES — New `cycle` Module (Steroid Protocol Plans)

**Context:** The mobile app now has a "Steroids" tab (inside the Diet screen) backed by a full `cycle` feature — an admin-authored content library that mirrors the existing `diet` module. **No backend support exists yet.** Please add a new `cycle` module following the standard 5-file module pattern (`cycle.routes/controller/service/model/validator.js`), reusing `socialToggle.js` for like/follow exactly like `diet`.

**Endpoints (mirror `/diets`):**

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/cycles` | `optionalAuth` | Paginated list. Filters: `?category=&level=&type=&tag=&includeUnpublished=`. Non-admins must only receive `isPublished: true`. Include `isLiked`/`isFollowed` when authed. |
| `GET` | `/api/cycles/:id` | `optionalAuth` | Single cycle (populated `createdBy`). |
| `POST` | `/api/cycles` | `admin, superadmin` | Create. Accepts JSON or `multipart/form-data` with `image` (jpeg/png/webp, 5MB → `reaux-labs/cycles`). Nested `phases`, `pct`, `risks`, `tags` arrive JSON-stringified when multipart. |
| `PUT` | `/api/cycles/:id` | `admin, superadmin` | Update (partial). Same body/image rules. |
| `DELETE` | `/api/cycles/:id` | `admin, superadmin` | Delete. Returns `{ message }`. |
| `POST` | `/api/cycles/:id/follow` | authenticated | Toggle follow (use `socialToggle`). Return updated cycle with `isFollowed` + `followersCount`. |
| `POST` | `/api/cycles/:id/like` | authenticated | Toggle like (use `socialToggle`). Return updated cycle with `isLiked` + `likesCount`. |

**Enums (validator):**
- `category`: `bulking | cutting | recomp | pct | other`
- `level`: `beginner | intermediate | advanced`
- `type`: `oral | injectable | inj-oral`
- `risks[].severity`: `low | medium | high`

**Mongoose schema (`cycle.model.js`) — mirror `diet.model.js`:**
```js
const compoundSchema = new Schema({ name: String, dosage: String, frequency: String }, { _id: false });
const phaseSchema    = new Schema({ name: String, label: String, note: String, compounds: [compoundSchema] }, { _id: false });
const pctItemSchema  = new Schema({ name: String, dosage: String, duration: String }, { _id: false });
const riskSchema     = new Schema({ title: String, description: String, severity: { type: String, enum: ['low','medium','high'] } }, { _id: false });

const cycleSchema = new Schema({
  title:        { type: String, required: true },
  slug:         { type: String, unique: true },      // slugify(title), like diet
  description:  String,
  category:     { type: String, enum: ['bulking','cutting','recomp','pct','other'], required: true },
  level:        { type: String, enum: ['beginner','intermediate','advanced'] },
  type:         { type: String, enum: ['oral','injectable','inj-oral'] },
  durationWeeks: Number,
  estimatedGain: String,        // free text e.g. "15-20 lbs"
  image:        String,
  phases:       [phaseSchema],
  pct:          { startNote: String, items: [pctItemSchema] },
  risks:        [riskSchema],
  tags:         [String],
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  isPublished:  { type: Boolean, default: true },
  followers:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likes:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
```
Add virtuals/derived `likesCount` + `followersCount` and runtime `isLiked` / `isFollowed` (computed from `req.user`) — same as diet responses. Register the router at `/api/cycles` in `src/app.js`.

**Full cycle object shape the frontend expects:**
```json
{
  "_id": "...", "title": "Test E + Deca Mass Builder", "slug": "...",
  "description": "...", "category": "bulking", "level": "advanced", "type": "inj-oral",
  "durationWeeks": 16, "estimatedGain": "15-20 lbs", "image": "...",
  "phases": [ { "name": "Weeks 1-6", "label": "Kickstart Phase",
    "compounds": [ { "name": "Testosterone Enanthate", "dosage": "500mg / week", "frequency": "Pin Mon/Thu" } ],
    "note": "Drop Dianabol. Monitor E2 levels." } ],
  "pct": { "startNote": "Start 14-18 days after last injection.",
    "items": [ { "name": "Nolvadex", "dosage": "40/40/20/20 mg", "duration": "Daily for 4 weeks" } ] },
  "risks": [ { "title": "Water Retention", "description": "...", "severity": "high" } ],
  "tags": ["wet-bulk"], "createdBy": { "_id": "...", "name": "...", "avatar": "...", "role": "admin" },
  "isPublished": true, "followers": [], "likes": [],
  "likesCount": 0, "followersCount": 0, "isLiked": false, "isFollowed": false,
  "createdAt": "...", "updatedAt": "..."
}
```
> Frontend degrades gracefully until this ships: the Steroids tab shows an empty state rather than crashing (the API layer already exists at `src/api/endpoints/cycles.ts`).

---

## 13. POSTS — Per-Post Analytics Endpoint

**Context:** Admins and post authors now see a **Post Analytics** screen (bar-chart icon on the post detail). It calls `GET /api/posts/:id/analytics`, which does not exist yet.

**Endpoint:**

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/posts/:id/analytics` | authenticated (author OR `admin`/`superadmin`) | Returns view/like/comment totals + engagement trend. |

**Expected response `data` shape (`PostAnalytics`):**
```json
{
  "postId": "...",
  "totalViews": 10520,
  "totalLikes": 2400,
  "totalComments": 142,
  "engagementRate": 5.2,
  "engagementDelta": 1.2,
  "periodLabel": "Last 7 Days",
  "series": [3.1, 4.0, 3.4, 4.8, 2.9, 5.6, 5.2],
  "seriesLabels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
}
```
- `totalViews` requires a post-view counter (add a `viewsCount` field on the post, incremented on `GET /posts/:id`, or a lightweight `PostView` collection). `totalLikes`/`totalComments` already exist as `likesCount`/`commentsCount`.
- `engagementRate` = engagements / views × 100; `engagementDelta` = change vs the previous period.
- `series` drives a 7-point trend chart (any length ≥ 2 works; `seriesLabels` optional — frontend falls back to Mon–Sun).
> Frontend degrades gracefully: if this 404s, the analytics screen still shows likes/comments (read from the post) and hides views/engagement with a "tracking not enabled" note.

---

## 14. GYM — Candidates (streamlined member add/remove)

**Context:** The ADMIN design has a **"My Candidates"** screen and an **"Add New Candidate"** form that lets a gym admin add a member in ONE step from just **name + phone + monthly fee + start date + avatar** (no email/password/plan). The existing flow (`POST /users` needs email+password+gender+DOB, then `POST /memberships/assign` needs a `planId`) can't satisfy this in one call, so two thin endpoints are needed. Listing/removing already work via the memberships API; the frontend uses `membershipsApi.list({ gymId })` for the list and `membershipsApi.cancel(id)` as the interim remove.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/api/gyms/candidates` | `admin, superadmin` | Create a gym member + membership in one step. Accepts JSON or `multipart/form-data` with `avatar` (jpeg/png/webp, 5MB). Body: `{ name, phone, monthlyFees?, startDate? }`. Should create/att­ach a User scoped to the admin's gym (generate a placeholder email/login as needed, or make email optional for gym-created members), create a `UserMembership` with `feesAmount = monthlyFees` and the given `startDate`, and return the created `Membership` (populated `userId`). |
| `DELETE` | `/api/gyms/candidates/:id` | `admin, superadmin` | Hard-remove a candidate (the design's "remove the user from your gym data — all associated data removed"). `:id` is the membership id. Until this ships, the app falls back to `PATCH /memberships/:id/cancel`. |

**Expected create response `data`:** a `Membership` object (same shape the memberships list returns) with populated `userId` (name, phone, avatar), `feesAmount`, `feesDue`, `startDate`, `endDate`, `status`.
> Frontend degrades gracefully: My Candidates (list/search/fees-tab/remove/export) is fully functional today on existing endpoints; only **Add Candidate** waits on `POST /gyms/candidates` (shows a clear "service not available yet" message until it exists). The API client already exists at `src/api/endpoints/candidates.ts`.

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
| 13 | New `cycle` module — `GET/POST/PUT/DELETE /cycles` + `/like` + `/follow` (mirror `diet`) | Implement module | HIGH |
| 14 | `GET /posts/:id/analytics` + post `viewsCount` tracking | Implement endpoint | MEDIUM |
| 15 | `POST /gyms/candidates` (+ `DELETE /gyms/candidates/:id`) — one-step gym member add/remove | Implement endpoints | MEDIUM |
