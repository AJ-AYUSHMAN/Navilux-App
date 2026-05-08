// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";

import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FIREBASE_API_KEY as apiKey} from '@env';
import {FIREBASE_AUTH_DOMAIN as authDomain} from '@env';
import {FIREBASE_PROJECT_ID as projectId} from '@env';
import {FIREBASE_STORAGE_BUCKET as storageBucket} from '@env';
import {FIREBASE_MESSAGING_SENDER_ID as messagingSenderId} from '@env';
import {FIREBASE_APP_ID as appId} from '@env';
import {FIREBASE_MEASUREMENT_ID as measurementId} from '@env';

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId
};

// Initialize Firebase
let app;
let auth;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Initialize Auth with React Native persistence to keep user logged in
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApps()[0];
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;