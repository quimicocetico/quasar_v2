// /scripts/motor-de-aula.js
import { registrarAtividade } from '/scripts/atividades.js';

export async function iniciarAula() {
    // Resolve o caminho do JSON via query string (?json=...) ou ./aula.json (legado)
    const params = new URLSearchParams(window.location.search);
    const jsonPath = params.get('json') ? '/' + params.get('json') : './aula.json';

    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`JSON não encontrado: ${jsonPath}`);
        const data = await res.json();

        // Expõe globalmente para o Editor de Mídias
        window.aulaAtual = data;

        // 1. Cabeçalho
        const elTitulo = document.getElementById('aula-titulo');
        const elSubtitulo = document.getElementById('aula-subtitulo');
        if (elTitulo) elTitulo.textContent = data.titulo;
        if (elSubtitulo) elSubtitulo.textContent = `${data.materia} • ${data.serie}`;

        const nav = document.getElementById('tabs-nav');
        const container = document.getElementById('tabs-content-container');
        if (!nav || !container) return;

        // 2. Abas de conteúdo
        data.tabs.forEach((tab, index) => {
            nav.appendChild(criarBotaoAba(tab.label, tab.id, index === 0));

            const contentDiv = document.createElement('div');
            contentDiv.id = `tab-content-${tab.id}`;
            contentDiv.className = `tab-pane space-y-8 ${index === 0 ? 'block' : 'hidden'}`;
            tab.secoes.forEach(secao => contentDiv.appendChild(renderizarSecao(secao)));
            container.appendChild(contentDiv);
        });

        // 3. Aba de exercícios
        nav.appendChild(criarBotaoAba('📝 Praticar', 'exercicios', false));

        // 4. Quiz
        setupQuiz(data.quiz?.questoes, data.id_atividade, data.professor_email);

        setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 200);

    } catch (err) { console.error('[Motor] Erro:', err); }
}

// ─── RENDERIZADORES ───────────────────────────────────────────────────────────

function renderizarSecao(secao) {
    const div = document.createElement('div');

    switch (secao.tipo) {
        case 'texto':
            div.className = 'text-gray-300 text-lg leading-relaxed';
            div.innerHTML = secao.conteudo;
            break;

        case 'curiosidade':
            div.className = 'bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-r-xl my-8';
            div.innerHTML = `
                <div class="flex items-center gap-3 mb-2 text-amber-500">
                    <i data-lucide="zap" class="w-5 h-5"></i>
                    <span class="font-bold uppercase text-sm tracking-widest">Você sabia?</span>
                </div>
                <div class="text-gray-200 italic">${secao.conteudo}</div>`;
            break;

        case 'aprofundamento': {
            const id = 'depth-' + Math.random().toString(36).substr(2, 5);
            div.className = 'my-6';
            div.innerHTML = `
                <button onclick="const el=document.getElementById('${id}');el.classList.toggle('hidden');this.querySelector('.chevron-icon').classList.toggle('rotate-180')"
                        class="w-full flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-all outline-none">
                    <span class="font-bold text-cyan-400 flex items-center gap-2">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i>
                        Aprofundamento: ${secao.titulo || 'Clique para explorar'}
                    </span>
                    <i data-lucide="chevron-down" class="chevron-icon w-5 h-5 text-cyan-500 transition-transform duration-300"></i>
                </button>
                <div id="${id}" class="hidden bg-white/5 p-6 rounded-b-xl border-x border-b border-white/10 text-gray-300">
                    ${secao.conteudo}
                </div>`;
            break;
        }

        case 'imagem':
            div.className = 'rounded-2xl overflow-hidden border border-white/10 my-8';
            if (secao.url) {
                div.innerHTML = `
                    <img src="${secao.url}" alt="${secao.legenda}" class="w-full object-cover">
                    <p class="p-4 text-sm text-gray-500 text-center bg-white/5">${secao.legenda}</p>`;
            } else {
                div.innerHTML = `
                    <div class="aspect-video bg-gray-800/60 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-600" data-midia-id="${secao.id}">
                        <i data-lucide="image" class="w-10 h-10 opacity-30"></i>
                        <span class="text-xs font-mono opacity-50">${secao.id || 'sem-id'}</span>
                        <span class="text-xs opacity-40">${secao.instrucao || 'Imagem não inserida'}</span>
                    </div>
                    <p class="p-4 text-sm text-gray-500 text-center bg-white/5">${secao.legenda}</p>`;
            }
            break;

        case 'video': {
            div.className = 'rounded-2xl overflow-hidden border border-white/10 my-8';
            if (secao.url) {
                const videoId = secao.url.match(/(?:v=|youtu\.be\/)([^&?\s]{11})/)?.[1];
                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : secao.url;
                div.innerHTML = `
                    <div class="aspect-video">
                        <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <p class="p-4 text-sm text-gray-500 text-center bg-white/5">${secao.legenda || ''}</p>`;
            } else {
                div.innerHTML = `
                    <div class="aspect-video bg-gray-800/60 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-600" data-midia-id="${secao.id}">
                        <i data-lucide="video" class="w-10 h-10 opacity-30"></i>
                        <span class="text-xs font-mono opacity-50">${secao.id || 'sem-id'}</span>
                        <span class="text-xs opacity-40">${secao.instrucao || 'Vídeo não inserido'}</span>
                    </div>
                    <p class="p-4 text-sm text-gray-500 text-center bg-white/5">${secao.legenda || ''}</p>`;
            }
            break;
        }
    }
    return div;
}

// ─── ABAS ─────────────────────────────────────────────────────────────────────

function criarBotaoAba(label, id, isActive) {
    const btn = document.createElement('button');
    const activeClass = 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]';
    const inactiveClass = 'border-white/10 text-gray-400 hover:bg-white/5';
    btn.className = `tab-btn whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${isActive ? activeClass : inactiveClass}`;
    btn.textContent = label;
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.className = `tab-btn whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${inactiveClass}`;
        });
        btn.className = `tab-btn whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${activeClass}`;
        document.querySelectorAll('.tab-pane, #tab-exercicios').forEach(p => p.classList.add('hidden'));
        const target = id === 'exercicios'
            ? document.getElementById('tab-exercicios')
            : document.getElementById(`tab-content-${id}`);
        if (target) target.classList.remove('hidden');
    };
    return btn;
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────

function setupQuiz(questoes, idAtividade, professorEmail) {
    const form = document.getElementById('quiz-form');
    const statusEl = document.getElementById('quiz-status-msg');
    if (!form || !questoes) return;

    const storageKey = 'respondido_' + idAtividade;
    const jaRespondeu = localStorage.getItem(storageKey);

    // Sorteia questões — mantém seed no storage para o gabarito ser consistente
    const seedKey = 'seed_' + idAtividade;
    let selecionadas;

    if (jaRespondeu) {
        // Reconstrói a mesma seleção usando o seed salvo
        const savedIds = JSON.parse(localStorage.getItem(seedKey) || '[]');
        selecionadas = savedIds.map(id => questoes.find(q => q.id === id)).filter(Boolean);
    } else {
        const objetivas = questoes.filter(q => q.tipo === 'objetiva').sort(() => 0.5 - Math.random()).slice(0, 8);
        const discursivas = questoes.filter(q => q.tipo === 'discursiva').sort(() => 0.5 - Math.random()).slice(0, 2);
        selecionadas = [...objetivas, ...discursivas];
        localStorage.setItem(seedKey, JSON.stringify(selecionadas.map(q => q.id)));
    }

    form.innerHTML = '';

    if (jaRespondeu) {
        const respostas = JSON.parse(localStorage.getItem('respostas_' + idAtividade) || '{}');
        const nota = parseFloat(localStorage.getItem('nota_' + idAtividade) || '0');
        if (statusEl) renderStatusConcluido(statusEl, nota);
        renderQuestoesComGabarito(form, selecionadas, respostas);
        return;
    }

    // Renderiza questões para responder
    selecionadas.forEach((q, i) => {
        form.appendChild(criarQuestaoEl(q, i));
    });

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-transform mt-4';
    btn.textContent = 'Finalizar e Ver Gabarito';
    form.appendChild(btn);

    form.onsubmit = (e) => {
        e.preventDefault();

        // Coleta respostas
        const respostas = {};
        selecionadas.forEach(q => {
            if (q.tipo === 'objetiva') {
                const sel = form.querySelector(`input[name="q_${q.id}"]:checked`);
                respostas[q.id] = sel ? sel.value : null;
            } else {
                const ta = form.querySelector(`textarea[name="q_${q.id}"]`);
                respostas[q.id] = ta ? ta.value.trim() : '';
            }
        });

        // Calcula nota (só objetivas)
        const objetivas = selecionadas.filter(q => q.tipo === 'objetiva');
        const acertos = objetivas.filter(q => respostas[q.id] === q.gabarito).length;
        const nota = parseFloat(((acertos / objetivas.length) * 10).toFixed(1));

        // Persiste
        localStorage.setItem(storageKey, 'true');
        localStorage.setItem('respostas_' + idAtividade, JSON.stringify(respostas));
        localStorage.setItem('nota_' + idAtividade, String(nota));

        // Envia ao backend
        registrarAtividade({
            id_atividade: idAtividade,
            professor_email: professorEmail,
            nota,
            acertos,
            total_objetivas: objetivas.length,
            respostas
        });

        // Substitui form pelo gabarito
        form.innerHTML = '';
        if (statusEl) renderStatusConcluido(statusEl, nota);
        renderQuestoesComGabarito(form, selecionadas, respostas);
    };
}

function criarQuestaoEl(q, i) {
    const div = document.createElement('div');
    div.className = 'bg-white/5 p-6 rounded-2xl border border-white/5 mb-6';
    let html = `<p class="font-bold text-lg mb-4 text-white"><span class="text-cyan-500">#${i + 1}</span> ${q.enunciado}</p>`;

    if (q.tipo === 'objetiva') {
        q.alternativas.forEach(alt => {
            html += `
            <label class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors mb-2 border border-transparent hover:border-white/10">
                <input type="radio" name="q_${q.id}" value="${alt.letra}" class="w-4 h-4 accent-cyan-500" required>
                <span class="text-gray-300"><b class="text-cyan-500">${alt.letra})</b> ${alt.texto}</span>
            </label>`;
        });
    } else {
        html += `<textarea name="q_${q.id}" class="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-300 focus:border-cyan-500 outline-none" rows="4" placeholder="Sua resposta..." required></textarea>`;
    }

    div.innerHTML = html;
    return div;
}

function renderStatusConcluido(el, nota) {
    el.innerHTML = `
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <div class="flex items-center gap-3 text-green-400">
                <i data-lucide="check-circle" class="w-5 h-5 shrink-0"></i>
                <span class="font-bold">Atividade concluída</span>
            </div>
            <div class="sm:ml-auto flex items-center gap-4">
                <span class="text-2xl font-bold text-white font-mono">${nota}<span class="text-sm text-gray-400">/10</span></span>
                <span class="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1">
                    ⏳ Questões dissertativas aguardando validação do professor
                </span>
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

function renderQuestoesComGabarito(container, questoes, respostas) {
    questoes.forEach((q, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-6';

        if (q.tipo === 'objetiva') {
            const acertou = respostas[q.id] === q.gabarito;
            const borderClass = acertou ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20';
            const labelClass = acertou ? 'text-green-400' : 'text-orange-400';

            const altsHtml = q.alternativas.map(alt => {
                const isGabarito = alt.letra === q.gabarito;
                const isAluno = alt.letra === respostas[q.id];
                let bg = 'border-white/5';
                let texto = 'text-gray-500';
                let badge = '';

                if (isGabarito) {
                    bg = 'bg-green-500/10 border-green-500/30';
                    texto = 'text-green-300 font-bold';
                    badge = '<span class="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ correta</span>';
                }
                if (isAluno && !acertou) {
                    bg = 'bg-orange-500/10 border-orange-500/30';
                    texto = 'text-orange-300 font-bold';
                    badge += '<span class="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">sua resposta</span>';
                }
                if (isAluno && acertou) {
                    badge = '<span class="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ sua resposta</span>';
                }

                return `<div class="flex items-center gap-2 p-3 rounded-xl border ${bg} ${texto}">
                    <b>${alt.letra})</b> <span>${alt.texto}</span>${badge}
                </div>`;
            }).join('');

            wrapper.innerHTML = `
                <div class="p-5 rounded-2xl border ${borderClass}">
                    <p class="text-sm font-bold mb-1 ${labelClass}">${acertou ? '✓' : '✗'} Questão #${i + 1}</p>
                    <p class="text-white mb-4">${q.enunciado}</p>
                    <div class="space-y-2">${altsHtml}</div>
                </div>`;
        } else {
            wrapper.innerHTML = `
                <div class="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                    <p class="text-sm font-bold text-purple-400 mb-1">Questão #${i + 1} — Dissertativa</p>
                    <p class="text-white mb-4">${q.enunciado}</p>
                    <div class="bg-black/20 rounded-xl p-3 mb-3">
                        <p class="text-xs text-gray-500 mb-1 uppercase tracking-wider">Sua resposta</p>
                        <p class="text-gray-300 text-sm">${respostas[q.id] || '<em class="opacity-40">Não respondida</em>'}</p>
                    </div>
                    <div class="bg-purple-500/10 rounded-xl p-3">
                        <p class="text-xs text-purple-400 uppercase tracking-wider">⏳ Aguardando validação do professor</p>
                    </div>
                </div>`;
        }

        container.appendChild(wrapper);
    });

    if (window.lucide) lucide.createIcons();
}
