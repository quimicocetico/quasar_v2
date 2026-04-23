# Quasar — Plataforma de Objetos Educacionais Interativos

A Plataforma Quasar é um ecossistema de ferramentas educacionais leves, modulares e gamificadas, projetado pela **MOVA Educação Criativa** para o Ensino Médio.

---

## 💎 Filosofias de Engenharia

Este projeto é regido por rigorosos padrões de qualidade de software. Cada linha de código deve respeitar os seguintes princípios:

1.  **SOLID**: Código orientado a objetos (ou funcional modular) com responsabilidades únicas e interfaces claras.
2.  **DRY (Don't Repeat Yourself)**: Lógicas compartilhadas (Auth, DB, UI Tokens) vivem exclusivamente na pasta `_shared/`.
3.  **KISS (Keep It Simple, Stupid)**: Soluções simples sobre complexidade desnecessária. O hub é intencionalmente leve.
4.  **YAGNI (You Aren't Gonna Need It)**: Implementamos apenas o que é necessário para a sprint atual. Sem "over-engineering".
5.  **Clean Code**: Nomes semânticos, funções pequenas e código autoexplicativo.
6.  **Regra do Escoteiro**: Sempre deixe o código um pouco mais limpo do que o encontrou.
7.  **SoC (Separation of Concerns)**: HTML para estrutura, CSS para estilo e JS para comportamento. Lógica de negócio isolada da UI.
8.  **Composição sobre Herança**: Plugins e componentes modulares em vez de hierarquias rígidas.
9.  **Fail Fast**: Validações rigorosas no início de cada processo (ex: Gatekeeper bloqueando acesso antes do carregamento).
10. **Lei de Deméter**: Um módulo deve falar apenas com seus amigos próximos; evitamos encadeamentos profundos de dependência.
11. **TDD (Test-Driven Development)**: Desenvolvimento orientado a testes para garantir estabilidade.
12. **Mobile First**: Interfaces pensadas para dispositivos móveis, escalando para desktop.

---

## 🏗️ Arquitetura da Solução

A Quasar utiliza uma arquitetura de **Micro-Apps Estáticos** compartilhando um Core unificado.

```
quasar_v2/
├── _shared/                  # O CORE: DRY e SoC aplicados aqui
│   ├── tokens.css            # Design System (Single Source of Truth)
│   ├── gatekeeper.js         # Segurança Centralizada (Fail Fast)
│   └── db.js                 # Abstração de Dados (Encapsulamento)
│
├── quasar-ferramentas/       # Micro-Apps Independentes (KISS)
│   ├── desafio-timeline/     # Refatorado (Clean Code)
│   ├── taca-das-casas/       # Real-time (SOLID)
│   └── ...
│
├── app.js                    # Orquestrador do Hub (Gatekeeper & Header Global)
├── index.html                # Portal de Missões (Hub Central)
├── dashboard-professor.html  # Gestão de Escolas, Turmas e Alunos
├── dashboard-aluno.html      # Perfil, Lista de Turma e Atalhos
├── onboarding.html           # Fluxo de Configuração e Vínculo de Matrícula
└── firestore.rules           # Regras de Segurança e Privacidade
```

---

## 🌟 Funcionalidades Implementadas

### 👨‍🏫 Área do Professor
- **Gestão de Turmas:** Interface mobile-first para adicionar, editar e remover estudantes.
- **Matrícula em Lote:** Importação rápida de listas de e-mails institucionais.
- **Segurança:** Acesso restrito via domínios governamentais (`@educar.rn.gov.br`).

### 🎓 Área do Aluno
- **Vínculo Automático:** Sincronização instantânea com a turma baseada no e-mail institucional no primeiro login.
- **Dashboard Pessoal:** Visualização da Casa, pontuação em tempo real e listagem de colegas de turma (modal privado).
- **Gamification Modular:** Integração nativa com a Taça das Casas (ranking real-time, mural de transparência e hall da fama) e o Codex Arcano.
- **Ranking Público:** Disponível versão sem login em `publico.html?escola=ID_DA_ESCOLA` (exibe apenas ranking e hall da fama).
- **UI Estabilizada:** Cabeçalho global padronizado em todas as ferramentas e interfaces responsivas otimizadas para mobile e desktop.

---

---

## 🚀 Como Contribuir

Ao desenvolver para a Quasar, siga o checklist:
- [ ] A nova lógica está em `_shared` se for útil para outros apps? (**DRY**)
- [ ] O app funciona em telas de 360px? (**Mobile First**)
- [ ] As funções têm mais de 20 linhas? Se sim, refatore. (**Clean Code**)
- [ ] O Firebase está sendo inicializado fora do `_shared/db.js`? (Não faça isso - **SoC**)

---

## 🛠️ Tecnologias
- **Frontend:** Vanilla JS, HTML5, CSS3 (Tailwind para prototipagem rápida).
- **Backend:** Firebase (Auth, Firestore, Hosting).
- **Icons:** Lucide Icons.
- **Fonts:** Outfit (Google Fonts).

---

## 🔐 Autenticação

O acesso à plataforma é restrito aos domínios institucionais do RN:
- **Alunos:** `@estudante.rn.gov.br`
- **Professores:** `@educar.rn.gov.br`

A autenticação é feita via Google OAuth e é centralizada no Hub. Todas as ferramentas herdam a sessão automaticamente através do `_shared/gatekeeper.js`.

---

## 🛠️ Como Rodar Localmente

**Pré-requisitos:** Firebase CLI instalado e autenticado.

```bash
# 1. Clonar o repositório
git clone https://github.com/quimicocetico/quasar_v2.git
cd quasar_v2

# 2. Iniciar servidor de desenvolvimento (Live Server)
npm run dev

# 3. Deploy de regras do Firestore (necessário após mudanças no arquivo .rules)
firebase deploy --only firestore:rules
```

---

## ➕ Adicionando Novas Ferramentas (Micro-Apps)

Para manter a modularidade da Quasar, siga esta estrutura ao criar uma nova ferramenta em `quasar-ferramentas/`:

1.  **Estrutura da Pasta:**
    ```
    nome-da-ferramenta/
    ├── index.html    # Estrutura (KISS)
    ├── style.css     # Estilo (Importar _shared/tokens.css)
    └── main.js       # Comportamento (Importar _shared/gatekeeper.js)
    ```
2.  **Regra de Ouro:** Nunca inicialize o Firebase dentro de uma ferramenta. Use sempre as abstrações de `_shared/db.js`.
3.  **Registro:** Adicione um novo card no `index.html` da raiz para dar acesso à ferramenta.

---

## 🏢 Relação com a Plataforma MOVA

A Quasar é um laboratório de ferramentas interativas (Objetos Educacionais). Ela funciona de forma complementar à **Plataforma MOVA**, que é o ambiente principal de gestão pedagógica e conteúdo estruturado.

---

---

Mantido com ❤️ por [MOVA Educação Criativa](https://github.com/quimicocetico).
