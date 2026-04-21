import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const provider = new GoogleAuthProvider();

export async function loginComGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const email = user.email;
        
        // --- MURALHA DE SEGURANÇA: Validação de Domínio Institucional ---
        const isAluno = email.endsWith('@estudante.rn.gov.br');
        const isProfessor = email.endsWith('@educar.rn.gov.br');

        // Se o usuário tentar entrar com um e-mail comum (@gmail.com, @hotmail.com), ele é barrado
        if (!isAluno && !isProfessor) {
            await auth.signOut(); // Desloga o penetra imediatamente
            throw new Error("Acesso negado. Por favor, use seu e-mail institucional (@estudante.rn.gov.br ou @educar.rn.gov.br).");
        }

        return user;
    } catch (error) {
        console.error("Erro na autenticação:", error);
        throw error; // Repassa o erro para o login.html mostrar a mensagem vermelha
    }
}

export async function enviarAtividade(idAula, respostas) {
    if (!auth.currentUser) {
        throw new Error("Usuário não autenticado.");
    }

    const usuario = auth.currentUser;
    // Puxa a escola e turma se houver, senão usa um fallback
    const perfil = JSON.parse(localStorage.getItem('perfil_aluno')) || { escola: 'EESPA', turma: 'Não definida' };

    return addDoc(collection(db, "atividades_alunos"), {
        id_atividade: idAula,
        aluno_nome: usuario.displayName,
        aluno_email: usuario.email,
        escola: perfil.escola,
        turma: perfil.turma,
        respostas: respostas,
        data_envio: serverTimestamp()
    });
}

export { serverTimestamp };