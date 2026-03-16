# REAUX Labs Mobile — Changes & API Gap Analysis

## Recent Changes (16 March 2026)

### 1. Backend API Updates (from Anish Babbar)

Four backend-side changes shipped on 16 March 2026:

#### 1a. `PUT /api/memberships/:id/fees` — `extendDays` param

The fees endpoint now accepts an optional `extendDays` integer. When provided:
- Adds N days to the membership's `endDate`
- Auto-reactivates memberships with status `expired` or `cancelled` back to `active`

**New request shape:**
```json
{ "amount": 1499, "note": "April fees", "extendDays": 30 }
```

#### 1b. Contact phone mandatory on backend

The `phone` field is now required when submitting the contact form on the backend. The frontend `contact.tsx` screen already collects phone, so no frontend change needed.

#### 1c. Multiple gyms per admin — `gymIds` array

The `User` model now has a `gymIds: [ObjectId]` array field in addition to the original `gymId`.

- `POST /api/gyms/:id/assign-admin` adds to `gymIds` **non-destructively** (existing gyms are not removed)
- All admin-scoped backend queries (memberships, fees, users) now check against **all gyms in `gymIds`**
- `gymId` still exists for backwards compatibility

#### 1d. `createOrder` push notification to superadmins

When a customer places an order, the backend now sends a push notification to all superadmins. This is backend-only — no frontend changes required.

---

### 2. Frontend Changes

#### 2a. `extendDays` in all Record Payment modals

Three payment modals updated to include an "Extend membership end date" toggle + days input:

- `app/(app)/(admin)/users/[id].tsx` — Record Payment modal in User Detail screen
- `app/(app)/(admin)/fees.tsx` — Record Payment modal in Fees screen (pre-fills from plan's `durationDays`)
- `app/(app)/(admin)/memberships/memberships/[id].tsx` — Record Payment modal in Membership Detail screen (pre-fills from plan's `durationDays`; only shown for payment mode, not advance/apply-credit modes)

#### 2b. Multi-gym admin assignment in User Detail

The Gym Assignment section in `app/(app)/(admin)/users/[id].tsx` was redesigned from a single-select dropdown to a **multi-select checkbox list**:
- All gyms shown with a checkbox per gym
- Tap to toggle assignment
- On Save, passes `gymIds: string[]` to `PUT /api/users/:id`

#### 2c. Editable name & phone in User Detail

Admin/superadmin can now edit a user's name and phone directly in `users/[id].tsx`:
- Name and phone `TextInput` fields shown below the read-only info card
- Changes detected in `hasChanges` and submitted via `updateUser`

#### 2d. Camera + gallery image picker for gym photos

`app/(app)/(admin)/gyms/create.tsx` now uses `pickImageWithCamera()` (shows an Alert with Camera / Gallery options) instead of gallery-only picker.

`src/hooks/useImagePicker.ts` was extended with:
- `_launchCamera()` — uses `expo-image-picker` `launchCameraAsync`
- `pickImageWithCamera()` — shows Alert dialog then calls camera or gallery

`app.json` updated:
- iOS `infoPlist`: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- Android `permissions`: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- `expo-image-picker` plugin added with permission strings

#### 2e. Password reset deep link (Android)

`app.json` now includes an Android `intentFilter` for `reauxlabs://reset-password` so the app opens the reset-password screen when users tap the email reset link on Android.

#### 2f. Post images use aspect ratio instead of fixed height

`src/components/cards/PostCard.tsx` and `app/(app)/(feed)/[id].tsx` changed image containers from `height: 280/300` (fixed) to `aspectRatio: 4/5` (portrait), so tall photos display correctly.

#### 2g. BMI tab always opens calculator, not history

`app/(app)/(health)/_layout.tsx` now exports `unstable_settings = { initialRouteName: 'index' }` so switching away from the History screen and back to the BMI tab always lands on the calculator.

#### 2h. Numeric input sanitisation

Fees/payment amount inputs in `fees.tsx`, `memberships/[id].tsx`, and `users/[id].tsx` use `.replace(/[^0-9.]/g, '')` in `onChangeText` to strip non-numeric characters on Android.

---

### 3. Bug Fixes

#### 3a. Payment history crash — `FeePayment.paidAt` vs `date`

The backend's `paymentHistory` entries return a `date` field, not `paidAt`. The TypeScript type had `paidAt: string` (required), causing `formatDate(undefined)` to throw "Invalid time value".

**Fixes:**
- `src/types/models.ts`: Changed `FeePayment.paidAt` to optional, added `date?: string` field
- `src/utils/formatters.ts`: `formatDate`, `formatDateTime`, `formatRelative` are now null-safe — return `'—'` for undefined/null/invalid dates
- Render site uses `p.date ?? p.paidAt ?? ''` as fallback chain

---

## Recent Changes (March 2026)

### 1. Reel Comments Fix

**Problem:** Comments posted on a reel detail screen would disappear when navigating away and coming back.

**Root Cause:** The `GET /reels/:id` endpoint does not return comments. The app was relying on the reel object itself for comments, which meant they were never re-fetched on focus.

**Fix:**
- Rewrote `src/api/endpoints/reels.ts` to add `getComments(id, params)` and `addComment(id, content)` endpoints hitting `GET /reels/:id/comments` and `POST /reels/:id/comment`
- Rewrote `src/stores/useReelStore.ts` to manage comments state (`comments`, `commentsLoading`, `fetchComments`, `addComment`, `clearComments`)
- Updated `app/(app)/(reels)/[id].tsx` to use `useFocusEffect` — fetches reel data and comments every time the screen comes into focus, clears on unmount
- Added `ReelComment` type to `src/types/models.ts`
- Updated `src/components/cards/CommentCard.tsx` to accept `Comment | ReelComment` union type

### 2. Admin Feed — Birthdays & Promotions Tabs

Two new admin-only tabs on the feed screen (after Workouts):

- **Birthdays tab**: Today's birthdays + upcoming (30 days) with countdown
- **Promotions tab**: Lists all promo codes with discount, usage, expiry, active/expired badge

### 3. Fee Credit Tracking

- New **Credit** tab in fees screen showing overpaid members
- Credit auto-computed as `feesPaid - feesAmount` (or from backend `credit` field)
- **Add/Edit Credit** modal per member with auto-calculated amount
- Payment modal shows credit notice when entered amount exceeds due

---

## Full API Coverage Audit

Cross-referenced the official backend API docs against the mobile app implementation.

### ✅ Section 1 — Auth (`/api/auth`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `/auth/register` | POST | ✅ Implemented |
| `/auth/login` | POST | ✅ Implemented |
| `/auth/me` | GET | ✅ Implemented |
| `/auth/profile` | PUT | ✅ Implemented (with avatar upload) |
| `/auth/forgot-password` | POST | ✅ Implemented |
| `/auth/reset-password` | POST | ⚠️ **API client exists, but NO screen** |

**Gap (RESOLVED):** `POST /auth/reset-password` is wired in `src/api/endpoints/auth.ts`. Screen `app/(auth)/reset-password.tsx` exists and reads the `token` param. Android deep link (`reauxlabs://reset-password`) added to `app.json` `intentFilters`.

---

### ✅ Section 2 — Users Admin (`/api/users`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /users` | GET | ✅ Implemented |
| `GET /users/:id` | GET | ✅ Implemented |
| `POST /users` | POST | ✅ Implemented (user creation screen) |
| `PUT /users/:id/role` | PUT | ✅ Implemented |
| `PUT /users/:id/status` | PUT | ✅ Implemented |
| `GET /users/birthdays/today` | GET | ⚠️ **App calls it — backend must confirm this exists** |
| `GET /users/birthdays/upcoming` | GET | ⚠️ **App calls it — backend must confirm this exists** |

**Gap (Backend):** The app calls `GET /users/birthdays/today` and `GET /users/birthdays/upcoming?days=30`. These endpoints **must exist on the backend** for the Birthdays tab to work. If not yet implemented, the backend dev needs to add them.

Expected response:
```json
{ "success": true, "data": [{ "_id": "...", "name": "...", "email": "...", "dateOfBirth": "...", "gymId": { "name": "..." } }] }
```

---

### ✅ Section 3 — Gyms (`/api/gyms`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /gyms` | GET | ✅ Implemented |
| `GET /gyms/:id` | GET | ✅ Implemented |
| `POST /gyms` | POST | ✅ Implemented |
| `PUT /gyms/:id` | PUT | ✅ Implemented |
| `DELETE /gyms/:id` | DELETE | ✅ Implemented (soft delete) |
| `POST /gyms/:id/assign-admin` | POST | ✅ Implemented (now adds to `gymIds` array non-destructively) |

---

### ✅ Section 4 — BMI (`/api/bmi`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `POST /bmi/record` | POST | ✅ Implemented |
| `GET /bmi/history` | GET | ✅ Implemented |
| `GET /bmi/latest` | GET | ✅ Implemented |

---

### ⚠️ Section 5 — Diet Plans (`/api/diets`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /diets` | GET | ✅ Implemented |
| `GET /diets/:id` | GET | ✅ Implemented |
| `POST /diets` | POST | ✅ Implemented |
| `PUT /diets/:id` | PUT | ✅ Implemented |
| `POST /diets/:id/follow` | POST | ✅ Implemented |
| `POST /diets/:id/like` | POST | ✅ Implemented |
| `GET /diets/suggested` | GET | ⚠️ **API client exists, screen partially built** |

**Gap:** `GET /diets/suggested` is defined in `src/api/endpoints/diets.ts` and a screen `app/(app)/(diet)/suggested.tsx` exists, but it is **not accessible from the BMI result screen**. After a user records their BMI, there is no "See Suggested Diets" button leading there.

**Fix needed:** Add a "View Suggested Diets" button/banner on `app/(app)/(health)/index.tsx` (BMI screen) after a BMI result is shown.

---

### ✅ Section 6 — Posts / Community (`/api/posts`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /posts` | GET | ✅ Implemented |
| `GET /posts/:id` | GET | ✅ Implemented |
| `POST /posts` | POST | ✅ Implemented |
| `POST /posts/:id/like` | POST | ✅ Implemented |
| `POST /posts/:id/comment` | POST | ✅ Implemented |
| `DELETE /posts/:id` | DELETE | ✅ API client exists |
| `DELETE /posts/:postId/comment/:commentId` | DELETE | ✅ API client exists |

---

### ✅ Section 7 — Reels (`/api/reels`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /reels` | GET | ✅ Implemented |
| `GET /reels/:id` | GET | ✅ Implemented |
| `POST /reels` | POST | ✅ Implemented (multipart, 120s timeout) |
| `POST /reels/:id/like` | POST | ✅ Implemented |
| `GET /reels/:id/comments` | GET | ✅ Implemented (just fixed) |
| `POST /reels/:id/comment` | POST | ✅ Implemented (just fixed) |

---

### ✅ Section 8 — Products (`/api/products`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /products` | GET | ✅ Implemented |
| `GET /products/:id` | GET | ✅ Implemented |
| `POST /products` | POST | ✅ Implemented |
| `PUT /products/:id` | PUT | ✅ Implemented |

---

### ✅ Section 9 — Cart (`/api/cart`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /cart` | GET | ✅ Implemented |
| `POST /cart/add` | POST | ✅ Implemented |
| `DELETE /cart/item/:productId` | DELETE | ✅ Implemented |

---

### ✅ Section 10 — Orders (`/api/orders`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `POST /orders/create` | POST | ✅ Implemented |
| `GET /orders/my` | GET | ✅ Implemented |
| `GET /orders` | GET | ✅ Implemented (admin) |
| `GET /orders/:id` | GET | ✅ Implemented |
| `PATCH /orders/:id/status` | PATCH | ✅ Implemented (admin) |

---

### ✅ Section 11 — Promo Codes (`/api/promo`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /promo` | GET | ✅ Implemented |
| `POST /promo/create` | POST | ✅ Implemented |
| `POST /promo/validate` | POST | ✅ Implemented |
| `GET /promo/:id` | GET | ✅ Implemented |
| `PUT /promo/:id` | PUT | ✅ API client exists (edit screen exists) |

---

### ✅ Section 12 — Challenges (`/api/challenges`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /challenges` | GET | ✅ Implemented |
| `POST /challenges` | POST | ✅ Implemented (admin) |
| `POST /challenges/:id/join` | POST | ✅ Implemented |

---

### ⚠️ Section 13 — Notifications (`/api/notifications`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /notifications` | GET | ✅ Implemented |
| `PUT /notifications/read/:id` | PUT | ✅ Implemented |
| `PATCH /notifications/mark-all-read` | PATCH | ✅ Implemented |
| `POST /notifications/device-token` | POST | ⚠️ **API client exists, NOT called in app** |
| `DELETE /notifications/device-token` | DELETE | ⚠️ **API client exists, NOT called in app** |
| `POST /notifications/test` | POST | ⚠️ **API client exists, NOT used** |

**Gap:** FCM/push notification device token registration is **never called** in the app. The `registerDeviceToken` and `removeDeviceToken` methods exist in `src/api/endpoints/notifications.ts` but are not wired to any Expo push token setup.

**Fix needed:**
1. Install `expo-notifications`
2. On app startup (after login), request permission and call `registerDeviceToken(expoToken)`
3. On logout, call `removeDeviceToken(expoToken)`

---

### ⚠️ Section 14 — Memberships (`/api/memberships`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /memberships/plans` | GET | ✅ Implemented (admin) |
| `GET /memberships/plans/:id` | GET | ✅ Implemented (admin) |
| `POST /memberships/plans` | POST | ✅ Implemented (admin) |
| `PUT /memberships/plans/:id` | PUT | ✅ Implemented (admin) |
| `DELETE /memberships/plans/:id` | DELETE | ✅ Implemented (admin) |
| `POST /memberships/assign` | POST | ✅ Implemented (admin) |
| `GET /memberships` | GET | ✅ Implemented (admin) |
| `GET /memberships/my` | GET | ✅ API client exists |
| `GET /memberships/:id` | GET | ✅ Implemented |
| `PATCH /memberships/:id/cancel` | PATCH | ✅ API client exists |
| `PUT /memberships/:id/fees` | PUT | ✅ Implemented (now supports `extendDays`) |

**Gap:** `GET /memberships/my` (My Memberships for the logged-in user) has an API client method but **no user-facing screen**. Regular users cannot see their own membership status, expiry date, or plan details anywhere in the app.

**Fix needed:** Add a "My Membership" card or section on the Profile screen (`app/(app)/(profile)/index.tsx`) that calls `getMyMemberships()` and displays the active membership.

---

### ✅ Section 15 — Analytics Admin (`/api/admin`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /admin/stats` | GET | ✅ Implemented |
| `GET /admin/sales-report` | GET | ✅ Implemented |

---

### ⚠️ Section 16 — Contact (`/api/contact`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| Contact form / submission | POST | ❌ **Static screen only — no API call** |

**Note:** `app/(app)/(profile)/contact.tsx` exists but is a static page with hardcoded phone/email/social links using `Linking.openURL()`. If the backend has a `POST /contact` endpoint to submit support requests, it is **not integrated**.

---

### ⚠️ Section 17 — Workouts (`/api/workouts`)

| Endpoint | Method | App Status |
|----------|--------|------------|
| `GET /workouts` | GET | ✅ API client + store + screen exist |
| `GET /workouts/:id` | GET | ✅ API client exists |
| `POST /workouts` | POST | ✅ API client exists (admin) |
| `PUT /workouts/:id` | PUT | ✅ API client exists (admin) |
| `DELETE /workouts/:id` | DELETE | ✅ API client exists (admin) |

**Gap:** Workouts screen exists at `app/(app)/(health)/workouts.tsx` with full functionality but it is **unclear if it's accessible from navigation**. It may not be linked from the tab bar or the health screen.

**Fix needed:** Confirm the workout screen is reachable. If not, add a "Workouts" entry on the Health/BMI tab or as a separate tab.

---

## Summary — Gaps by Priority

### 🔴 High Priority (User-facing broken flows)

| # | Feature | What's Missing | Effort |
|---|---------|----------------|--------|
| 1 | Password Reset | ~~No reset-password screen, no deep link~~ **✅ RESOLVED** (screen exists, deep link added to app.json) | — |
| 2 | My Membership | Regular users can't see their own membership | Small — add card to Profile screen |
| 3 | Diet Suggestions | BMI screen doesn't link to suggested diets | Small — add button to BMI result |

### 🟡 Medium Priority (Backend must confirm / missing wiring)

| # | Feature | What's Missing | Effort |
|---|---------|----------------|--------|
| 4 | Birthday Endpoints | Backend needs `GET /users/birthdays/today` and `GET /users/birthdays/upcoming` | Backend work |
| 5 | Push Notifications | Device token never registered with backend | Medium — expo-notifications setup |
| 6 | Workouts Navigation | Screen may not be reachable from the app | Small — add navigation link |

### 🟢 Low Priority (Nice to have)

| # | Feature | What's Missing | Effort |
|---|---------|----------------|--------|
| 7 | Contact Form API | Contact screen is static, no submission | Small — wire to POST /contact |
| 8 | Reel Comments Count | `commentsCount` not shown on reel cards | Small — add to ReelCard |
