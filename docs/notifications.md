# Notifications API & React Native Integration

## Overview

The notification system has two layers:

1. **In-app notifications** — stored in MongoDB, fetched via API
2. **Push notifications** — sent via Firebase Cloud Messaging (FCM) to devices

Both are created simultaneously by the `createNotification()` helper. Push notifications are optional — if Firebase isn't configured, only in-app notifications are saved.

---

## API Endpoints

Base path: `/api/notifications`

All endpoints require authentication (`Authorization: Bearer <token>`).

### GET `/api/notifications`

Get paginated notifications for the logged-in user.

**Query params:**

| Param    | Type    | Default | Description                                      |
| -------- | ------- | ------- | ------------------------------------------------ |
| `page`   | number  | 1       | Page number                                      |
| `limit`  | number  | 20      | Results per page (max 100)                       |
| `type`   | string  | —       | Filter by type: `system`, `order`, `challenge`, `community`, `diet` |
| `isRead` | boolean | —       | Filter by read status                            |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "title": "New Like",
      "message": "Arjun liked your post",
      "type": "community",
      "isRead": false,
      "metadata": { "postId": "..." },
      "createdAt": "2026-02-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

### PUT `/api/notifications/read/:id`

Mark a single notification as read.

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { "_id": "...", "isRead": true, "..." : "..." }
}
```

---

### PATCH `/api/notifications/mark-all-read`

Mark all unread notifications as read.

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": { "modifiedCount": 5 }
}
```

---

### POST `/api/notifications/fcm-token`

Register an FCM device token (call this on app login/startup).

**Body:**

```json
{ "token": "fcm-device-token-string" }
```

**Response:**

```json
{
  "success": true,
  "message": "FCM token registered"
}
```

---

### DELETE `/api/notifications/fcm-token`

Remove an FCM device token (call this on logout).

**Body:**

```json
{ "token": "fcm-device-token-string" }
```

**Response:**

```json
{
  "success": true,
  "message": "FCM token removed"
}
```

---

## Notification Types

| Type        | Triggered When                                |
| ----------- | --------------------------------------------- |
| `community` | Someone likes your post/reel/diet, comments on your post, follows your diet |
| `order`     | Order placed, status updated (confirmed, shipped, delivered, cancelled) |
| `challenge` | You join a challenge                          |
| `diet`      | Someone follows or likes your diet plan       |
| `system`    | General system notifications                  |

---

## Events That Create Notifications

| Module    | Event             | Recipient         | Type        |
| --------- | ----------------- | ------------------ | ----------- |
| Post      | Like a post       | Post author        | `community` |
| Post      | Comment on post   | Post author        | `community` |
| Reel      | Like a reel       | Reel author        | `community` |
| Diet      | Like a diet       | Diet creator       | `community` |
| Diet      | Follow a diet     | Diet creator       | `diet`      |
| Challenge | Join a challenge  | The user who joined | `challenge` |
| Order     | Place an order    | Buyer              | `order`     |
| Order     | Status change     | Buyer              | `order`     |

> Self-notifications are suppressed — liking your own post won't notify you.

---

## React Native Integration

### 1. Install Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

Follow the official setup for your platform:
- **iOS**: Add `GoogleService-Info.plist` to your Xcode project
- **Android**: Add `google-services.json` to `android/app/`

> These files come from your Firebase Console → Project Settings → Your Apps.

---

### 2. Request Permission (iOS)

```javascript
import messaging from '@react-native-firebase/messaging';

async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted');
  }
}
```

Call this early in your app (e.g., on first launch or after login).

---

### 3. Get FCM Token & Register with Backend

```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function registerDeviceToken(authToken) {
  const fcmToken = await messaging().getToken();

  // Avoid re-registering the same token
  const savedToken = await AsyncStorage.getItem('fcmToken');
  if (savedToken === fcmToken) return;

  await fetch('https://your-api.com/api/notifications/fcm-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: fcmToken }),
  });

  await AsyncStorage.setItem('fcmToken', fcmToken);
}
```

Call this after login and on app startup (tokens can rotate).

---

### 4. Handle Token Refresh

```javascript
useEffect(() => {
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    // Remove old token
    const oldToken = await AsyncStorage.getItem('fcmToken');
    if (oldToken) {
      await fetch('https://your-api.com/api/notifications/fcm-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: oldToken }),
      });
    }

    // Register new token
    await fetch('https://your-api.com/api/notifications/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: newToken }),
    });

    await AsyncStorage.setItem('fcmToken', newToken);
  });

  return unsubscribe;
}, []);
```

---

### 5. Listen for Notifications

```javascript
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Alert } from 'react-native';

function useNotificationListeners(navigation) {
  useEffect(() => {
    // Foreground — app is open
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      // Show an in-app alert/toast
      Alert.alert(
        remoteMessage.notification.title,
        remoteMessage.notification.body
      );
      // Or update a notification badge count, refetch notification list, etc.
    });

    // Background/quit — user tapped the notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
      const { type, postId, orderId } = remoteMessage.data;
      // Navigate based on notification type
      if (type === 'community' && postId) {
        navigation.navigate('PostDetail', { postId });
      } else if (type === 'order' && orderId) {
        navigation.navigate('OrderDetail', { orderId });
      }
    });

    // App opened from quit state via notification tap
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          const { type, postId, orderId } = remoteMessage.data;
          // Navigate to relevant screen
        }
      });

    return unsubscribe;
  }, []);
}
```

---

### 6. Remove Token on Logout

```javascript
async function logout(authToken) {
  const fcmToken = await AsyncStorage.getItem('fcmToken');

  if (fcmToken) {
    await fetch('https://your-api.com/api/notifications/fcm-token', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
    await AsyncStorage.removeItem('fcmToken');
  }

  // ... rest of your logout logic (clear auth token, navigate to login, etc.)
}
```

---

### 7. Fetch In-App Notifications

```javascript
async function getNotifications(authToken, page = 1) {
  const res = await fetch(
    `https://your-api.com/api/notifications?page=${page}&limit=20`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return res.json();
}

async function markAsRead(authToken, notificationId) {
  await fetch(
    `https://your-api.com/api/notifications/read/${notificationId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
}

async function markAllAsRead(authToken) {
  await fetch('https://your-api.com/api/notifications/mark-all-read', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authToken}` },
  });
}
```

---

## Backend Setup (Firebase)

### Option A: Local Development (file path)

1. Go to **Firebase Console** → Project Settings → Service Accounts
2. Click **Generate New Private Key** → download JSON file
3. Set in `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

### Option B: Cloud Deployment / Render (env var)

1. Copy the full JSON content of the service account file
2. Set as environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"...","...":"..."}
   ```

> The JSON env var takes priority over the file path. If neither is set, push notifications are silently disabled (in-app notifications still work).

---

## Notification Data Shape

Every push notification includes a `data` payload with at least a `type` field. Additional context-specific IDs are included in `metadata`:

```json
{
  "notification": {
    "title": "New Like",
    "body": "Arjun liked your post"
  },
  "data": {
    "type": "community",
    "postId": "665f1a2b3c4d5e6f7a8b9c0d"
  }
}
```

Use the `data.type` field to route navigation in your app when a user taps the notification.
