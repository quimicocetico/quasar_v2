📔 Diário de Sessão: Plataforma Quasar
Data: 20 de Abril de 2026

Status: Estrutura Base e Segurança "Gatekeeper" Consolidadas.

🚀 1. Visão Geral do Projeto
A Plataforma Quasar é um ecossistema educacional interativo (HTML/JS Vanilla + Firebase). Ela está sendo preparada para ser um módulo da futura Plataforma MOVA. O objetivo atual é rodar aulas piloto na escola EESPA.

🏗️ 2. Arquitetura de Software
Decidimos por uma abordagem Multi-Repo/Micro-Frontend:

Repositório Atual (quasar_v2): É o "Cérebro". Controla Login, Catálogo de Aulas, Segurança de Banco e o Header Global.

Ferramentas Externas: Lousas e Simuladores pesados ficam em outros repositórios e são injetados via <iframe> para manter este repositório leve.

Estrutura de Pastas Atual:
Plaintext
/
├── app.js               # O "Gatekeeper": Controla Auth, Header e Injeção de UI.
├── firebase-config.js   # Configuração Firebase e Funções de Auth (Google).
├── firestore.rules      # Regras de segurança (Bloqueio de edições pós-envio).
├── index.html           # Hub de Missões (Catálogo).
├── login.html           # Único ponto de entrada para deslogados.
├── eespa/               # Conteúdo pedagógico (Aulas).
├── docs/                # ESTADO_DO_PROJETO, REGRAS_DO_PROJETO, CONTRIBUTING.
└── gerar-catalogo.js    # Script Node para automação do JSON de aulas.
🔐 3. O "Gatekeeper" (app.js)
Implementamos uma lógica de proteção de rotas robusta:

Auth Observer: O app.js vigia o estado do Firebase. Se um usuário deslogado tenta acessar qualquer página (exceto login.html), ele é redirecionado instantaneamente.

Restrição de Domínio: O sistema só aceita e-mails @estudante.rn.gov.br ou @educar.rn.gov.br.

Injeção Automática: O app.js injeta o Header, o Footer e as dependências (Tailwind, Lucide Icons, Google Fonts) em todas as páginas via JavaScript, garantindo unidade visual sem repetir código.

🎨 4. UI/UX e Design System
Estilo: "Deep Space" (Fundo escuro #0A0F1C) com acentos em Neon (#00F0FF e #7000FF).

Header Dinâmico: Criamos um Card de Perfil no canto superior direito. Ele exibe a foto do Google do aluno, nome, e-mail e o botão de Logout (Sair).

🛠️ 5. Progresso no Git
Branch Principal: main.

Sincronização: O repositório local está conectado ao GitHub (quimicocetico/quasar_v2).

Documentação: Todos os arquivos .md foram atualizados para refletir a nova arquitetura profissional.

📝 6. Pendências para o Próximo Agente
Aula de Bioquímica: O conteúdo em /eespa/1-ano/biologia/ precisa de refinamento visual e lógica de quiz (usando o globalThis.db exposto pelo app.js).

Integração de Ferramentas: Começar a injetar a "Lousa Interativa" externa via iframe nas aulas de teste.

Catálogo Dinâmico: Garantir que o index.html consuma corretamente o catalogo.json gerado pelo robô.

Nota para o próximo agente: O desenvolvedor prefere uma abordagem direta, com código limpo (Vanilla JS) e focado em escalabilidade para o projeto MOVA. O Gatekeeper em app.js é a peça mais sensível do sistema hoje.