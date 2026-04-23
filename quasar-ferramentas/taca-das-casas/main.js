import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, onSnapshot, query, where, getDocs, orderBy, limit, doc, getDoc } from "../../_shared/db.js";

export function initRanking(callback, publicEscolaId = null) {
  if (publicEscolaId) {
    // Modo Público: Sem autenticação, usa ID da escola fornecido
    runRanking(null, { escola_id: publicEscolaId }, callback);
  } else {
    // Modo Privado: Requer autenticação
    requireAuth(async (user, profile) => {
      runRanking(user, profile, callback);
    });
  }
}

async function runRanking(user, profile, callback) {
  const temporadaId = "temp_2026_1";
  const escolaId = profile?.escola_id;

  // Estado inicial para evitar que a UI fique travada
  let state = {
    casas: [],
    eventos: [],
    topGanhadores: [],
    topPerdedores: [],
    user,
    profile
  };

  if (!escolaId) {
    console.error("❌ Erro Crítico: ID da Escola não encontrado no perfil.");
    callback(state); // Chama o callback para liberar a UI
    return;
  }

  console.log(`🚀 Inicializando Ranking para Escola: ${escolaId} | Temporada: ${temporadaId}`);

  // Tenta buscar o nome da escola se for genérico
  if (!profile.escola_nome || profile.escola_nome === 'Escola de Heróis') {
    try {
      const escolaSnap = await getDoc(doc(db, "escolas", escolaId));
      if (escolaSnap.exists()) {
        profile.escola_nome = escolaSnap.data().nome;
        callback({ ...state }); // Atualiza com o nome real
      }
    } catch (e) { console.error("❌ Erro ao buscar nome da escola:", e); }
  }

  try {
    // 1. Base do Ranking: Turmas
    const snapTurmas = await getDocs(collection(db, "escolas", escolaId, "turmas"));
    const todasAsTurmas = snapTurmas.docs.map(d => ({ id: d.id, ...d.data() }));

    if (todasAsTurmas.length === 0) {
      console.warn("⚠️ Nenhuma turma encontrada para esta escola.");
      callback({ ...state, casas: [] });
    }

    // 2. Listener para Pontuações das Casas
    const unsubCasas = onSnapshot(collection(db, "taca_casas", temporadaId, "casas"), (snapCasas) => {
      const pontosPorCasa = {};
      snapCasas.docs.forEach(d => { pontosPorCasa[d.id] = d.data().pontos_total; });

      state.casas = todasAsTurmas.map(t => ({
        id: t.id,
        nome: t.nome,
        escola_id: t.escola_id,
        pontos_total: pontosPorCasa[t.id] || 0
      })).sort((a, b) => b.pontos_total - a.pontos_total);

      callback({ ...state });
    }, (err) => console.error("❌ Erro no listener de casas:", err));

    // 3. Listener para Eventos (Mural e Ranking de Alunos)
    const unsubEventos = onSnapshot(collection(db, "taca_casas", temporadaId, "eventos"), (snapEvents) => {
      const todosEventos = snapEvents.docs.map(d => ({ id: d.id, ...d.data() }));
      const eventosEscola = todosEventos.filter(ev => ev.escola_id === escolaId);

      state.eventos = [...eventosEscola]
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        .slice(0, 10);

      const statsAlunos = {};
      eventosEscola.forEach(ev => {
        const key = ev.aluno_uid || `name_${ev.aluno_nome}`;
        if (ev.aluno_nome) {
          if (!statsAlunos[key]) {
            statsAlunos[key] = { 
              nome: ev.aluno_nome, 
              turma: ev.turma_nome,
              ganhos: 0, perdidos: 0, total: 0
            };
          }
          if (ev.pontos > 0) statsAlunos[key].ganhos += ev.pontos;
          else statsAlunos[key].perdidos += Math.abs(ev.pontos);
          statsAlunos[key].total += ev.pontos;
        }
      });

      const rankingAlunos = Object.values(statsAlunos);
      state.topGanhadores = [...rankingAlunos].sort((a, b) => b.total - a.total);
      state.topPerdedores = [...rankingAlunos].sort((a, b) => a.total - b.total);

      callback({ ...state });
    }, (err) => console.error("❌ Erro no listener de eventos:", err));

  } catch (e) {
    console.error("❌ Falha crítica ao inicializar ranking:", e);
  }
}

export async function atribuirPontos() { return true; }
