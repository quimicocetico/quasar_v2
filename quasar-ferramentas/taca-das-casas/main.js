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

    // 2. Listener para Pontuações das Casas (Filtrado por Escola)
    const qCasas = query(
      collection(db, "taca_casas", temporadaId, "casas"),
      where("escola_id", "==", escolaId)
    );

    const unsubCasas = onSnapshot(qCasas, (snapCasas) => {
      const dadosCasas = {};
      snapCasas.docs.forEach(d => { 
        dadosCasas[d.id] = { 
          pontos: d.data().pontos_total, 
          cor: d.data().cor 
        }; 
      });

      state.casas = todasAsTurmas.map(t => ({
        id: t.id,
        nome: t.nome,
        escola_id: t.escola_id,
        pontos_total: dadosCasas[t.id]?.pontos || 0,
        cor: dadosCasas[t.id]?.cor
      })).sort((a, b) => b.pontos_total - a.pontos_total);

      callback({ ...state });
    }, (err) => console.error("❌ Erro no listener de casas:", err));

    // 3. Listener para Eventos (Mural e Ranking de Alunos) - Filtrado por Escola
    // Buscamos os últimos 200 eventos da escola para o ranking de alunos, mas limitamos o mural a 10.
    const qEventos = query(
      collection(db, "taca_casas", temporadaId, "eventos"),
      where("escola_id", "==", escolaId),
      orderBy("timestamp", "desc"),
      limit(200) // Limite razoável para processamento client-side
    );

    const unsubEventos = onSnapshot(qEventos, (snapEvents) => {
      const eventosEscola = snapEvents.docs.map(d => ({ id: d.id, ...d.data() }));

      // Mural de Transparência (Top 10)
      state.eventos = eventosEscola.slice(0, 10);

      // Ranking de Alunos (Baseado nos 200 eventos recentes)
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
