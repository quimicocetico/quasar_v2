// motor-de-aula.js
export async function iniciarAula() {
    try {
        const res = await fetch('./aula.json');
        const data = await res.json();

        // 1. Setup inicial
        document.getElementById('aula-titulo').textContent = data.titulo;
        document.getElementById('aula-subtitulo').textContent = `${data.materia} • ${data.serie}`;
        
        const nav = document.getElementById('tabs-nav');
        const container = document.getElementById('tabs-content-container');
        
        // 2. Renderizar Abas de Conteúdo
        data.tabs.forEach((tab, index) => {
            const btn = criarBotaoAba(tab.label, tab.id, index === 0);
            nav.appendChild(btn);

            const contentDiv = document.createElement('div');
            contentDiv.id = `tab-content-${tab.id}`;
            contentDiv.className = `tab-pane space-y-8 ${index === 0 ? 'block' : 'hidden'}`;
            
            tab.secoes.forEach(secao => {
                contentDiv.appendChild(renderizarSecao(secao));
            });
            container.appendChild(contentDiv);
        });

        // 3. Adicionar Aba de Exercícios
        const btnEx = criarBotaoAba("📝 Praticar", "exercicios", false);
        nav.appendChild(btnEx);

        // 4. Preparar Quiz (8 Objetivas + 2 Discursivas)
        setupQuiz(data.questoes, data.id_atividade);

        // Inicializar ícones
        setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 200);

    } catch (err) { console.error("Erro no Motor:", err); }
}

// --- RENDERIZADORES DE CONTEÚDO ---

function renderizarSecao(secao) {
    const div = document.createElement('div');
    
    switch(secao.tipo) {
        case 'texto':
            div.className = "text-gray-300 text-lg leading-relaxed";
            div.innerHTML = secao.conteudo;
            break;
            
        case 'curiosidade':
            div.className = "bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-r-xl my-8";
            div.innerHTML = `
                <div class="flex items-center gap-3 mb-2 text-amber-500">
                    <i data-lucide="zap" class="w-5 h-5"></i>
                    <span class="font-bold uppercase text-sm tracking-widest">Você sabia?</span>
                </div>
                <div class="text-gray-200 italic">${secao.conteudo}</div>`;
            break;

        case 'aprofundamento':
            const id = 'deep-' + Math.random().toString(36).substr(2, 9);
            div.className = "my-8";
            div.innerHTML = `
                <button onclick="document.getElementById('${id}').classList.toggle('hidden-content'); document.getElementById('${id}').classList.toggle('show-content')" 
                        class="w-full flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-all">
                    <div class="flex items-center gap-3 text-cyan-400">
                        <i data-lucide="book-open" class="w-5 h-5"></i>
                        <span class="font-semibold text-left">Aprofundamento: ${secao.titulo || 'Clique para explorar'}</span>
                    </div>
                    <i data-lucide="chevron-down" class="w-5 h-5 text-cyan-500"></i>
                </button>
                <div id="${id}" class="deepening-content hidden-content bg-white/5 mt-1 rounded-b-xl px-6 py-4 text-gray-300 border-x border-b border-white/5">
                    ${secao.conteudo}
                </div>`;
            break;
            
        case 'imagem':
            div.className = "rounded-2xl overflow-hidden border border-white/10 my-8";
            div.innerHTML = `
                <div class="aspect-video bg-gray-800 flex items-center justify-center text-gray-500">
                    <i data-lucide="image" class="w-12 h-12 opacity-20"></i>
                </div>
                <p class="p-4 text-sm text-gray-500 text-center bg-white/5">${secao.legenda}</p>`;
            break;
    }
    return div;
}

// --- LÓGICA DE ABAS ---

function criarBotaoAba(label, id, isActive) {
    const btn = document.createElement('button');
    btn.className = `tab-btn whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${isActive ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`;
    btn.textContent = label;
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.className = 'tab-btn whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border border-white/10 text-gray-400 hover:bg-white/5');
        btn.className = 'tab-btn whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]';
        
        document.querySelectorAll('.tab-pane, #tab-exercicios').forEach(p => p.classList.add('hidden'));
        const target = (id === 'exercicios') ? document.getElementById('tab-exercicios') : document.getElementById(`tab-content-${id}`);
        target.classList.remove('hidden');
    };
    return btn;
}

// --- LÓGICA DO QUIZ ---

function setupQuiz(questoes, idAtividade) {
    const form = document.getElementById('quiz-form');
    const status = document.getElementById('quiz-status-msg');
    
    // Verificar se já respondeu
    const jaRespondeu = localStorage.getItem('respondido_' + idAtividade);

    // Separar e Sortear (8 Objetivas + 2 Discursivas)
    const objetivas = questoes.filter(q => q.tipo === 'objetiva').sort(() => 0.5 - Math.random()).slice(0, 8);
    const discursivas = questoes.filter(q => q.tipo === 'discursiva').sort(() => 0.5 - Math.random()).slice(0, 2);
    const selecionadas = [...objetivas, ...discursivas];

    selecionadas.forEach((q, i) => {
        const qDiv = document.createElement('div');
        qDiv.className = "bg-white/5 p-6 rounded-2xl border border-white/5";
        
        let html = `<p class="font-bold text-lg mb-4 text-white"><span class="text-cyan-500">#${i+1}</span> ${q.enunciado}</p>`;
        
        if(q.tipo === 'objetiva') {
            q.alternativas.forEach(alt => {
                html += `
                <label class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors mb-2 border border-transparent hover:border-white/10">
                    <input type="radio" name="q_${q.id}" value="${alt.letra}" class="w-4 h-4 accent-cyan-500" ${jaRespondeu ? 'disabled' : ''} required>
                    <span class="text-gray-300"><b class="text-cyan-500">${alt.letra})</b> ${alt.texto}</span>
                </label>`;
            });
        } else {
            html += `<textarea name="q_${q.id}" class="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-300 focus:border-cyan-500 outline-none" rows="4" placeholder="Sua resposta..." ${jaRespondeu ? 'disabled' : ''} required></textarea>`;
        }
        
        qDiv.innerHTML = html;
        form.appendChild(qDiv);
    });

    if(!jaRespondeu) {
        form.innerHTML += `<button type="submit" class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-transform">Finalizar e Ver Gabarito</button>`;
        form.onsubmit = (e) => {
            e.preventDefault();
            localStorage.setItem('respondido_' + idAtividade, 'true');
            mostrarGabarito(selecionadas);
            window.location.reload(); // Recarrega para aplicar travas e mostrar gabarito limpo
        };
    } else {
        status.innerHTML = `<div class="bg-green-500/20 text-green-400 p-4 rounded-xl border border-green-500/30 flex items-center gap-3"><i data-lucide="check-circle"></i> Você já concluiu esta atividade. Veja o gabarito abaixo.</div>`;
        mostrarGabarito(selecionadas);
    }
}

function mostrarGabarito(questoes) {
    const result = document.getElementById('quiz-result');
    result.classList.remove('hidden');
    result.innerHTML = `<h3 class="text-2xl font-bold mb-6 text-cyan-400 border-b border-white/10 pb-4">Gabarito Oficial</h3>`;
    
    questoes.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = "mb-6 p-4 rounded-xl bg-white/5 border-l-4 " + (q.tipo === 'objetiva' ? 'border-cyan-500' : 'border-purple-500');
        div.innerHTML = `
            <p class="text-sm font-bold text-gray-400 mb-1">QUESTÃO #${i+1}</p>
            <p class="text-white mb-2">${q.enunciado}</p>
            <p class="text-cyan-400 font-bold">RESPOSTA ESPERADA: ${q.gabarito || 'Resposta pessoal (revisada pelo professor).'}</p>
        `;
        result.appendChild(div);
    });
}