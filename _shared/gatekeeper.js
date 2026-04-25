import { auth } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import { db, doc, getDoc } from "./db.js";

export function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      const isPublic = window.location.pathname.includes('publico');
      const isLogin = window.location.pathname.includes('login');
      
      if (!isLogin && !isPublic) {
        window.location.href = "/login.html";
      }
      return;
    }

    // Busca o perfil para entregar ao app
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const profile = snap.exists() ? snap.data() : {};
      callback(user, profile);
    } catch (e) {
      console.error("Erro ao carregar perfil no Gatekeeper:", e);
      callback(user, {});
    }
  });
}
