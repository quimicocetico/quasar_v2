// scripts/seed_steam.js
const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker/locale/pt_BR');

/**
 * CONFIGURAÇÃO DO AMBIENTE
 */
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'demo-quasar-local'
});

const db = admin.firestore();
const auth = admin.auth();

const CONFIG = {
  NUM_ESCOLAS: 1,
  PROFS_POR_ESCOLA: 4,
  TURMAS_POR_PROF: 3,
  PROJETOS_POR_PROF: 5,
  ALUNOS_POR_TURMA: 15
};

const AREAS = [
  "Ciências Exatas e da Terra",
  "Ciências Biológicas",
  "Engenharias",
  "Ciências da Saúde",
  "Ciências Sociais Aplicadas",
  "Multidisciplinar"
];

const ETAPAS_IDS = Array.from({ length: 15 }, (_, i) => (i + 1).toString().padStart(2, '0'));

async function runSeed() {
  console.log('🌱 Iniciando Super Seed - STEAM Lab...');

  try {
    for (let i = 0; i < CONFIG.NUM_ESCOLAS; i++) {
      const nomeEscola = `Escola Politécnica ${faker.person.lastName()}`;
      const escolaRef = await db.collection('escolas').add({
        nome: nomeEscola,
        codigo_acesso: faker.string.alphanumeric(6).toUpperCase(),
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🏫 Escola: ${nomeEscola}`);

      for (let j = 0; j < CONFIG.PROFS_POR_ESCOLA; j++) {
        const nomeProf = `Prof. ${faker.person.fullName()}`;
        const emailProf = `prof.${faker.string.alphanumeric(4)}@educar.rn.gov.br`.toLowerCase();

        const profAuth = await auth.createUser({
          email: emailProf,
          password: 'password123',
          displayName: nomeProf
        });

        await db.collection('users').doc(profAuth.uid).set({
          nome: nomeProf,
          email: emailProf,
          papel: 'professor',
          escola_id: escolaRef.id,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  👨‍🏫 Professor: ${emailProf}`);

        // Criar turmas para este professor
        const turmasIds = [];
        for (let k = 0; k < CONFIG.TURMAS_POR_PROF; k++) {
          const nomeTurma = `${faker.number.int({ min: 1, max: 3 })}º Ano ${faker.string.alpha({ length: 1, casing: 'upper' })} (STEAM)`;
          const turmaRef = await escolaRef.collection('turmas').add({
            nome: nomeTurma,
            professor_uid: profAuth.uid,
            professores: [profAuth.uid],
            escola_id: escolaRef.id,
            created_at: admin.firestore.FieldValue.serverTimestamp()
          });
          turmasIds.push(turmaRef.id);
          console.log(`    🎓 Turma: ${nomeTurma}`);

          // Criar alguns alunos na turma
          for (let l = 0; l < CONFIG.ALUNOS_POR_TURMA; l++) {
            const nomeAluno = faker.person.fullName();
            const emailAluno = `aluno.${faker.string.alphanumeric(5)}@estudante.rn.gov.br`.toLowerCase();
            
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
          }
        }

        // Criar Projetos para este professor
        for (let p = 0; p < CONFIG.PROJETOS_POR_PROF; p++) {
          const titulo = faker.company.catchPhrase();
          const area = faker.helpers.arrayElement(AREAS);
          
          // Pegar 3 alunos aleatórios da última turma criada (simplificação)
          const alunosQuery = await db.collection('matriculas')
            .where('turma_id', '==', turmasIds[0])
            .limit(3)
            .get();
          
          const membros = alunosQuery.docs.map(d => ({
            email: d.data().email,
            nome: d.data().nome,
            status: 'aceito'
          }));

          const projetoRef = await db.collection('projetos').add({
            dados_gerais: {
              titulo,
              problema_inicial: faker.lorem.paragraph(),
              area,
              link_drive: "https://drive.google.com/drive/folders/1abc123_exemplo",
              professorId: profAuth.uid,
              token_coorientador: crypto.randomUUID(),
              status: "ativo"
            },
            membros_emails: membros.map(m => m.email),
            membros_status: membros,
            data_criacao: admin.firestore.FieldValue.serverTimestamp()
          });

          // Criar estados variados para as etapas
          for (const etapaId of ETAPAS_IDS) {
            const random = Math.random();
            let status = 'aguardando';
            let checks = [];

            if (etapaId === "01") status = 'aprovado';
            else if (etapaId === "02") {
              status = 'aprovado';
              checks = [0, 1, 2];
            } else if (random > 0.8) {
              status = 'aprovado';
              checks = [0, 1, 2, 3];
            } else if (random > 0.5) {
              status = 'aguardando_aprovacao';
              checks = [0, 1];
            } else if (random > 0.3) {
              status = 'devolvido';
            }

            const etapaRef = projetoRef.collection('etapas').doc(etapaId);
            await etapaRef.set({
              status_etapa: status,
              checks: checks,
              ultima_atualizacao: admin.firestore.FieldValue.serverTimestamp()
            });

            // Adicionar submissão se não estiver 'aguardando'
            if (status !== 'aguardando') {
              const subRef = await etapaRef.collection('submissoes').add({
                conteudo_markdown: `### Relato da Etapa ${etapaId}\n\n${faker.lorem.paragraphs(2)}`,
                autor_email: membros[0].email,
                data_envio: admin.firestore.FieldValue.serverTimestamp()
              });

              if (status === 'devolvido') {
                await subRef.collection('feedbacks').add({
                  autor: nomeProf,
                  autor_tipo: 'professor',
                  comentario: "Ajuste as referências conforme o padrão ABNT solicitado.",
                  data: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          }
          console.log(`      🧪 Projeto: ${titulo} (${area})`);
        }
      }
    }

    console.log('\n🚀 SEED COMPLETO!');
    console.log(`- Projetos Criados: ${CONFIG.NUM_ESCOLAS * CONFIG.PROFS_POR_ESCOLA * CONFIG.PROJETOS_POR_PROF}`);

  } catch (error) {
    console.error('❌ Erro no seed:', error);
  }
}

runSeed();
