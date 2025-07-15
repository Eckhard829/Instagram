import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCQqy9f_1XejtiCm0MNQhDEN-WHCVwFuPc",
  authDomain: "instagram-clone-49b0b.firebaseapp.com",
  projectId: "instagram-clone-49b0b",
  storageBucket: "instagram-clone-49b0b.firebasestorage.app",
  messagingSenderId: "1059173962808",
  appId: "1:1059173962808:web:3210e5da29793eb10602cd",
  measurementId: "G-3EFDDRL4G5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);