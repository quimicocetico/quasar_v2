// app.js — Gatekeeper e Motor de UI da Plataforma Quasar
import { requireAuth } from "./_shared/gatekeeper.js";
import { db, doc, getDoc, setDoc, serverTimestamp } from "./_shared/db.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const isLoginPage = window.location.pathname.includes('login');
const isOnboardingPage = window.location.pathname.includes('onboarding');

// ─── 1. Estilos globais injetados uma única vez ───────────────────────────────
document.head.insertAdjacentHTML('beforeend', `
  <style>
    :root { --bg-deep: #0A0F1C; --accent: #00F0FF; --accent-soft: rgba(0,240,255,0.1); }
    body { background-color: var(--bg-deep); color: white; font-family: 'Outfit', sans-serif; }
    .glass {
      background: rgba(17,24,39,0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .profile-card-shadow {
      box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.1);
    }
    .dropdown-transition { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
    .hidden-scale { opacity:0; transform:scale(0.95) translateY(-10px); pointer-events:none; }
  </style>
`);

// ─── 2. Header HTML ───────────────────────────────────────────────────────────
function renderizarHeader() {
  document.body.insertAdjacentHTML('afterbegin', `
    <header class="fixed top-0 w-full z-50 glass border-b border-white/5">
      <div class="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">

        <a href="/index.html" class="flex items-center gap-3 group">
          <div class="w-9 h-9 bg-gradient-to-br from-[#00F0FF] to-[#7000FF] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:scale-110 transition-transform">
            <i data-lucide="layout-grid" class="text-white w-5 h-5"></i>
          </div>
          <span class="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">QUASAR</span>
        </a>

        <div class="relative">
          <button id="profile-trigger" class="flex items-center gap-2 p-1.5 pr-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <div id="header-avatar" class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/20">
              <i data-lucide="user" class="w-4 h-4 text-gray-400"></i>
            </div>
            <span id="header-name" class="text-sm font-medium text-gray-200 hidden sm:block">Entrar</span>
            <i data-lucide="chevron-down" class="w-4 h-4 text-gray-500"></i>
          </button>

          <div id="profile-card" class="dropdown-transition hidden-scale absolute right-0 mt-3 w-72 glass rounded-2xl profile-card-shadow overflow-hidden">
            <div class="p-6 text-center border-b border-white/5">
              <div id="card-avatar" class="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3 border-2 border-[#00F0FF]/30">
                <i data-lucide="user" class="w-8 h-8 text-gray-500"></i>
              </div>
              <h3 id="card-name" class="font-bold text-base text-white">Visitante</h3>
              <p id="card-email" class="text-xs text-gray-400 truncate mt-0.5">Não autenticado</p>
            </div>
            <div class="p-2">
              <button id="auth-action-btn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors">
                <i data-lucide="log-in" class="w-4 h-4 text-[#00F0FF]"></i>
                <span>Fazer Login</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
    <div class="h-16"></div>
  `);

  if (window.lucide) lucide.createIcons();
  setupEvents();
}

function setupEvents() {
  const trigger = document.getElementById('profile-trigger');
  const card    = document.getElementById('profile-card');
  const authBtn = document.getElementById('auth-action-btn');

  if (trigger) trigger.onclick = (e) => { e.stopPropagation(); card.classList.toggle('hidden-scale'); };
  document.onclick = () => card && card.classList.add('hidden-scale');
  if (card) card.onclick = (e) => e.stopPropagation();

  if (authBtn) {
    authBtn.onclick = async () => {
      if (auth.currentUser) {
        await signOut(auth);
        window.location.href = '/login.html';
      } else {
        window.location.href = '/login.html';
      }
    };
  }
}

function atualizarHeaderUsuario(user, profile) {
  const headerName  = document.getElementById('header-name');
  const headerAvatar = document.getElementById('header-avatar');
  const cardName    = document.getElementById('card-name');
  const cardEmail   = document.getElementById('card-email');
  const cardAvatar  = document.getElementById('card-avatar');
  const authBtn     = document.getElementById('auth-action-btn');

  if (!headerName) return;

  if (user) {
    const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Aluno';
    headerName.textContent = firstName;
    cardName.textContent   = user.displayName || 'Aluno Quasar';
    cardEmail.textContent  = user.email;

    const papel = profile?.papel || (user.email.endsWith('@educar.rn.gov.br') ? 'professor' : 'aluno');
    document.body.dataset.role = papel;

    if (user.photoURL) {
      headerAvatar.innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover rounded-full">`;
      cardAvatar.innerHTML   = `<img src="${user.photoURL}" class="w-full h-full object-cover rounded-full">`;
    }

    authBtn.innerHTML = `
      ${papel === 'professor' ? `
        <a href="/dashboard-professor.html" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors mb-1">
          <i data-lucide="layout-dashboard" class="w-4 h-4 text-[#00F0FF]"></i>
          <span>Painel do Mestre</span>
        </a>
      ` : ''}
      <button id="auth-signout-btn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors">
        <i data-lucide="log-out" class="w-4 h-4 text-red-400"></i>
        <span class="text-red-400 font-medium">Sair da Conta</span>
      </button>
    `;

    document.getElementById('auth-signout-btn').onclick = async () => {
      await signOut(auth);
      window.location.href = '/login.html';
    };

    if (window.lucide) lucide.createIcons();
  } else {
    headerName.textContent = 'Entrar';
  }
}

// ─── 3. Lógica de Gatekeeper e Onboarding ─────────────────────────────────────
// ─── 3. Lógica de Gatekeeper e Onboarding ─────────────────────────────────────
requireAuth(async (user) => {
  // Se estamos na página de login e o usuário já está autenticado, vai para o index
  if (isLoginPage && user) {
    window.location.href = "/index.html";
    return;
  }

  if (isLoginPage) return;

  renderizarHeader();
  
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // Primeiro acesso — criar profile
    const papel = user.email.endsWith('@educar.rn.gov.br') ? "professor" : "aluno";
    const profile = {
      nome: user.displayName,
      email: user.email,
      papel: papel,
      created_at: serverTimestamp()
    };
    await setDoc(userRef, profile);
    atualizarHeaderUsuario(user, profile);
    
    if (!isOnboardingPage) window.location.href = "/onboarding.html";
    return;
  }

  const profile = snap.data();
  atualizarHeaderUsuario(user, profile);

  if (!profile.escola_id && !isOnboardingPage) {
    window.location.href = "/onboarding.html";
    return;
  }

  // Se já tiver escola e estiver na onboarding, vai pro index
  if (profile.escola_id && isOnboardingPage) {
    window.location.href = "/index.html";
    return;
  }
});
