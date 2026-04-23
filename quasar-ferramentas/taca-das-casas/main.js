import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, onSnapshot, query, where, getDocs, orderBy, limit } from "../../_shared/db.js";

export function initRanking(callback) {
  requireAuth(async (user, profile) => {
    const temporadaId = "temp_2026_1";
    const escolaId = profile.escola_id;

    if (!escolaId) {
      console.warn("Usuário sem escola vinculada.");
      return;
    }

    // 1. Buscar todas as turmas da escola do usuário (Base do Ranking)
    const snapTurmas = await getDocs(collection(db, "escolas", escolaId, "turmas"));
    const todasAsTurmas = snapTurmas.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. Listener para Pontuações da Temporada
    onSnapshot(collection(db, "taca_casas", temporadaId, "casas"), (snapCasas) => {
      const pontosPorCasa = {};
      snapCasas.docs.forEach(d => { pontosPorCasa[d.id] = d.data().pontos_total; });

      // Mesclar turmas com pontuações (Garantindo que todas apareçam, mesmo com 0)
      const casas = todasAsTurmas.map(t => ({
        id: t.id,
        nome: t.nome,
        escola_id: t.escola_id,
        pontos_total: pontosPorCasa[t.id] || 0
      }));

      casas.sort((a, b) => b.pontos_total - a.pontos_total);

      // 3. Listener para Eventos (Real-time)
      onSnapshot(collection(db, "taca_casas", temporadaId, "eventos"), (snapEvents) => {
        const todosEventos = snapEvents.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filtra eventos apenas desta escola (segurança e privacidade)
        const eventosEscola = todosEventos.filter(ev => ev.escola_id === escolaId);

        console.log("📊 Eventos recebidos:", eventosEscola.length);

        const eventosRecentes = [...eventosEscola]
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
                ganhos: 0,
                perdidos: 0,
                total: 0
              };
            }
            if (ev.pontos > 0) statsAlunos[key].ganhos += ev.pontos;
            else statsAlunos[key].perdidos += Math.abs(ev.pontos);
            statsAlunos[key].total += ev.pontos;
          }
        });

        const rankingAlunos = Object.values(statsAlunos);
        const topGanhadores = [...rankingAlunos].sort((a, b) => b.total - a.total);
        const topPerdedores = [...rankingAlunos].sort((a, b) => a.total - b.total);

        callback({ user, profile, casas, eventos: eventosRecentes, topGanhadores, topPerdedores });
      });
    });
  });
}

export async function atribuirPontos() { return true; }
