// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // only auth for now
import {FIREBASE_API_KEY as apiKey} from '@env';
import {FIREBASE_AUTH_DOMAIN as authDomain} from '@env';
import {FIREBASE_PROJECT_ID as projectId} from '@env';
import {FIREBASE_STORAGE_BUCKET as storageBucket} from '@env';
import {FIREBASE_MESSAGING_SENDER_ID as messagingSenderId} from '@env';
import {FIREBASE_APP_ID as appId} from '@env';
import {FIREBASE_MEASUREMENT_ID as measurementId} from '@env';
//import firebase from 'firebase/compat/app';
//import 'firebase/compat/auth';
//import 'firebase/compat/firestore';
//import { getFirestore } from "firebase/firestore";
//import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//export const db = getFirestore(app);
//export const auth = getAuth(app);

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Avoid re-initializing on fast refresh
export const auth = firebase.auth();
export default firebase;