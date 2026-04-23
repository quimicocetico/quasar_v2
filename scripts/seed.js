// scripts/seed.js
const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker/locale/pt_BR');

/**
 * CONFIGURAÇÃO DO AMBIENTE
 * Forçamos o SDK Admin a falar com os emuladores locais
 */
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Inicializa com um ID de projeto fictício para segurança
admin.initializeApp({
  projectId: 'demo-quasar-local'
});

const db = admin.firestore();
const auth = admin.auth();

// Configurações do Volume de Dados
const CONFIG = {
  NUM_ESCOLAS: 2,
  PROFS_POR_ESCOLA: 2,
  TURMAS_POR_PROF: 2,
  ALUNOS_POR_TURMA: 12,
  EVENTOS_POR_ALUNO: 5,
  TEMPORADA_ID: 'temp_2026_1'
};

const CATEGORIAS_PONTOS = [
  { motivo: "Participação exemplar em sala", pontos: 10, tipo: "ganho" },
  { motivo: "Ajudou um colega com dificuldade", pontos: 15, tipo: "ganho" },
  { motivo: "Entrega de tarefa no prazo", pontos: 5, tipo: "ganho" },
  { motivo: "Excelente desempenho no Desafio Timeline", pontos: 20, tipo: "ganho" },
  { motivo: "Conversa excessiva durante a explicação", pontos: -10, tipo: "perda" },
  { motivo: "Não entregou a atividade proposta", pontos: -15, tipo: "perda" },
  { motivo: "Comportamento inadequado no corredor", pontos: -5, tipo: "perda" },
  { motivo: "Destaque da semana na disciplina", pontos: 25, tipo: "ganho" },
  { motivo: "Iniciativa em projeto colaborativo", pontos: 30, tipo: "ganho" },
  { motivo: "Uso indevido do celular", pontos: -20, tipo: "perda" }
];

const CARDS_CODEX = [
  { id: "c1", nome: "Átomo de Dalton", raridade: "comum", emoji: "⚪", categoria: "Química" },
  { id: "c2", nome: "Revolução Francesa", raridade: "raro", emoji: "🇫🇷", categoria: "História" },
  { id: "c3", nome: "Célula Procarionte", raridade: "comum", emoji: "🧬", categoria: "Biologia" },
  { id: "c4", nome: "Equação de Einstein", raridade: "lendario", emoji: "⚛️", categoria: "Física" },
  { id: "c5", nome: "Tabela Periódica", raridade: "epico", emoji: "📊", categoria: "Química" },
  { id: "c6", nome: "Queda da Bastilha", raridade: "raro", emoji: "🏰", categoria: "História" },
  { id: "c7", nome: "DNA e RNA", raridade: "epico", emoji: "🧬", categoria: "Biologia" },
  { id: "c8", nome: "Segunda Guerra Mundial", raridade: "raro", emoji: "🎖️", categoria: "História" },
  { id: "c9", nome: "Buraco Negro", raridade: "lendario", emoji: "🕳️", categoria: "Física" }
];

const CORES_POOL = [
  'linear-gradient(to top, #00F0FF, #00A3FF)', // Ciano
  'linear-gradient(to top, #A855F7, #6366F1)', // Roxo/Indigo
  'linear-gradient(to top, #F59E0B, #D97706)', // Laranja
  'linear-gradient(to top, #10B981, #059669)', // Verde
  'linear-gradient(to top, #EC4899, #DB2777)', // Rosa
  'linear-gradient(to top, #3B82F6, #2563EB)', // Azul
  'linear-gradient(to top, #EF4444, #B91C1C)', // Vermelho
  'linear-gradient(to top, #FACC15, #EAB308)'  // Amarelo
];

async function runSeed() {
  console.log('🌱 Iniciando plantio de dados realistas na Quasar...');

  try {
    // 0. Preparar Temporada e Codex
    console.log('🏆 Configurando Temporada e Codex...');
    await db.collection('taca_casas').doc(CONFIG.TEMPORADA_ID).set({
      nome: "Temporada Alpha 2026",
      ativa: true,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    for (const card of CARDS_CODEX) {
      await db.collection('codex').doc(card.id).set({
        ...card,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    for (let i = 0; i < CONFIG.NUM_ESCOLAS; i++) {
      const nomeEscola = `Escola Estadual ${faker.person.lastName()}`;
      
      // 1. Criar Escola
      const escolaRef = await db.collection('escolas').add({
        nome: nomeEscola,
        professor_uid: 'master_dev', 
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🏫 Escola: ${nomeEscola}`);

      for (let j = 0; j < CONFIG.PROFS_POR_ESCOLA; j++) {
        const nomeProf = `Prof. ${faker.person.fullName()}`;
        const emailProf = `prof.${faker.string.alphanumeric(4)}@educar.rn.gov.br`.toLowerCase();

        // 2. Criar Professor no Auth
        const profAuth = await auth.createUser({
          email: emailProf,
          password: 'password123',
          displayName: nomeProf
        });

        // 3. Criar Perfil do Professor em 'users'
        await db.collection('users').doc(profAuth.uid).set({
          nome: nomeProf,
          email: emailProf,
          papel: 'professor',
          escola_id: escolaRef.id,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  👨‍🏫 Professor: ${emailProf}`);

        if (j === 0) {
          await escolaRef.update({ professor_uid: profAuth.uid });
        }

        for (let k = 0; k < CONFIG.TURMAS_POR_PROF; k++) {
          const nomeTurma = `${faker.number.int({ min: 1, max: 9 })}º Ano ${faker.string.alpha({ length: 1, casing: 'upper' })}`;
          
          // 4. Criar Turma
          const turmaRef = await escolaRef.collection('turmas').add({
            nome: nomeTurma,
            professor_uid: profAuth.uid,
            escola_id: escolaRef.id,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            serie: faker.number.int({ min: 1, max: 3 })
          });
          console.log(`    🎓 Turma: ${nomeTurma}`);

          // 5. Inicializar "Casa" para esta turma na Taça das Casas
          const casaRef = db.collection('taca_casas').doc(CONFIG.TEMPORADA_ID).collection('casas').doc(turmaRef.id);
          let pontosTotalTurma = 0;
          const corCasa = CORES_POOL[Math.floor(Math.random() * CORES_POOL.length)]; // Seleção aleatória para diversidade

          for (let l = 0; l < CONFIG.ALUNOS_POR_TURMA; l++) {
            const nomeAluno = faker.person.fullName();
            const emailAluno = `aluno.${faker.string.alphanumeric(5)}@estudante.rn.gov.br`.toLowerCase();

            // 6. Criar Aluno
            const alunoAuth = await auth.createUser({
              email: emailAluno,
              password: 'password123',
              displayName: nomeAluno
            });

            await db.collection('users').doc(alunoAuth.uid).set({
              nome: nomeAluno,
              email: emailAluno,
              papel: 'aluno',
              escola_id: escolaRef.id,
              turma_id: turmaRef.id,
              created_at: admin.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('matriculas').add({
              nome: nomeAluno,
              email: emailAluno,
              escola_id: escolaRef.id,
              turma_id: turmaRef.id,
              aluno_uid: alunoAuth.uid,
              status: 'ativo'
            });

            // 7. Gerar Eventos de Pontos (Ganhos e Perdidos)
            for (let m = 0; m < CONFIG.EVENTOS_POR_ALUNO; m++) {
              const categoria = faker.helpers.arrayElement(CATEGORIAS_PONTOS);
              const pontos = categoria.pontos + faker.number.int({ min: -2, max: 2 }); // Variar levemente
              
              await db.collection('taca_casas').doc(CONFIG.TEMPORADA_ID).collection('eventos').add({
                pontos: pontos,
                motivo: categoria.motivo,
                turma_id: turmaRef.id,
                turma_nome: nomeTurma,
                escola_id: escolaRef.id,
                professor_uid: profAuth.uid,
                professor_nome: nomeProf,
                aluno_uid: alunoAuth.uid,
                aluno_nome: nomeAluno,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });

              pontosTotalTurma += pontos;
            }

            // 8. Atribuir alguns cards do Codex ao inventário
            const numCards = faker.number.int({ min: 1, max: 4 });
            const cardsParaDar = faker.helpers.arrayElements(CARDS_CODEX, numCards);
            for (const card of cardsParaDar) {
              await db.collection('users').doc(alunoAuth.uid).collection('inventario').doc(card.id).set({
                obtido_em: admin.firestore.FieldValue.serverTimestamp(),
                raridade: card.raridade,
                emoji: card.emoji,
                nome: card.nome
              });
            }
          }

          // 9. Atualizar saldo total da "Casa"
          await casaRef.set({
            nome: nomeTurma,
            escola_id: escolaRef.id,
            pontos_total: pontosTotalTurma,
            cor: corCasa,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🚀 AMBIENTE DE TESTES PRONTO E POVOADO');
    console.log('='.repeat(50));
    console.log('ESTATÍSTICAS:');
    console.log(`- Escolas: ${CONFIG.NUM_ESCOLAS}`);
    console.log(`- Professores: ${CONFIG.NUM_ESCOLAS * CONFIG.PROFS_POR_ESCOLA}`);
    console.log(`- Turmas: ${CONFIG.NUM_ESCOLAS * CONFIG.PROFS_POR_ESCOLA * CONFIG.TURMAS_POR_PROF}`);
    console.log(`- Alunos: ${CONFIG.NUM_ESCOLAS * CONFIG.PROFS_POR_ESCOLA * CONFIG.TURMAS_POR_PROF * CONFIG.ALUNOS_POR_TURMA}`);
    console.log(`- Registros de Pontos: ${CONFIG.NUM_ESCOLAS * CONFIG.PROFS_POR_ESCOLA * CONFIG.TURMAS_POR_PROF * CONFIG.ALUNOS_POR_TURMA * CONFIG.EVENTOS_POR_ALUNO}`);
    console.log('='.repeat(50));
    console.log('Dica: Acesse o Dashboard do Professor para ver os rankings!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error);
  }
}

runSeed();

