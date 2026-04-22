import { auth } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      if (!window.location.pathname.includes('login')) {
        window.location.href = "/login.html";
      }
      return;
    }
    callback(user);
  });
}
