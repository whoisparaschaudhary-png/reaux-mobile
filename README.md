# REAUX Labs Mobile

Fitness/gym community + e-commerce mobile app built with **React Native**, **Expo SDK 54**, and **Expo Router v6**. Features social feed, short-form reels, diet plans, BMI/BMR tracking, supplement shop, and admin panel. Backend: `https://reaux-labs-be.onrender.com/api`. Currency: **INR (₹)**.

## Tech Stack

- React Native 0.81.5 + Expo ~54
- Expo Router v6 (file-based routing)
- Zustand (state), Axios (API), FlashList, expo-image, expo-video
- SplineSans fonts, Ionicons

## What’s Implemented (as of now)

### Auth & Profile
- Login/register with JWT; register has first/last name, DOB, +91 phone (10 digits).
- Profile: phone is **compulsory and non-editable** (set at registration); email non-editable.
- Extended profile edit: name, height, weight, DOB, gender.

### Feed & Reels
- Feed with category tabs (For You, Workouts, Nutrition, My Admins). **Workouts** uses category `workouts` so workout posts show correctly.
- **Per-category cache**: switching tabs keeps each tab’s list; data persists.
- Post create: author shows correctly (no “Unknown”) after create and after like.
- Reels: comment & share actions; reel detail screen with like and share.
- My Admins and Nutrition tabs hidden for admin users.

### Diet Plans
- List with category filters; create/edit plan (admin); follow/like.
- Create: validation for calories, numeric keyboard; new plan appears in list and in filters.
- **Author on card**: creator name shown (no “Unknown”) via store merge of `createdBy`.
- **Publish/Unpublish** on plan detail (admin/superadmin); updates `isPublished` via API.
- After create, list refresh is skipped once so the new plan stays visible.
- **After app reload**: admin list requests `includeUnpublished=true` so backend can return current user’s unpublished plans (backend must support this).

### BMI / Health
- BMI calculator; BMR (Mifflin–St Jeor) and TDEE with activity level.
- BMI result: ideal weight range, comparison note, BMI scale, short “What is BMI?” note.

### Shop & Checkout
- **Saved address**: Add Address saves to cart store + AsyncStorage; Cart and Checkout show and prefill it so user isn’t asked to add address again after save.
- Cart, checkout, promo, orders, invoice.
- **Invoice Download PDF**: uses `exportSingleOrderPDF`; share/save via system sheet.

### Admin
- Dashboard, analytics, sales report, products/orders/users (and gyms for superadmin), challenges, promo, notifications.

### Fixes & Polish
- Bottom tab bar uses safe area insets for consistent height across devices.
- `react-native-worklets` aligned with Expo SDK; expo-notifications subscription cleanup.
- Diet plan create error handling shows backend validation messages.

## Run

```bash
npm install --legacy-peer-deps
npx expo start
# or
npm run android
```

See **CLAUDE.md** for full structure, theme, API reference, and conventions.
