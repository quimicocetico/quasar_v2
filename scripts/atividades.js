// /scripts/atividades.js
// Camada de abstração para envio de atividades.
// Troca Firebase → Supabase aqui sem tocar no motor.

import { enviarAtividade as _enviarFirebase } from '/firebase-config.js';

/**
 * @param {object} payload
 * @param {string} payload.id_atividade
 * @param {string} payload.professor_email
 * @param {number} payload.nota           - 0 a 10
 * @param {number} payload.acertos        - objetivas corretas
 * @param {number} payload.total_objetivas
 * @param {object} payload.respostas      - { id_questao: resposta_aluno }
 */
export async function registrarAtividade(payload) {
    // Dispara evento para a MOVA (futuro iframe/postMessage)
    window.dispatchEvent(new CustomEvent('quasar:concluida', { detail: payload }));

    // Envia ao Firebase (substituir por Supabase na migração)
    try {
        await _enviarFirebase(payload);
    } catch (err) {
        console.warn('[atividades] Falha no envio ao backend:', err);
    }
}
