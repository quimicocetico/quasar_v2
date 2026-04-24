import { auth } from "../firebase-config.js";

// _shared/points-helper.js — Gerenciador Universal de Pontos da Taça das Casas
import { db, collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, increment } from "./db.js";

/**
 * Abre o modal de atribuição de pontos para uma turma.
 * @param {string} turmaId 
 * @param {string} escolaId 
 * @param {string} turmaNome 
 */
export async function abrirModalPontos(turmaId, escolaId, turmaNome) {
  // 1. Garantir que o modal existe no DOM
  let modal = document.getElementById('modal-points-global');
  if (!modal) {
    modal = injectModalHTML();
  }

  // 2. Setup inicial do Modal
  const title = modal.querySelector('#points-modal-title');
  const inputPontos = modal.querySelector('#points-value');
  const inputMotivo = modal.querySelector('#points-reason');
  const studentList = modal.querySelector('#points-student-list');
  const btnSave = modal.querySelector('#btn-points-save');

  title.textContent = `Pontos para ${turmaNome}`;
  inputPontos.value = '10';
  inputMotivo.value = '';
  studentList.innerHTML = '<p class="text-gray-500 text-xs animate-pulse">Carregando estudantes...</p>';
  btnSave.disabled = true;

  modal.classList.remove('hidden');

  // 3. Carregar Estudantes da Turma
  let allStudents = [];
  const searchInput = modal.querySelector('#points-search');
  searchInput.value = '';

  const renderList = (filter = "") => {
    const searchTerm = (filter || "").toLowerCase();
    const filtered = allStudents.filter(s => {
      const nome = s.nome || "Estudante";
      return nome.toLowerCase().includes(searchTerm);
    });
    if (filtered.length === 0) {
      studentList.innerHTML = `<p class="text-gray-500 text-[10px] italic py-2 text-center">${allStudents.length > 0 ? 'Nenhum aluno corresponde à busca.' : 'Nenhum estudante vinculado.'}</p>`;
      return;
    }
    studentList.innerHTML = filtered.map(al => `
      <label class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent has-[:checked]:border-[#00F0FF]/30 has-[:checked]:bg-[#00F0FF]/5">
        <input type="checkbox" value="${al.aluno_uid || ''}" data-nome="${al.nome}" class="w-3 h-3 rounded border-white/10 bg-white/5 text-[#00F0FF] focus:ring-[#00F0FF]">
        <span class="text-xs font-medium text-gray-300">${al.nome}</span>
      </label>
    `).join('');
  };

  try {
    const q = query(collection(db, "matriculas"), where("turma_id", "==", turmaId));
    const snap = await getDocs(q);
    allStudents = snap.docs.map(d => d.data());

    renderList();
    btnSave.disabled = false;

    // Configurar Busca Real-time
    searchInput.oninput = (e) => renderList(e.target.value);

  } catch (e) {
    console.error(e);
    studentList.innerHTML = '<p class="text-red-400 text-[10px]">Erro ao carregar estudantes.</p>';
  }

  // 4. Lógica de Salvar
  btnSave.onclick = async () => {
    const pontos = parseInt(inputPontos.value);
    const motivo = inputMotivo.value.trim();
    if (isNaN(pontos)) return alert("Informe um valor numérico.");
    if (!motivo) return alert("O motivo é obrigatório para garantir a transparência.");

    const checked = modal.querySelectorAll('input[type="checkbox"]:checked');
    const vinculados = Array.from(checked).map(c => ({
      uid: c.value,
      nome: c.dataset.nome
    }));

    btnSave.disabled = true;
    btnSave.textContent = "Gravando...";

    try {
      const temporadaId = "temp_2026_1"; 
      
      // BUSCA ROBUSTA: Garantir dados do professor e escola
      const { getDoc } = await import("./db.js");
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const profile = userDoc.data() || {};
      const finalEscolaId = profile.escola_id || escolaId;
      const professorNome = profile.nome || auth.currentUser.displayName || "Professor";

      // A. Registrar no Mural de Transparência (Eventos)
      const payloadBase = {
        pontos,
        motivo,
        turma_id: turmaId,
        turma_nome: turmaNome,
        escola_id: finalEscolaId,
        professor_uid: auth.currentUser.uid,
        professor_nome: professorNome,
        timestamp: serverTimestamp()
      };

      if (vinculados.length > 0) {
        for (const al of vinculados) {
          await addDoc(collection(db, "taca_casas", temporadaId, "eventos"), {
            ...payloadBase,
            aluno_uid: al.uid,
            aluno_nome: al.nome
          });
        }
      } else {
        await addDoc(collection(db, "taca_casas", temporadaId, "eventos"), payloadBase);
      }

      // B. Atualizar Saldo da Casa (Ranking)
      const casaRef = doc(db, "taca_casas", temporadaId, "casas", turmaId);
      await updateDoc(casaRef, {
        pontos_total: increment(pontos),
        nome: turmaNome,
        escola_id: finalEscolaId,
        updated_at: serverTimestamp()
      }).catch(async (err) => {
        if (err.code === 'not-found') {
          const { setDoc } = await import("./db.js");
          await setDoc(casaRef, {
            nome: turmaNome,
            escola_id: finalEscolaId,
            pontos_total: pontos,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        } else throw err;
      });

      alert("✅ Pontuação registrada com sucesso!");
      fecharModalPontos();
      
    } catch (e) {
      console.error("ERRO AO SALVAR:", e);
      alert("Erro ao salvar pontos. Verifique o console.");
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Confirmar Pontuação";
    }
  };
}

function injectModalHTML() {
  const html = `
    <div id="modal-points-global" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm hidden">
      <div class="max-w-md w-full glass rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-200">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
            <i data-lucide="trophy" class="text-yellow-500 w-6 h-6"></i>
          </div>
          <div>
            <h2 id="points-modal-title" class="text-xl font-bold">Atribuir Pontos</h2>
            <p class="text-xs text-gray-400">Taça das Casas — Temporada 2024.1</p>
          </div>
        </div>

        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Pontos</label>
              <input type="number" id="points-value" class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-[#00F0FF] outline-none transition-all font-black text-xl text-[#00F0FF]" value="10">
            </div>
            <div class="flex items-end gap-2 pb-1">
              <button onclick="const v = document.getElementById('points-value'); v.value = parseInt(v.value) - 10" class="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20">
                <i data-lucide="minus-circle" class="w-5 h-5"></i>
              </button>
              <button onclick="const v = document.getElementById('points-value'); v.value = parseInt(v.value) + 10" class="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-all border border-green-500/20">
                <i data-lucide="plus-circle" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Motivo (Transparência)</label>
            <textarea id="points-reason" rows="2" class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-[#00F0FF] outline-none transition-all text-sm" placeholder="Ex: Excelente comportamento ou participação..."></textarea>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5 ml-1">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vincular Estudantes (Opcional)</label>
              <input type="text" id="points-search" class="bg-transparent text-[10px] text-[#00F0FF] border-b border-white/10 outline-none w-24 focus:w-32 transition-all placeholder:text-gray-600" placeholder="Buscar nome...">
            </div>
            <div id="points-student-list" class="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              <!-- JS Injects -->
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button onclick="window.fecharModalPontos()" class="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all">Cancelar</button>
            <button id="btn-points-save" class="flex-1 py-4 bg-[#00F0FF] text-[#0A0F1C] font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00F0FF]/20 text-sm uppercase tracking-widest">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  if (window.lucide) lucide.createIcons();
  return document.getElementById('modal-points-global');
}

window.fecharModalPontos = () => {
  const modal = document.getElementById('modal-points-global');
  if (modal) modal.classList.add('hidden');
};

