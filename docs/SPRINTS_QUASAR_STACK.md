# Quasar v2 — Stack Tech Refactor
> Executar em ordem. Cada sprint é independente e entregável.

---

## Sprint 0 — Sanitização do Firebase [CONCLUÍDO]
**Objetivo:** zerar banco e rules antes de qualquer desenvolvimento. Executar primeiro, sem exceção.

### Pré-requisito
Firebase CLI instalado e autenticado:
```bash
firebase login
firebase use SEU_PROJECT_ID
```

### Passo 1 — Zerar o banco via CLI
```bash
firebase firestore:delete --all-collections --project SEU_PROJECT_ID
```
Confirmar quando solicitado. Apaga `challenges/`, `config/` e `sessoes_timeline/` — nenhum dado relevante será perdido.

### Passo 2 — Substituir `firestore.rules`
Apagar o conteúdo atual do arquivo `firestore.rules` na raiz e substituir por:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── FUNÇÕES AUXILIARES ───────────────────────────────────────
    function isAutenticado() {
      return request.auth != null;
    }
    function isAluno() {
      return isAutenticado() &&
        request.auth.token.email.matches('.*@estudante[.]rn[.]gov[.]br');
    }
    function isProfessor() {
      return isAutenticado() &&
        request.auth.token.email.matches('.*@educar[.]rn[.]gov[.]br');
    }
    function isProprietario(uid) {
      return request.auth.uid == uid;
    }
    function professorDaTemporada(temporadaId) {
      return isProfessor() &&
        request.auth.uid == get(/databases/$(database)/documents/taca_casas/temporadas/$(temporadaId)).data.professor_uid;
    }
    function professorDaEscola(escolaId) {
      return isProfessor() &&
        request.auth.uid == get(/databases/$(database)/documents/escolas/$(escolaId)).data.professor_uid;
    }

    // ─── USUÁRIOS ────────────────────────────────────────────────
    match /users/{uid} {
      allow read, write: if isProprietario(uid);

      match /codex/{cartaId} {
        allow read, write: if isProprietario(uid);
      }
    }

    // ─── ESCOLAS E TURMAS ────────────────────────────────────────
    match /escolas/{escolaId} {
      allow read: if isAutenticado();
      allow create: if isProfessor();
      allow update, delete: if professorDaEscola(escolaId);

      match /turmas/{turmaId} {
        allow read: if isAutenticado();
        allow write: if professorDaEscola(escolaId);
      }
    }

    // ─── MATRÍCULAS ──────────────────────────────────────────────
    match /matriculas/{matriculaId} {
      allow read: if isProprietario(resource.data.aluno_uid)
                  || isProfessor();
      allow create: if isProfessor();
      allow update: if isProfessor();
      allow delete: if false;
    }

    // ─── CATÁLOGO CODEX ──────────────────────────────────────────
    match /codex/{cartaId} {
      allow read: if isAutenticado();
      allow write: if false;
    }

    // ─── TAÇA DAS CASAS ──────────────────────────────────────────
    match /taca_casas/temporadas/{temporadaId} {
      allow read: if isAutenticado();
      allow create: if isProfessor();
      allow update, delete: if professorDaTemporada(temporadaId);

      match /casas/{casaId} {
        allow read: if isAutenticado();
        allow write: if professorDaTemporada(temporadaId);

        match /eventos/{eventoId} {
          allow read: if isAutenticado();
          allow create: if professorDaTemporada(temporadaId);
          allow update, delete: if false;
        }
      }
    }
  }
}
```

### Passo 3 — Testar no emulador antes do deploy
```bash
firebase emulators:start --only firestore
```

Cenários obrigatórios a testar:
- Aluno escrevendo em `/codex/` global → deve **negar**
- Professor escrevendo em `/users/{uid}` de outro usuário → deve **negar**
- Aluno lendo `/taca_casas/temporadas/` → deve **permitir**
- Professor criando evento em temporada que não é dele → deve **negar**
- Aluno lendo própria matrícula → deve **permitir**

### Passo 4 — Deploy das rules
```bash
firebase deploy --only firestore:rules
```

**Entrega:** banco vazio, rules novas em prod, emulador validado.

---

## Sprint 1 — Criar `_shared/` [CONCLUÍDO]
**Objetivo:** base compartilhada que todas as apps vão importar.

### Criar `_shared/gatekeeper.js`
```js
import { auth } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js";

export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) { window.location.href = "/login.html"; return; }
    callback(user);
  });
}
```

### Criar `_shared/db.js`
```js
import { db } from "../firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js";

export { db, doc, getDoc, setDoc, updateDoc,
         collection, addDoc, onSnapshot, serverTimestamp };
```

### Criar `_shared/tokens.css`
Extrair as variáveis CSS do design system atual para este arquivo:
```css
:root {
  --bg-deep: #0A0E1A;
  --surface: #111827;
  --text-primary: #E8ECF4;
  --accent-cyan: #00D4FF;
  --accent-warm: #FF6B35;
  --accent-green: #10B981;
  --font-display: 'Outfit', sans-serif;
  --font-mono: 'Space Mono', monospace;
  --radius-card: 16px;
  --radius-btn: 12px;
}
```

**Entrega:** pasta `_shared/` com os 3 arquivos criados e funcionando.

---

## Sprint 2 — Refatorar `desafio-timeline` [CONCLUÍDO]
**Objetivo:** quebrar o `index.html` de 48KB em arquivos separados.

### Estrutura alvo
```
desafio-timeline/
├── index.html    # < 50 linhas — só estrutura
├── style.css     # todo CSS extraído
└── main.js       # todo JS extraído
```

### Regras
- Extrair todo `<style>` para `style.css`
- Extrair todo `<script>` para `main.js`
- `main.js` deve importar `_shared/gatekeeper.js` na primeira linha
- `index.html` deve linkar `<link rel="stylesheet" href="style.css">` e `<script type="module" src="main.js">`
- Não alterar nenhuma lógica — só mover código

**Entrega:** app funcionando igual, código separado, `index.html` limpo.

---

## Sprint 3 — Modelo de dados no Firestore [CONCLUÍDO]
**Objetivo:** criar a estrutura de coleções para área de usuário e apps persistentes.

### Coleções a criar (via console Firebase ou seed script)

```
users/{uid}
  profile: { nome, email, papel, escola_id, created_at }

escolas/{escola_id}
  { nome, dominio_email, professor_uid, created_at }
  turmas/{turma_id}
    { nome, professor_uid, created_at }

matriculas/{matricula_id}
  { aluno_uid, aluno_email, turma_id, escola_id, status, created_at }

taca_casas/
  temporadas/{temporada_id}
    { nome, turma_id, professor_uid, ativa, created_at }
    casas/{casa_id}
      { nome, cor, pontos_total }
      eventos/{evento_id}
        { pontos, motivo, aluno_uid, professor_uid, created_at }

codex/
  cartas/{carta_id}
    { nome, descricao, raridade, imagem_url, disciplina }

users/{uid}/codex/{carta_id}
  { obtida_em, quantidade, origem }
```

**Entrega:** estrutura documentada e validada no console Firebase. Nenhum dado real — só confirmar que as coleções existem e os campos fazem sentido.

---

## Sprint 4 — Atualizar `firestore.rules` [CONCLUÍDO]
**Objetivo:** garantir isolamento entre apps e entre usuários.

Adicionar ao `firestore.rules` existente:

```js
// perfil — só o próprio usuário
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

// coleção do codex por usuário
match /users/{uid}/codex/{cartaId} {
  allow read, write: if request.auth.uid == uid;
}

// catálogo de cartas — leitura pública autenticada
match /codex/{cartaId} {
  allow read: if request.auth != null;
  allow write: if false; // só admin via console
}

// escolas — professor gerencia a própria
match /escolas/{escolaId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == resource.data.professor_uid;
}

// turmas — dentro da escola do professor
match /escolas/{escolaId}/turmas/{turmaId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == get(/databases/$(database)/documents/escolas/$(escolaId)).data.professor_uid;
}

// matrículas — professor cria, aluno lê a própria
match /matriculas/{matriculaId} {
  allow read: if request.auth.uid == resource.data.aluno_uid
              || request.auth.uid == resource.data.professor_uid;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.professor_uid;
}

// taça das casas — professor da temporada escreve, qualquer autenticado lê
match /taca_casas/temporadas/{temporadaId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == resource.data.professor_uid;

  match /casas/{casaId} {
    allow read: if request.auth != null;
    allow write: if request.auth.uid == get(/databases/$(database)/documents/taca_casas/temporadas/$(temporadaId)).data.professor_uid;

    match /eventos/{eventoId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == get(/databases/$(database)/documents/taca_casas/temporadas/$(temporadaId)).data.professor_uid;
      allow update, delete: if false;
    }
  }
}
```

Após editar: `firebase deploy --only firestore:rules`

**Entrega:** regras em prod, testadas no emulador antes do deploy.

---

## Sprint 5 — Área de usuário no hub [CONCLUÍDO]
**Objetivo:** onboarding automático e dashboards mobile-first para professor e aluno.

### Lógica em `app.js` (adicionar ao fluxo existente)

```js
import { requireAuth } from "./_shared/gatekeeper.js";
import { db, doc, getDoc, setDoc, serverTimestamp } from "./_shared/db.js";

requireAuth(async (user) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // primeiro acesso — criar profile
    await setDoc(userRef, {
      nome: user.displayName,
      email: user.email,
      papel: detectarPapel(user.email), // professor ou aluno
      created_at: serverTimestamp()
    });
    redirecionarOnboarding(user);
    return;
  }

  const profile = snap.data();
  if (!profile.escola_id) { redirecionarOnboarding(user); return; }

  carregarHub(profile);
});

function detectarPapel(email) {
  // ajustar conforme domínios reais
  return email.includes("professor") ? "professor" : "aluno";
}
```

### Tela de onboarding — professor
- Campo: nome da escola
- Campo: criar primeira turma
- Upload CSV com emails dos alunos → parsear no front, criar documentos em `matriculas/`

### Tela de onboarding — aluno
- Sistema verifica se email existe em `matriculas/` com status `pendente`
- Se sim: atualiza `aluno_uid`, muda status para `ativo`, cria `profile`
- Se não: exibe mensagem "seu professor ainda não criou sua turma"

**Entrega:** Fluxo de primeiro acesso completo com vínculo automático de UID via e-mail e dashboards funcionais para ambos os papéis.

---

## Sprint 6 — Refatorar `taca-das-casas/` [CONCLUÍDO]
**Objetivo:** Refinar a experiência mobile do ranking e consolidar a lógica de atribuição de pontos. 
*Nota: Refinado em 23/04 com ranking real-time, mural de transparência, hall da fama e responsividade desktop otimizada.*

### Estrutura
```
taca-das-casas/
├── index.html          # tela do aluno (ranking ao vivo)
├── professor.html      # tela do professor (atribuir pontos)
├── style.css           # importa _shared/tokens.css
└── main.js             # lógica compartilhada
```

### `main.js` — ranking realtime
```js
import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, onSnapshot } from "../../_shared/db.js";

requireAuth((user) => {
  const params = new URLSearchParams(window.location.search);
  const temporadaId = params.get("temporada");

  onSnapshot(
    collection(db, "taca_casas", "temporadas", temporadaId, "casas"),
    (snap) => {
      const casas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderRanking(casas.sort((a, b) => b.pontos_total - a.pontos_total));
    }
  );
});
```

### `professor.html` — atribuir pontos
- Selecionar temporada ativa da turma do professor
- Lista de casas com botões +/- pontos
- Campo: motivo (texto livre)
- Campo: vincular a aluno (opcional — dropdown com alunos da turma)
- Ao confirmar: cria documento em `eventos/` e atualiza `pontos_total` da casa

**Entrega:** professor atribui pontos, ranking atualiza em tempo real na tela do aluno.

---

## Sprint 7 — Criar `codex-arcano/`
**Objetivo:** coleção de flashcards colecionáveis vinculados ao usuário.

### Estrutura
```
codex-arcano/
├── index.html       # galeria da coleção do aluno
├── style.css        # importa _shared/tokens.css
└── main.js
```

### `main.js` — carregar coleção
```js
import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, collection, doc, getDoc, onSnapshot } from "../../_shared/db.js";

requireAuth(async (user) => {
  // catálogo completo
  const catalogoSnap = await getDocs(collection(db, "codex"));
  const catalogo = catalogoSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // coleção do usuário — realtime
  onSnapshot(collection(db, "users", user.uid, "codex"), (snap) => {
    const obtidas = new Set(snap.docs.map(d => d.id));
    renderColecao(catalogo, obtidas);
  });
});
```

### `renderColecao`
- Cartas obtidas: exibem arte, nome, raridade
- Cartas não obtidas: exibem silhueta cinza com `?`
- Filtro por disciplina e raridade

**Entrega:** aluno vê a própria coleção, cartas obtidas destacadas, não obtidas como silhueta.

---

## Ordem de execução

| Sprint | Depende de | Pode rodar em paralelo com |
|--------|-----------|---------------------------|
| 0 — sanitização Firebase | nada | — |
| 1 — `_shared/` | Sprint 0 | — |
| 2 — timeline | Sprint 1 | — |
| 3 — modelo Firestore | Sprint 0 | Sprint 1, 2 |
| 4 — rules | Sprint 0 | Sprint 1, 2 |
| 5 — área usuário | Sprint 1, 3, 4 | — |
| 6 — taça das casas | Sprint 1, 3, 4 | Sprint 7 |
| 7 — codex arcano | Sprint 1, 3, 4 | Sprint 6 |

---

## O que não tocar

- `calc-estequiometria/` — incompleta, sem previsão
- `lousa-interativa/` — já modular, não precisa de refatoração
- `primeira-guerra/` — sem previsão de alteração
- `firebase-config.js` — não duplicar, não mover
- `firestore.rules` — Sprint 0 substitui o arquivo completo; após isso nunca remover regras sem validar no emulador
