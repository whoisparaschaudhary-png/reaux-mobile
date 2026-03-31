# Seed Data Reference

Run `npm run seed` to populate the database. **All passwords: `Pass1234`**

---

## Accounts

| Role | Name | Email | Gym |
|------|------|-------|-----|
| SuperAdmin | Anish Babbar | anish@reauxlabs.com | — |
| Admin | Rahul Sharma | rahul@reauxlabs.com | REAUX Fitness Delhi |
| Admin | Priya Patel | priya@reauxlabs.com | REAUX Fitness Mumbai |
| User | Arjun Mehta | arjun@gmail.com | REAUX Fitness Delhi |
| User | Sneha Gupta | sneha@gmail.com | REAUX Fitness Mumbai |
| User | Vikram Singh | vikram@gmail.com | REAUX Fitness Delhi |

---

## Gyms (3)

| Name | City | Admin | Amenities |
|------|------|-------|-----------|
| REAUX Fitness Delhi | Connaught Place, Delhi | Rahul Sharma | parking, AC, sauna, pool, locker, wifi, cafe |
| REAUX Fitness Mumbai | Bandra West, Mumbai | Priya Patel | parking, AC, steam, locker, wifi, juice bar, crossfit |
| REAUX Fitness Bangalore | Koramangala, Bangalore | — (no admin assigned) | parking, AC, sauna, locker, wifi, yoga studio |

---

## Membership Plans (6)

### Delhi (gym 1)
| Plan | Duration | Price | Key Features |
|------|----------|-------|--------------|
| Basic Monthly | 30 days | ₹1,500 | Gym floor, locker |
| Premium Quarterly | 90 days | ₹3,999 | + Sauna, pool, 2 PT sessions |
| Elite Yearly | 365 days | ₹12,999 | + Unlimited PT, nutrition plan, priority booking |

### Mumbai (gym 2)
| Plan | Duration | Price | Key Features |
|------|----------|-------|--------------|
| Basic Monthly | 30 days | ₹1,800 | Gym floor, locker |
| Premium Quarterly | 90 days | ₹4,499 | + Steam, crossfit, 4 PT sessions |

### Bangalore (gym 3)
| Plan | Duration | Price | Key Features |
|------|----------|-------|--------------|
| Premium Half-Yearly | 180 days | ₹6,999 | + Sauna, yoga studio, AI tracking |

---

## User Memberships (4) — Fees Scenarios

| Member | Plan | Status | Fees | Paid | Due | Advance Credit | Scenario |
|--------|------|--------|------|------|-----|----------------|---------|
| Arjun | Elite Yearly (Delhi) | Active | ₹12,999 | ₹12,999 | ₹0 | ₹0 | Fully paid |
| Sneha | Premium Quarterly (Mumbai) | Active | ₹4,499 | ₹2,000 | ₹2,499 | ₹0 | Partial — dues pending |
| Vikram | Basic Monthly (Delhi) | **Expired** | ₹1,500 | ₹1,500 | ₹0 | ₹0 | Old expired membership |
| Vikram | Premium Quarterly (Delhi) | Active | ₹3,999 | ₹5,000 | ₹0 | ₹1,001 | Overpaid — has advance credit |

> Use Vikram's active membership to test `POST /:id/apply-credit` and `PUT /:id/fees` with negative amount.
> Use Sneha's membership to test `PUT /:id/fees` (recording a payment to clear dues).

---

## Promo Codes (3)

| Code | Type | Value | Min Order | Max Discount | Expiry |
|------|------|-------|-----------|--------------|--------|
| `REAUX20` | Percentage | 20% | ₹999 | ₹500 | 30 Jun 2026 |
| `FLAT200` | Fixed | ₹200 | ₹1,500 | — | 31 Mar 2026 |
| `WELCOME50` | Percentage | 50% | ₹0 | ₹300 | 31 Dec 2026 |

---

## Diet Plans (4)

| Title | Category | Diet Type | Calories | Created By |
|-------|----------|-----------|----------|------------|
| Lean Muscle Gain Plan | muscle-gain | non-veg | 2,165 kcal | Rahul (Delhi admin) |
| Weight Loss Veg Plan | weight-loss | veg | 1,521 kcal | Priya (Mumbai admin) |
| Muscle Gain High Protein Plan | muscle-gain | non-veg | 2,882 kcal | Rahul (Delhi admin) |
| Cutting Plan — Shred Season | cutting | both | 924 kcal | Priya (Mumbai admin) |

**Likes / Follows:**
- Arjun follows: Lean Muscle, Muscle Gain
- Sneha follows: Weight Loss Veg
- Vikram follows: Lean Muscle, Cutting Plan, Muscle Gain

---

## Workouts (6)

| Title | Category | Difficulty | Duration | Calories | Created By |
|-------|----------|------------|----------|----------|------------|
| Full Body Strength — Beginner | strength | beginner | 45 min | 280 | Rahul |
| Push Day — Chest, Shoulders & Triceps | strength | intermediate | 60 min | 380 | Rahul |
| HIIT Cardio Blast — 20 Minutes | hiit | intermediate | 20 min | 300 | Priya |
| Morning Yoga Flow — 30 Minutes | yoga | beginner | 30 min | 120 | Priya |
| Pull Day — Back & Biceps | strength | intermediate | 55 min | 360 | Rahul |
| CrossFit WOD — Fran | crossfit | advanced | 15 min | 250 | Priya |

---

## Posts (5) & Comments (4)

| Post | Author | Media | Likes | Comments |
|------|--------|-------|-------|---------|
| 180kg deadlift PR | Arjun | Image | 3 | 2 |
| First 5K under 25min | Sneha | Image | 4 | 1 |
| Protein stock arrived | Rahul (admin) | Text | 2 | 1 |
| Meal prep Sunday | Vikram | Image | 3 | 0 |
| Yoga session Mumbai | Priya (admin) | Image | 1 | 0 |

---

## Reels (4) & Reel Comments (6)

| Reel | Author | Caption | Likes | Comments |
|------|--------|---------|-------|---------|
| Deadlift PR video | Arjun | 180kg deadlift PR | 3 | 2 |
| 5K run video | Sneha | First 5K under 25 min | 2 | 1 |
| Bench press form check | Vikram | 100kg x 5 form check | 1 | 2 |
| Gym tour Delhi | Rahul (admin) | REAUX Fitness Delhi tour | 3 | 1 |

---

## Products (6)

| Name | Category | Price | Stock |
|------|----------|-------|-------|
| REAUX Whey Protein Isolate 1kg | supplements | ₹2,499 | 120 |
| BCAA Powder 300g - Berry Blast | supplements | ₹999 | 80 |
| Premium Resistance Bands Set | equipment | ₹799 | 45 |
| REAUX Gym Stringer Tank Top | apparel | ₹599 | 200 |
| Creatine Monohydrate 250g | supplements | ₹649 | 95 |
| REAUX Shaker Bottle 700ml | accessories | ₹349 | 300 |

---

## Orders (4)

| User | Items | Total | Discount | Final | Status |
|------|-------|-------|----------|-------|--------|
| Sneha | Whey + Shaker | ₹2,848 | ₹300 (WELCOME50) | ₹2,548 | delivered |
| Arjun | BCAA x2 + Creatine | ₹2,647 | ₹500 (REAUX20) | ₹2,147 | shipped |
| Vikram | Bands + Tank x2 | ₹1,997 | ₹200 (FLAT200) | ₹1,797 | confirmed |
| Sneha | Creatine | ₹649 | ₹0 | ₹649 | pending |

---

## Challenges (2)

| Title | Type | Target | Participants | Status |
|-------|------|--------|--------------|--------|
| 30-Day 10K Steps Challenge | steps | 300,000 steps | Arjun (40%), Sneha (32%), Vikram (47%) | Active |
| February Push-Up Challenge | workout | 3,000 push-ups | Arjun (22%), Vikram (27%) | Active |

---

## Contact Submissions (4)

| Name | Subject | Status |
|------|---------|--------|
| Rohit Kapoor | Membership inquiry — Delhi gym | resolved |
| Meera Nair | Damaged protein product complaint | open |
| Sanjay Verma | App feedback + PDF suggestion | open |
| Deepika Reddy | Yoga classes inquiry — Mumbai | resolved |

---

## BMI Records

| User | Entries | Trend |
|------|---------|-------|
| Arjun | 3 (Dec–Feb) | 25.47 → 24.82 → 23.51 (improving — overweight to normal) |
| Sneha | 2 (Jan–Feb) | 22.66 → 21.48 (normal, losing weight) |
| Vikram | 3 (Nov–Feb) | 27.76 → 26.88 → 25.71 (overweight, improving) |

---

## Notifications (8)

- Arjun: Order shipped, Challenge update, Welcome
- Sneha: Order delivered, New diet plan, Welcome
- Vikram: Membership assigned, Order confirmed
