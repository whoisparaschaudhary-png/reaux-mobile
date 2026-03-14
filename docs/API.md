# REAUX_labs API Documentation

**Version:** 1.0
**Base URL (local):** `http://localhost:5001/api`
**Base URL (production):** `https://reaux-labs-be.onrender.com/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Standard Response Format](#standard-response-format)
3. [Roles](#roles)
4. [Seed Data / Test Accounts](#seed-data--test-accounts)
5. [Auth](#1-auth)
6. [Users (Admin)](#2-users-admin)
7. [Gyms](#3-gyms)
8. [BMI](#4-bmi)
9. [Diet Plans](#5-diet-plans)
10. [Posts / Community](#6-posts--community)
11. [Reels](#7-reels)
12. [Products](#8-products)
13. [Cart](#9-cart)
14. [Orders](#10-orders)
15. [Promo Codes](#11-promo-codes)
16. [Challenges](#12-challenges)
17. [Notifications](#13-notifications)
18. [Memberships](#14-memberships)
19. [Analytics (Admin)](#15-analytics-admin)

---

## Authentication

REAUX_labs uses **JSON Web Tokens (JWT)** for authentication. Tokens are returned upon successful registration or login and expire after **7 days** (configurable via `JWT_EXPIRES_IN`).

### Header Format

Include the token in the `Authorization` header for all protected routes:

```
Authorization: Bearer <token>
```

### Token Payload

The JWT payload contains:

| Field    | Type   | Description           |
|----------|--------|-----------------------|
| `userId` | string | The user's MongoDB ID |
| `role`   | string | The user's role        |

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

> The `message` field is included only when the controller explicitly provides one (e.g., "Registration successful", "Login successful", "Profile updated").

### Paginated Response

All list endpoints that support pagination return data in this envelope. The `limit` parameter is capped at **100** results per page.

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "pages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Description of the error"
}
```

In development mode, a `stack` trace is also included:

```json
{
  "success": false,
  "message": "Description of the error",
  "stack": "Error: ..."
}
```

### Common Error Codes

| Status Code | Meaning                | Typical Cause                                   |
|-------------|------------------------|-------------------------------------------------|
| `400`       | Bad Request            | Validation failure, invalid input               |
| `401`       | Unauthorized           | Missing/invalid/expired token, wrong credentials |
| `403`       | Forbidden              | Account disabled, insufficient role permissions  |
| `404`       | Not Found              | Resource does not exist, invalid route           |
| `409`       | Conflict               | Duplicate entry (email, gym name, etc.)          |
| `429`       | Too Many Requests      | Rate limit exceeded                              |
| `500`       | Internal Server Error  | Unexpected server error                          |

---

## Roles

| Role         | Description                                                                                      |
|--------------|--------------------------------------------------------------------------------------------------|
| `user`       | Default role. Can manage own profile, track BMI, follow diet plans, create posts/reels, shop, join challenges. |
| `admin`      | Gym administrator. All user permissions plus ability to create diet plans, products, challenges, and view analytics. |
| `superadmin` | Full system access. All admin permissions plus user management, gym CRUD, promo codes, role/status changes, and sales reports. |

---

## Seed Data / Test Accounts

Run `node seed.js` to populate the database with test data. This clears all existing data and inserts fresh records.

### Test Accounts

| Role | Name | Email | Password |
|------|------|-------|----------|
| **SuperAdmin** | Anish Babbar | `anish@reauxlabs.com` | `Pass1234` |
| **Admin** (Delhi Gym) | Rahul Sharma | `rahul@reauxlabs.com` | `Pass1234` |
| **Admin** (Mumbai Gym) | Priya Patel | `priya@reauxlabs.com` | `Pass1234` |
| **User** | Arjun Mehta | `arjun@gmail.com` | `Pass1234` |
| **User** | Sneha Gupta | `sneha@gmail.com` | `Pass1234` |
| **User** | Vikram Singh | `vikram@gmail.com` | `Pass1234` |

### Seeded Data Summary

| Collection | Count | Details |
|------------|-------|---------|
| Users | 6 | 1 superadmin, 2 admins, 3 users |
| Gyms | 3 | Delhi, Mumbai, Bangalore |
| BMI Records | 8 | Progress tracking over months per user |
| Diet Plans | 3 | Keto, Vegan, High Protein (with meals & macros) |
| Posts | 5 | Text posts with hashtags, likes, comments |
| Comments | 4 | On various posts |
| Reels | 4 | With video URLs, likes |
| Products | 6 | Supplements, equipment, apparel, accessories |
| Carts | 2 | Active carts for 2 users |
| Orders | 4 | Various statuses (pending, confirmed, shipped, delivered) |
| Promo Codes | 3 | `REAUX20` (20%), `FLAT200` (flat 200), `WELCOME50` (50%) |
| Challenges | 2 | 30-Day Steps, February Push-Ups (with participants & progress) |
| Notifications | 8 | Order, challenge, community, diet, system types |

### Promo Codes

| Code | Type | Value | Min Order | Max Discount | Valid Until |
|------|------|-------|-----------|-------------|-------------|
| `REAUX20` | Percentage | 20% | 999 | 500 | 2026-06-30 |
| `FLAT200` | Fixed | 200 | 1500 | - | 2026-03-31 |
| `WELCOME50` | Percentage | 50% | 0 | 300 | 2026-12-31 |

---

## Health Check

### `GET /api/health`

Quick health-check endpoint. No authentication required. Returns `200` when healthy, `503` when the database is disconnected.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "REAUX_labs API is running",
  "timestamp": "2025-06-15T14:00:00.000Z",
  "uptime": 3600.123,
  "database": "connected"
}
```

**Response (503 Service Unavailable):**

```json
{
  "success": false,
  "message": "Service degraded",
  "timestamp": "2025-06-15T14:00:00.000Z",
  "uptime": 3600.123,
  "database": "disconnected"
}
```

---

## 1. Auth

Base path: `/api/auth`

### 1.1 Register

```
POST /api/auth/register
```

**Auth:** None

**Request Body:**

| Field      | Type   | Required | Constraints              | Description                        |
|------------|--------|----------|---------------------------|------------------------------------|
| `name`     | string | Yes      | min: 2, max: 100          | User's full name                   |
| `email`    | string | Yes      | Valid email format         | User's email address               |
| `password` | string | Yes      | min: 6, max: 128          | Account password                   |
| `phone`    | string | No       |                           | Phone number                       |
| `gymId`    | string | No       | Valid MongoDB ObjectId     | ID of the gym to associate with    |

**Request Example:**

```json
{
  "name": "Arjun Patel",
  "email": "arjun@example.com",
  "password": "StrongPass123",
  "phone": "+91-9876543210",
  "gymId": "665a1f2e3c4b5d6e7f8a9b0c"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "665b2a3f4d5c6e7f8a9b0d1e",
      "name": "Arjun Patel",
      "email": "arjun@example.com",
      "phone": "+91-9876543210",
      "role": "user",
      "gymId": "665a1f2e3c4b5d6e7f8a9b0c",
      "status": "active",
      "createdAt": "2025-06-01T10:30:00.000Z",
      "updatedAt": "2025-06-01T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

*409 Conflict -- Email already registered:*

```json
{
  "success": false,
  "message": "Email already registered"
}
```

*400 Bad Request -- Validation failure:*

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "path": "body.email", "message": "Invalid email" }
  ]
}
```

---

### 1.2 Login

```
POST /api/auth/login
```

**Auth:** None

**Request Body:**

| Field      | Type   | Required | Constraints       | Description        |
|------------|--------|----------|--------------------|--------------------|
| `email`    | string | Yes      | Valid email format  | Registered email   |
| `password` | string | Yes      | min: 1             | Account password   |

**Request Example:**

```json
{
  "email": "arjun@example.com",
  "password": "StrongPass123"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "665b2a3f4d5c6e7f8a9b0d1e",
      "name": "Arjun Patel",
      "email": "arjun@example.com",
      "phone": "+91-9876543210",
      "role": "user",
      "gymId": "665a1f2e3c4b5d6e7f8a9b0c",
      "status": "active",
      "createdAt": "2025-06-01T10:30:00.000Z",
      "updatedAt": "2025-06-01T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

*401 Unauthorized -- Wrong credentials:*

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

*403 Forbidden -- Account disabled:*

```json
{
  "success": false,
  "message": "Account is disabled"
}
```

---

### 1.3 Get Current User

```
GET /api/auth/me
```

**Auth:** Bearer Token (any role)

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665b2a3f4d5c6e7f8a9b0d1e",
    "name": "Arjun Patel",
    "email": "arjun@example.com",
    "phone": "+91-9876543210",
    "role": "user",
    "gymId": {
      "_id": "665a1f2e3c4b5d6e7f8a9b0c",
      "name": "Iron Paradise Gym",
      "slug": "iron-paradise-gym",
      "logo": "https://cdn.reauxlabs.com/gyms/iron-paradise-logo.png",
      "address": {
        "street": "42 MG Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001"
      }
    },
    "avatar": "https://cdn.reauxlabs.com/avatars/arjun.jpg",
    "height": 175,
    "weight": 72,
    "dateOfBirth": "1996-03-15T00:00:00.000Z",
    "gender": "male",
    "status": "active",
    "createdAt": "2025-06-01T10:30:00.000Z",
    "updatedAt": "2025-06-10T14:20:00.000Z"
  }
}
```

**Error Responses:**

*401 Unauthorized -- No token:*

```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

*401 Unauthorized -- Invalid/expired token:*

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### 1.4 Update Profile

```
PUT /api/auth/profile
```

**Auth:** Bearer Token (any role)

**Request Body:**

| Field         | Type   | Required | Constraints                       | Description          |
|---------------|--------|----------|------------------------------------|-----------------------|
| `name`        | string | No       | min: 2, max: 100                   | Full name            |
| `phone`       | string | No       |                                    | Phone number         |
| `height`      | number | No       | Must be positive                   | Height in cm         |
| `weight`      | number | No       | Must be positive                   | Weight in kg         |
| `dateOfBirth` | string | No       | Date string (e.g., "1996-03-15")   | Date of birth        |
| `gender`      | string | No       | One of: `male`, `female`, `other`  | Gender               |

**Request Example:**

```json
{
  "height": 175,
  "weight": 72,
  "gender": "male",
  "dateOfBirth": "1996-03-15"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "_id": "665b2a3f4d5c6e7f8a9b0d1e",
    "name": "Arjun Patel",
    "email": "arjun@example.com",
    "phone": "+91-9876543210",
    "role": "user",
    "gymId": {
      "_id": "665a1f2e3c4b5d6e7f8a9b0c",
      "name": "Iron Paradise Gym",
      "slug": "iron-paradise-gym",
      "logo": "https://cdn.reauxlabs.com/gyms/iron-paradise-logo.png",
      "address": {
        "street": "42 MG Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001"
      }
    },
    "height": 175,
    "weight": 72,
    "dateOfBirth": "1996-03-15T00:00:00.000Z",
    "gender": "male",
    "status": "active",
    "createdAt": "2025-06-01T10:30:00.000Z",
    "updatedAt": "2025-06-10T14:20:00.000Z"
  }
}
```

---

### 1.5 Forgot Password

```
POST /api/auth/forgot-password
```

**Auth:** None

Sends a password reset email if the email exists. Always returns success to prevent email enumeration.

**Request Body:**

| Field   | Type   | Required | Constraints       | Description      |
|---------|--------|----------|-------------------|------------------|
| `email` | string | Yes      | Valid email format | Account email    |

**Request Example:**

```json
{
  "email": "arjun@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent"
}
```

---

### 1.6 Reset Password

```
POST /api/auth/reset-password
```

**Auth:** None

Resets the user's password using a valid reset token (received via email). Tokens expire after 1 hour and can only be used once.

**Request Body:**

| Field         | Type   | Required | Constraints | Description                         |
|---------------|--------|----------|-------------|-------------------------------------|
| `token`       | string | Yes      | min: 1       | Reset token from the email link     |
| `newPassword` | string | Yes      | min: 6       | New password                        |

**Request Example:**

```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NewStrongPass456"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**

*400 Bad Request -- Invalid or expired token:*

```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

---

## 2. Users (Admin)

Base path: `/api/users`

All endpoints in this module require authentication and elevated role permissions.

### 2.1 List Users

```
GET /api/users
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**Query Parameters:**

| Parameter | Type   | Default | Description               |
|-----------|--------|---------|----------------------------|
| `page`    | number | 1       | Page number                |
| `limit`   | number | 10      | Results per page           |

**Request Example:**

```
GET /api/users?page=1&limit=10
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "665b2a3f4d5c6e7f8a9b0d1e",
      "name": "Arjun Patel",
      "email": "arjun@example.com",
      "phone": "+91-9876543210",
      "role": "user",
      "gymId": "665a1f2e3c4b5d6e7f8a9b0c",
      "status": "active",
      "createdAt": "2025-06-01T10:30:00.000Z",
      "updatedAt": "2025-06-10T14:20:00.000Z"
    },
    {
      "_id": "665c3b4a5e6d7f8a9b0c1d2f",
      "name": "Priya Sharma",
      "email": "priya@example.com",
      "role": "admin",
      "gymId": "665a1f2e3c4b5d6e7f8a9b0c",
      "status": "active",
      "createdAt": "2025-05-20T08:15:00.000Z",
      "updatedAt": "2025-06-05T11:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Error Responses:**

*403 Forbidden -- Insufficient role:*

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

---

### 2.2 Get User by ID

```
GET /api/users/:id
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | User's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665b2a3f4d5c6e7f8a9b0d1e",
    "name": "Arjun Patel",
    "email": "arjun@example.com",
    "phone": "+91-9876543210",
    "role": "user",
    "gymId": "665a1f2e3c4b5d6e7f8a9b0c",
    "avatar": "https://cdn.reauxlabs.com/avatars/arjun.jpg",
    "height": 175,
    "weight": 72,
    "dateOfBirth": "1996-03-15T00:00:00.000Z",
    "gender": "male",
    "status": "active",
    "createdAt": "2025-06-01T10:30:00.000Z",
    "updatedAt": "2025-06-10T14:20:00.000Z"
  }
}
```

**Error Responses:**

*404 Not Found:*

```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 2.3 Update User Role

```
PUT /api/users/:id/role
```

**Auth:** Bearer Token
**Role:** `superadmin` only

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | User's MongoDB ID |

**Request Body:**

| Field  | Type   | Required | Constraints                              | Description |
|--------|--------|----------|-------------------------------------------|-------------|
| `role` | string | Yes      | One of: `user`, `admin`, `superadmin`      | New role    |

**Request Example:**

```json
{
  "role": "admin"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User role updated",
  "data": {
    "_id": "665b2a3f4d5c6e7f8a9b0d1e",
    "name": "Arjun Patel",
    "email": "arjun@example.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2025-06-01T10:30:00.000Z",
    "updatedAt": "2025-06-12T09:00:00.000Z"
  }
}
```

**Error Responses:**

*403 Forbidden -- Not superadmin:*

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

---

### 2.4 Update User Status

```
PUT /api/users/:id/status
```

**Auth:** Bearer Token
**Role:** `superadmin` only

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | User's MongoDB ID |

**Request Body:**

| Field    | Type   | Required | Constraints                     | Description |
|----------|--------|----------|---------------------------------|-------------|
| `status` | string | Yes      | One of: `active`, `disabled`     | New status  |

**Request Example:**

```json
{
  "status": "disabled"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User status updated",
  "data": {
    "_id": "665b2a3f4d5c6e7f8a9b0d1e",
    "name": "Arjun Patel",
    "email": "arjun@example.com",
    "role": "user",
    "status": "disabled",
    "createdAt": "2025-06-01T10:30:00.000Z",
    "updatedAt": "2025-06-12T09:05:00.000Z"
  }
}
```

---

## 3. Gyms

Base path: `/api/gyms`

### 3.1 Create Gym

```
POST /api/gyms
```

**Auth:** Bearer Token
**Role:** `superadmin` only

**Request Body:**

| Field                      | Type     | Required | Constraints           | Description                  |
|----------------------------|----------|----------|-----------------------|------------------------------|
| `name`                     | string   | Yes      | min: 2, max: 200       | Gym name                     |
| `description`              | string   | No       | max: 2000              | Gym description              |
| `address`                  | object   | Yes      |                       | Address object               |
| `address.street`           | string   | Yes      | min: 1                 | Street address               |
| `address.city`             | string   | Yes      | min: 1                 | City                         |
| `address.state`            | string   | Yes      | min: 1                 | State                        |
| `address.pincode`          | string   | Yes      | min: 1                 | PIN code                     |
| `address.coordinates`      | object   | No       |                       | Geo coordinates              |
| `address.coordinates.lat`  | number   | No       |                       | Latitude                     |
| `address.coordinates.lng`  | number   | No       |                       | Longitude                    |
| `phone`                    | string   | No       |                       | Contact phone                |
| `email`                    | string   | No       | Valid email format     | Contact email                |
| `amenities`                | string[] | No       |                       | List of amenities            |
| `openingHours`             | object   | No       |                       | Weekly hours                 |
| `openingHours.[day]`       | object   | No       |                       | Per-day hours                |
| `openingHours.[day].open`  | string   | No       |                       | Opening time (e.g., "06:00") |
| `openingHours.[day].close` | string   | No       |                       | Closing time (e.g., "22:00") |

> `[day]` can be: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`

**Request Example:**

```json
{
  "name": "Iron Paradise Gym",
  "description": "Premium fitness center with state-of-the-art equipment and certified trainers.",
  "address": {
    "street": "42 MG Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  },
  "phone": "+91-80-12345678",
  "email": "info@ironparadise.com",
  "amenities": ["cardio", "free-weights", "steam-room", "personal-training", "parking"],
  "openingHours": {
    "monday": { "open": "05:30", "close": "22:00" },
    "tuesday": { "open": "05:30", "close": "22:00" },
    "wednesday": { "open": "05:30", "close": "22:00" },
    "thursday": { "open": "05:30", "close": "22:00" },
    "friday": { "open": "05:30", "close": "22:00" },
    "saturday": { "open": "07:00", "close": "20:00" },
    "sunday": { "open": "07:00", "close": "18:00" }
  }
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "665a1f2e3c4b5d6e7f8a9b0c",
    "name": "Iron Paradise Gym",
    "slug": "iron-paradise-gym",
    "description": "Premium fitness center with state-of-the-art equipment and certified trainers.",
    "address": {
      "street": "42 MG Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "coordinates": { "lat": 12.9716, "lng": 77.5946 }
    },
    "phone": "+91-80-12345678",
    "email": "info@ironparadise.com",
    "amenities": ["cardio", "free-weights", "steam-room", "personal-training", "parking"],
    "openingHours": {
      "monday": { "open": "05:30", "close": "22:00" },
      "tuesday": { "open": "05:30", "close": "22:00" },
      "wednesday": { "open": "05:30", "close": "22:00" },
      "thursday": { "open": "05:30", "close": "22:00" },
      "friday": { "open": "05:30", "close": "22:00" },
      "saturday": { "open": "07:00", "close": "20:00" },
      "sunday": { "open": "07:00", "close": "18:00" }
    },
    "images": [],
    "isActive": true,
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "createdAt": "2025-06-01T08:00:00.000Z",
    "updatedAt": "2025-06-01T08:00:00.000Z"
  }
}
```

**Error Responses:**

*409 Conflict -- Duplicate gym name:*

```json
{
  "success": false,
  "message": "A gym with this name already exists"
}
```

---

### 3.2 List Gyms

```
GET /api/gyms
```

**Auth:** None (public)

**Query Parameters:**

| Parameter | Type   | Default | Description                           |
|-----------|--------|---------|----------------------------------------|
| `page`    | number | 1       | Page number                            |
| `limit`   | number | 10      | Results per page                       |
| `city`    | string |         | Filter by city (case-insensitive)      |
| `sort`    | string |         | Sort field (default: newest first)     |

**Request Example:**

```
GET /api/gyms?page=1&limit=5&city=Bangalore
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "665a1f2e3c4b5d6e7f8a9b0c",
      "name": "Iron Paradise Gym",
      "slug": "iron-paradise-gym",
      "description": "Premium fitness center with state-of-the-art equipment.",
      "address": {
        "street": "42 MG Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001"
      },
      "amenities": ["cardio", "free-weights", "steam-room"],
      "isActive": true,
      "createdAt": "2025-06-01T08:00:00.000Z",
      "updatedAt": "2025-06-01T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 12,
    "pages": 3
  }
}
```

> Only active gyms (`isActive: true`) are returned.

---

### 3.3 Get Gym by ID

```
GET /api/gyms/:id
```

**Auth:** None (public)

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | Gym's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665a1f2e3c4b5d6e7f8a9b0c",
    "name": "Iron Paradise Gym",
    "slug": "iron-paradise-gym",
    "description": "Premium fitness center with state-of-the-art equipment and certified trainers.",
    "address": {
      "street": "42 MG Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "coordinates": { "lat": 12.9716, "lng": 77.5946 }
    },
    "phone": "+91-80-12345678",
    "email": "info@ironparadise.com",
    "images": ["https://cdn.reauxlabs.com/gyms/iron-paradise-1.jpg"],
    "logo": "https://cdn.reauxlabs.com/gyms/iron-paradise-logo.png",
    "amenities": ["cardio", "free-weights", "steam-room", "personal-training", "parking"],
    "openingHours": {
      "monday": { "open": "05:30", "close": "22:00" },
      "saturday": { "open": "07:00", "close": "20:00" },
      "sunday": { "open": "07:00", "close": "18:00" }
    },
    "isActive": true,
    "createdBy": {
      "_id": "665d4c5b6e7f8a9b0c1d2e3f",
      "name": "Vikram Singh",
      "email": "vikram@reauxlabs.com"
    },
    "createdAt": "2025-06-01T08:00:00.000Z",
    "updatedAt": "2025-06-01T08:00:00.000Z"
  }
}
```

**Error Responses:**

*404 Not Found:*

```json
{
  "success": false,
  "message": "Gym not found"
}
```

---

### 3.4 Update Gym

```
PUT /api/gyms/:id
```

**Auth:** Bearer Token
**Role:** `superadmin` only

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | Gym's MongoDB ID |

**Request Body:**

All fields from the create schema are accepted, but all are optional. Additional fields:

| Field      | Type     | Required | Description                      |
|------------|----------|----------|----------------------------------|
| `images`   | string[] | No       | Array of image URLs              |
| `logo`     | string   | No       | Logo URL                         |
| `isActive` | boolean  | No       | Whether the gym is active        |

**Request Example:**

```json
{
  "description": "Updated: Now with an Olympic swimming pool!",
  "amenities": ["cardio", "free-weights", "steam-room", "swimming-pool", "personal-training"],
  "logo": "https://cdn.reauxlabs.com/gyms/iron-paradise-logo-v2.png"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665a1f2e3c4b5d6e7f8a9b0c",
    "name": "Iron Paradise Gym",
    "slug": "iron-paradise-gym",
    "description": "Updated: Now with an Olympic swimming pool!",
    "amenities": ["cardio", "free-weights", "steam-room", "swimming-pool", "personal-training"],
    "logo": "https://cdn.reauxlabs.com/gyms/iron-paradise-logo-v2.png",
    "isActive": true,
    "updatedAt": "2025-06-12T10:00:00.000Z"
  }
}
```

---

### 3.5 Delete Gym (Soft Delete)

```
DELETE /api/gyms/:id
```

**Auth:** Bearer Token
**Role:** `superadmin` only

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | Gym's MongoDB ID |

> This performs a **soft delete** by setting `isActive` to `false`. The gym record is not physically removed from the database.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665a1f2e3c4b5d6e7f8a9b0c",
    "name": "Iron Paradise Gym",
    "isActive": false,
    "updatedAt": "2025-06-12T10:30:00.000Z"
  }
}
```

**Error Responses:**

*404 Not Found:*

```json
{
  "success": false,
  "message": "Gym not found"
}
```

---

### 3.6 Assign Gym Admin

```
POST /api/gyms/:id/assign-admin
```

**Auth:** Bearer Token
**Role:** `superadmin` only

Promotes a user to the `admin` role and associates them with the specified gym.

**URL Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | Gym's MongoDB ID |

**Request Body:**

| Field    | Type   | Required | Constraints             | Description                  |
|----------|--------|----------|--------------------------|------------------------------|
| `userId` | string | Yes      | min: 1, valid ObjectId   | ID of the user to promote    |

**Request Example:**

```json
{
  "userId": "665c3b4a5e6d7f8a9b0c1d2f"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665c3b4a5e6d7f8a9b0c1d2f",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "admin",
    "gymId": "665a1f2e3c4b5d6e7f8a9b0c",
    "status": "active",
    "updatedAt": "2025-06-12T11:00:00.000Z"
  }
}
```

**Error Responses:**

*404 Not Found -- Gym or user not found:*

```json
{
  "success": false,
  "message": "Gym not found"
}
```

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 4. BMI

Base path: `/api/bmi`

All BMI endpoints require authentication. Records are scoped to the authenticated user.

### 4.1 Record BMI

```
POST /api/bmi/record
```

**Auth:** Bearer Token (any role)

**Request Body:**

| Field    | Type   | Required | Constraints    | Description            |
|----------|--------|----------|----------------|------------------------|
| `height` | number | Yes      | Must be positive | Height in centimeters |
| `weight` | number | Yes      | Must be positive | Weight in kilograms   |

> The BMI value and category (`underweight`, `normal`, `overweight`, `obese`) are calculated automatically by the server.

**Request Example:**

```json
{
  "height": 175,
  "weight": 72
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "665e5d6c7f8a9b0c1d2e3f40",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "height": 175,
    "weight": 72,
    "bmi": 23.51,
    "category": "normal",
    "createdAt": "2025-06-12T12:00:00.000Z",
    "updatedAt": "2025-06-12T12:00:00.000Z"
  }
}
```

---

### 4.2 Get BMI History

```
GET /api/bmi/history
```

**Auth:** Bearer Token (any role)

Returns the authenticated user's BMI records in reverse chronological order.

**Query Parameters:**

| Parameter | Type   | Default | Description     |
|-----------|--------|---------|-----------------|
| `page`    | number | 1       | Page number     |
| `limit`   | number | 10      | Results per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "665e5d6c7f8a9b0c1d2e3f40",
      "userId": "665b2a3f4d5c6e7f8a9b0d1e",
      "height": 175,
      "weight": 72,
      "bmi": 23.51,
      "category": "normal",
      "createdAt": "2025-06-12T12:00:00.000Z"
    },
    {
      "_id": "665d4c5b6e7f8a9b0c1d2e3a",
      "userId": "665b2a3f4d5c6e7f8a9b0d1e",
      "height": 175,
      "weight": 78,
      "bmi": 25.47,
      "category": "overweight",
      "createdAt": "2025-05-01T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "pages": 1
  }
}
```

---

### 4.3 Get Latest BMI

```
GET /api/bmi/latest
```

**Auth:** Bearer Token (any role)

Returns the most recent BMI record for the authenticated user.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665e5d6c7f8a9b0c1d2e3f40",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "height": 175,
    "weight": 72,
    "bmi": 23.51,
    "category": "normal",
    "createdAt": "2025-06-12T12:00:00.000Z"
  }
}
```

---

## 5. Diet Plans

Base path: `/api/diets`

### 5.1 Create Diet Plan

```
POST /api/diets
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**Request Body:**

| Field                     | Type     | Required | Constraints                                                                 | Description                  |
|---------------------------|----------|----------|-----------------------------------------------------------------------------|------------------------------|
| `title`                   | string   | Yes      | min: 2, max: 200                                                             | Diet plan title              |
| `category`                | string   | Yes      | One of: `weight-loss`, `muscle-gain`, `maintenance`, `keto`, `vegan`, `other` | Plan category                |
| `description`             | string   | No       | max: 2000                                                                    | Plan description             |
| `meals`                   | array    | No       |                                                                             | Array of meal objects        |
| `meals[].name`            | string   | Yes      | min: 1                                                                       | Meal name (e.g., "Breakfast") |
| `meals[].time`            | string   | No       |                                                                             | Suggested time (e.g., "08:00") |
| `meals[].items`           | array    | No       |                                                                             | Array of food items          |
| `meals[].items[].name`    | string   | Yes      | min: 1                                                                       | Food item name               |
| `meals[].items[].quantity`| string   | No       |                                                                             | Quantity (e.g., "200g")      |
| `meals[].items[].calories`| number   | No       |                                                                             | Calories                     |
| `meals[].items[].protein` | number   | No       |                                                                             | Protein in grams             |
| `meals[].items[].carbs`   | number   | No       |                                                                             | Carbs in grams               |
| `meals[].items[].fat`     | number   | No       |                                                                             | Fat in grams                 |
| `image`                   | string   | No       |                                                                             | Cover image URL              |
| `totalCalories`           | number   | No       | Must be positive                                                             | Total daily calories         |
| `tags`                    | string[] | No       |                                                                             | Searchable tags              |
| `isPublished`             | boolean  | No       | Default: `false`                                                             | Whether publicly visible     |

**Request Example:**

```json
{
  "title": "Lean Muscle Builder - 2500 Cal",
  "category": "muscle-gain",
  "description": "A high-protein diet plan designed for lean muscle growth with clean eating.",
  "totalCalories": 2500,
  "isPublished": true,
  "tags": ["high-protein", "muscle-gain", "clean-eating"],
  "meals": [
    {
      "name": "Breakfast",
      "time": "07:30",
      "items": [
        { "name": "Egg whites", "quantity": "6 eggs", "calories": 102, "protein": 22, "carbs": 0, "fat": 0 },
        { "name": "Oatmeal", "quantity": "80g", "calories": 300, "protein": 10, "carbs": 54, "fat": 5 },
        { "name": "Banana", "quantity": "1 medium", "calories": 105, "protein": 1, "carbs": 27, "fat": 0 }
      ]
    },
    {
      "name": "Post-Workout Shake",
      "time": "10:30",
      "items": [
        { "name": "Whey Protein", "quantity": "1 scoop", "calories": 120, "protein": 25, "carbs": 3, "fat": 1 },
        { "name": "Peanut Butter", "quantity": "1 tbsp", "calories": 95, "protein": 4, "carbs": 3, "fat": 8 }
      ]
    }
  ]
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "665f6e7d8a9b0c1d2e3f4051",
    "title": "Lean Muscle Builder - 2500 Cal",
    "slug": "lean-muscle-builder-2500-cal",
    "category": "muscle-gain",
    "description": "A high-protein diet plan designed for lean muscle growth with clean eating.",
    "totalCalories": 2500,
    "isPublished": true,
    "tags": ["high-protein", "muscle-gain", "clean-eating"],
    "meals": [ ... ],
    "followers": [],
    "likes": [],
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "createdAt": "2025-06-12T14:00:00.000Z",
    "updatedAt": "2025-06-12T14:00:00.000Z"
  }
}
```

---

### 5.2 Update Diet Plan

```
PUT /api/diets/:id
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**URL Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `id`      | string | Diet plan's MongoDB ID |

**Request Body:** Same fields as create, but all are optional.

**Request Example:**

```json
{
  "totalCalories": 2600,
  "isPublished": true
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665f6e7d8a9b0c1d2e3f4051",
    "title": "Lean Muscle Builder - 2500 Cal",
    "totalCalories": 2600,
    "isPublished": true,
    "updatedAt": "2025-06-13T09:00:00.000Z"
  }
}
```

---

### 5.3 List Diet Plans

```
GET /api/diets
```

**Auth:** None (public)

**Query Parameters:**

| Parameter  | Type   | Default | Description                           |
|------------|--------|---------|----------------------------------------|
| `page`     | number | 1       | Page number                            |
| `limit`    | number | 10      | Results per page                       |
| `category` | string |         | Filter by category (e.g., `keto`)      |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "665f6e7d8a9b0c1d2e3f4051",
      "title": "Lean Muscle Builder - 2500 Cal",
      "slug": "lean-muscle-builder-2500-cal",
      "category": "muscle-gain",
      "description": "A high-protein diet plan designed for lean muscle growth.",
      "totalCalories": 2500,
      "image": "https://cdn.reauxlabs.com/diets/muscle-builder.jpg",
      "tags": ["high-protein", "muscle-gain", "clean-eating"],
      "isPublished": true,
      "createdAt": "2025-06-12T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

---

### 5.4 Get Diet Plan by ID

```
GET /api/diets/:id
```

**Auth:** None (public)

**URL Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `id`      | string | Diet plan's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "665f6e7d8a9b0c1d2e3f4051",
    "title": "Lean Muscle Builder - 2500 Cal",
    "slug": "lean-muscle-builder-2500-cal",
    "category": "muscle-gain",
    "description": "A high-protein diet plan designed for lean muscle growth with clean eating.",
    "totalCalories": 2500,
    "meals": [
      {
        "name": "Breakfast",
        "time": "07:30",
        "items": [
          { "name": "Egg whites", "quantity": "6 eggs", "calories": 102, "protein": 22, "carbs": 0, "fat": 0 },
          { "name": "Oatmeal", "quantity": "80g", "calories": 300, "protein": 10, "carbs": 54, "fat": 5 }
        ]
      }
    ],
    "tags": ["high-protein", "muscle-gain", "clean-eating"],
    "followers": ["665b2a3f4d5c6e7f8a9b0d1e"],
    "likes": ["665b2a3f4d5c6e7f8a9b0d1e", "665c3b4a5e6d7f8a9b0c1d2f"],
    "isPublished": true,
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "createdAt": "2025-06-12T14:00:00.000Z"
  }
}
```

---

### 5.5 Follow/Unfollow Diet Plan

```
POST /api/diets/:id/follow
```

**Auth:** Bearer Token (any role)

Toggles the authenticated user's follow status on the diet plan. If the user is currently following, they will unfollow; if not following, they will follow.

**URL Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `id`      | string | Diet plan's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Diet plan followed"
}
```

or

```json
{
  "success": true,
  "message": "Diet plan unfollowed"
}
```

---

### 5.6 Like/Unlike Diet Plan

```
POST /api/diets/:id/like
```

**Auth:** Bearer Token (any role)

Toggles the authenticated user's like on the diet plan.

**URL Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `id`      | string | Diet plan's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Diet plan liked"
}
```

or

```json
{
  "success": true,
  "message": "Diet plan unliked"
}
```

---

### 5.7 Get Suggested Diets (BMI-Based)

```
GET /api/diets/suggested
```

**Auth:** Bearer Token (any role)

Returns diet plan recommendations based on the authenticated user's most recent BMI record. Uses a rule-based mapping from BMI category to diet category and calorie range.

**BMI-to-Diet Mapping:**

| BMI Category | Suggested Diet Category | Calorie Range |
|-------------|------------------------|---------------|
| underweight | `muscle-gain` | 2500–3500 |
| normal | `maintenance` | 1800–2500 |
| overweight | `weight-loss` | 1200–1800 |
| obese | `weight-loss` | 1000–1500 |

**Fallback Logic:**
1. Match by category + calorie range
2. If no results → match by category only (ignore calorie range)
3. If still no results → return all published diets

**Query Parameters:**

| Parameter | Type   | Default | Description      |
|-----------|--------|---------|------------------|
| `page`    | number | 1       | Page number      |
| `limit`   | number | 10      | Results per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "suggestion": {
    "bmiCategory": "normal",
    "bmi": 22.5,
    "recommendedCategory": "maintenance",
    "calorieRange": { "min": 1800, "max": 2500 }
  },
  "data": [
    {
      "_id": "665f6e7d8a9b0c1d2e3f4051",
      "title": "Balanced Maintenance Plan",
      "slug": "balanced-maintenance-plan",
      "category": "maintenance",
      "totalCalories": 2000,
      "image": "https://cdn.reauxlabs.com/diets/maintenance.jpg",
      "isPublished": true,
      "createdBy": {
        "_id": "665d4c5b6e7f8a9b0c1d2e3f",
        "name": "Rahul Sharma",
        "avatar": "https://cdn.reauxlabs.com/profiles/rahul.jpg"
      },
      "createdAt": "2025-06-12T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

**Error Response (404 — No BMI Record):**

```json
{
  "success": false,
  "message": "No BMI record found. Please record your BMI first."
}
```

---

## 6. Posts / Community

Base path: `/api/posts`

All post endpoints require authentication.

### 6.1 Create Post

```
POST /api/posts
```

**Auth:** Bearer Token (any role)

**Request Body:**

| Field       | Type     | Required | Constraints                            | Description                    |
|-------------|----------|----------|----------------------------------------|--------------------------------|
| `content`   | string   | Yes      | min: 1                                  | Post text content              |
| `mediaType` | string   | No       | One of: `text`, `image`, `video`         | Type of media (default: `text`) |
| `mediaUrl`  | string   | No       |                                        | URL to media file              |
| `hashtags`  | string[] | No       |                                        | Post hashtags                  |
| `category`  | string   | No       |                                        | Post category                  |

**Request Example:**

```json
{
  "content": "Just completed a 5K run in 24 minutes! Consistency pays off. #running #fitness",
  "mediaType": "image",
  "mediaUrl": "https://cdn.reauxlabs.com/posts/run-5k-proof.jpg",
  "hashtags": ["running", "fitness", "cardio"],
  "category": "achievement"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "66607f8e9a0b1c2d3e4f5062",
    "author": "665b2a3f4d5c6e7f8a9b0d1e",
    "content": "Just completed a 5K run in 24 minutes! Consistency pays off. #running #fitness",
    "mediaType": "image",
    "mediaUrl": "https://cdn.reauxlabs.com/posts/run-5k-proof.jpg",
    "hashtags": ["running", "fitness", "cardio"],
    "category": "achievement",
    "likes": [],
    "likesCount": 0,
    "commentsCount": 0,
    "createdAt": "2025-06-13T07:00:00.000Z",
    "updatedAt": "2025-06-13T07:00:00.000Z"
  }
}
```

---

### 6.2 List Posts

```
GET /api/posts
```

**Auth:** Bearer Token (any role)

**Query Parameters:**

| Parameter  | Type   | Default | Description                            |
|------------|--------|---------|----------------------------------------|
| `page`     | number | 1       | Page number                            |
| `limit`    | number | 10      | Results per page                       |
| `category` | string |         | Filter by category                     |
| `hashtag`  | string |         | Filter by hashtag                      |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "66607f8e9a0b1c2d3e4f5062",
      "author": {
        "_id": "665b2a3f4d5c6e7f8a9b0d1e",
        "name": "Arjun Patel",
        "avatar": "https://cdn.reauxlabs.com/avatars/arjun.jpg"
      },
      "content": "Just completed a 5K run in 24 minutes!",
      "mediaType": "image",
      "mediaUrl": "https://cdn.reauxlabs.com/posts/run-5k-proof.jpg",
      "hashtags": ["running", "fitness", "cardio"],
      "category": "achievement",
      "likesCount": 12,
      "commentsCount": 3,
      "createdAt": "2025-06-13T07:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 89,
    "pages": 9
  }
}
```

---

### 6.3 Get Post by ID

```
GET /api/posts/:id
```

**Auth:** Bearer Token (any role)

**URL Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `id`      | string | Post's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "66607f8e9a0b1c2d3e4f5062",
    "author": {
      "_id": "665b2a3f4d5c6e7f8a9b0d1e",
      "name": "Arjun Patel",
      "avatar": "https://cdn.reauxlabs.com/avatars/arjun.jpg"
    },
    "content": "Just completed a 5K run in 24 minutes! Consistency pays off.",
    "mediaType": "image",
    "mediaUrl": "https://cdn.reauxlabs.com/posts/run-5k-proof.jpg",
    "hashtags": ["running", "fitness", "cardio"],
    "category": "achievement",
    "likes": ["665b2a3f4d5c6e7f8a9b0d1e", "665c3b4a5e6d7f8a9b0c1d2f"],
    "likesCount": 12,
    "commentsCount": 3,
    "createdAt": "2025-06-13T07:00:00.000Z",
    "updatedAt": "2025-06-13T10:30:00.000Z"
  }
}
```

---

### 6.4 Like/Unlike Post

```
POST /api/posts/:id/like
```

**Auth:** Bearer Token (any role)

Toggles the authenticated user's like on the post.

**URL Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `id`      | string | Post's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Post liked"
}
```

or

```json
{
  "success": true,
  "message": "Post unliked"
}
```

---

### 6.5 Add Comment

```
POST /api/posts/:id/comment
```

**Auth:** Bearer Token (any role)

**URL Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `id`      | string | Post's MongoDB ID |

**Request Body:**

| Field     | Type   | Required | Constraints | Description    |
|-----------|--------|----------|-------------|----------------|
| `content` | string | Yes      | min: 1       | Comment text   |

**Request Example:**

```json
{
  "content": "Great pace! Keep it up!"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "66618a9fab1c2d3e4f506173",
    "postId": "66607f8e9a0b1c2d3e4f5062",
    "author": "665b2a3f4d5c6e7f8a9b0d1e",
    "content": "Great pace! Keep it up!",
    "createdAt": "2025-06-13T11:00:00.000Z",
    "updatedAt": "2025-06-13T11:00:00.000Z"
  }
}
```

---

## 7. Reels

Base path: `/api/reels`

### 7.1 Create Reel

```
POST /api/reels
```

**Auth:** Bearer Token (any role)

**Content-Type:** `multipart/form-data` (for file upload) or `application/json` (for URL)

**Form Data (file upload):**

| Field           | Type   | Required | Description                       |
|-----------------|--------|----------|-----------------------------------|
| `video`         | file   | Yes*     | Video file (mp4, mov, avi). Max 100MB. Uploaded to Cloudinary. |
| `caption`       | string | No       | Reel caption                      |
| `linkedProduct` | string | No       | Product ID to link to the reel    |

**JSON Body (URL-based, no file upload):**

| Field           | Type   | Required | Description                       |
|-----------------|--------|----------|-----------------------------------|
| `videoUrl`      | string | Yes*     | URL of an existing video          |
| `caption`       | string | No       | Reel caption                      |
| `linkedProduct` | string | No       | Product ID to link to the reel    |

> *Either `video` file or `videoUrl` must be provided.

**Request Example (file upload via curl):**

```bash
curl -X POST http://localhost:5001/api/reels \
  -H "Authorization: Bearer <token>" \
  -F "video=@workout.mp4" \
  -F "caption=My deadlift PR!"
```

**Request Example (JSON with URL):**

```json
{
  "videoUrl": "https://example.com/videos/workout.mp4",
  "caption": "My deadlift PR!"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Reel created",
  "data": {
    "_id": "698624a8a1a4e084ed96408e",
    "author": "698622d81e80db14e947565b",
    "videoUrl": "https://res.cloudinary.com/dfusrxsq6/video/upload/v1770398886/reaux-labs/reels/ub8wtfrzacnclwuokymo.mp4",
    "caption": "My deadlift PR!",
    "likes": [],
    "likesCount": 0,
    "createdAt": "2026-02-06T17:28:08.668Z",
    "updatedAt": "2026-02-06T17:28:08.668Z"
  }
}
```

---

### 7.2 List Reels

```
GET /api/reels
```

**Auth:** None (public)

**Query Parameters:**

| Parameter | Type   | Default | Description     |
|-----------|--------|---------|-----------------|
| `page`    | number | 1       | Page number     |
| `limit`   | number | 10      | Results per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6661ab0ecd2e3f4a5b6c7d83",
      "author": {
        "_id": "665b2a3f4d5c6e7f8a9b0d1e",
        "name": "Arjun Patel",
        "avatar": "https://cdn.reauxlabs.com/avatars/arjun.jpg"
      },
      "videoUrl": "https://cdn.reauxlabs.com/reels/deadlift-form-guide.mp4",
      "caption": "Proper deadlift form - avoid these common mistakes!",
      "linkedProduct": {
        "_id": "6662ab0ecd2e3f4a5b6c7d84",
        "name": "REAUX Lifting Straps",
        "price": 799
      },
      "likesCount": 45,
      "createdAt": "2025-06-14T06:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 32,
    "pages": 4
  }
}
```

> **Note:** The `likes` array is excluded from list responses to reduce payload size. Only `likesCount` is returned. Use the detail endpoint (7.3) to get full reel data.

---

### 7.3 Get Reel by ID

```
GET /api/reels/:id
```

**Auth:** None (public)

**URL Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `id`      | string | Reel's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "698624a8a1a4e084ed96408e",
    "author": {
      "_id": "698622d81e80db14e947565b",
      "name": "Arjun Patel",
      "avatar": "https://cdn.reauxlabs.com/avatars/arjun.jpg"
    },
    "videoUrl": "https://res.cloudinary.com/dfusrxsq6/video/upload/v1770398886/reaux-labs/reels/ub8wtfrzacnclwuokymo.mp4",
    "caption": "Proper deadlift form - avoid these common mistakes!",
    "linkedProduct": {
      "_id": "6662ab0ecd2e3f4a5b6c7d84",
      "name": "REAUX Lifting Straps",
      "price": 799,
      "images": ["https://cdn.reauxlabs.com/products/lifting-straps-1.jpg"]
    },
    "likes": ["665b2a3f4d5c6e7f8a9b0d1e"],
    "likesCount": 1,
    "createdAt": "2026-02-06T17:28:08.668Z",
    "updatedAt": "2026-02-06T17:28:08.668Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Reel not found"
}
```

---

### 7.4 Like/Unlike Reel

```
POST /api/reels/:id/like
```

**Auth:** Bearer Token (any role)

Toggles the authenticated user's like on the reel.

**URL Parameters:**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `id`      | string | Reel's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Reel liked"
}
```

or

```json
{
  "success": true,
  "message": "Reel unliked"
}
```

---

## 8. Products

Base path: `/api/products`

### 8.1 List Products

```
GET /api/products
```

**Auth:** None (public)

**Query Parameters:**

| Parameter  | Type   | Default | Description                          |
|------------|--------|---------|--------------------------------------|
| `page`     | number | 1       | Page number                          |
| `limit`    | number | 10      | Results per page                     |
| `category` | string |         | Filter by category                   |
| `search`   | string |         | Text search on name and description  |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6662ab0ecd2e3f4a5b6c7d84",
      "name": "REAUX Lifting Straps",
      "description": "Premium cotton lifting straps for heavy pulls. Anti-slip grip with reinforced stitching.",
      "price": 799,
      "compareAtPrice": 1199,
      "images": [
        "https://cdn.reauxlabs.com/products/lifting-straps-1.jpg",
        "https://cdn.reauxlabs.com/products/lifting-straps-2.jpg"
      ],
      "category": "accessories",
      "stock": 150,
      "isActive": true,
      "createdAt": "2025-06-10T09:00:00.000Z"
    },
    {
      "_id": "6662bc1fde3f4a5b6c7d8e95",
      "name": "REAUX Whey Protein - Chocolate",
      "description": "25g protein per scoop. Low carb, zero sugar. 2kg tub.",
      "price": 2499,
      "compareAtPrice": 3499,
      "images": [
        "https://cdn.reauxlabs.com/products/whey-chocolate-1.jpg"
      ],
      "category": "supplements",
      "stock": 80,
      "isActive": true,
      "createdAt": "2025-06-08T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "pages": 3
  }
}
```

---

### 8.2 Get Product by ID

```
GET /api/products/:id
```

**Auth:** None (public)

**URL Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `id`      | string | Product's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6662ab0ecd2e3f4a5b6c7d84",
    "name": "REAUX Lifting Straps",
    "description": "Premium cotton lifting straps for heavy pulls. Anti-slip grip with reinforced stitching.",
    "price": 799,
    "compareAtPrice": 1199,
    "images": [
      "https://cdn.reauxlabs.com/products/lifting-straps-1.jpg",
      "https://cdn.reauxlabs.com/products/lifting-straps-2.jpg"
    ],
    "category": "accessories",
    "stock": 150,
    "isActive": true,
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "createdAt": "2025-06-10T09:00:00.000Z",
    "updatedAt": "2025-06-10T09:00:00.000Z"
  }
}
```

---

### 8.3 Create Product

```
POST /api/products
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**Request Body:**

| Field            | Type     | Required | Constraints      | Description                              |
|------------------|----------|----------|------------------|------------------------------------------|
| `name`           | string   | Yes      | min: 1            | Product name                             |
| `price`          | number   | Yes      | Must be positive   | Selling price (in smallest currency unit or INR) |
| `description`    | string   | No       |                  | Product description                      |
| `compareAtPrice` | number   | No       | Must be positive   | Original/strikethrough price             |
| `images`         | string[] | No       |                  | Array of image URLs                      |
| `category`       | string   | No       |                  | Product category                         |
| `stock`          | number   | No       | Integer, min: 0    | Available stock (default: 0)             |

**Request Example:**

```json
{
  "name": "REAUX Resistance Band Set",
  "price": 1299,
  "compareAtPrice": 1899,
  "description": "Set of 5 resistance bands (light to heavy). Latex-free, portable, and durable.",
  "images": ["https://cdn.reauxlabs.com/products/bands-1.jpg"],
  "category": "equipment",
  "stock": 200
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "6663cd20ef4a5b6c7d8e9fa6",
    "name": "REAUX Resistance Band Set",
    "description": "Set of 5 resistance bands (light to heavy). Latex-free, portable, and durable.",
    "price": 1299,
    "compareAtPrice": 1899,
    "images": ["https://cdn.reauxlabs.com/products/bands-1.jpg"],
    "category": "equipment",
    "stock": 200,
    "isActive": true,
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "createdAt": "2025-06-14T10:00:00.000Z",
    "updatedAt": "2025-06-14T10:00:00.000Z"
  }
}
```

---

### 8.4 Update Product

```
PUT /api/products/:id
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**URL Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `id`      | string | Product's MongoDB ID |

**Request Body:** Same fields as create, all optional. Additionally:

| Field      | Type    | Required | Description                      |
|------------|---------|----------|----------------------------------|
| `isActive` | boolean | No       | Set to `false` to deactivate     |

**Request Example:**

```json
{
  "price": 999,
  "stock": 175
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6663cd20ef4a5b6c7d8e9fa6",
    "name": "REAUX Resistance Band Set",
    "price": 999,
    "stock": 175,
    "isActive": true,
    "updatedAt": "2025-06-15T08:00:00.000Z"
  }
}
```

---

## 9. Cart

Base path: `/api/cart`

All cart endpoints require authentication. Each user has a single cart document.

### 9.1 Add to Cart

```
POST /api/cart/add
```

**Auth:** Bearer Token (any role)

**Request Body:**

| Field       | Type   | Required | Constraints                  | Description                    |
|-------------|--------|----------|------------------------------|--------------------------------|
| `productId` | string | Yes      | min: 1, valid MongoDB ObjectId | ID of the product to add       |
| `quantity`  | number | No       | Positive integer (default: 1) | Quantity to add                |

**Request Example:**

```json
{
  "productId": "6662ab0ecd2e3f4a5b6c7d84",
  "quantity": 2
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6664de31fa5b6c7d8e9f0ab7",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "items": [
      {
        "product": "6662ab0ecd2e3f4a5b6c7d84",
        "quantity": 2
      }
    ],
    "createdAt": "2025-06-15T10:00:00.000Z",
    "updatedAt": "2025-06-15T10:00:00.000Z"
  }
}
```

---

### 9.2 View Cart

```
GET /api/cart
```

**Auth:** Bearer Token (any role)

Returns the authenticated user's cart with populated product details.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6664de31fa5b6c7d8e9f0ab7",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "items": [
      {
        "product": {
          "_id": "6662ab0ecd2e3f4a5b6c7d84",
          "name": "REAUX Lifting Straps",
          "price": 799,
          "images": ["https://cdn.reauxlabs.com/products/lifting-straps-1.jpg"]
        },
        "quantity": 2
      },
      {
        "product": {
          "_id": "6662bc1fde3f4a5b6c7d8e95",
          "name": "REAUX Whey Protein - Chocolate",
          "price": 2499,
          "images": ["https://cdn.reauxlabs.com/products/whey-chocolate-1.jpg"]
        },
        "quantity": 1
      }
    ],
    "createdAt": "2025-06-15T10:00:00.000Z",
    "updatedAt": "2025-06-15T10:30:00.000Z"
  }
}
```

---

### 9.3 Remove from Cart

```
DELETE /api/cart/item/:productId
```

**Auth:** Bearer Token (any role)

**URL Parameters:**

| Parameter   | Type   | Description          |
|-------------|--------|----------------------|
| `productId` | string | Product's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6664de31fa5b6c7d8e9f0ab7",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "items": [
      {
        "product": "6662bc1fde3f4a5b6c7d8e95",
        "quantity": 1
      }
    ],
    "updatedAt": "2025-06-15T11:00:00.000Z"
  }
}
```

---

## 10. Orders

Base path: `/api/orders`

All order endpoints require authentication.

### 10.1 Create Order

```
POST /api/orders/create
```

**Auth:** Bearer Token (any role)

Creates an order from the items currently in the user's cart. The cart is emptied upon successful order creation. An order confirmation email is sent to the user automatically.

**Request Body:**

| Field                        | Type   | Required | Constraints | Description              |
|------------------------------|--------|----------|-------------|--------------------------|
| `shippingAddress`            | object | Yes      |             | Shipping address object  |
| `shippingAddress.street`     | string | Yes      | min: 1       | Street address           |
| `shippingAddress.city`       | string | Yes      | min: 1       | City                     |
| `shippingAddress.state`      | string | Yes      | min: 1       | State                    |
| `shippingAddress.pincode`    | string | Yes      | min: 1       | PIN code                 |
| `shippingAddress.phone`      | string | Yes      | min: 1       | Contact phone            |
| `promoCode`                  | string | No       |             | Promo code to apply      |

**Request Example:**

```json
{
  "shippingAddress": {
    "street": "15 Brigade Road, Ashok Nagar",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560025",
    "phone": "+91-9876543210"
  },
  "promoCode": "FIT20"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "6665ef42ab6c7d8e9f0a1bc8",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "items": [
      {
        "product": "6662ab0ecd2e3f4a5b6c7d84",
        "name": "REAUX Lifting Straps",
        "price": 799,
        "quantity": 2
      },
      {
        "product": "6662bc1fde3f4a5b6c7d8e95",
        "name": "REAUX Whey Protein - Chocolate",
        "price": 2499,
        "quantity": 1
      }
    ],
    "totalAmount": 4097,
    "discount": 819.4,
    "finalAmount": 3277.6,
    "promoCode": "FIT20",
    "status": "pending",
    "shippingAddress": {
      "street": "15 Brigade Road, Ashok Nagar",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560025",
      "phone": "+91-9876543210"
    },
    "createdAt": "2025-06-15T14:00:00.000Z",
    "updatedAt": "2025-06-15T14:00:00.000Z"
  }
}
```

**Error Responses:**

*400 Bad Request -- Empty cart:*

```json
{
  "success": false,
  "message": "Cart is empty"
}
```

*400 Bad Request -- Invalid promo code:*

```json
{
  "success": false,
  "message": "Invalid promo code"
}
```

*400 Bad Request -- Promo code expired:*

```json
{
  "success": false,
  "message": "Promo code has expired"
}
```

*400 Bad Request -- Minimum order amount not met:*

```json
{
  "success": false,
  "message": "Minimum order amount of 500 not met"
}
```

---

### 10.2 Get My Orders

```
GET /api/orders/my
```

**Auth:** Bearer Token (any role)

Returns the authenticated user's orders in reverse chronological order.

**Query Parameters:**

| Parameter | Type   | Default | Description     |
|-----------|--------|---------|-----------------|
| `page`    | number | 1       | Page number     |
| `limit`   | number | 10      | Results per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6665ef42ab6c7d8e9f0a1bc8",
      "userId": "665b2a3f4d5c6e7f8a9b0d1e",
      "items": [
        {
          "product": "6662ab0ecd2e3f4a5b6c7d84",
          "name": "REAUX Lifting Straps",
          "price": 799,
          "quantity": 2
        },
        {
          "product": "6662bc1fde3f4a5b6c7d8e95",
          "name": "REAUX Whey Protein - Chocolate",
          "price": 2499,
          "quantity": 1
        }
      ],
      "totalAmount": 4097,
      "discount": 819.4,
      "finalAmount": 3277.6,
      "promoCode": "FIT20",
      "status": "pending",
      "shippingAddress": {
        "street": "15 Brigade Road, Ashok Nagar",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560025",
        "phone": "+91-9876543210"
      },
      "createdAt": "2025-06-15T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

---

### 10.3 Get Order by ID

```
GET /api/orders/:id
```

**Auth:** Bearer Token (any role)

Returns a specific order. Users can only view their own orders.

**URL Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `id`      | string | Order's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6665ef42ab6c7d8e9f0a1bc8",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "items": [
      {
        "product": "6662ab0ecd2e3f4a5b6c7d84",
        "name": "REAUX Lifting Straps",
        "price": 799,
        "quantity": 2
      }
    ],
    "totalAmount": 1598,
    "discount": 0,
    "finalAmount": 1598,
    "status": "confirmed",
    "shippingAddress": {
      "street": "15 Brigade Road, Ashok Nagar",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560025",
      "phone": "+91-9876543210"
    },
    "createdAt": "2025-06-15T14:00:00.000Z",
    "updatedAt": "2025-06-16T09:00:00.000Z"
  }
}
```

**Error Responses:**

*404 Not Found:*

```json
{
  "success": false,
  "message": "Order not found"
}
```

*403 Forbidden -- Not order owner:*

```json
{
  "success": false,
  "message": "Unauthorized to view this order"
}
```

---

### 10.4 Update Order Status (Admin)

```
PATCH /api/orders/:id/status
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

Updates the status of an order. Follows a state machine — only valid transitions are allowed. A notification is automatically created for the user on each status change.

**Valid Transitions:**

| From        | Allowed To                    |
|-------------|-------------------------------|
| `pending`   | `confirmed`, `cancelled`      |
| `confirmed` | `shipped`, `cancelled`        |
| `shipped`   | `delivered`, `cancelled`      |
| `delivered` | *(none)*                      |
| `cancelled` | *(none)*                      |

**URL Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `id`      | string | Order's MongoDB ID |

**Request Body:**

| Field    | Type   | Required | Constraints                                       | Description |
|----------|--------|----------|---------------------------------------------------|-------------|
| `status` | string | Yes      | One of: `confirmed`, `shipped`, `delivered`, `cancelled` | New status  |

**Request Example:**

```json
{
  "status": "confirmed"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "_id": "6665ef42ab6c7d8e9f0a1bc8",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "status": "confirmed",
    "items": [ ... ],
    "totalAmount": 4097,
    "discount": 819.4,
    "finalAmount": 3277.6,
    "createdAt": "2025-06-15T14:00:00.000Z",
    "updatedAt": "2025-06-16T09:00:00.000Z"
  }
}
```

**Error Responses:**

*400 Bad Request -- Invalid transition:*

```json
{
  "success": false,
  "message": "Cannot transition from 'delivered' to 'shipped'"
}
```

*404 Not Found:*

```json
{
  "success": false,
  "message": "Order not found"
}
```

---

## 11. Promo Codes

Base path: `/api/promo`

### 11.1 Create Promo Code

```
POST /api/promo/create
```

**Auth:** Bearer Token
**Role:** `superadmin` only

**Request Body:**

| Field            | Type   | Required | Constraints                        | Description                              |
|------------------|--------|----------|------------------------------------|------------------------------------------|
| `code`           | string | Yes      | min: 1                              | Promo code (auto-uppercased)             |
| `discountType`   | string | Yes      | One of: `percentage`, `fixed`        | Type of discount                         |
| `discountValue`  | number | Yes      | Must be positive                     | Discount amount (% or fixed value)       |
| `minOrderAmount` | number | No       | min: 0 (default: 0)                 | Minimum order total to apply promo       |
| `maxDiscount`    | number | No       | Must be positive                     | Maximum discount cap (for percentage)    |
| `usageLimit`     | number | No       | Positive integer                     | Maximum total uses allowed               |
| `validFrom`      | string | No       | Date string (ISO 8601)               | Start date of validity                   |
| `validUntil`     | string | No       | Date string (ISO 8601)               | Expiry date                              |

**Request Example:**

```json
{
  "code": "FIT20",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderAmount": 500,
  "maxDiscount": 1000,
  "usageLimit": 500,
  "validFrom": "2025-06-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "6666fa53bc7d8e9f0a1b2cd9",
    "code": "FIT20",
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderAmount": 500,
    "maxDiscount": 1000,
    "usageLimit": 500,
    "usedCount": 0,
    "validFrom": "2025-06-01T00:00:00.000Z",
    "validUntil": "2025-12-31T23:59:59.000Z",
    "isActive": true,
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "createdAt": "2025-06-15T16:00:00.000Z",
    "updatedAt": "2025-06-15T16:00:00.000Z"
  }
}
```

**Error Responses:**

*409 Conflict -- Duplicate promo code:*

```json
{
  "success": false,
  "message": "Duplicate value for field: code"
}
```

---

### 11.2 Validate Promo Code

```
POST /api/promo/validate
```

**Auth:** Bearer Token (any role)

Validates whether a promo code is active and applicable.

**Request Body:**

| Field  | Type   | Required | Constraints | Description      |
|--------|--------|----------|-------------|------------------|
| `code` | string | Yes      | min: 1       | Promo code       |

**Request Example:**

```json
{
  "code": "FIT20"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "code": "FIT20",
    "discountType": "percentage",
    "discountValue": 20,
    "discount": 0
  }
}
```

> Note: The `discount` field reflects the computed discount based on the current order amount. When validating without an order context, it may be `0`.

**Error Responses:**

*404 Not Found -- Invalid or inactive code:*

```json
{
  "success": false,
  "message": "Invalid or inactive promo code"
}
```

*400 Bad Request -- Expired:*

```json
{
  "success": false,
  "message": "Promo code has expired"
}
```

*400 Bad Request -- Usage limit reached:*

```json
{
  "success": false,
  "message": "Promo code usage limit reached"
}
```

---

## 12. Challenges

Base path: `/api/challenges`

### 12.1 Create Challenge

```
POST /api/challenges
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

**Request Body:**

| Field         | Type   | Required | Constraints                                    | Description                  |
|---------------|--------|----------|------------------------------------------------|------------------------------|
| `title`       | string | Yes      | min: 1, max: 200                                | Challenge title              |
| `type`        | string | Yes      | One of: `steps`, `workout`, `diet`, `custom`     | Type of challenge            |
| `target`      | number | Yes      | Must be positive                                 | Target number (e.g., steps)  |
| `startDate`   | string | Yes      | min: 1, date string                              | Challenge start date         |
| `endDate`     | string | Yes      | min: 1, date string                              | Challenge end date           |
| `description` | string | No       |                                                | Challenge description        |

**Request Example:**

```json
{
  "title": "30-Day Push-Up Challenge",
  "type": "workout",
  "target": 3000,
  "startDate": "2025-07-01",
  "endDate": "2025-07-31",
  "description": "Complete 3000 push-ups in 30 days. Track your daily reps!"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "66670b64cd8e9f0a1b2c3dea",
    "title": "30-Day Push-Up Challenge",
    "description": "Complete 3000 push-ups in 30 days. Track your daily reps!",
    "type": "workout",
    "target": 3000,
    "startDate": "2025-07-01T00:00:00.000Z",
    "endDate": "2025-07-31T00:00:00.000Z",
    "participants": [],
    "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
    "isActive": true,
    "createdAt": "2025-06-16T08:00:00.000Z",
    "updatedAt": "2025-06-16T08:00:00.000Z"
  }
}
```

---

### 12.2 List Challenges

```
GET /api/challenges
```

**Auth:** Bearer Token (any role)

**Query Parameters:**

| Parameter | Type   | Default | Description     |
|-----------|--------|---------|-----------------|
| `page`    | number | 1       | Page number     |
| `limit`   | number | 10      | Results per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "66670b64cd8e9f0a1b2c3dea",
      "title": "30-Day Push-Up Challenge",
      "description": "Complete 3000 push-ups in 30 days.",
      "type": "workout",
      "target": 3000,
      "startDate": "2025-07-01T00:00:00.000Z",
      "endDate": "2025-07-31T00:00:00.000Z",
      "participants": [
        {
          "userId": "665b2a3f4d5c6e7f8a9b0d1e",
          "progress": 450,
          "joinedAt": "2025-07-01T06:30:00.000Z"
        }
      ],
      "isActive": true,
      "createdBy": "665d4c5b6e7f8a9b0c1d2e3f",
      "createdAt": "2025-06-16T08:00:00.000Z"
    },
    {
      "_id": "66681c75de9f0a1b2c3d4efb",
      "title": "10K Steps Daily Challenge",
      "description": "Walk at least 10,000 steps every day for 2 weeks.",
      "type": "steps",
      "target": 140000,
      "startDate": "2025-07-15T00:00:00.000Z",
      "endDate": "2025-07-29T00:00:00.000Z",
      "participants": [],
      "isActive": true,
      "createdAt": "2025-06-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### 12.3 Join Challenge

```
POST /api/challenges/:id/join
```

**Auth:** Bearer Token (any role)

Adds the authenticated user as a participant in the challenge with an initial progress of `0`.

**URL Parameters:**

| Parameter | Type   | Description            |
|-----------|--------|------------------------|
| `id`      | string | Challenge's MongoDB ID |

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Joined challenge successfully",
  "data": {
    "_id": "66670b64cd8e9f0a1b2c3dea",
    "title": "30-Day Push-Up Challenge",
    "participants": [
      {
        "userId": "665b2a3f4d5c6e7f8a9b0d1e",
        "progress": 0,
        "joinedAt": "2025-07-01T06:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

*404 Not Found:*

```json
{
  "success": false,
  "message": "Challenge not found"
}
```

---

## 13. Notifications

Base path: `/api/notifications`

All notification endpoints require authentication.

### 13.1 Get Notifications

```
GET /api/notifications
```

**Auth:** Bearer Token (any role)

Returns notifications for the authenticated user, sorted by newest first.

**Query Parameters:**

| Parameter | Type   | Default | Description     |
|-----------|--------|---------|-----------------|
| `page`    | number | 1       | Page number     |
| `limit`   | number | 10      | Results per page |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "66692d86ef0a1b2c3d4e5f0c",
      "userId": "665b2a3f4d5c6e7f8a9b0d1e",
      "title": "Order Confirmed",
      "message": "Your order #6665ef42ab6c7d8e9f0a1bc8 has been confirmed and is being prepared for shipping.",
      "type": "order",
      "isRead": false,
      "metadata": {
        "orderId": "6665ef42ab6c7d8e9f0a1bc8"
      },
      "createdAt": "2025-06-16T09:00:00.000Z"
    },
    {
      "_id": "66693e97fa1b2c3d4e5f601d",
      "userId": "665b2a3f4d5c6e7f8a9b0d1e",
      "title": "New Challenge Available",
      "message": "30-Day Push-Up Challenge starts on July 1st. Join now!",
      "type": "challenge",
      "isRead": true,
      "metadata": {
        "challengeId": "66670b64cd8e9f0a1b2c3dea"
      },
      "createdAt": "2025-06-16T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "pages": 2
  }
}
```

---

### 13.2 Mark Notification as Read

```
PUT /api/notifications/read/:id
```

**Auth:** Bearer Token (any role)

**URL Parameters:**

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| `id`      | string | Notification's MongoDB ID  |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "66692d86ef0a1b2c3d4e5f0c",
    "userId": "665b2a3f4d5c6e7f8a9b0d1e",
    "title": "Order Confirmed",
    "message": "Your order #6665ef42ab6c7d8e9f0a1bc8 has been confirmed.",
    "type": "order",
    "isRead": true,
    "createdAt": "2025-06-16T09:00:00.000Z",
    "updatedAt": "2025-06-16T12:00:00.000Z"
  }
}
```

---

### 13.3 Mark All Notifications as Read

```
PATCH /api/notifications/mark-all-read
```

**Auth:** Bearer Token (any role)

Marks all unread notifications for the authenticated user as read in a single operation.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 13.4 Register FCM Device Token

```
POST /api/notifications/fcm-token
```

**Auth:** Bearer Token (any role)

Registers a Firebase Cloud Messaging token for push notifications. Supports multiple devices per user (uses `$addToSet` to prevent duplicates).

**Request Body:**

```json
{
  "token": "fcm-device-token-string"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "FCM token registered"
}
```

---

### 13.5 Remove FCM Device Token

```
DELETE /api/notifications/fcm-token
```

**Auth:** Bearer Token (any role)

Removes an FCM device token (call on logout).

**Request Body:**

```json
{
  "token": "fcm-device-token-string"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "FCM token removed"
}
```

---

## 14. Memberships

Base path: `/api/memberships`

The membership system has two layers: **Membership Plans** (templates created by SuperAdmin) and **User Memberships** (subscriptions assigned by Admins). Plans are gym-specific.

### 14.1 Create Membership Plan

```
POST /api/memberships/plans
```

**Auth:** Bearer Token
**Role:** `superadmin`

**Request Body:**

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

| Field          | Type     | Required | Description                          |
|----------------|----------|----------|--------------------------------------|
| `name`         | string   | Yes      | Plan name                            |
| `gymId`        | string   | Yes      | Gym this plan belongs to             |
| `durationDays` | number   | Yes      | Duration in days (30, 90, 180, 365)  |
| `price`        | number   | Yes      | Price in INR                         |
| `features`     | string[] | No       | List of included features            |
| `description`  | string   | No       | Plan description                     |

**Success Response (201 Created):**

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

### 14.2 List Membership Plans

```
GET /api/memberships/plans
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

Admins see only plans for their gym. SuperAdmin sees all plans (optionally filter by `gymId`).

**Query Parameters:**

| Parameter | Type   | Default | Description                     |
|-----------|--------|---------|---------------------------------|
| `gymId`   | string | —       | Filter by gym (superadmin only) |
| `page`    | number | 1       | Page number                     |
| `limit`   | number | 10      | Results per page (max 100)      |

**Success Response (200 OK):**

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
      "description": "Basic gym access for 30 days.",
      "isActive": true
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "pages": 1 }
}
```

---

### 14.3 Get Membership Plan by ID

```
GET /api/memberships/plans/:id
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

---

### 14.4 Update Membership Plan

```
PUT /api/memberships/plans/:id
```

**Auth:** Bearer Token
**Role:** `superadmin`

**Request Body (all fields optional):**

```json
{
  "name": "Basic Monthly (Updated)",
  "price": 1799,
  "features": ["Gym Floor Access", "Locker Room", "Wifi"],
  "isActive": false
}
```

---

### 14.5 Delete Membership Plan (Soft Delete)

```
DELETE /api/memberships/plans/:id
```

**Auth:** Bearer Token
**Role:** `superadmin`

Sets `isActive: false`. Plan is no longer returned in list queries.

---

### 14.6 Assign Membership to User

```
POST /api/memberships/assign
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

Assigns a plan to a user. The `endDate` is auto-calculated as `startDate + plan.durationDays`. If no `startDate` is provided, defaults to today. Sends a push notification to the user.

Admins can only assign plans belonging to their gym.

**Request Body:**

```json
{
  "userId": "665f1a2b3c4d5e6f7a8b9c0d",
  "planId": "665f1a2b3c4d5e6f7a8b9c0e",
  "startDate": "2026-03-01"
}
```

| Field       | Type   | Required | Description                         |
|-------------|--------|----------|-------------------------------------|
| `userId`    | string | Yes      | User to assign the membership to    |
| `planId`    | string | Yes      | Plan to assign                      |
| `startDate` | string | No       | ISO date string, defaults to today  |

**Success Response (201 Created):**

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

---

### 14.7 List User Memberships

```
GET /api/memberships
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

Admins see only memberships for their gym. SuperAdmin sees all.

**Query Parameters:**

| Parameter | Type   | Default | Description                                |
|-----------|--------|---------|--------------------------------------------|
| `gymId`   | string | —       | Filter by gym (superadmin only)            |
| `userId`  | string | —       | Filter by user                             |
| `status`  | string | —       | Filter: `active`, `expired`, `cancelled`   |
| `page`    | number | 1       | Page number                                |
| `limit`   | number | 10      | Results per page (max 100)                 |

**Success Response (200 OK):**

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

### 14.8 Get My Memberships

```
GET /api/memberships/my
```

**Auth:** Bearer Token (any role)

Returns the authenticated user's own memberships with plan and gym details populated.

---

### 14.9 Get Membership by ID

```
GET /api/memberships/:id
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

---

### 14.10 Cancel Membership

```
PATCH /api/memberships/:id/cancel
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

Sets membership status to `cancelled`. Cannot cancel an already-cancelled membership. Admins can only cancel memberships for their gym. Sends a push notification to the user.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Membership cancelled",
  "data": {
    "_id": "...",
    "status": "cancelled",
    "updatedAt": "..."
  }
}
```

---

## 15. Analytics (Admin)

Base path: `/api/admin`

### 15.1 Get Platform Stats

```
GET /api/admin/stats
```

**Auth:** Bearer Token
**Role:** `admin` or `superadmin`

Returns aggregate counts of key platform entities.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalPosts": 3420,
    "totalOrders": 876,
    "totalProducts": 45,
    "totalChallenges": 12,
    "recentUsers": 87
  }
}
```

| Field             | Type   | Description                               |
|-------------------|--------|-------------------------------------------|
| `totalUsers`      | number | Total registered users                    |
| `totalPosts`      | number | Total community posts                     |
| `totalOrders`     | number | Total orders placed                       |
| `totalProducts`   | number | Total products in catalog                 |
| `totalChallenges` | number | Total challenges created                  |
| `recentUsers`     | number | Users registered in the last 30 days      |

---

### 15.2 Get Sales Report

```
GET /api/admin/sales-report
```

**Auth:** Bearer Token
**Role:** `superadmin` only

Returns comprehensive sales analytics including overall stats, monthly breakdown (last 6 months), and top-selling products.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalRevenue": 1847350,
    "orderCount": 876,
    "averageOrderValue": 2109.42,
    "monthlyStats": [
      {
        "_id": { "year": 2025, "month": 6 },
        "revenue": 345200,
        "orders": 156
      },
      {
        "_id": { "year": 2025, "month": 5 },
        "revenue": 312800,
        "orders": 143
      },
      {
        "_id": { "year": 2025, "month": 4 },
        "revenue": 298500,
        "orders": 138
      }
    ],
    "topProducts": [
      {
        "_id": "6662bc1fde3f4a5b6c7d8e95",
        "name": "REAUX Whey Protein - Chocolate",
        "totalQuantity": 342,
        "totalRevenue": 854658
      },
      {
        "_id": "6662ab0ecd2e3f4a5b6c7d84",
        "name": "REAUX Lifting Straps",
        "totalQuantity": 289,
        "totalRevenue": 230911
      },
      {
        "_id": "6663cd20ef4a5b6c7d8e9fa6",
        "name": "REAUX Resistance Band Set",
        "totalQuantity": 198,
        "totalRevenue": 197802
      },
      {
        "_id": "6664de31fa5b6c7d8e9f0ab7",
        "name": "REAUX Pre-Workout - Berry Blast",
        "totalQuantity": 176,
        "totalRevenue": 263824
      },
      {
        "_id": "6665ef42ab6c7d8e9f0a1bc8",
        "name": "REAUX Gym Bag - Tactical Black",
        "totalQuantity": 134,
        "totalRevenue": 200866
      }
    ]
  }
}
```

| Field                        | Type   | Description                                           |
|------------------------------|--------|-------------------------------------------------------|
| `totalRevenue`               | number | Sum of `finalAmount` across all orders                |
| `orderCount`                 | number | Total number of orders                                |
| `averageOrderValue`          | number | Average `finalAmount` per order                       |
| `monthlyStats`               | array  | Revenue and order count grouped by year/month (last 6 months) |
| `monthlyStats[]._id.year`    | number | Year                                                  |
| `monthlyStats[]._id.month`   | number | Month (1-12)                                          |
| `monthlyStats[].revenue`     | number | Total revenue for the month                           |
| `monthlyStats[].orders`      | number | Number of orders for the month                        |
| `topProducts`                | array  | Top 5 best-selling products by quantity               |
| `topProducts[]._id`          | string | Product ID                                            |
| `topProducts[].name`         | string | Product name                                          |
| `topProducts[].totalQuantity`| number | Total units sold                                      |
| `topProducts[].totalRevenue` | number | Total revenue from this product                       |

**Error Responses:**

*403 Forbidden -- Not superadmin:*

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

---

## Appendix: Order Statuses

| Status      | Description                                |
|-------------|--------------------------------------------|
| `pending`   | Order placed, awaiting confirmation        |
| `confirmed` | Order confirmed by the system/admin        |
| `shipped`   | Order shipped to the customer              |
| `delivered` | Order delivered successfully               |
| `cancelled` | Order has been cancelled                   |

**Status Transitions:** `pending` → `confirmed` → `shipped` → `delivered`. Any non-terminal status can also transition to `cancelled`. Terminal statuses (`delivered`, `cancelled`) cannot be changed.

## Appendix: BMI Categories

| Category      | BMI Range           |
|---------------|---------------------|
| `underweight` | BMI < 18.5          |
| `normal`      | 18.5 <= BMI < 25    |
| `overweight`  | 25 <= BMI < 30      |
| `obese`       | BMI >= 30           |

## Appendix: Notification Types

| Type        | Description                                   |
|-------------|-----------------------------------------------|
| `system`    | General system notifications                  |
| `order`     | Order status updates                          |
| `challenge` | Challenge invites and updates                 |
| `community` | Social interactions (likes, comments, etc.)   |
| `diet`      | Diet plan updates and reminders               |

## Appendix: Diet Plan Categories

| Category       | Description                  |
|----------------|------------------------------|
| `weight-loss`  | Calorie-deficit plans        |
| `muscle-gain`  | High-protein surplus plans   |
| `maintenance`  | Balanced calorie plans       |
| `keto`         | Ketogenic diet plans         |
| `vegan`        | Plant-based diet plans       |
| `other`        | Other/custom diet plans      |

## Appendix: Membership Statuses

| Status      | Description                                    |
|-------------|------------------------------------------------|
| `active`    | Currently valid membership                     |
| `expired`   | Past the end date                              |
| `cancelled` | Manually cancelled by admin/superadmin         |

## Appendix: Challenge Types

| Type      | Description                     |
|-----------|---------------------------------|
| `steps`   | Step-count based challenges     |
| `workout` | Exercise/rep based challenges   |
| `diet`    | Diet adherence challenges       |
| `custom`  | Custom-defined challenges       |
