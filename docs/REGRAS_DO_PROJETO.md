# Plataforma Quasar: Regras de Arquitetura e Engenharia

> Este documento dita as regras de desenvolvimento para garantir que a Plataforma Quasar se mantenha escalável, segura e pronta para integração futura com a Plataforma MOVA.

---

## 0. Mapa do Ecossistema — Leia Primeiro

Três projetos distintos. Não misture código entre eles.

| Projeto | Repo | Stack |
|---|---|---|
| **Plataforma Quasar** | `quasar_v2` | Vanilla JS + Firebase — **você está aqui** |
| **Quasar Lab** | `quasarlab` | React + Vite + Supabase |
| **Plataforma MOVA** | privado | Plataforma mãe futura |

---

## 1. Arquitetura Multi-Repo (Micro-Frontends)

- **`plataforma-quasar` (Privado):** Motor de autenticação, catálogo, envio de atividades, gamificação.
- **`quasar-ferramentas` (Público):** Lousa Interativa, Simuladores, Jogos. Repositório separado.
- **Regra de Injeção:** Toda ferramenta externa é incorporada via `<iframe>`. Nunca insira lógicas pesadas de canvas ou jogos nas pastas de rotas.

---

## 2. Autenticação e Gatekeeper

- **`app.js` é a peça mais sensível do sistema.** Ele injeta o header global e controla auth em todas as páginas.
- **Nenhuma página (exceto `login.html`) pode funcionar sem importar `app.js`.**
- **Zero lógica de auth nas aulas.** Os arquivos em `/eespa/` nunca lidam com autenticação diretamente.
- **Validação dupla:** Domínios institucionais validados no front (`firebase-config.js`) e no back (`firestore.rules`).

---

## 3. Head Padrão — Regra Obrigatória

Toda página da plataforma deve conter este `<head>` na ordem exata abaixo.  
**A ordem importa:** Lucide e Tailwind precisam estar disponíveis antes do `app.js` executar.

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

E como **último script** no `<body>`:
```html
<script type="module" src="/app.js"></script>
```

Template completo disponível em `/_dev/templates/_template_head.html`.

---

## 4. Banco de Dados e Segurança (Firestore)

- Nenhuma regra alterada pelo painel web do Firebase. Somente via `firestore.rules`.
- Deploy: `firebase deploy --only firestore:rules`
- Proibido `allow update, delete: if true` na coleção `atividades_alunos`.

---

## 5. Estrutura de Rotas e Aulas

- O catálogo é uma SPA que lê `catalogo.json` — nunca edite o JSON manualmente.
- Pastas e arquivos: **minúsculas, sem acentos, sem espaços, separados por hífen.**
- Exemplo: `/eespa/1-ano/fisica/leis-de-newton/`

---

## 6. IDs de Atividade

- Padrão obrigatório: `[escola]_[materia]_[tema]_[ano]_v[versao]`
- Exemplo: `eespa_quimica_modelos-atomicos_1ano_v1`
- IDs são imutáveis após o primeiro envio ao Firestore.
