/**
 * DAMN App — Environment-Driven Runtime Configuration
 * All credentials are loaded from local `.env` via Expo's built-in
 * `EXPO_PUBLIC_*` environment variable support. Never commit real keys here.
 * See `.env.example` for setup instructions.
 */

export const DAMN_CONFIG = {
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
    databaseId: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_ID ?? 'damn',
  },
};
