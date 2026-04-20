# ESTADO DO PROJETO — Plataforma Quasar
> Última atualização: 2026-04 · Responsável: dev sênior MOVA

---

## ⚠️ Mapa do Ecossistema — Leia Antes de Tudo

Existem três projetos distintos. Confundi-los é o erro mais comum:

| Projeto | Repo | Stack | Função |
|---|---|---|---|
| **Plataforma Quasar** | `quimicocetico/quasar_v2` | HTML/CSS/JS Vanilla + Firebase | Motor de aulas, auth, catálogo, gamificação. **Você está aqui.** |
| **Quasar Lab** | `quimicocetico/quasarlab` | React + Vite + Supabase | Módulo de Iniciação Científica (IC) — projeto separado, banco separado |
| **Plataforma MOVA** | privado | — | Plataforma mãe futura. Quasar e QuasarLab serão módulos dela via Micro-Frontend |

**Regra de ouro:** Nenhum código deste repositório vai para o QuasarLab ou MOVA diretamente. A integração futura será via `<iframe>` ou contrato de API.

---

## Visão Geral

A Plataforma Quasar é um ecossistema educacional interativo focado em trilhas de aprendizagem e gamificação. Desenvolvido com HTML/CSS/JS vanilla + Firebase. Atualmente em fase de testes com a **EESPA** (escola piloto). Público-alvo: alunos do Ensino Médio da rede pública do RN.

---

## Arquitetura Atual

```
/                               ← raiz = motor da plataforma
├── app.js                      # Gatekeeper: auth + header global injetado em todas as páginas
├── firebase-config.js          # Conexão Firebase + Google Auth + envio de atividades
├── firestore.rules             # Regras de segurança do banco (deploy via CLI)
├── index.html                  # Hub / Portal de Missões
├── login.html                  # Único ponto de entrada para não-autenticados
├── catalogo.html               # SPA do catálogo de aulas (lê catalogo.json)
├── gerar-catalogo.js           # Robô Node.js: varre /eespa/, gera catalogo.json
├── catalogo.json               # Gerado automaticamente — NÃO editar à mão
├── package.json                # Scripts: predev roda o robô antes do firebase serve
│
├── eespa/                      # Aulas da escola piloto EESPA
│   └── 1-ano/
│       └── biologia/
│           └── aula-bioquimica/
│               └── index.html  # [PROD] Bases Químicas da Vida
│
├── _modules/                   # Ferramentas interativas (lousa, timelines)
│                               # Futuramente migrar para repo quasar-ferramentas
│
├── _dev/                       # Templates e rascunhos — NÃO vai a deploy
│   └── templates/
│
└── docs/                       # Esta documentação
```

---

## Regras do Motor

- **`app.js` é sagrado.** Ele injeta header, dependências (Tailwind, Lucide, Fonts) e controla auth em todas as páginas. Nunca duplique auth nas aulas.
- **Nenhuma página (exceto `login.html`) funciona sem importar `app.js`.**
- **Acesso restrito:** Apenas `@estudante.rn.gov.br` e `@educar.rn.gov.br`.
- **`firestore.rules`** é a fonte de verdade de permissões. Nunca altere pelo painel web.
- **`catalogo.json`** é gerado pelo robô. Nunca edite manualmente.

---

## Status dos Módulos

| Módulo | Caminho | Status | Observações |
|---|---|---|---|
| Autenticação | `login.html` + `app.js` | ✅ Funcional | Restrição de domínio ativa |
| Header Global | `app.js` | ✅ Funcional | Injetado via JS em todas as páginas |
| Portal de Missões | `index.html` | ✅ Corrigido | Agora importa `app.js` corretamente |
| Catálogo Dinâmico | `catalogo.html` | ⚠️ Verificar | Confirmar se importa `app.js` |
| Aula: Bioquímica | `eespa/1-ano/biologia/...` | ⚠️ Em refinamento | Precisa de quiz e polish visual |
| Lousa Interativa | `_modules/lousa-interativa/` | ⏳ Migrando | Mover para `quasar-ferramentas` |
| Segurança Firestore | `firestore.rules` | ✅ Blindado | Deploy unificado realizado |

---

## Roadmap

- [ ] **Imediato:** Verificar e corrigir `catalogo.html` (importar `app.js`)
- [ ] **Imediato:** Verificar aulas em `/eespa/` (todas devem importar `app.js`)
- [ ] **Etapa 2:** Migrar `_modules/` para repositório `quasar-ferramentas`
- [ ] **Etapa 3:** Expandir aulas em `eespa/` e rodar robô de catálogo
- [ ] **Etapa 4 (futuro):** Estudo de integração com MOVA via Micro-Frontend
