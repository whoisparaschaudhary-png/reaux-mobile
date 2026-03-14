export const API_URL = 'https://reaux-labs-be.onrender.com/api';

/** App store URLs - update APP_STORE_ID when the app is published on iOS */
export const APP_STORE_ID = 'YOUR_APP_STORE_ID'; // e.g. '1234567890'
export const PLAY_STORE_PACKAGE = 'com.babbaranish.reauxlabsmobile';

export const STORE_URLS = {
  ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
  android: `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SHIPPING_ADDRESS: 'shipping_address',
  SAVED_ADDRESSES: 'saved_addresses',
} as const;
