# Plataforma Quasar: Regras de Arquitetura e Engenharia

> Este documento dita as regras de desenvolvimento para garantir que a Plataforma Quasar se mantenha escalável, segura e pronta para integração futura com a Plataforma MOVA.
> Última atualização: 2026-04-20

---

## 0. Mapa do Ecossistema — Leia Primeiro

Três projetos distintos. Não misture código entre eles.

| Projeto | Repo | Stack |
|---|---|---|
| **Plataforma Quasar** | `quasar_v2` | Vanilla JS + Firebase — **você está aqui** |
| **Quasar Lab** | `quasarlab` | React + Vite + Supabase |
| **Plataforma MOVA** | privado | Plataforma mãe futura |

---

## 1. Identidade da Plataforma

A Quasar é um **motor de aulas**, não uma plataforma standalone. Hoje roda sozinha para o piloto EESPA. No futuro será incorporada à MOVA como ferramenta de criação e visualização de aulas dentro de trilhas de aprendizagem.

**Robson Dev ≠ Robson Professor.** O desenvolvedor usa o mesmo fluxo de qualquer professor. JSONs de aula são subidos via `/criar-aula.html`, nunca via deploy de pasta.

---

## 2. Autenticação e Gatekeeper

- **`app.js` é a peça mais sensível do sistema.** Injeta header global e controla auth em todas as páginas.
- **Nenhuma página (exceto `login.html`) funciona sem importar `app.js`.**
- **Zero lógica de auth nas aulas.** `motor-de-aula.js` nunca lida com autenticação diretamente.
- **Dois papéis por domínio de email:**
  - `@estudante.rn.gov.br` → aluno
  - `@educar.rn.gov.br` → professor
- **Validação dupla:** domínio validado no front (`firebase-config.js`) e no back (`firestore.rules`).

---

## 3. Head Padrão — Regra Obrigatória

Toda página deve conter este `<head>` na ordem exata. **A ordem importa.**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título — Plataforma Quasar</title>

  <!-- 1. Tailwind -->
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>

  <!-- 2. Lucide Icons (DEVE vir antes do app.js) -->
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"></script>

  <!-- 3. Fonte -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
</head>
```

Último script no `<body>`:
```html
<script type="module" src="/app.js"></script>
```

---

## 4. Arquitetura de Dados — Firestore-First

### Regra central
**Aulas não vivem em pastas.** Vivem no Firestore + Firebase Storage. Pastas locais são exclusivas do ambiente de desenvolvimento (`_dev/`).

### Coleção `aulas/`
```
aulas/{id_atividade}
  titulo, materia, serie, escola
  professor_email   ← chave de ownership
  json_url          ← Firebase Storage
  status            ← "rascunho" | "publicado"
  criada_em, atualizada_em

  midias/{id_midia}
    tipo            ← "imagem" | "video"
    url
    atualizada_em
```

### Regras de acesso
- Professor: lê e escreve apenas onde `professor_email == auth.token.email`
- Aluno: lê apenas onde `status == "publicado"`
- Nunca `allow write: if true` em nenhuma coleção

### Mídias são separadas do JSON
O JSON é o conteúdo pedagógico — imutável após criação. As mídias ficam na subcoleção `midias/`. Isso permite substituir o JSON sem perder as mídias inseridas.

---

## 5. Motor de Aula — Regras

- **Shell único:** `aula.html` na raiz. Nunca crie `index.html` por aula.
- **Carregamento por ID:** `/aula.html?id=eespa_bio_cap9_2ano_v1` — busca Firestore.
- **Dev only:** `/aula.html?json=_dev/aulas-locais/aula.json` — carrega arquivo local, sem Firestore.
- **Modo editor:** ativado via `?modo=editor`, só renderiza se `currentUser.email === aula.professor_email`.
- **`window.aulaAtual`** sempre exposto após carregamento — usado pelo editor de mídias.

---

## 6. Abstração de Backend

- **`/scripts/atividades.js`** é o único ponto de contato com o backend para envio de atividades.
- Nunca chame Firebase diretamente no motor ou nas páginas de aula.
- Na migração para Supabase: substituir apenas `atividades.js`.
- O evento `quasar:concluida` é disparado sempre — a MOVA o ouvirá via `postMessage` na integração.

---

## 7. IDs de Atividade

- Padrão obrigatório: `[escola]_[materia]_[tema]_[ano]_v[versao]`
- Exemplo: `eespa_bio_classificacao-virus-bacterias_2ano_v1`
- **IDs são imutáveis após o primeiro envio ao Firestore.**
- Substituição de conteúdo não muda o ID — cria nova versão (`v2`, `v3`...) só se for refatoração maior.

---

## 8. Fluxo de Criação de Aula

1. Professor gera `aula.json` (via LLM com prompt mestre ou manualmente)
2. Acessa `/criar-aula.html` (requer `@educar.rn.gov.br`)
3. Upload do JSON → validação → salva no Storage → cria doc no Firestore
4. Redireciona para `/aula.html?id=xxx&modo=editor`
5. Professor insere mídias nos placeholders
6. Clica "Publicar" → `status: publicado`
7. Copia link e envia para a turma

**Nunca** oriente um professor a editar arquivos, fazer deploy ou mexer no repositório.

---

## 9. Estrutura de Arquivos do Repo

```
/
├── app.js                  # Gatekeeper — não alterar sem revisão cuidadosa
├── firebase-config.js
├── firestore.rules         # Fonte de verdade de permissões
├── aula.html               # Shell único
├── criar-aula.html         # Interface do professor
├── catalogo.html           # Hub do aluno
├── login.html
├── scripts/
│   ├── motor-de-aula.js
│   └── atividades.js
├── _dev/                   # NÃO vai a deploy
│   └── aulas-locais/
└── docs/
```

**Pastas aposentadas:** `eespa/`, `gerar-catalogo.js`, `catalogo.json` — não recriar.
