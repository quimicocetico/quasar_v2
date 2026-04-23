# Diário de Sessão — Plataforma Quasar
**Data:** 23 de Abril de 2026
**Status:** Plataforma Estabilizada. Taça das Casas Concluída. Sprints 0-6 finalizados.

---

## 1. O que mudou desde a Sessão 01

A plataforma foi completamente reposicionada. O modelo anterior — motor de aulas com catálogo dinâmico, gerador Node.js e trilhas pedagógicas — foi migrado para a Plataforma MOVA, que terá seu próprio portal de criação de aulas mais robusto.

O Quasar passa a ser exclusivamente um **hub de objetos educacionais independentes**.

---

## 2. Arquitetura atual

### O hub (`quasar_v2` raiz)
Responsabilidades: login, vitrine de ferramentas, área de usuário. Nenhuma lógica de conteúdo.

### As ferramentas (`quasar-ferramentas/`)
Monorepo. Cada ferramenta é uma aplicação estática independente (HTML/CSS/JS Vanilla + ES Modules). Sem build tool. Sem framework obrigatório.

### Contrato compartilhado (`_shared/`)
A ser criado no Sprint 1. Três arquivos que toda ferramenta herda:
- `tokens.css` — design system como CSS variables
- `gatekeeper.js` — guard de auth importável
- `db.js` — helpers Firestore centralizados

### Banco de dados
Firebase Firestore. Modelo centrado em `users/{uid}` com subcoleções isoladas por ferramenta. Configuração externalizável para eventual domínio público.

---

## 3. Ferramentas existentes

| Ferramenta | Stack | Situação |
|---|---|---|
| `lousa-interativa` | Vanilla JS, ES Modules | Não mexer — já modular |
| `primeira-guerra` | Vanilla JS, multi-página HTML | Não mexer — sem previsão |
| `desafio-timeline` | Vanilla JS monolítico (~48KB) | Refatorar no Sprint 2 |
| `calc-estequiometria` | Vanilla JS | Não mexer — incompleta |

---

## 4. Ferramentas novas (a construir)

### Taça das Casas
Ranking gamificado acumulativo por casas/turmas. Professor atribui pontos livremente — com ou sem vincular a um aluno específico. Ranking atualiza em tempo real via `onSnapshot`. Duas telas: `index.html` (aluno, ranking ao vivo) e `professor.html` (atribuição de pontos).

Modelo de dados:
```
taca_casas/temporadas/{id} → casas/{id} → eventos/{id}
```

### Codex Arcano
Coleção de flashcards colecionáveis vinculada à conta do aluno. Catálogo global de cartas em `codex/` (read-only). Coleção pessoal em `users/{uid}/codex/`. Cartas não obtidas exibidas como silhueta.

---

## 5. Área de usuário

Onboarding automático no primeiro login:
- **Professor:** cria escola → cria turma → sobe CSV com emails dos alunos → sistema cria documentos em `matriculas/`
- **Aluno:** sistema detecta email em `matriculas/` → vincula automaticamente → cria profile

Detecção de papel por domínio de email (`@educar` = professor, `@estudante` = aluno).

---

## 6. Decisões de negócio em aberto

- **Domínio público:** as ferramentas podem ou não se tornar públicas. Arquitetura já suporta: config Firebase externalizável, auth opcional por ferramenta. Decisão pendente.
- **Integração MOVA:** quando ocorrer, as ferramentas serão integradas via `postMessage` contract. A MOVA injetará contexto (`__MOVA_CONTEXT__`) e a ferramenta detecta e muda comportamento sem alterar código. Sem data prevista.
- **QuasarLab:** corre paralelo em repo separado com Supabase. Independente do Quasar.

---

## 7. Sprints planejados

Documento completo: `SPRINTS_QUASAR_STACK.md`

| Sprint | Objetivo |
|---|---|
| 0 | Sanitização Firebase — zerar banco, novo `firestore.rules` via CLI |
| 1 | Criar `_shared/` com gatekeeper, db helpers e tokens CSS |
| 2 | Refatorar `desafio-timeline` — separar HTML/CSS/JS |
| 3 | Criar modelo de dados no Firestore |
| 4 | Deploy das novas `firestore.rules` |
| 5 | Área de usuário no hub — onboarding professor e aluno |
| 6 | Criar `taca-das-casas/` do zero [CONCLUÍDO] |
| 7 | Criar `codex-arcano/` do zero |

**Próximo passo imediato:** dev executa Sprint 0.

---

## 8. Arquivos obsoletos a remover do repo

- `CONTRIBUTING.md` — guia de criação de aulas, não existe mais
- `ESTADO_DO_PROJETO.md` — substituído por este diário
- `REGRAS_DO_PROJETO.md` — substituído pelo README e pelos sprints
- `gerar-catalogo.js` — removido com o catálogo
- `catalogo.json` — removido com o catálogo
- `catalogo.html` — removido com o catálogo
- `eespa/` — conteúdo migrado para MOVA

---

## 9. Nota para o próximo agente

- `firebase-config.js` nunca deve ser duplicado — todas as ferramentas importam da raiz
- O Sprint 0 (sanitização) deve ser executado antes de qualquer desenvolvimento
- Regras do Firestore: sempre testar no emulador antes de `firebase deploy --only firestore:rules`
- Decisões de stack são intencionais: sem Vite, sem framework, sem build tool — manter assim até haver razão explícita para mudar
- Robson é direto e autodidata — sem explicações óbvias, código completo e pronto para uso
