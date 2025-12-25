import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBd5c4oZXZm6jy-OWUQVZoOhowNdYGU2y4",
  authDomain: "weiu-fbfe2.firebaseapp.com",
  projectId: "weiu-fbfe2",
  storageBucket: "weiu-fbfe2.firebasestorage.app",
  messagingSenderId: "87341697110",
  appId: "1:87341697110:web:04888ed6167bfbe531d3f7",
  measurementId: "G-8H2NZZ3KH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
