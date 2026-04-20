1. ESTADO_DO_PROJETO.mdMarkdown# ESTADO DO PROJETO — Plataforma Quasar
> Última atualização: 2026-04 · Responsável: dev sênior MOVA

---

## Visão Geral

A Plataforma Quasar é um ecossistema educacional interativo focado em trilhas de aprendizagem e gamificação, desenvolvido com HTML/CSS/JS vanilla + Firebase. Atualmente em fase de testes com a EESPA. Futuramente, será integrada como feature da Plataforma MOVA, operando no modelo de Micro-Frontends.

---

## Arquitetura Atual (Multi-Repo)

A plataforma centraliza a autenticação, segurança e o catálogo de rotas. Ferramentas interativas pesadas rodam em repositórios isolados e são injetadas via `<iframe>`.

```text
/                               ← raiz = motor da plataforma
├── app.js                      # Gatekeeper global: auth, redirecionamento de rotas e UI base
├── firebase-config.js          # Conexão Firestore + Google Auth + funções de envio
├── firestore.rules             # [PROD] Regras de segurança de banco de dados (Deploy via CLI)
├── index.html                  # Hub principal (Portal de Missões)
├── login.html                  # Ponto de entrada único (Acesso VIP Institucional)
├── catalogo.html               # SPA do catálogo de trilhas e aulas
├── gerar-catalogo.js           # Script Node.js (Robô) que vasculha pastas e gera o JSON
├── catalogo.json               # Seed gerado automaticamente com links das aulas
├── package.json                # Gerenciador de dependências e scripts (predev)
├── firebase.json               # Config Firebase Hosting e deploy de regras
│
├── eespa/                      # Aulas da EESPA (escola piloto)
│   └── 1-ano/
│       └── biologia/
│           └── aula-bioquimica/
│               └── index.html  # [PROD] Bases Químicas da Vida
│
├── _dev/                       # Material em desenvolvimento — NÃO vai a deploy de prod
│   └── templates/              # Templates base para novas aulas
│
└── docs/                       # Documentação do projeto
    ├── ESTADO_DO_PROJETO.md    # Este arquivo
    ├── REGRAS_DO_PROJETO.md    # Regras de código e arquitetura
    └── CONTRIBUTING.md         # Guia de criação e contribuição
Regras de Ouro do Motor Baseapp.js atua como Gatekeeper. Nenhuma tela (exceto login) pode ser acessada sem autenticação ativa. Usuários não logados são expulsos instantaneamente para /login.html.Acesso Restrito por Domínio: O firebase-config.js bloqueia e-mails pessoais. Apenas @estudante.rn.gov.br e @educar.rn.gov.br são aceitos.Segurança Backend: O arquivo firestore.rules é a única fonte de verdade para permissões de banco. Ele garante que o aluno só escreva na própria prova e proíbe edições pós-envio.IDs de Atividade: Padrão rigoroso: escola_materia_tema_ano_v{N} ex: eespa_bioquimica_1ano_v1.Status dos MódulosMóduloCaminho / RepoStatusObservaçõesAutenticação (Login VIP)/login.html✅ ConcluídoBloqueio de e-mail comum ativoPortal de Missões/index.html✅ FuncionalAcessível apenas pós-loginCatálogo Dinâmico/catalogo.html✅ Automação OKLê de catalogo.json via FetchAula: Bioquímica/eespa/1-ano/biologia/...✅ Em testeÚnica aula modelo ativaSegurança de Bancofirestore.rules✅ BlindadoDeploy unificado realizadoLousa Interativa / Jogosquasar-ferramentas⏳ MigrandoSerão isolados em repo públicoQuasar Labquasarlab⏳ IsoladoRodará via Supabase paraleloPróximos Passos (Roadmap)[ ] Etapa 2 (Arquitetura): Finalizar a migração das ferramentas (_modules) para o repositório externo quasar-ferramentas.[ ] Etapa 3 (Conteúdo): Expandir as aulas em eespa/ e rodar automação para popular o catálogo.[ ] Etapa 4 (MOVA): Iniciar estudos de transição de Google Auth para JWT do Supabase quando a integração ocorrer.