# REAUX Labs Mobile — Recent Changes

## 1. Reel Comments Fix

**Problem:** Comments posted on a reel detail screen would disappear when navigating away and coming back.

**Root Cause:** The `GET /reels/:id` endpoint does not return comments. The app was relying on the reel object itself for comments, which meant they were never re-fetched on focus.

**Fix:**
- Rewrote `src/api/endpoints/reels.ts` to add `getComments(id, params)` and `addComment(id, content)` endpoints hitting `GET /reels/:id/comments` and `POST /reels/:id/comment`
- Rewrote `src/stores/useReelStore.ts` to manage comments state (`comments`, `commentsLoading`, `fetchComments`, `addComment`, `clearComments`)
- Updated `app/(app)/(reels)/[id].tsx` to use `useFocusEffect` — fetches reel data and comments every time the screen comes into focus, clears on unmount
- Added `ReelComment` type to `src/types/models.ts`
- Updated `src/components/cards/CommentCard.tsx` to accept `Comment | ReelComment` union type

**Files changed:**
- `src/api/endpoints/reels.ts`
- `src/stores/useReelStore.ts`
- `app/(app)/(reels)/[id].tsx`
- `src/components/cards/CommentCard.tsx`
- `src/types/models.ts`

---

## 2. Admin Feed — Birthdays & Promotions Tabs

**Feature:** Two new admin-only tabs added to the feed screen immediately after the Workouts tab.

### Birthdays Tab
- Shows **Today's Birthdays** with a gift icon badge
- Shows **Upcoming Birthdays (Next 30 Days)** with a days-left countdown
- Fetches from `usersApi.getTodayBirthdays()` and `usersApi.getUpcomingBirthdays(30)`
- Displays member name, email, gym, and days until birthday

### Promotions Tab
- Lists all active and expired promo codes
- Shows discount type/value, usage count vs limit, expiry date
- Active/Expired badge per promo
- Fetches from `promosApi.list()`

**Files changed:**
- `app/(app)/(feed)/index.tsx`

---

## 3. Fee Credit Tracking

**Feature:** Track overpayments (credit) per member in the Fees admin screen.

### Credit Calculation
Credit is computed as:
```
credit = m.credit ?? (feesPaid > feesAmount && feesDue <= 0 ? feesPaid - feesAmount : 0)
```
Backend `credit` field is used if available; otherwise auto-computed from overpayment.

### Credit Tab
- New **Credit** filter tab in the fees screen showing members with a positive credit balance
- Displays total credit balance across all members

### Credit Banner
- Tappable banner shown above the filter tabs when any member has credit
- Tap navigates directly to the Credit tab

### Add / Edit Credit Modal
- **Fully paid members** show an "Add Credit" / "Edit Credit" button (wallet icon)
- **Credit tab rows** show an "Edit" button
- Modal displays:
  - Total Fee
  - Total Paid
  - Auto-calculated credit (from overpayment)
  - Current stored credit (if different)
- Credit amount field pre-filled with current credit value
- Optional note field
- Saves via `recordFees` API with the difference as a payment adjustment

### Payment Modal Enhancement
- Shows fee breakdown: Total Fee, Paid, Due, Existing Credit
- When entered amount exceeds the due, displays notice: *"₹X will be added as credit"*

**Files changed:**
- `app/(app)/(admin)/fees.tsx`
- `src/types/models.ts` (added `credit?: number` to `Membership`)

---

## 4. Other Improvements

| Area | Change |
|------|--------|
| Diet Plans | Edit and upload form improvements |
| Notifications | Enhanced notification screen, accessible to regular users |
| User Management | User creation screen added |
| Profile | Contact screen added |
| PDF Export | Invoice PDF export utility (`src/utils/pdfExport.ts`) |
| Feed Post Detail | Comment section improvements |
| App Layout | Tab bar and navigation updates |
