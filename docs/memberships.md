# Memberships API

## Overview

The membership system has two layers:

1. **Membership Plans** — templates that define what a gym offers (name, price, duration, features)
2. **User Memberships** — actual subscriptions linking a user to a plan at a specific gym

Plans are gym-specific. Each gym can have different plans with different pricing.

---

## Permissions

| Action | SuperAdmin | Admin | User |
|--------|-----------|-------|------|
| Create plans | All gyms | - | - |
| Update/delete plans | All gyms | - | - |
| View plans | All gyms | Own gym only | - |
| Assign membership to user | All gyms | Own gym only | - |
| View all memberships | All gyms | Own gym only | - |
| Cancel membership | All gyms | Own gym only | - |
| View own memberships | - | - | Own only |

> Admins are automatically scoped to their gym — they can only see and manage plans/memberships for the gym they're assigned to (`user.gymId`).

---

## API Endpoints

Base path: `/api/memberships`

All endpoints require authentication (`Authorization: Bearer <token>`).

---

### Plans

#### POST `/api/memberships/plans`

Create a new membership plan. **SuperAdmin only.**

**Body:**

```json
{
  "name": "Premium Quarterly",
  "gymId": "665f1a2b3c4d5e6f7a8b9c0d",
  "durationDays": 90,
  "price": 3999,
  "features": ["Gym Floor Access", "Pool", "Personal Trainer (2 sessions)"],
  "description": "Full access to all amenities for 3 months."
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Membership plan created",
  "data": {
    "_id": "...",
    "name": "Premium Quarterly",
    "gymId": "665f1a2b3c4d5e6f7a8b9c0d",
    "durationDays": 90,
    "price": 3999,
    "features": ["Gym Floor Access", "Pool", "Personal Trainer (2 sessions)"],
    "description": "Full access to all amenities for 3 months.",
    "isActive": true,
    "createdBy": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

#### GET `/api/memberships/plans`

List membership plans. **Admin + SuperAdmin.**

- Admins see only plans for their gym
- SuperAdmin sees all plans (optionally filter by `gymId`)

**Query params:**

| Param   | Type   | Description           |
|---------|--------|-----------------------|
| `gymId` | string | Filter by gym (superadmin only) |
| `page`  | number | Page number (default 1) |
| `limit` | number | Results per page (default 10, max 100) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Basic Monthly",
      "gymId": { "_id": "...", "name": "REAUX Fitness Delhi", "slug": "reaux-fitness-delhi" },
      "durationDays": 30,
      "price": 1500,
      "features": ["Gym Floor Access", "Locker Room"],
      "description": "...",
      "isActive": true
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "pages": 1 }
}
```

---

#### GET `/api/memberships/plans/:id`

Get a single plan by ID. **Admin + SuperAdmin.**

---

#### PUT `/api/memberships/plans/:id`

Update a plan. **SuperAdmin only.**

**Body (all fields optional):**

```json
{
  "name": "Basic Monthly (Updated)",
  "price": 1799,
  "features": ["Gym Floor Access", "Locker Room", "Wifi"],
  "isActive": false
}
```

---

#### DELETE `/api/memberships/plans/:id`

Soft-delete a plan (sets `isActive: false`). **SuperAdmin only.**

---

### User Memberships

#### POST `/api/memberships/assign`

Assign a membership plan to a user. **Admin + SuperAdmin.**

The `endDate` is automatically calculated as `startDate + plan.durationDays`. If no `startDate` is provided, it defaults to today.

A push notification is sent to the user when assigned.

**Body:**

```json
{
  "userId": "665f1a2b3c4d5e6f7a8b9c0d",
  "planId": "665f1a2b3c4d5e6f7a8b9c0e",
  "startDate": "2026-03-01"
}
```

| Field       | Required | Description                          |
|-------------|----------|--------------------------------------|
| `userId`    | Yes      | The user to assign the membership to |
| `planId`    | Yes      | The plan to assign                   |
| `startDate` | No       | Defaults to today if not provided    |

**Response (201):**

```json
{
  "success": true,
  "message": "Membership assigned",
  "data": {
    "_id": "...",
    "userId": "...",
    "planId": "...",
    "gymId": "...",
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-05-30T00:00:00.000Z",
    "status": "active",
    "assignedBy": "..."
  }
}
```

**Validations:**
- Plan must exist and be active
- User must exist
- Admin can only assign plans belonging to their gym

---

#### GET `/api/memberships`

List all user memberships. **Admin + SuperAdmin.**

- Admins see only memberships for their gym
- SuperAdmin sees all (optionally filter)

**Query params:**

| Param    | Type   | Description                            |
|----------|--------|----------------------------------------|
| `gymId`  | string | Filter by gym (superadmin only)        |
| `userId` | string | Filter by user                         |
| `status` | string | Filter: `active`, `expired`, `cancelled` |
| `page`   | number | Page number                            |
| `limit`  | number | Results per page                       |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": { "_id": "...", "name": "Arjun Mehta", "email": "arjun@gmail.com", "avatar": "..." },
      "planId": { "_id": "...", "name": "Elite Yearly", "durationDays": 365, "price": 12999, "features": ["..."] },
      "gymId": { "_id": "...", "name": "REAUX Fitness Delhi", "slug": "reaux-fitness-delhi" },
      "startDate": "2026-01-15T00:00:00.000Z",
      "endDate": "2027-01-15T00:00:00.000Z",
      "status": "active",
      "assignedBy": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 4, "pages": 1 }
}
```

---

#### GET `/api/memberships/my`

Get the logged-in user's own memberships. **Any authenticated user.**

Returns memberships with plan details (name, price, features, description) and gym info (name, slug, logo).

---

#### GET `/api/memberships/:id`

Get a single membership by ID. **Admin + SuperAdmin.**

---

#### PATCH `/api/memberships/:id/cancel`

Cancel a membership. **Admin + SuperAdmin.**

Sets status to `cancelled`. A push notification is sent to the user.

**Response:**

```json
{
  "success": true,
  "message": "Membership cancelled",
  "data": {
    "_id": "...",
    "status": "cancelled",
    "..."
  }
}
```

**Validations:**
- Membership must exist
- Cannot cancel an already-cancelled membership
- Admin can only cancel memberships for their gym

---

## Membership Statuses

| Status      | Description                                    |
|-------------|------------------------------------------------|
| `active`    | Currently valid (startDate <= now <= endDate)  |
| `expired`   | Past the end date                              |
| `cancelled` | Manually cancelled by admin/superadmin         |

> Note: Status is not automatically updated when `endDate` passes. The `expired` status must be set manually or via a scheduled job if needed in the future.

---

## React Native Usage

### Fetch Plans for a Gym

```javascript
async function getGymPlans(authToken, gymId) {
  const res = await fetch(
    `https://your-api.com/api/memberships/plans?gymId=${gymId}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return res.json();
}
```

### Get My Memberships

```javascript
async function getMyMemberships(authToken, page = 1) {
  const res = await fetch(
    `https://your-api.com/api/memberships/my?page=${page}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return res.json();
}
```

### Check If User Has Active Membership

```javascript
async function hasActiveMembership(authToken) {
  const res = await fetch(
    'https://your-api.com/api/memberships/my?status=active',
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const data = await res.json();
  return data.pagination.total > 0;
}
```

### Admin: Assign Membership

```javascript
async function assignMembership(authToken, userId, planId, startDate) {
  const body = { userId, planId };
  if (startDate) body.startDate = startDate;

  const res = await fetch('https://your-api.com/api/memberships/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
```

### Admin: Cancel Membership

```javascript
async function cancelMembership(authToken, membershipId) {
  const res = await fetch(
    `https://your-api.com/api/memberships/${membershipId}/cancel`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return res.json();
}
```

---

## Data Model

### MembershipPlan

| Field          | Type     | Description                    |
|----------------|----------|--------------------------------|
| `name`         | String   | Plan name (e.g. "Basic Monthly") |
| `gymId`        | ObjectId | Gym this plan belongs to       |
| `durationDays` | Number   | Duration in days (30, 90, 365) |
| `price`        | Number   | Price in INR                   |
| `features`     | [String] | List of included features      |
| `description`  | String   | Optional details               |
| `isActive`     | Boolean  | Soft delete flag               |
| `createdBy`    | ObjectId | SuperAdmin who created it      |

### UserMembership

| Field        | Type     | Description                            |
|--------------|----------|----------------------------------------|
| `userId`     | ObjectId | The member                             |
| `planId`     | ObjectId | Which plan                             |
| `gymId`      | ObjectId | Which gym (denormalized for fast queries) |
| `startDate`  | Date     | When membership starts                 |
| `endDate`    | Date     | Auto-calculated: startDate + durationDays |
| `status`     | String   | `active` / `expired` / `cancelled`     |
| `assignedBy` | ObjectId | Admin who assigned it                  |

---

## Notifications

| Event                | Recipient | Message                                          |
|----------------------|-----------|--------------------------------------------------|
| Membership assigned  | User      | `You've been assigned the "Plan Name" at Gym Name` |
| Membership cancelled | User      | `Your "Plan Name" has been cancelled`            |

Both in-app notifications (MongoDB) and push notifications (FCM) are sent simultaneously.
