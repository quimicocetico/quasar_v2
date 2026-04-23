📚 Documentação Técnica: Ambiente de Testes Seguros e Seed de Dados
Projeto: Quasar — Plataforma de Objetos Educacionais Interativos
Objetivo: Estabelecer um ambiente local estéril e seguro, utilizando variáveis de ambiente para injeção de emuladores e um script de Seed automatizado para popular o banco com uma rede complexa de dados fictícios (Escolas > Professores > Turmas > Alunos), garantindo zero risco de vazamento de dados de produção (LGPD).

🔒 1. Segurança e Arquitetura do Core (DRY & Fail Fast)
Para garantir que o código do emulador nunca vaze para produção, abandonamos a checagem via window.location. O agente deve implementar variáveis de ambiente no bundler (assumindo Vite/Webpack).

Passo 1: Crie um arquivo .env.local na raiz do projeto:

Snippet de código
VITE_USE_EMULATOR=true
Passo 2: Atualize o _shared/db.js para usar a variável:

JavaScript
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = { 
  // Credenciais de produção
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Validação segura via variável de ambiente (Build-time)
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  console.log("🛡️ Quasar: Ambiente DEV Seguro (Emuladores Ativos via ENV)");
}

export { db, auth };
🏗️ 2. Estratégia de Povoamento (Seed Script)
Para criar um cenário real de estresse, o dev agent deve criar um script que roda fora do frontend, usando o firebase-admin (que ignora as regras do Firestore para escrever rápido) e o @faker-js/faker para gerar nomes falsos realistas.

Passo 1: Instalar dependências de desenvolvimento:

Bash
npm install -D firebase-admin @faker-js/faker
Passo 2: Criar o arquivo scripts/seed.js na raiz do projeto. Este script deve orquestrar a criação das entidades respeitando os relacionamentos:

JavaScript
// scripts/seed.js
const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker/locale/pt_BR');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({ projectId: 'demo-quasar-local' });
const db = admin.firestore();
const auth = admin.auth();

const CONFIG = {
  NUM_ESCOLAS: 2,
  PROFS_POR_ESCOLA: 2,
  TURMAS_POR_PROF: 2,
  ALUNOS_POR_TURMA: 12,
  EVENTOS_POR_ALUNO: 5,
  TEMPORADA_ID: 'temp_2026_1'
};

async function runSeed() {
  console.log('🌱 Iniciando plantio de dados realistas na Quasar...');
  // (O script completo agora inclui Taça das Casas, Eventos de Pontos e Codex)
  // Veja o arquivo scripts/seed.js para a implementação completa.
}
runSeed();
```

---

### 🚀 3. Fluxo de Trabalho e Comandos do Terminal

Sempre que precisar iniciar o ambiente de testes do zero, siga esta sequência exata de comandos em terminais separados:

#### Terminal 1: Iniciar Emuladores
Inicia o ecossistema Firebase (Auth, Firestore, Hosting, UI) em modo volátil.
```bash
firebase emulators:start --project demo-quasar-local
```

#### Terminal 2: Popular Banco de Dados (Seed)
Roda o script que cria escolas, professores, turmas, alunos e pontuações.
```bash
node scripts/seed.js
```

#### Terminal 3: Iniciar Servidor Web
Inicia o servidor de desenvolvimento para visualizar a aplicação.
```bash
npm run dev
```

---

### 💡 Dicas de Produtividade

- **Limpeza Total**: Para resetar tudo, basta dar um `Ctrl+C` no Terminal 1 (Emuladores). Ao iniciar novamente, o banco estará vazio.
- **Login Rápido**: A senha para **todos** os usuários gerados é `password123`.
- **Verificação**: Acesse [http://localhost:4000/auth](http://localhost:4000/auth) para ver os e-mails gerados para teste.
- **Erro "Port 8080 taken"**: Se o Firestore não iniciar, feche processos fantasmas com o comando:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force
  ```
- **Transparência**: O script agora gera pontos positivos e negativos, permitindo testar o Ranking e o Mural da Taça das Casas imediatamente.