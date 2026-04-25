import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, getDoc, orderBy, limit, setDoc, onSnapshot } from "../../_shared/db.js";
import { ETAPAS_MCAT } from "./etapas.js";

// --- Globais ---
const urlParams = new URLSearchParams(window.location.search);
const MAGIC_TOKEN = urlParams.get('token');
const MAGIC_PROJETO = urlParams.get('projeto');
let VISITANTE_NOME = sessionStorage.getItem('visitante_nome');

let projetoAtual = null;
let perfilLogado = null;
let etapaAbertaId = null; // Controle do Accordion
let unsubEtapas = null;

// --- Inicialização ---
async function init() {
    if (MAGIC_TOKEN && MAGIC_PROJETO) {
        const pRef = doc(db, "projetos", MAGIC_PROJETO);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists() && pSnap.data().dados_gerais.token_coorientador === MAGIC_TOKEN) {
            if (!VISITANTE_NOME) {
                VISITANTE_NOME = prompt("Olá! Como gostaria de ser identificado nos comentários?");
                if (VISITANTE_NOME) sessionStorage.setItem('visitante_nome', VISITANTE_NOME);
            }
            if (VISITANTE_NOME) {
                projetoAtual = { id: MAGIC_PROJETO, ...pSnap.data() };
                perfilLogado = { papel: 'coorientador', nome: VISITANTE_NOME };
                abrirProjeto(MAGIC_PROJETO);
                return;
            }
        }
    }

    requireAuth(async (user, profile) => {
        perfilLogado = { ...profile, uid: user.uid };
        document.getElementById('user-greeting').textContent = perfilLogado.nome || user.email;

        if (perfilLogado.papel === 'professor') {
            carregarProjetosProfessor(user.uid);
        } else {
            carregarFluxoAluno(user.email);
        }

        setupEventListeners();
    });
}

init();

// --- Dashboard ---
async function carregarProjetosProfessor(professorId) {
    const q = query(collection(db, "projetos"), where("dados_gerais.professorId", "==", professorId));
    const snap = await getDocs(q);

    if (snap.empty) {
        document.getElementById('teacher-actions-empty').classList.remove('hidden');
        document.getElementById('projects-section').classList.add('hidden');
    } else {
        document.getElementById('projects-section').classList.remove('hidden');
        document.getElementById('teacher-actions-empty').classList.add('hidden');
        renderizarProjetos(snap, true);
    }
}

async function carregarFluxoAluno(email) {
    const q = query(collection(db, "projetos"), where("membros_emails", "array-contains", email));
    const snap = await getDocs(q);

    const invitesContainer = document.getElementById('invites-container');
    invitesContainer.innerHTML = '';
    snap.forEach(pDoc => {
        const p = pDoc.data();
        const meuStatus = p.membros_status.find(m => m.email === email);
        if (meuStatus && meuStatus.status === "pendente") renderizarConvite(pDoc.id, p);
    });

    document.getElementById('projects-section').classList.remove('hidden');
    renderizarProjetos(snap, false, email);
}

async function renderizarProjetos(snap, souProfessor, alunoEmail = null) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    for (const pDoc of snap.docs) {
        const p = pDoc.data();
        const id = pDoc.id;
        if (!souProfessor) {
            const ms = p.membros_status.find(m => m.email === alunoEmail);
            if (!ms || ms.status !== "aceito") continue;
        }

        // Calcular Progresso
        const etapasSnap = await getDocs(query(collection(db, `projetos/${id}/etapas`), where("status_etapa", "==", "aprovado")));
        const aprovadas = etapasSnap.size;
        const total = 15;
        const pct = Math.round((aprovadas / total) * 100);

        const div = document.createElement('div');
        div.className = 'project-card edu-card p-6 flex flex-col h-full';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black uppercase tracking-widest text-cyan-400">Projeto MCAT</span>
                    <h3 class="text-sm font-black text-white leading-tight">${p.dados_gerais.titulo}</h3>
                </div>
                <div class="text-right">
                    <span class="text-[14px] font-black text-cyan-400">${pct}%</span>
                    <p class="text-[7px] font-black uppercase text-gray-500 tracking-tighter">Progresso</p>
                </div>
            </div>

            <!-- Barra de Progresso -->
            <div class="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style="width: ${pct}%"></div>
            </div>
            
            <div class="flex-grow space-y-6">
                <!-- Lista de Pesquisadores -->
                <div class="space-y-3">
                    <p class="text-[8px] font-black uppercase tracking-widest text-gray-600 ml-1">Equipe de Pesquisa</p>
                    <div class="space-y-2">
                        ${p.membros_status.map(m => `
                            <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                <div class="flex items-center gap-2 overflow-hidden">
                                    <div class="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center text-[7px] font-black text-cyan-500 shrink-0">
                                        ${(m.nome || m.email).charAt(0).toUpperCase()}
                                    </div>
                                    <span class="text-[9px] font-bold text-gray-300 truncate">${m.nome || m.email}</span>
                                    ${m.status === 'pendente' ? '<span class="text-[6px] font-black uppercase px-1 bg-amber-500/10 text-amber-500 rounded">Pendente</span>' : ''}
                                </div>
                                ${souProfessor ? `
                                    <button onclick="removerMembro('${id}', '${m.email}')" class="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all">
                                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="mt-8 flex gap-2">
                <button onclick="abrirProjeto('${id}')" class="btn-glow flex-grow py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">Entrar no Lab</button>
                ${souProfessor ? `
                    <button onclick="abrirMagicModal('${id}')" class="w-12 h-10 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all" title="Compartilhar Acesso">
                        <i data-lucide="share-2" class="w-4 h-4"></i>
                    </button>
                ` : ''}
            </div>
        `;
        container.appendChild(div);
    }
    if (window.lucide) lucide.createIcons();
}

// --- Convites e Membros ---
function renderizarConvite(id, p) {
    const div = document.createElement('div');
    div.className = 'edu-card border-cyan-400/30 bg-cyan-400/5 flex justify-between items-center py-4 px-6 rounded-2xl';
    div.innerHTML = `
        <div class="flex flex-col">
            <span class="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">Convite de Pesquisa</span>
            <span class="text-xs font-bold text-white">${p.dados_gerais.titulo}</span>
        </div>
        <div class="flex gap-2">
            <button onclick="responderConvite('${id}', 'aceito')" class="px-4 py-2 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl">Aceitar</button>
            <button onclick="responderConvite('${id}', 'recusado')" class="px-4 py-2 bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10">Recusar</button>
        </div>
    `;
    document.getElementById('invites-container').appendChild(div);
}

window.responderConvite = async (id, resp) => {
    const pRef = doc(db, "projetos", id);
    const pSnap = await getDoc(pRef);
    const p = pSnap.data();
    
    requireAuth(async (user) => {
        const ns = p.membros_status.map(m => m.email === user.email ? { ...m, status: resp } : m);
        if (resp === 'aceito') {
            const todos = ns.every(m => m.status === 'aceito');
            await updateDoc(pRef, { membros_status: ns, "dados_gerais.status": todos ? "em_andamento" : "aguardando_alunos" });
        } else {
            await updateDoc(pRef, { membros_emails: arrayRemove(user.email), membros_status: ns.filter(m => m.email !== user.email) });
        }
        location.reload();
    });
};

window.adicionarMembro = async (projetoId) => {
    projetoAtual = { id: projetoId };
    const modal = document.getElementById('search-member-modal');
    modal.classList.remove('hidden');

    const escolaSelect = document.getElementById('search-escola');
    escolaSelect.innerHTML = '<option value="">Selecione uma escola...</option>';

    const vinculos = perfilLogado.vinculos || (perfilLogado.escola_id ? [perfilLogado.escola_id] : []);

    for (const eid of vinculos) {
        const eSnap = await getDoc(doc(db, "escolas", eid));
        if (eSnap.exists()) {
            const opt = document.createElement('option');
            opt.value = eid;
            opt.textContent = eSnap.data().nome;
            escolaSelect.appendChild(opt);
        }
    }
};

window.convidarEstudante = async (email, nome) => {
    const pRef = doc(db, "projetos", projetoAtual.id);
    const pSnap = await getDoc(pRef);
    const p = pSnap.data();

    if (p.membros_emails.includes(email)) return alert("Este aluno já faz parte do projeto.");
    if (p.membros_emails.length >= 3) return alert("Limite de 3 alunos atingido.");

    await updateDoc(pRef, {
        membros_emails: arrayUnion(email),
        membros_status: arrayUnion({ email, nome, status: "pendente" }),
        "dados_gerais.status": "aguardando_alunos"
    });

    alert(`Convite enviado para ${email}!`);
    fecharSearchModal();
    location.reload();
};

window.removerMembro = async (id, email) => {
    if (!confirm(`Remover ${email}?`)) return;
    const pRef = doc(db, "projetos", id);
    const pSnap = await getDoc(pRef);
    const p = pSnap.data();
    await updateDoc(pRef, {
        membros_emails: arrayRemove(email),
        membros_status: p.membros_status.filter(m => m.email !== email)
    });
    location.reload();
};

// --- Navegação ---
window.abrirProjeto = (id) => {
    window.location.href = `projeto.html?id=${id}`;
};

// --- Event Listeners Globais ---
let pesquisadoresSelecionados = [];

function setupEventListeners() {
    const creationModal = document.getElementById('creation-modal');
    
    document.querySelectorAll('#btn-show-form, #btn-show-form-empty').forEach(btn => {
        btn.onclick = async () => {
            creationModal.classList.remove('hidden');
            pesquisadoresSelecionados = [];
            renderSelectedResearchers();
            
            const escolaSelect = document.getElementById('create-escola');
            escolaSelect.innerHTML = '<option value="">Escola...</option>';
            const vinculos = perfilLogado.vinculos || (perfilLogado.escola_id ? [perfilLogado.escola_id] : []);
            for (const eid of vinculos) {
                const eSnap = await getDoc(doc(db, "escolas", eid));
                if (eSnap.exists()) {
                    const opt = document.createElement('option');
                    opt.value = eid;
                    opt.textContent = eSnap.data().nome;
                    escolaSelect.appendChild(opt);
                }
            }
        };
    });

    window.fecharModalCriacao = () => document.getElementById('creation-modal').classList.add('hidden');
    window.fecharSearchModal = () => document.getElementById('search-member-modal').classList.add('hidden');
    window.fecharMagicModal = () => document.getElementById('magic-link-modal').classList.add('hidden');

    document.getElementById('btn-back-dashboard').onclick = () => location.reload();

    document.getElementById('create-escola').onchange = async (e) => {
        const eid = e.target.value;
        const tSelect = document.getElementById('create-turma');
        tSelect.disabled = true;
        tSelect.innerHTML = '<option value="">Carregando...</option>';
        if (!eid) return;

        const q = query(collection(db, "escolas", eid, "turmas"));
        const snap = await getDocs(q);
        tSelect.innerHTML = '<option value="">Turma...</option>';
        snap.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.data().nome;
            tSelect.appendChild(opt);
        });
        tSelect.disabled = false;
    };

    document.getElementById('create-turma').onchange = async (e) => {
        const tid = e.target.value;
        const results = document.getElementById('create-search-results');
        results.innerHTML = '<p class="text-[8px] text-gray-500 italic p-4 text-center">Buscando alunos...</p>';
        if (!tid) return;

        const q = query(collection(db, "matriculas"), where("turma_id", "==", tid));
        const snap = await getDocs(q);
        results.innerHTML = '';
        snap.forEach(d => {
            const aluno = d.data();
            const jaSelecionado = pesquisadoresSelecionados.some(p => p.email === aluno.email);
            const div = document.createElement('div');
            div.className = `flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 mb-2 ${jaSelecionado ? 'opacity-40 grayscale pointer-events-none' : ''}`;
            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-white">${aluno.nome}</span>
                    <span class="text-[8px] text-gray-500">${aluno.email}</span>
                </div>
                <button type="button" onclick="selecionarParaCriacao('${aluno.email}', '${aluno.nome}')" class="px-3 py-1.5 bg-cyan-500 text-black text-[8px] font-black uppercase rounded-lg">Selecionar</button>
            `;
            results.appendChild(div);
        });
    };

    document.getElementById('form-projeto').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (pesquisadoresSelecionados.length === 0) return alert("Selecione pelo menos um pesquisador.");
        
        const btn = document.getElementById('btn-submit');
        btn.disabled = true; btn.textContent = "Protocolando...";

        try {
            const problema = document.getElementById('problema').value;
            const titulo = document.getElementById('titulo').value;
            const area = document.getElementById('area').value;
            const linkDrive = document.getElementById('link_drive').value;
            const membrosStatus = pesquisadoresSelecionados.map(p => ({ 
                email: p.email, 
                nome: p.nome, 
                status: "pendente" 
            }));

            const docRef = await addDoc(collection(db, "projetos"), {
                dados_gerais: {
                    titulo,
                    problema_inicial: problema,
                    area,
                    link_drive: linkDrive,
                    professorId: perfilLogado.uid || null,
                    token_coorientador: crypto.randomUUID(),
                    status: "aguardando_alunos"
                },
                membros_emails: pesquisadoresSelecionados.map(p => p.email),
                membros_status: membrosStatus,
                data_criacao: serverTimestamp()
            });

            // Inicializar Etapas 01 e 02 automaticamente
            const pId = docRef.id;
            await setDoc(doc(db, "projetos", pId, "etapas", "01"), { status_etapa: "aguardando" });
            await addDoc(collection(db, "projetos", pId, "etapas", "01", "submissoes"), {
                conteudo_markdown: "Equipe em processo de formação via aceites.",
                autor_email: "Sistema",
                data_envio: serverTimestamp()
            });

            await setDoc(doc(db, "projetos", pId, "etapas", "02"), { status_etapa: "aguardando" });
            await addDoc(collection(db, "projetos", pId, "etapas", "02", "submissoes"), {
                conteudo_markdown: problema,
                autor_email: "Sistema",
                data_envio: serverTimestamp()
            });

            location.reload();
        } catch (err) { 
            console.error("Erro na criação:", err);
            alert("Erro ao criar projeto: " + err.message); 
            btn.disabled = false; 
            btn.textContent = "Protocolar Projeto";
        }
    });

    document.getElementById('search-escola').onchange = async (e) => {
        const escolaId = e.target.value;
        const turmaSelect = document.getElementById('search-turma');
        if (!escolaId) return;
        turmaSelect.disabled = false;
        const q = query(collection(db, "escolas", escolaId, "turmas"));
        const snap = await getDocs(q);
        turmaSelect.innerHTML = '<option value="">Selecione a turma...</option>';
        snap.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.data().nome;
            turmaSelect.appendChild(opt);
        });
    };

    document.getElementById('search-turma').onchange = async (e) => {
        const turmaId = e.target.value;
        const results = document.getElementById('search-results');
        if (!turmaId) return;
        const q = query(collection(db, "matriculas"), where("turma_id", "==", turmaId));
        const snap = await getDocs(q);
        results.innerHTML = '';
        snap.forEach(d => {
            const aluno = d.data();
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 mb-2';
            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="text-[11px] font-bold text-white">${aluno.nome}</span>
                    <span class="text-[9px] text-gray-500">${aluno.email}</span>
                </div>
                <button onclick="convidarEstudante('${aluno.email}', '${aluno.nome}')" class="px-3 py-1.5 bg-indigo-500 text-white text-[9px] font-black uppercase rounded-lg">Convidar</button>
            `;
            results.appendChild(div);
        });
    };
}

window.selecionarParaCriacao = (email, nome) => {
    if (pesquisadoresSelecionados.length >= 3) return alert("Limite de 3 pesquisadores por projeto.");
    if (pesquisadoresSelecionados.some(p => p.email === email)) return;

    pesquisadoresSelecionados.push({ email, nome });
    renderSelectedResearchers();
    
    // Atualizar lista de busca para desabilitar o selecionado
    document.getElementById('create-turma').dispatchEvent(new Event('change'));
};

window.removerDaCriacao = (email) => {
    pesquisadoresSelecionados = pesquisadoresSelecionados.filter(p => p.email !== email);
    renderSelectedResearchers();
    document.getElementById('create-turma').dispatchEvent(new Event('change'));
};

function renderSelectedResearchers() {
    const container = document.getElementById('selected-researchers');
    if (pesquisadoresSelecionados.length === 0) {
        container.innerHTML = '<p class="text-[9px] text-gray-600 font-bold uppercase italic p-4 border border-dashed border-white/5 w-full text-center rounded-xl">Nenhum aluno selecionado</p>';
        return;
    }

    container.innerHTML = '';
    pesquisadoresSelecionados.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg animate-in zoom-in duration-200';
        chip.innerHTML = `
            <span class="text-[9px] font-black text-cyan-400 uppercase truncate max-w-[80px]">${p.nome.split(' ')[0]}</span>
            <button type="button" onclick="removerDaCriacao('${p.email}')" class="text-cyan-400 hover:text-white">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        container.appendChild(chip);
    });
    if (window.lucide) lucide.createIcons();
}

window.abrirMagicModal = async (id) => {
    const pSnap = await getDoc(doc(db, "projetos", id));
    const p = pSnap.data();
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
    const url = `${baseUrl}projeto.html?projeto=${id}&token=${p.dados_gerais.token_coorientador}`;

    document.getElementById('magic-link-text').textContent = url;
    document.getElementById('magic-qr').src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}`;
    document.getElementById('magic-link-modal').classList.remove('hidden');

    document.getElementById('btn-revogar-magic').onclick = async () => {
        if (!confirm("Revogar acesso atual? Isso invalidará o QR Code e o Link anteriores.")) return;
        const novoToken = crypto.randomUUID();
        await updateDoc(doc(db, "projetos", id), { "dados_gerais.token_coorientador": novoToken });
        abrirMagicModal(id);
    };

    if (window.lucide) lucide.createIcons();
};

window.fecharMagicModal = () => document.getElementById('magic-link-modal').classList.add('hidden');
window.copiarLinkMagico = () => {
    const text = document.getElementById('magic-link-text').textContent;
    navigator.clipboard.writeText(text).then(() => alert("Link copiado!"));
};
