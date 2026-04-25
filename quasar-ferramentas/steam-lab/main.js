import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, getDoc, orderBy, limit, setDoc } from "../../_shared/db.js";
import { ETAPAS_MCAT } from "./etapas.js";

// --- Globais ---
const urlParams = new URLSearchParams(window.location.search);
const MAGIC_TOKEN = urlParams.get('token');
const MAGIC_PROJETO = urlParams.get('projeto');
let VISITANTE_NOME = sessionStorage.getItem('visitante_nome');

let projetoAtual = null;
let etapaAtiva = null;
let userLogado = null;
let perfilLogado = null;

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
                renderAmbienteTrabalho();
                return;
            }
        }
    }

    requireAuth(async (user, profile) => {
        userLogado = user;
        perfilLogado = profile;
        document.getElementById('user-greeting').textContent = profile.nome || user.email;

        if (profile.papel === 'professor') {
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

function renderProgressBar(percent) {
    const hue = percent * 1.2; // 0 (Red/Orange) to 120 (Green)
    return `
        <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%; background-color: hsl(${hue}, 80%, 45%);"></div>
        </div>
        <span class="progress-text">${Math.round(percent)}% concluído</span>
    `;
}

function formatarNomeEmail(email) {
    if (!email) return "";
    const namePart = email.split('@')[0];
    return namePart.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
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

        // Cálculo de Progresso
        const etapasSnap = await getDocs(collection(db, `projetos/${id}/etapas`));
        let aprovadas = 0;
        etapasSnap.forEach(d => { if (d.data().status_etapa === "aprovado") aprovadas++; });
        const percent = (aprovadas / 15) * 100;

        const div = document.createElement('div');
        div.className = 'project-card edu-card';
        div.innerHTML = `
            <div class="card-header">
                <h3 class="text-xs font-bold text-white mb-0 truncate pr-4">${p.dados_gerais.titulo}</h3>
                <span class="status-badge status-${p.dados_gerais.status}">${p.dados_gerais.status.replace('_', ' ')}</span>
            </div>

            ${renderProgressBar(percent)}

            <div class="card-body">
                <div class="project-info">
                    <div class="member-list">
                        ${p.membros_status.map(m => `
                            <div class="member-item">
                                <div class="member-info">
                                    <span class="dot ${m.status === 'aceito' ? 'accepted' : 'pending'}"></span>
                                    <span class="opacity-80 truncate max-w-[100px]" title="${m.email}">${formatarNomeEmail(m.email)}</span>
                                </div>
                                ${souProfessor ? `<button onclick="removerMembro('${id}', '${m.email}')" class="btn-icon-sm remove" title="Remover aluno">🗑️</button>` : ''}
                            </div>
                        `).join('')}
                        ${souProfessor && p.membros_emails.length < 3 ? `
                            <div class="member-item border-t border-white/5 pt-1 mt-1">
                                <button onclick="adicionarMembro('${id}')" class="btn-icon-sm add text-[8px] flex items-center gap-1">
                                    <span>+ Convidar Aluno</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="project-actions">
                    <button onclick="abrirProjeto('${id}')" class="btn btn-primary btn-action">Abrir Lab</button>
                    ${souProfessor ? `<button onclick="abrirMagicModal('${id}')" class="btn btn-secondary btn-action">Acesso Coorientador</button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

// --- Membros ---
window.removerMembro = async (projetoId, email) => {
    if (!confirm(`Remover ${email} do projeto?`)) return;
    const pRef = doc(db, "projetos", projetoId);
    const pSnap = await getDoc(pRef);
    const p = pSnap.data();
    const ns = p.membros_status.filter(m => m.email !== email);
    const ne = p.membros_emails.filter(e => e !== email);
    if (ne.length === 0) return alert("O projeto precisa de pelo menos um aluno.");
    await updateDoc(pRef, { membros_emails: ne, membros_status: ns });
    location.reload();
};

window.adicionarMembro = async (projetoId) => {
    projetoAtual = { id: projetoId }; // Temporário para a busca
    const modal = document.getElementById('search-member-modal');
    modal.classList.remove('hidden');

    const escolaSelect = document.getElementById('search-escola');
    escolaSelect.innerHTML = '<option value="">Selecione uma escola...</option>';

    const vinculos = perfilLogado.vinculos || (perfilLogado.escola_id ? [perfilLogado.escola_id] : []);

    if (vinculos.length === 0) {
        escolaSelect.innerHTML = '<option value="">Nenhuma escola vinculada</option>';
        return;
    }

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

window.fecharSearchModal = () => document.getElementById('search-member-modal').classList.add('hidden');

// Listeners para a Busca de Alunos no Modal
document.getElementById('search-escola').onchange = async (e) => {
    const escolaId = e.target.value;
    const turmaSelect = document.getElementById('search-turma');
    const results = document.getElementById('search-results');

    turmaSelect.innerHTML = '<option value="">Carregando turmas...</option>';
    turmaSelect.disabled = true;
    results.innerHTML = '<p class="text-xs text-gray-500 italic">Aguardando turma...</p>';

    if (!escolaId) return;

    const q = query(collection(db, "escolas", escolaId, "turmas")); // Caminho corrigido para subcoleção
    const snap = await getDocs(q);

    turmaSelect.innerHTML = '<option value="">Selecione a turma...</option>';
    snap.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.data().nome;
        turmaSelect.appendChild(opt);
    });
    turmaSelect.disabled = false;
};

document.getElementById('search-turma').onchange = async (e) => {
    const turmaId = e.target.value;
    const results = document.getElementById('search-results');
    results.innerHTML = '<p class="text-xs text-gray-500 italic">Carregando alunos...</p>';

    if (!turmaId) return;

    const q = query(collection(db, "matriculas"), where("turma_id", "==", turmaId));
    const snap = await getDocs(q);

    results.innerHTML = '';
    if (snap.empty) {
        results.innerHTML = '<p class="text-xs text-red-400">Nenhum aluno encontrado nesta turma.</p>';
        return;
    }

    snap.forEach(d => {
        const aluno = d.data();
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="flex flex-col">
                <span class="text-sm font-bold text-white">${aluno.nome}</span>
                <span class="text-[10px] opacity-50">${aluno.email}</span>
            </div>
            <button onclick="convidarEstudante('${aluno.email}')" class="btn btn-secondary py-1 px-3 text-[10px]">Convidar</button>
        `;
        results.appendChild(div);
    });
};

window.convidarEstudante = async (email) => {
    const pRef = doc(db, "projetos", projetoAtual.id);
    const pSnap = await getDoc(pRef);
    const p = pSnap.data();

    if (p.membros_emails.includes(email)) return alert("Este aluno já faz parte do projeto.");
    if (p.membros_emails.length >= 3) return alert("Limite de 3 alunos atingido.");

    await updateDoc(pRef, {
        membros_emails: arrayUnion(email),
        membros_status: arrayUnion({ email, status: "pendente" }),
        "dados_gerais.status": "aguardando_alunos"
    });

    alert(`Convite enviado para ${email}!`);
    fecharSearchModal();
    location.reload();
};

// --- Convite ---
function renderizarConvite(id, p) {
    const div = document.createElement('div');
    div.className = 'edu-card border-cyan-400/30 bg-cyan-400/5 flex justify-between items-center py-4';
    div.innerHTML = `
        <div class="flex flex-col">
            <span class="text-[8px] font-bold text-cyan-400 uppercase">Convite de Pesquisa</span>
            <span class="text-sm font-bold">${p.dados_gerais.titulo}</span>
        </div>
        <div class="flex gap-2">
            <button onclick="responderConvite('${id}', 'aceito')" class="btn btn-primary py-2 px-4 text-[10px]">Aceitar</button>
            <button onclick="responderConvite('${id}', 'recusado')" class="btn btn-secondary py-2 px-4 text-[10px]">Recusar</button>
        </div>
    `;
    document.getElementById('invites-container').appendChild(div);
}

// --- Ambiente de Trabalho ---
window.abrirProjeto = async (id) => {
    const pSnap = await getDoc(doc(db, "projetos", id));
    projetoAtual = { id, ...pSnap.data() };
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('project-view').classList.remove('hidden');
    carregarEtapas();
};

async function carregarEtapas() {
    const stepsTrail = document.getElementById('steps-trail');
    stepsTrail.innerHTML = '';
    const etapasSnap = await getDocs(collection(db, `projetos/${projetoAtual.id}/etapas`));
    const statusEtapas = {};
    etapasSnap.forEach(d => statusEtapas[d.id] = d.data());

    let ultimaAprovada = true;
    ETAPAS_MCAT.forEach(etapa => {
        const info = statusEtapas[etapa.id] || { status_etapa: "aguardando" };
        const isAprovada = info.status_etapa === "aprovado";
        const isDesbloqueada = ultimaAprovada;

        const btn = document.createElement('button');
        btn.className = `step-item ${isDesbloqueada ? 'unlocked' : 'blocked'} ${isAprovada ? 'approved' : ''} ${info.status_etapa === 'aguardando_aprovacao' ? 'waiting' : ''}`;
        btn.onclick = isDesbloqueada ? () => selecionarEtapa(etapa, info) : null;
        btn.innerHTML = `<span class="step-number">${etapa.id}</span><span class="step-label">${etapa.titulo}</span>`;
        stepsTrail.appendChild(btn);

        ultimaAprovada = isAprovada;
    });
}

async function selecionarEtapa(etapa, info) {
    etapaAtiva = etapa;
    document.querySelectorAll('.step-item').forEach(el => {
        if (el.querySelector('.step-number').textContent === etapa.id) el.classList.add('active');
        else el.classList.remove('active');
    });

    document.getElementById('step-editor-empty').classList.add('hidden');
    document.getElementById('step-editor').classList.remove('hidden');
    document.getElementById('step-title').textContent = etapa.titulo;
    document.getElementById('step-instruction').textContent = etapa.instrucao;
    document.getElementById('step-status-tag').textContent = (info.status_etapa || 'aguardando').replace('_', ' ');
    document.getElementById('step-status-tag').className = `status-badge status-${info.status_etapa}`;

    document.getElementById('step-checklist').innerHTML = etapa.checklist.map(i => `
        <li class="flex items-center gap-2 text-[10px] text-gray-400">
            <span class="w-1 h-1 bg-cyan-400 rounded-full"></span><span>${i}</span>
        </li>`).join('');

    const isProfessor = perfilLogado.papel === 'professor';
    const isCoorientador = perfilLogado.papel === 'coorientador';
    const isAluno = perfilLogado.papel === 'aluno';

    document.getElementById('student-editor-area').classList.toggle('hidden', !isAluno || info.status_etapa === 'aguardando_aprovacao');
    document.getElementById('evaluation-area').classList.toggle('hidden', isAluno);

    if (!isAluno) renderBotoesAvaliacao(isProfessor, info.status_etapa);
    carregarHistorico(etapa.id);
}

// --- Avaliação ---
function renderBotoesAvaliacao(isProfessor, status) {
    const container = document.getElementById('evaluation-buttons');
    container.innerHTML = '';

    const btnComentar = document.createElement('button');
    btnComentar.className = 'btn-small-ic bg-white/5 text-white';
    btnComentar.textContent = 'Apenas Feedback';
    btnComentar.onclick = () => enviarFeedback(null);
    container.appendChild(btnComentar);

    if (isProfessor && status === 'aguardando_aprovacao') {
        const btnAprovar = document.createElement('button');
        btnAprovar.className = 'btn-small-ic bg-green-500 text-black';
        btnAprovar.textContent = 'Aprovar Etapa';
        btnAprovar.onclick = () => enviarFeedback('aprovado');
        container.appendChild(btnAprovar);

        const btnDevolver = document.createElement('button');
        btnDevolver.className = 'btn-small-ic bg-orange-500 text-black';
        btnDevolver.textContent = 'Devolver p/ Ajustes';
        btnDevolver.onclick = () => enviarFeedback('devolvido');
        container.appendChild(btnDevolver);
    }
}

async function enviarFeedback(novoStatus) {
    const texto = document.getElementById('feedback-text').value.trim();
    if (!texto && !novoStatus) return;

    const subSnap = await getDocs(query(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaAtiva.id}/submissoes`), orderBy("data_envio", "desc"), limit(1)));
    if (subSnap.empty) return alert("Nenhuma submissão ativa.");

    await addDoc(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaAtiva.id}/submissoes/${subSnap.docs[0].id}/feedbacks`), {
        autor: perfilLogado.papel === 'professor' ? "Professor" : perfilLogado.nome,
        autor_tipo: perfilLogado.papel,
        comentario: texto || (novoStatus === 'aprovado' ? "Etapa aprovada." : "Aguardando ajustes."),
        token: perfilLogado.papel === 'professor' ? null : MAGIC_TOKEN,
        data: serverTimestamp()
    });

    if (novoStatus) {
        await updateDoc(doc(db, `projetos/${projetoAtual.id}/etapas/${etapaAtiva.id}`), { status_etapa: novoStatus, ultima_atualizacao: serverTimestamp() });
    }

    document.getElementById('feedback-text').value = '';
    alert("Operação concluída!");
    carregarEtapas();
    selecionarEtapa(etapaAtiva, { status_etapa: novoStatus || 'aguardando_aprovacao' });
}

async function carregarHistorico(etapaId) {
    const container = document.getElementById('logbook-history');
    container.innerHTML = '';
    const subSnap = await getDocs(query(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/submissoes`), orderBy("data_envio", "desc")));

    for (const sDoc of subSnap.docs) {
        const sub = sDoc.data();
        const card = document.createElement('div');
        card.className = `history-card ${subSnap.docs.indexOf(sDoc) === 0 ? 'latest' : 'old'}`;
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2 opacity-50">
                <span class="text-[8px] font-mono">${sub.data_envio?.toDate().toLocaleString() || 'Processando...'}</span>
                <span class="text-[8px] font-bold uppercase">${sub.autor_email}</span>
            </div>
            <div class="markdown-content">${marked.parse(sub.conteudo_markdown)}</div>
            <div id="feedbacks-${sDoc.id}" class="mt-3 space-y-2 border-t border-white/5 pt-2"></div>
        `;
        container.appendChild(card);
        carregarFeedbacks(sDoc.id, etapaId);
    }
}

async function carregarFeedbacks(subId, etapaId) {
    const fSnap = await getDocs(query(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/submissoes/${subId}/feedbacks`), orderBy("data", "asc")));
    const fContainer = document.getElementById(`feedbacks-${subId}`);
    fSnap.forEach(fDoc => {
        const f = fDoc.data();
        const bubble = document.createElement('div');
        bubble.className = `feedback-bubble ${f.autor_tipo === 'professor' ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : 'bg-purple-500/10 border-l-2 border-purple-500'}`;
        bubble.innerHTML = `
            <p class="text-[8px] font-bold uppercase mb-1 opacity-50">${f.autor}</p>
            <p>${f.comentario}</p>
        `;
        fContainer.appendChild(bubble);
    });
}

// --- Magic Link & Modal Logic ---
window.abrirMagicModal = async (id) => {
    const pSnap = await getDoc(doc(db, "projetos", id));
    const p = pSnap.data();
    const url = `${window.location.origin}${window.location.pathname}?projeto=${id}&token=${p.dados_gerais.token_coorientador}`;

    document.getElementById('magic-link-text').textContent = url;
    document.getElementById('magic-qr').src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}`;
    document.getElementById('magic-link-modal').classList.remove('hidden');

    document.getElementById('btn-revogar-magic').onclick = async () => {
        if (!confirm("Revogar acesso?")) return;
        await updateDoc(doc(db, "projetos", id), { "dados_gerais.token_coorientador": crypto.randomUUID() });
        abrirMagicModal(id);
    };
};

window.fecharMagicModal = () => document.getElementById('magic-link-modal').classList.add('hidden');
window.copiarLinkMagico = () => {
    navigator.clipboard.writeText(document.getElementById('magic-link-text').textContent).then(() => alert("Link copiado!"));
};

function setupEventListeners() {
    const creationModal = document.getElementById('creation-modal');
    const form = document.getElementById('form-projeto');

    document.querySelectorAll('#btn-show-form, #btn-show-form-empty').forEach(btn => {
        btn.onclick = () => creationModal.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-creation').onclick = () => {
        creationModal.classList.add('hidden');
        form.reset();
    };

    document.getElementById('btn-back-dashboard').onclick = () => location.reload();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit');
        btn.disabled = true; btn.textContent = "Criando...";

        try {
            const emails = [document.getElementById('email1').value, document.getElementById('email2').value, document.getElementById('email3').value].filter(v => v);
            await addDoc(collection(db, "projetos"), {
                dados_gerais: {
                    titulo: document.getElementById('titulo').value,
                    problema_inicial: document.getElementById('problema').value,
                    professorId: userLogado.uid,
                    token_coorientador: crypto.randomUUID(),
                    status: "aguardando_alunos"
                },
                membros_emails: emails,
                membros_status: emails.map(e => ({ email: e, status: "pendente" })),
                data_criacao: serverTimestamp()
            });
            alert("Projeto Criado!");
            location.reload();
        } catch (err) { alert("Erro ao criar."); btn.disabled = false; btn.textContent = "Criar Projeto"; }
    });

    document.getElementById('btn-submit-step').onclick = async () => {
        const conteudo = document.getElementById('editor-markdown').value.trim();
        if (!conteudo) return;
        await addDoc(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaAtiva.id}/submissoes`), {
            conteudo_markdown: conteudo,
            autor_email: userLogado.email,
            data_envio: serverTimestamp()
        });
        await setDoc(doc(db, `projetos/${projetoAtual.id}/etapas/${etapaAtiva.id}`), { status_etapa: "aguardando_aprovacao", ultima_atualizacao: serverTimestamp() }, { merge: true });
        alert("Enviado!"); location.reload();
    };
}

window.responderConvite = async (id, resp) => {
    const pRef = doc(db, "projetos", id);
    const pSnap = await getDoc(pRef);
    const p = pSnap.data();
    const ns = p.membros_status.map(m => m.email === userLogado.email ? { ...m, status: resp } : m);
    if (resp === 'aceito') {
        const todos = ns.every(m => m.status === 'aceito');
        await updateDoc(pRef, { membros_status: ns, "dados_gerais.status": todos ? "em_andamento" : "aguardando_alunos" });
    } else {
        await updateDoc(pRef, { membros_emails: arrayRemove(userLogado.email), membros_status: ns });
    }
    location.reload();
};
