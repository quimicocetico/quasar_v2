# 🚀 Plataforma Quasar — Motor Educacional

Bem-vindo ao repositório central da **Plataforma Quasar**, um ecossistema educacional interativo focado em trilhas de aprendizagem, gamificação e gestão de sala de aula. 

Atualmente em fase piloto com a **EESPA**, este projeto funciona como o motor principal que, no futuro, será integrado à **Plataforma MOVA**.

---

## 🏗️ Arquitetura do Ecossistema (Multi-Repo)

Para garantir segurança, escalabilidade e evitar falhas em cascata, o ecossistema Quasar foi dividido utilizando conceitos de **Micro-Frontends**.

Este repositório (`plataforma-quasar`) é o **Motor Principal (Gatekeeper)**. Ele é responsável por:
- 🔐 Autenticação Institucional (Bloqueio de contas pessoais).
- 🗄️ Regras de Segurança do Banco de Dados (Firestore).
- 🗺️ Roteamento e Catálogo Dinâmico de Aulas.
- 🎓 Hospedagem das Trilhas de Aprendizagem (Ex: `/eespa/`).

As ferramentas pesadas e interativas vivem em repositórios isolados e são injetadas nas aulas via `<iframe>`:
- 🕹️ **[Quasar Ferramentas]** (Lousa Interativa, Simuladores, Timeline).
- 🧪 **[Quasar Lab]** (Iniciação Científica via Supabase).

---

## ⚡ Principais Funcionalidades

- **Acesso VIP:** Login restrito aos domínios `@estudante.rn.gov.br` e `@educar.rn.gov.br`.
- **Anti-Gabarito:** Regras no Back-end (`firestore.rules`) que impedem alunos de alterarem ou apagarem provas já enviadas.
- **Catálogo Automatizado:** Um robô em Node.js varre as pastas de aulas e gera a interface do aluno automaticamente, sem necessidade de atualizar menus HTML à mão.

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.
- [Firebase CLI](https://firebase.google.com/docs/cli) instalado globalmente (`npm install -g firebase-tools`).

### Passo a Passo

1. **Clone o repositório e entre na pasta:**
   ```bash
   git clone [https://github.com/quimicocetico/plataforma-quasar.git](https://github.com/quimicocetico/plataforma-quasar.git)
   cd plataforma-quasar
Instale as dependências (para o robô do catálogo):

Bash
npm install
Inicie o servidor de desenvolvimento:

Bash
npm run dev
Este comando inicia o Firebase Emulator/Hosting e aciona o script gerar-catalogo.js em background para manter suas aulas atualizadas em tempo real.

📚 Documentação Oficial
Para entender as regras de negócio, como criar novas aulas ou verificar o roadmap atual, consulte nossa documentação interna na pasta /docs:

📍 Estado do Projeto & Roadmap

⚖️ Regras de Arquitetura e Código

🛠️ Guia de Contribuição (Como criar aulas)

Desenvolvido para a sala de aula do futuro. Mantido por MOVA.


### O que fazer agora?

1. Salve este arquivo na raiz do projeto.
2. Como você já configurou a branch `main`, para enviar esse README para o GitHub basta rodar a trinca básica no terminal:
   ```bash
   git add README.md
   git commit -m "docs: adiciona README oficial do projeto"
   git push
