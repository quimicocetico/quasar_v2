// app.js — Motor Global da Plataforma Quasar
// Responsabilidade: injetar UI (header/footer), gerenciar estado de auth no header.
// NÃO controla lógica de quiz/formulário — isso é responsabilidade de cada aula.

import { auth, loginComGoogle } from '/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Expõe no globalThis para aulas que precisam referenciar via módulo isolado
globalThis.auth = auth;
globalThis.loginComGoogle = loginComGoogle;
globalThis.onAuthStateChanged = onAuthStateChanged;
globalThis.db = (await import('/firebase-config.js')).db;

// Injeção de dependências visuais (Tailwind, Lucide, Fontes)
document.head.insertAdjacentHTML('beforeend', `
  <script src="https://cdn.tailwindcss.com/3.4.17"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = { theme: { extend: { fontFamily: { display: ['Outfit', 'sans-serif'], mono: ['Space Mono', 'monospace'] } } } }
  <\/script>
  <style>
    :root { --bg-deep: #0A0F1C; --bg-surface: #111827; --accent-primary: #00F0FF; --accent-secondary: #7000FF; --text-main: #FFFFFF; --text-muted: #9CA3AF; }
    body { background-color: var(--bg-deep); color: var(--text-main); font-family: 'Outfit', sans-serif; }
    .glass-panel { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
    .btn-neon { background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
  </style>
`);

// Injeta Header e Footer globais
function renderizarUI() {
    const header = `
    <header class="fixed w-full z-50 glass-panel border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <a href="/" class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl btn-neon flex items-center justify-center"><i data-lucide="zap" class="w-6 h-6 text-white"></i></div>
                    <span class="font-display font-bold text-2xl tracking-tight text-white">Plataforma <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#7000FF]">Quasar</span></span>
                </a>
                <div id="auth-panel" class="flex items-center gap-4">
                    <button id="btn-login-global" class="hidden text-sm font-medium text-white hover:text-[#00F0FF] transition-colors">Entrar</button>
                    <div id="user-info" class="hidden items-center gap-3">
                        <span id="user-name" class="text-sm text-gray-300"></span>
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><i data-lucide="user" class="w-4 h-4"></i></div>
                    </div>
                </div>
            </div>
        </div>
    </header>`;

    const footer = `
    <footer class="bg-[#111827] border-t border-white/5 pt-16 pb-8 mt-20">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-gray-400 font-mono text-sm">© 2026 Plataforma Quasar · EESPA</p>
        </div>
    </footer>`;

    document.body.insertAdjacentHTML('afterbegin', header);
    document.body.insertAdjacentHTML('beforeend', footer);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 200);
}

// Gerencia APENAS o estado visual do header — não interfere com lógica de aulas
function gerenciarAuth() {
    const btnLogin = document.getElementById('btn-login-global');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');

    if (btnLogin) {
        btnLogin.onclick = async () => {
            try { await loginComGoogle(); }
            catch (e) { console.error('[Quasar] Erro no login:', e); }
        };
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (btnLogin) btnLogin.classList.add('hidden');
            if (userInfo) { userInfo.classList.remove('hidden'); userInfo.classList.add('flex'); }
            if (userName) userName.textContent = user.displayName || user.email;
        } else {
            if (btnLogin) btnLogin.classList.remove('hidden');
            if (userInfo) { userInfo.classList.add('hidden'); userInfo.classList.remove('flex'); }
        }
    });
}

renderizarUI();
gerenciarAuth();
