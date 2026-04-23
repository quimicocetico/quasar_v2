import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCbX7z9-j9OHgeJ6t5XZx7xc98w9S_nytk",
    authDomain: "quimico-cetico.firebaseapp.com",
    projectId: "quimico-cetico",
    storageBucket: "quimico-cetico.firebasestorage.app",
    messagingSenderId: "673165487092",
    appId: "1:673165487092:web:dc60ee2fcd6f5347d227a1",
    measurementId: "G-B1LJX5V4F5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Iniciando seed do Firestore...");

  try {
    // 1. Users
    await setDoc(doc(db, "users", "placeholder_user"), {
      nome: "Usuário Placeholder",
      email: "placeholder@educar.rn.gov.br",
      papel: "professor",
      created_at: serverTimestamp()
    });

    // 2. Escolas
    const escolaRef = doc(db, "escolas", "escola_modelo");
    await setDoc(escolaRef, {
      nome: "Escola Modelo Quasar",
      dominio_email: "educar.rn.gov.br",
      professor_uid: "placeholder_user",
      created_at: serverTimestamp()
    });

    // 3. Turmas
    await setDoc(doc(db, "escolas", "escola_modelo", "turmas", "turma_9a"), {
      nome: "9º Ano A",
      professor_uid: "placeholder_user",
      created_at: serverTimestamp()
    });

    // 4. Matrículas
    await addDoc(collection(db, "matriculas"), {
      aluno_uid: "aluno_placeholder",
      aluno_email: "aluno@estudante.rn.gov.br",
      turma_id: "turma_9a",
      escola_id: "escola_modelo",
      status: "pendente",
      created_at: serverTimestamp()
    });

    // 5. Taça das Casas
    const temporadaRef = doc(db, "taca_casas", "temp_2024_1");
    await setDoc(temporadaRef, {
      nome: "Temporada Alpha 2024",
      turma_id: "turma_9a",
      professor_uid: "placeholder_user",
      ativa: true,
      created_at: serverTimestamp()
    });

    await setDoc(doc(db, "taca_casas", "temp_2024_1", "casas", "casa_dragao"), {
      nome: "Casa do Dragão",
      cor: "#FF0000",
      pontos_total: 0
    });

    // 6. Codex (Catálogo Global)
    const cards = [
      { id: "c1", nome: "Átomo de Dalton", raridade: "comum", emoji: "⚪", categoria: "Química" },
      { id: "c2", nome: "Revolução Francesa", raridade: "raro", emoji: "🇫🇷", categoria: "História" },
      { id: "c3", nome: "Célula Procarionte", raridade: "comum", emoji: "🧬", categoria: "Biologia" },
      { id: "c4", nome: "Equação de Einstein", raridade: "lendario", emoji: "⚛️", categoria: "Física" },
      { id: "c5", nome: "Tabela Periódica", raridade: "epico", emoji: "📊", categoria: "Química" },
      { id: "c6", nome: "Queda da Bastilha", raridade: "raro", emoji: "🏰", categoria: "História" }
    ];

    for (const card of cards) {
      await setDoc(doc(db, "codex", card.id), {
        ...card,
        created_at: serverTimestamp()
      });
    }

    // 7. Inventário de Exemplo (para o placeholder_user)
    await setDoc(doc(db, "users", "aluno_placeholder", "inventario", "c1"), { obtida_em: serverTimestamp() });
    await setDoc(doc(db, "users", "aluno_placeholder", "inventario", "c3"), { obtida_em: serverTimestamp() });

    console.log("Seed finalizado com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro no seed:", error);
    process.exit(1);
  }
}

seed();
