// =================================================================
// DOSYA: src/firebaseConfig.js
// AÇIKLAMA: Firebase projesinin yapılandırma bilgilerini içerir.
// ÖNEMLİ: Aşağıdaki değerleri kendi Firebase projenizden aldığınız
// bilgilerle değiştirmeniz gerekmektedir.
// =================================================================
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

export default app;
