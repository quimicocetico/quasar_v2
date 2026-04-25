import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, getDoc, orderBy, limit, setDoc, onSnapshot } from "../../_shared/db.js";
import { ETAPAS_MCAT } from "./etapas.js";

// --- Globais ---
const urlParams = new URLSearchParams(window.location.search);
const PROJETO_ID = urlParams.get('id');
const MAGIC_TOKEN = urlParams.get('token');
const MAGIC_PROJETO = urlParams.get('projeto');
let VISITANTE_NOME = sessionStorage.getItem('visitante_nome');

let projetoAtual = null;
let perfilLogado = null;
let etapaAbertaId = null; 
let unsubEtapas = null;

// --- Inicialização ---
async function init() {
    // Caso de Link Mágico (Co-orientador)
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
                perfilLogado = { papel: 'coorientador', nome: VISITANTE_NOME, uid: 'visitante' };
                configurarInterface();
                return;
            }
        }
    }

    // Fluxo Normal (Professor/Aluno)
    requireAuth(async (user, profile) => {
        const pId = PROJETO_ID || MAGIC_PROJETO;
        if (!pId) return window.location.href = "index.html";
        
        perfilLogado = { ...profile, uid: user.uid };

        const pRef = doc(db, "projetos", pId);
        const pSnap = await getDoc(pRef);
        
        if (!pSnap.exists()) {
            alert("Projeto não encontrado.");
            return window.location.href = "index.html";
        }

        projetoAtual = { id: pId, ...pSnap.data() };
        configurarInterface();
    });
}

init();

function configurarInterface() {
    document.getElementById('view-project-title').textContent = projetoAtual.dados_gerais.titulo;
    document.getElementById('view-project-area').textContent = projetoAtual.dados_gerais.area || "Geral";
    
    const driveLink = document.getElementById('view-project-drive');
    if (projetoAtual.dados_gerais.link_drive) {
        driveLink.href = projetoAtual.dados_gerais.link_drive;
        driveLink.classList.remove('hidden');
    } else {
        driveLink.classList.add('hidden');
    }

    carregarEtapasRealtime();
}

function carregarEtapasRealtime() {
    if (unsubEtapas) unsubEtapas();
    unsubEtapas = onSnapshot(collection(db, `projetos/${projetoAtual.id}/etapas`), (snap) => {
        const statusEtapas = {};
        snap.forEach(d => statusEtapas[d.id] = d.data());
        
        // Calcular Progresso
        const aprovadas = Object.values(statusEtapas).filter(e => e.status_etapa === 'aprovado').length;
        const pct = Math.round((aprovadas / 15) * 100);
        renderizarProgressoHeader(pct);
        
        renderizarFeedMCAT(statusEtapas);
    });
}

function renderizarProgressoHeader(pct) {
    const container = document.getElementById('view-project-progress');
    if (!container) return;

    // Cor dinâmica: 0 = vermelho (0), 120 = verde (100)
    const hue = Math.min(120, pct * 1.2);
    const color = `hsl(${hue}, 80%, 50%)`;

    container.innerHTML = `
        <div class="flex flex-col items-center gap-2">
            <div class="flex items-center gap-3">
                <div class="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div class="h-full transition-all duration-1000 ease-out" 
                         style="width: ${pct}%; background: ${color}; box-shadow: 0 0 10px ${color}44"></div>
                </div>
                <span class="text-[11px] font-black tracking-tighter" style="color: ${color}">${pct}%</span>
            </div>
            <p class="text-[7px] font-black uppercase tracking-[0.2em] text-gray-500">Conclusão do Ciclo MCAT</p>
        </div>
    `;
}

function renderizarFeedMCAT(statusEtapas) {
    const feed = document.getElementById('mcat-feed');
    feed.innerHTML = '';

    // Verificar Conclusão Total (Etapa 15 Aprovada)
    const isTotalmenteConcluido = statusEtapas["15"]?.status_etapa === 'aprovado';
    if (isTotalmenteConcluido) {
        const celebration = document.createElement('div');
        celebration.className = 'col-span-full mb-12 animate-in fade-in zoom-in duration-1000';
        celebration.innerHTML = `
            <div class="relative p-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
                <div class="bg-[#0A0F1C] rounded-[2.4rem] p-8 sm:p-12 text-center relative overflow-hidden">
                    <!-- Background Decor -->
                    <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div class="absolute -top-24 -left-24 w-64 h-64 bg-amber-500 rounded-full blur-[100px]"></div>
                        <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]"></div>
                    </div>

                    <div class="relative z-10">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mb-6 shadow-xl shadow-amber-500/20 border-4 border-amber-500/30">
                            <i data-lucide="award" class="w-10 h-10 text-white"></i>
                        </div>
                        
                        <h3 class="text-3xl sm:text-4xl font-black tracking-tighter text-white mb-4 uppercase">Pesquisa Concluída com <span class="text-amber-400">Excelência</span></h3>
                        <p class="text-gray-400 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed mb-8">
                            Parabéns à equipe! Vocês completaram com sucesso todas as 15 etapas do Ciclo de Investigação Científica. O rigor metodológico e a dedicação demonstrados são a marca de verdadeiros cientistas.
                        </p>

                        <div class="flex flex-wrap justify-center gap-4">
                            <div class="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]"></span>
                                <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">Selo de Qualidade STEAM</span>
                            </div>
                            <div class="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                                <span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#F59E0B]"></span>
                                <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">Pronto para Publicação</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        feed.appendChild(celebration);
    }

    let ultimaAprovada = true;
    let proximaAtividadeIdentificada = false;

    // Verificar se Etapa 01 deve ser auto-aprovada (Todos aceitaram)
    const todosAceitaram = projetoAtual.membros_status.every(m => m.status === 'aceito');
    if (todosAceitaram && statusEtapas["01"]?.status_etapa !== 'aprovado') {
        updateDoc(doc(db, `projetos/${projetoAtual.id}/etapas`, "01"), { status_etapa: "aprovado" });
    }

    ETAPAS_MCAT.forEach((etapa, index) => {
        const info = statusEtapas[etapa.id] || { status_etapa: "aguardando" };
        const isAprovada = info.status_etapa === "aprovado";
        const isEsperando = info.status_etapa === "aguardando_aprovacao";
        const isDevolvida = info.status_etapa === "devolvido";
        
        // Etapas 01, 02 e 03 são desbloqueadas por padrão (não bloqueantes entre si)
        const isDesbloqueada = index < 3 || ultimaAprovada;

        let isFocus = false;
        if (isDesbloqueada && !isAprovada && !isEsperando && !proximaAtividadeIdentificada) {
            isFocus = true;
            proximaAtividadeIdentificada = true;
        }
        
        const card = document.createElement('div');
        card.id = `card-${etapa.id}`;
        card.className = `stage-card ${!isDesbloqueada ? 'locked' : ''} ${etapaAbertaId === etapa.id ? 'expanded' : 'collapsed'} ${isAprovada ? 'approved' : ''} ${isFocus ? 'focus' : ''} ${isDevolvida ? 'correction' : ''}`;
        
        const statusText = isAprovada ? 'Concluída' : (isEsperando ? 'Em Avaliação' : (isDevolvida ? 'Ajustes Necessários' : (isFocus ? 'Sua Próxima Missão' : 'Em Aberto')));
        const statusClass = isAprovada ? 'aprovado' : (isEsperando ? 'aguardando' : (isDevolvida ? 'correcao' : 'vazio'));

        const temFeedbackHeuristica = isDevolvida || isAprovada;
        const feedbackBtnLabel = isDevolvida ? "Ver Correções" : (isAprovada ? "Ver Feedback" : "Sem Orientações");
        const feedbackBtnClass = temFeedbackHeuristica ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20" : "bg-white/5 text-gray-700 border-white/5 cursor-default";

        // Renderização Especial por Etapa
        let editorHtml = `
            <textarea id="markdown-${etapa.id}" 
                class="custom-scrollbar"
                placeholder="Descreva aqui os resultados desta etapa..."
                ${perfilLogado.papel !== 'aluno' || isEsperando || isAprovada ? 'readonly' : ''}></textarea>
            
            ${perfilLogado.papel === 'aluno' && !isEsperando && !isAprovada ? `
                <button onclick="enviarEtapa('${etapa.id}')" class="btn-glow w-full py-4 mt-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Protocolar Submissão</button>
            ` : ''}
        `;

        if (etapa.id === "01") {
            editorHtml = `
                <div class="space-y-3">
                    <h4 class="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-4">Status da Equipe</h4>
                    ${projetoAtual.membros_status.map(m => `
                        <div class="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <span class="text-[10px] font-bold text-gray-300">${m.nome || m.email}</span>
                            <span class="text-[8px] font-black uppercase px-2 py-1 ${m.status === 'aceito' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'} rounded">
                                ${m.status === 'aceito' ? 'Confirmado' : 'Pendente'}
                            </span>
                        </div>
                    `).join('')}
                    ${!todosAceitaram ? '<p class="text-[9px] text-gray-500 italic mt-4 text-center">Aguardando todos os membros aceitarem para concluir a etapa.</p>' : ''}
                </div>
            `;
        } else {
            const checks = info.checks || [];
            const souProfessor = perfilLogado.papel === 'professor';
            
            editorHtml = `
                <div class="space-y-6">
                    ${etapa.id === "02" ? `
                        <div class="p-5 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                            <h4 class="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-3">Problema Identificado</h4>
                            <p class="text-sm font-medium text-gray-200 italic">"${projetoAtual.dados_gerais.problema_inicial}"</p>
                        </div>
                    ` : `
                        <textarea id="markdown-${etapa.id}" 
                            class="custom-scrollbar"
                            placeholder="Descreva aqui os resultados desta etapa..."
                            ${perfilLogado.papel !== 'aluno' || isEsperando || isAprovada ? 'readonly' : ''}></textarea>
                        
                        ${perfilLogado.papel === 'aluno' && !isEsperando && !isAprovada ? `
                            <button onclick="enviarEtapa('${etapa.id}')" class="btn-glow w-full py-4 mt-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Protocolar Submissão</button>
                        ` : ''}
                    `}
                    
                    <div class="space-y-2 pt-4 border-t border-white/5">
                        <h4 class="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Validação do Mestre (Checklist de Qualidade)</h4>
                        ${etapa.checklist.map((item, i) => `
                            <label class="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all ${!souProfessor ? 'pointer-events-none opacity-80' : ''}">
                                <input type="checkbox" class="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500" 
                                    ${checks.includes(i) ? 'checked' : ''} 
                                    onchange="toggleCheckEtapa('${etapa.id}', ${i})">
                                <span class="text-[10px] font-bold text-gray-400">${item}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const checklistCompleto = (info.checks || []).length === etapa.checklist.length;

        card.innerHTML = `
            <div class="stage-number">${etapa.id}</div>
            
            <div class="flex justify-between items-center mb-2 cursor-pointer" onclick="toggleStage('${etapa.id}')">
                <h3 class="text-base font-black tracking-tight pr-10">${etapa.titulo}</h3>
                <div class="flex items-center gap-3">
                    <span class="status-label ${statusClass}">${statusText}</span>
                    <i data-lucide="${etapaAbertaId === etapa.id ? 'chevron-up' : 'chevron-down'}" class="w-4 h-4 text-gray-500"></i>
                </div>
            </div>

            <div class="workspace-grid mt-6">
                <div class="space-y-6">
                    <div class="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <p class="text-xs text-gray-400 leading-relaxed italic">"${etapa.instrucao}"</p>
                    </div>

                    <div id="editor-container-${etapa.id}" class="editor-area">
                        ${editorHtml}
                    </div>
                </div>

                <div class="space-y-6">
                    ${perfilLogado.papel !== 'aluno' ? `
                        <div class="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <h4 class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Ações de Mentoria</h4>
                            <div class="flex flex-col gap-3">
                                ${perfilLogado.papel === 'professor' && !isAprovada ? `
                                    <div class="space-y-3 mb-4">
                                        <label class="text-[8px] font-black uppercase text-indigo-300/60 ml-1">Justificativa / Feedback</label>
                                        <textarea id="feedback-eval-${etapa.id}" 
                                            class="w-full bg-[#0d1221] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none h-20 resize-none custom-scrollbar"
                                            placeholder="Escreva as orientações para os alunos..."></textarea>
                                    </div>

                                    <div class="grid grid-cols-2 gap-2">
                                        <button onclick="avaliarEtapa('${etapa.id}', 'aprovado')" 
                                            ${!checklistCompleto ? 'disabled title="Complete o checklist primeiro"' : ''}
                                            class="py-3 bg-emerald-500 text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:grayscale">Aprovar</button>
                                        
                                        <button onclick="avaliarEtapa('${etapa.id}', 'devolvido')" 
                                            class="py-3 bg-rose-500/20 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-xl border border-rose-500/20 hover:bg-rose-500/30 transition-all">Devolver</button>
                                    </div>
                                ` : ''}
                                
                                <button onclick="abrirFeedbackDrawer('${etapa.id}')" class="w-full py-3 bg-white/5 text-gray-400 font-black text-[9px] uppercase tracking-widest rounded-xl border border-white/5 hover:text-white transition-all ${isAprovada ? 'mt-0' : 'mt-2'}">
                                    Histórico de Feedbacks
                                </button>
                            </div>
                        </div>
                    ` : `
                        <button onclick="${temFeedbackHeuristica ? `abrirFeedbackDrawer('${etapa.id}')` : ''}" class="w-full py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl border transition-all ${feedbackBtnClass}">
                            ${feedbackBtnLabel}
                        </button>
                    `}
                </div>
            </div>
        `;
        feed.appendChild(card);
        if (etapa.id !== "01" && etapa.id !== "02") carregarConteudoEtapa(etapa.id);
        ultimaAprovada = isAprovada;
    });

    if (window.lucide) lucide.createIcons();
}

window.toggleCheckEtapa = async (etapaId, index) => {
    const pRef = doc(db, `projetos/${projetoAtual.id}/etapas`, etapaId);
    const pSnap = await getDoc(pRef);
    let checks = pSnap.exists() ? (pSnap.data().checks || []) : [];
    
    if (checks.includes(index)) {
        checks = checks.filter(i => i !== index);
    } else {
        checks.push(index);
    }

    await setDoc(pRef, { 
        checks,
        ultima_atualizacao: serverTimestamp()
    }, { merge: true });
};

window.toggleStage = (id) => {
    etapaAbertaId = (etapaAbertaId === id) ? null : id;
    carregarEtapasRealtime();
};

async function carregarConteudoEtapa(etapaId) {
    const q = query(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/submissoes`), orderBy("data_envio", "desc"), limit(1));
    const snap = await getDocs(q);
    const textarea = document.getElementById(`markdown-${etapaId}`);
    if (!snap.empty && textarea) {
        textarea.value = snap.docs[0].data().conteudo_markdown;
    }
}

window.enviarEtapa = async (etapaId) => {
    const conteudo = document.getElementById(`markdown-${etapaId}`).value.trim();
    if (!conteudo) return alert("O campo está vazio.");
    if (!confirm("Confirmar submissão para avaliação do mestre?")) return;

    await addDoc(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/submissoes`), {
        conteudo_markdown: conteudo,
        autor_email: perfilLogado.nome || "Estudante",
        data_envio: serverTimestamp()
    });

    await setDoc(doc(db, `projetos/${projetoAtual.id}/etapas/${etapaId}`), {
        status_etapa: "aguardando_aprovacao",
        ultima_atualizacao: serverTimestamp()
    }, { merge: true });

    alert("✅ Submissão realizada!");
};

window.avaliarEtapa = async (etapaId, status) => {
    const feedbackField = document.getElementById(`feedback-eval-${etapaId}`);
    const feedback = feedbackField ? feedbackField.value.trim() : "";
    
    if (status === 'devolvido' && !feedback) {
        return alert("Por favor, descreva os ajustes necessários no campo de feedback antes de devolver.");
    }
    
    if (!confirm(`Deseja marcar esta etapa como ${status.toUpperCase()}?`)) return;
    
    await setDoc(doc(db, `projetos/${projetoAtual.id}/etapas/${etapaId}`), {
        status_etapa: status,
        ultima_atualizacao: serverTimestamp()
    }, { merge: true });

    if (feedback) {
        await addDoc(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/feedbacks`), {
            autor: perfilLogado.nome || "Professor",
            autor_tipo: perfilLogado.papel,
            comentario: feedback,
            token: perfilLogado.papel === 'coorientador' ? projetoAtual.dados_gerais.token_coorientador : null,
            data: serverTimestamp()
        });
    }
    
    if (status === 'aprovado') alert("✅ Etapa aprovada com sucesso!");
};

// --- Feedback Drawer ---
let feedbackEtapaId = null;

window.abrirFeedbackDrawer = async (etapaId) => {
    feedbackEtapaId = etapaId;
    const drawer = document.getElementById('feedback-drawer');
    const history = document.getElementById('drawer-history');
    
    drawer.classList.remove('hidden');
    setTimeout(() => drawer.classList.add('active'), 10);
    
    history.innerHTML = '<p class="text-xs text-gray-500 italic py-10 text-center">Buscando mentorias...</p>';

    const legacyPath = collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/submissoes`);
    const legacySnap = await getDocs(query(legacyPath, orderBy("data_envio", "desc"), limit(1)));
    let legacySubId = !legacySnap.empty ? legacySnap.docs[0].id : null;

    console.log(`[Drawer] Carregando feedbacks para Etapa ${etapaId}. Legacy SubId: ${legacySubId}`);

    onSnapshot(query(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/feedbacks`), orderBy("data", "asc")), (fSnap) => {
        history.innerHTML = '';
        const allFeedbacks = [];
        
        // Coletar novos feedbacks (Unified Path)
        fSnap.forEach(d => allFeedbacks.push({ id: d.id, ...d.data() }));

        // Caso exista submissão legada, tentar buscar feedbacks de lá também (Uma única vez ou via novo listener)
        // Para simplificar e garantir reatividade em ambos, vamos focar no unificado daqui para frente, 
        // mas injetar os legados se existirem no carregamento inicial.
        if (legacySubId) {
            getDocs(query(collection(db, `projetos/${projetoAtual.id}/etapas/${etapaId}/submissoes/${legacySubId}/feedbacks`), orderBy("data", "asc")))
                .then(lSnap => {
                    lSnap.forEach(d => {
                        if (!allFeedbacks.some(f => f.comentario === d.data().comentario)) {
                            allFeedbacks.push({ id: d.id, ...d.data(), legacy: true });
                        }
                    });
                    renderFeedbacks(allFeedbacks);
                });
        } else {
            renderFeedbacks(allFeedbacks);
        }
    });

    function renderFeedbacks(feedbacks) {
        history.innerHTML = '';
        if (feedbacks.length === 0) {
            history.innerHTML = '<p class="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-12 opacity-50">Nenhuma orientação registrada.</p>';
            return;
        }

        // Ordenar por data (pode haver mistura de legados e novos)
        feedbacks.sort((a, b) => (a.data?.toMillis() || 0) - (b.data?.toMillis() || 0));

        feedbacks.forEach(f => {
            const div = document.createElement('div');
            div.className = `feedback-bubble animate-in slide-in-from-bottom-2 duration-300 ${f.autor_tipo === 'professor' ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : 'bg-purple-500/10 border-l-2 border-purple-500'}`;
            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[8px] font-black uppercase text-gray-400">${f.autor}</span>
                        ${f.legacy ? '<span class="text-[6px] font-black uppercase bg-white/5 px-1 rounded text-gray-600">Arquivo</span>' : ''}
                    </div>
                    <span class="text-[7px] text-gray-600">${f.data?.toDate().toLocaleDateString() || '...'}</span>
                </div>
                <p class="text-xs text-gray-200 leading-relaxed">${f.comentario}</p>
            `;
            history.appendChild(div);
        });
        history.scrollTop = history.scrollHeight;
    }
};

window.fecharFeedbackDrawer = () => {
    const drawer = document.getElementById('feedback-drawer');
    drawer.classList.remove('active');
    setTimeout(() => drawer.classList.add('hidden'), 400);
};

document.getElementById('btn-send-drawer-feedback').onclick = async () => {
    const texto = document.getElementById('drawer-text').value.trim();
    if (!texto || !feedbackEtapaId) return;
    await addDoc(collection(db, `projetos/${projetoAtual.id}/etapas/${feedbackEtapaId}/feedbacks`), {
        autor: perfilLogado.nome || "Mentor",
        autor_tipo: perfilLogado.papel,
        comentario: texto,
        token: perfilLogado.papel === 'coorientador' ? projetoAtual.dados_gerais.token_coorientador : null,
        data: serverTimestamp()
    });
    document.getElementById('drawer-text').value = '';
};
