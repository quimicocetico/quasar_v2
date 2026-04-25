// app.js — Gatekeeper e Motor de UI da Plataforma Quasar
import { requireAuth } from "./_shared/gatekeeper.js";
import { db, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "./_shared/db.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const isLoginPage = window.location.pathname.includes('login');
const isOnboardingPage = window.location.pathname.includes('onboarding');

// ─── 1. Inicialização ────────────────────────────────────────────────────────

// ─── 2. Header HTML ───────────────────────────────────────────────────────────
// ─── 2. Header & Footer HTML ──────────────────────────────────────────────────
function renderizarHeader() {
  // Remove header se já existir (prevenção contra duplicados)
  const existingHeader = document.querySelector('header.platform-header');
  if (existingHeader) existingHeader.remove();

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="platform-header fixed top-0 w-full z-[100] glass border-b border-white/5">
      <div class="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex justify-between items-center">

        <a href="/index.html" class="flex items-center gap-2 md:gap-3 group">
          <div class="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
            <i data-lucide="sparkles" class="text-white w-4 h-4 md:w-5 md:h-5"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-sm md:text-xl font-black tracking-tighter text-white leading-tight">QUASAR</span>
            <span class="text-[8px] font-bold text-cyan-400/60 uppercase tracking-widest hidden md:block">Plataforma Educacional</span>
          </div>
        </a>

        <div class="flex items-center gap-4">
          <div class="relative">
            <button id="profile-trigger" class="flex items-center gap-2 p-1 md:p-1.5 pr-3 md:pr-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
              <div id="header-avatar" class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-all">
                <i data-lucide="user" class="w-4 h-4 text-gray-500"></i>
              </div>
              <span id="header-name" class="text-[11px] md:text-sm font-black uppercase tracking-widest text-gray-300 hidden sm:block">Acessar</span>
              <i data-lucide="chevron-down" class="w-4 h-4 text-gray-600 group-hover:text-cyan-500 transition-colors"></i>
            </button>

            <div id="profile-card" class="dropdown-transition hidden-scale absolute right-0 mt-3 w-72 glass-card profile-card-shadow overflow-hidden">
              <div class="p-8 text-center border-b border-white/5 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-50"></div>
                <div id="card-avatar" class="relative z-10 w-20 h-20 mx-auto rounded-full bg-gray-900 flex items-center justify-center mb-4 border-2 border-cyan-500/20 shadow-xl">
                  <i data-lucide="user" class="w-10 h-10 text-gray-600"></i>
                </div>
                <h3 id="card-name" class="relative z-10 font-black text-lg text-white uppercase tracking-tight">Visitante</h3>
                <p id="card-email" class="relative z-10 text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate mt-1">Nenhum vínculo detectado</p>
              </div>
              <div class="p-3 bg-white/[0.02]">
                <div id="auth-action-container">
                  <button id="auth-action-btn" class="w-full flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-white/5 text-xs font-black uppercase tracking-widest text-cyan-400 transition-all">
                    <i data-lucide="log-in" class="w-4 h-4"></i>
                    <span>Entrar no Portal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
    <div class="h-16 md:h-20"></div>
  `);

  if (window.lucide) lucide.createIcons();
  setupEvents();
}

function renderizarFooter() {
  const existingFooter = document.querySelector('footer.platform-footer');
  if (existingFooter) existingFooter.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="platform-footer mt-20 pb-12 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 md:px-8 pt-12">
        <div class="flex flex-col md:flex-row justify-between items-center gap-8">
          <div class="flex flex-col items-center md:items-start gap-4">
            <div class="flex items-center gap-3 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div class="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-white"></i>
              </div>
              <span class="text-xs font-black tracking-widest uppercase">Quasar Platform</span>
            </div>
            <p class="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center md:text-left">
              &copy; 2024 PRESSAGIO DESIGN. TODOS OS DIREITOS RESERVADOS.
            </p>
          </div>
          
          <div class="flex flex-col items-center md:items-end gap-2">
            <div class="flex items-center gap-6 mb-2">
              <a href="#" class="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">Termos</a>
              <a href="#" class="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">Privacidade</a>
              <a href="#" class="text-[10px] font-black text-gray-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">Suporte</a>
            </div>
            <div class="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-[9px] font-black text-gray-500 uppercase tracking-tighter">v2.0.8 — STABLE RELEASE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `);

  if (window.lucide) lucide.createIcons();
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
      ` : `
        <a href="/dashboard-aluno.html" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm transition-colors mb-1">
          <i data-lucide="user" class="w-4 h-4 text-[#00F0FF]"></i>
          <span>Meu Perfil</span>
        </a>
      `}
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
// Renderiza imediatamente se for login ou público para evitar "flash" de página vazia
if (isLoginPage || window.location.pathname.includes('publico')) {
  renderizarHeader();
  renderizarFooter();
}

requireAuth(async (user) => {
  // Se estamos na página de login e o usuário já está autenticado, vai para o index
  if (isLoginPage && user) {
    window.location.href = "/index.html";
    return;
  }

  // Renderiza para todos os outros casos autenticados
  renderizarHeader();
  renderizarFooter();
  
  if (isLoginPage) return;
  
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // Primeiro acesso — criar profile
    const papel = user.email.endsWith('@educar.rn.gov.br') ? "professor" : "aluno";
    let escolaId = null;
    let turmaId = null;

    if (papel === "aluno") {
      // Tenta vincular matrícula pré-existente
      const q = query(collection(db, "matriculas"), where("email", "==", user.email.toLowerCase()));
      const mSnap = await getDocs(q);
      if (!mSnap.empty) {
        const matDoc = mSnap.docs[0];
        escolaId = matDoc.data().escola_id;
        turmaId = matDoc.data().turma_id;
        // Vincula UID à matrícula
        await updateDoc(matDoc.ref, { aluno_uid: user.uid });
      }
    }

    const profile = {
      nome: user.displayName,
      email: user.email,
      papel: papel,
      escola_id: escolaId,
      turma_id: turmaId,
      created_at: serverTimestamp()
    };
    await setDoc(userRef, profile);
    atualizarHeaderUsuario(user, profile);
    
    if (!profile.escola_id && !isOnboardingPage) {
      window.location.href = "/onboarding.html";
      return;
    }
  }

  const profile = snap.data();

  // Se for aluno e não tiver escola, tenta vincular agora (caso tenha sido criado antes da lógica de vínculo)
  if (profile.papel === "aluno" && !profile.escola_id) {
    const q = query(collection(db, "matriculas"), where("email", "==", user.email.toLowerCase()));
    const mSnap = await getDocs(q);
    if (!mSnap.empty) {
      const matDoc = mSnap.docs[0];
      const matData = matDoc.data();
      await updateDoc(userRef, { escola_id: matData.escola_id, turma_id: matData.turma_id });
      await updateDoc(matDoc.ref, { aluno_uid: user.uid });
      profile.escola_id = matData.escola_id;
      profile.turma_id = matData.turma_id;
    }
  }

  // Se não tem escola_id mas tem vinculos (Professor multi-escola), recupera o primeiro para não travar o app
  if (!profile.escola_id && profile.vinculos && profile.vinculos.length > 0) {
    const primaryEscola = profile.vinculos[0];
    await updateDoc(doc(db, "users", user.uid), { escola_id: primaryEscola });
    profile.escola_id = primaryEscola;
  }

  atualizarHeaderUsuario(user, profile);

  if (!profile.escola_id && !isOnboardingPage) {
    window.location.href = "/onboarding.html";
    return;
  }

  // Se já tiver escola e estiver na onboarding, vai pro index (a menos que queira adicionar outra)
  const isForceAdd = new URLSearchParams(window.location.search).get('mode') === 'add';
  if (profile.escola_id && isOnboardingPage && !isForceAdd) {
    window.location.href = "/index.html";
    return;
  }
});
