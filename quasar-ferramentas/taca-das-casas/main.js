import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, increment } from "../../_shared/db.js";

export function initRanking(renderFn) {
  requireAuth((user) => {
    const params = new URLSearchParams(window.location.search);
    const temporadaId = params.get("temporada") || "temp_2024_1"; // Fallback para a de teste

    onSnapshot(
      collection(db, "taca_casas", temporadaId, "casas"),
      (snap) => {
        const casas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderFn(casas.sort((a, b) => b.pontos_total - a.pontos_total));
      }
    );
  });
}

export async function atribuirPontos(temporadaId, casaId, pontos, motivo, alunoId = null) {
  try {
    const casaRef = doc(db, "taca_casas", temporadaId, "casas", casaId);
    
    // 1. Criar evento
    await addDoc(collection(db, "taca_casas", temporadaId, "casas", casaId, "eventos"), {
      pontos,
      motivo,
      aluno_uid: alunoId,
      created_at: serverTimestamp()
    });

    // 2. Atualizar total de forma atômica
    await updateDoc(casaRef, {
      pontos_total: increment(pontos)
    });

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
