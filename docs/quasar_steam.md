# Planejamento de Sprints: Ferramenta de Iniciação Científica (IC)
> **Diretriz:** Executar em ordem estrita. Cada sprint é independente, testável e segue a arquitetura modular da plataforma Quasar (`quasar-ferramentas/iniciacao-cientifica`).

## Resumo da Arquitetura de Dados (Firestore)
- **`projetos/{projetoId}`**: Guarda dados do projeto, professor, token do coorientador e status.
- **`projetos/{projetoId}/membros/{email}`**: Subcoleção ou array controlando alunos convidados e status (pendente/aceito).
- **`projetos/{projetoId}/etapas/{etapaId}`**: Guarda o status atual da etapa (ex: aguardando, devolvido, aprovado).
- **`projetos/{projetoId}/etapas/{etapaId}/submissoes/{submissaoId}`**: O "Diário de Bordo". Guarda o texto em Markdown, data, e subcoleção de `feedbacks`. Nunca sobrescreve.
- **`projetos/{projetoId}/etapas/{etapaId}/submissoes/{submissaoId}/feedbacks/{feedbackId}`**: Comentários. Deve conter `autor_nome`, `autor_tipo` (orientador/coorientador) e `timestamp`.

---

## Sprint 1: Fundação e Segurança (Regras de Negócio)
**Objetivo:** Preparar o terreno no Firebase para suportar a nova estrutura sem vazar dados.

* **Passo 1:** Atualizar o `firestore.rules` na raiz do projeto.
* **Passo 2:** Criar regras que permitam ao professor criar projetos.
* **Passo 3:** Criar regras que permitam leitura/escrita de alunos apenas nos projetos onde seu e-mail consta como membro.
* **Passo 4:** Criar a regra do "Link Mágico": permitir leitura do projeto e escrita restrita na coleção de `feedbacks` se o request contiver o `token` correto.

## Sprint 2: Setup da Ferramenta e Painel do Professor
**Objetivo:** Criar a interface base isolada e permitir que o professor dê o pontapé inicial.

* **Passo 1:** Criar a pasta `quasar-ferramentas/iniciacao-cientifica/` com `index.html`, `style.css` e `main.js`.
* **Passo 2:** Importar `_shared/gatekeeper.js`, `_shared/db.js` e `_shared/tokens.css`.
* **Passo 3:** Desenvolver a UI do Painel do Professor: Botão "Novo Projeto".
* **Passo 4:** Criar o formulário inicial para o professor inserir: Título, Problema (Etapa 01) e e-mails dos alunos (máx 3).
* **Passo 5:** Salvar o projeto no Firestore com status `aguardando_alunos`.

## Sprint 3: Gestão de Acesso (Convites e Coorientador)
**Objetivo:** Implementar o aceite dos alunos e o link mágico seguro do coorientador.

* **Passo 1:** No painel do aluno, exibir alerta de "Convite Pendente" com botões de Aceitar/Recusar. Atualizar status no banco.
* **Passo 2:** No painel do professor, criar a interface de "Coorientador".
* **Passo 3:** Criar a função para gerar um Hash aleatório (Token) e salvar no documento do projeto.
* **Passo 4:** Gerar a URL compartilhável (`?projeto=ID&token=HASH`) com aviso educativo sobre não compartilhar em público.
* **Passo 5:** Implementar o botão "Revogar Acesso" que gera um novo Hash e invalida o anterior.

## Sprint 4: Área da Equipe e Editor Markdown
**Objetivo:** Permitir que os alunos submetam as etapas (Etapa 02 a 15) com formatação leve.

* **Passo 1:** Criar a interface de visualização da Trilha de Etapas (Menu lateral ou cards).
* **Passo 2:** Integrar um `textarea` simples para a equipe digitar em Markdown.
* **Passo 3:** Implementar a lógica de bloqueio: a Etapa N só é liberada para edição se a Etapa N-1 estiver com status `aprovado`.
* **Passo 4:** Ao enviar, criar um novo documento dentro de `submissoes` (Histórico intocável). Mudar status da etapa para `aguardando_aprovacao`.

## Sprint 5: Ciclo de Avaliação (Professor e Coorientador)
**Objetivo:** Fechar o ciclo pedagógico com aprovações, devoluções e trilha de auditoria.

* **Passo 1:** Implementar o acesso do Coorientador via Link Mágico (bypassar o `gatekeeper.js` se URL tiver token válido, exigindo apenas um "Nome de Assinatura").
* **Passo 2:** Interface de Leitura de Submissão: Renderizar o Markdown submetido pela equipe.
* **Passo 3:** Criar o formulário de Feedback (Professor e Coorientador).
* **Passo 4:** Implementar botões de "Aprovar" e "Devolver com Feedback" (Visíveis apenas para o Professor).
* **Passo 5:** Exibir o histórico de versões e feedbacks anteriores abaixo da submissão atual para consulta (Diário de Bordo).

---

## 🚀 Melhorias Futuras (Backlog)
- **Rastreabilidade de Feedback**: Implementar no `create` do feedback a gravação automática do campo `autor_tipo` baseada na autenticação (Orientador) ou no Token (Coorientador), permitindo que a UI aplique estilos visuais distintos para as orientações.
- **Notificações**: Integrar com sistema de alertas da Quasar para avisar a equipe quando um novo feedback for postado.

---

# Detalhamento das Etapas MCAT (Quasar STEAM Lab)

Etapa 01: Observação e Identificação do Problema
Instrução: Observar o ambiente ou literatura para reconhecer um fato e transformá-lo em uma pergunta científica.
Checklist:
- [ ] A situação-problema é clara e precisa?
- [ ] Evitou julgamentos de valor (melhor/pior)?
- [ ] Possui uma dimensão viável para execução?
- [ ] Possui uma resposta possivel execução?

Etapa 02: Formação da Equipe e Papéis
Instrução: Definir o grupo de trabalho (máximo 3 alunos) e o professor orientador e coorientador (>21 anos).
Checklist:
- [ ] Alunos e orientador devidamente cadastrados?
- [ ] Papéis de cada integrante definidos?
- [ ] Coorientador ja cadastrado (acesso via perfil de visitante convidado).

Etapa 03: Abertura do Diário de Bordo
Instrução: Iniciar o registro detalhado e preciso de todos os passos, datas, locais e descobertas.
Checklist:
- [ ] Caderno tipo brochura com capa dura iniciado corretamente?
- [ ] Registros são feitos das primeiras reuniões do projeto?
- [ ] Registros são feitos manualmente e datados?

Etapa 04: Pesquisa Bibliográfica Inicial
Instrução: Reunir informações e referências confiáveis sobre o assunto para embasar o estudo.
Checklist:
- [ ] Pelo menos 3 referências confiáveis listadas?
- [ ] Fichamento devidamente registrado no diário de bordo?
- [ ] Uso de bases como Google Acadêmico?

Etapa 05: Formulação de Hipóteses
Instrução: Criar uma afirmação que pressupõe uma resposta ao problema (Científico) ou definir o que se pretende atingir (Engenharia).
Checklist:
- [ ] Hipótese responde a situação problema?
- [ ] Hipótese é testavel?

Etapa 06: Formulação de Objetivos
Instrução: Listar os objetivos do projeto geral e especificos.
Checklist:
- [ ] Objetivos usam verbos de ação adequados (analisar, avaliar, etc.)?
- [ ] Objetivos adequados a hipotese?
- [ ] Objetivos organizados em ordem de prioridade?

Etapa 07: Levantamento de Materiais e Métodos (Ajustado)
Instrução: Listar os materiais necessários e o método de pesquisa.
Checklist:
- [ ] Lista de materiais completa?
- [ ] Método descrito passo a passo?

Etapa 08: Introdução/Justificativa
Instrução: Apresente o tema da sua pesquisa e por que é relevante e importante.
Checklist:
- [ ] Explica de que assunto trata o seu projeto? 
- [ ] Demonstra por que é importante tratar esse assunto? 
- [ ] Revisa o que se sabia sobre esse assunto antes desse estudo?
- [ ] Deixa claro como esse estudo irá ampliar os conhecimentos?

Etapa 09: Planejamento da Metodologia
Instrução: Descrever o delineamento experimental, variáveis, controles e tratamentos.
Checklist:
- [ ] Descrição clara do objeto de estudo e local?
- [ ] Variáveis e grupos de controle identificados?

Etapa 10: Submissão do Formulário de Projeto
Instrução: Preencher o planejamento inicial incluindo cronograma e previsão de gastos.
Checklist:
- [ ] Orçamento detalhado incluído?
- [ ] Cronograma de semanas definido?

Etapa 11: Execução Experimental e Coleta de Dados
Instrução: Realizar os testes planejados, registrando rigorosamente os resultados no Diário de Bordo.
Checklist:
- [ ] Autorização do comitê de ética (quando necessário)?
- [ ] Procedimentos seguidos conforme planejamento?
- [ ] Dados quantitativos anotados com precisão?

Etapa 12: Análise de Dados e Resultados
Instrução: Organizar os dados em tabelas/gráficos e aplicar análises.
Checklist:
- [ ] Gráficos e tabelas gerados (ex: Excel)?
- [ ] Uso de ferramentas como SIVAR ou testes estatísticos?

Etapa 13: Elaboração da Conclusão
Instrução: Interpretar os resultados para responder ao problema inicial.
Checklist:
- [ ] Conclusão baseada estritamente nos dados coletados?
- [ ] Relação com a literatura estabelecida?

Etapa 14: Redação do Relatório Final e Resumo
Instrução: Escrever o documento formal no tempo passado, seguindo a estrutura científica.
Checklist:
- [ ] Resumo com máximo de 2000-2500 caracteres?
- [ ] Relatório contém folha de rosto, sumário e referências ABNT?

Etapa 15: Preparação de Pôster
Instrução: Criar os materiais visuais para a feira.
Checklist:
- [ ] Pôster autoexplicativo (0,9m x 1,2m)?