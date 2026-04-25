# Codex Arcano — Especificação Técnica v2.1

**Data:** 23/04/2026
**Alterações v2.1:**
- Carta secreta alterada de "Transmutação" para "Radioatividade"
- Texto de todos os poderes reescrito do ponto de vista da carta (voz do professor falando com o aluno)

---

## 1. Visão geral

Coleção de cards colecionáveis com mecânica de abertura de pacotes, fusão e cards secretos. Organizada em **temporadas semestrais**. Cada temporada tem uma coleção ativa de 20 cartas. Poderes são benefícios acadêmicos reais, válidos apenas dentro da temporada ativa. Coleções antigas permanecem disponíveis na loja e como brindes — apenas os poderes são encerrados ao fim da temporada.

---

## 2. Economia das cartas — decisões finais

### Parâmetros validados estatisticamente

```
Período de uma temporada: 1 semestre (~100 dias letivos)
Pacotes por aluno por semestre: 8–16 (média 12)
Cartas por pacote: 3
Total de cartas obtidas por aluno: 24–48 (média 36)
Turma padrão: 30–40 alunos
```

### Tamanho da coleção: 20 cartas únicas por temporada

| Perfil | Pacotes/sem | Cartas obtidas | Únicas esperadas | % completo | Fusões possíveis |
|---|---|---|---|---|---|
| Mínimo | 8 | 24 | ~14 de 20 | 70% | ~3 |
| Médio | 12 | 36 | ~17 de 20 | 85% | ~6 |
| Máximo | 16 | 48 | ~19 de 20 | 95% | ~8 |

Alunos que completam a coleção por turma: **~3 de 35**
Alunos que chegam à carta secreta: **~8–10 de 35**

### Distribuição de raridade nas 20 cartas

| Raridade | Qtd | % da coleção |
|---|---|---|
| Comum | 9 | 45% |
| Incomum | 5 | 25% |
| Rara | 3 | 15% |
| Lendária | 2 | 10% |
| Secreta | 1 | 5% |

### Probabilidade por slot de pacote

| Raridade | Pacote padrão | Pacote premium |
|---|---|---|
| Comum | 55% | 15% |
| Incomum | 28% | 38% |
| Rara | 13% | 35% |
| Lendária | 3% | 9% |
| Secreta | 0% | 0% |

---

## 3. Mecânica de temporada

### O que é uma temporada

- Duração: 1 semestre
- Vinculada a uma coleção de 20 cartas
- Ativada manualmente pelo professor no início do semestre
- Encerrada manualmente pelo professor ao fim do semestre

### O que acontece ao encerrar uma temporada

| Elemento | O que acontece |
|---|---|
| Cartas da coleção | Permanecem na coleção pessoal do aluno para sempre |
| Poderes | Encerrados — não podem mais ser ativados |
| Pacotes não abertos | Permanecem acessíveis |
| Coleção na loja MOVA | Disponível para compra avulsa (comuns e incomuns) |
| Coleção como brinde | Pode ser distribuída em outros desafios da plataforma |

### Schema de temporada no Firestore

```
temporadas/{id}
  - nome: string
  - colecao_id: string
  - turma_id: string
  - criada_por: uid_professor
  - inicio: timestamp
  - fim: timestamp?
  - status: 'ativa' | 'encerrada'
```

---

## 4. Sistema de fusão

### Regra base

```
3 duplicatas comuns    → 1 incomum aleatória da coleção ativa
3 duplicatas incomuns  → 1 rara aleatória da coleção ativa
3 duplicatas raras     → 1 lendária aleatória da coleção ativa
combinação específica  → 1 carta secreta
```

### Carta secreta

- Nunca obtida por pacote
- Obtida por combinação específica definida por coleção
- Combinação padrão: `1 carta lendária + 1 carta rara específica + 1 carta comum específica`
- A combinação não é exibida no app — os alunos descobrem por tentativa ou dica do professor
- Fusão válida apenas dentro da temporada ativa

---

## 5. Canais de obtenção de cartas

| Canal | Quem controla | Raridades disponíveis | Temporada necessária |
|---|---|---|---|
| Pacote padrão | Professor | Todas exceto secreta | Sim |
| Pacote premium | Professor | Todas exceto secreta | Sim |
| Fusão | Aluno | Conforme regra | Sim |
| Loja MOVA | Plataforma | Comum + Incomum apenas | Não |
| Brinde (outros desafios) | Plataforma / Professor | Qualquer | Não |

Rara, Lendária e Secreta nunca à venda na loja.

---

## 6. Poderes — ciclo de vida e voz

A carta fala diretamente com o aluno — é a voz do professor concedendo o benefício.
Padrão de linguagem: **"Você pode [benefício]."**

```
Temporada ativa    → poder disponível para uso
Temporada encerrada → poder bloqueado
```

Carta com poder encerrado exibe: *"Poder da temporada [nome] — encerrado."*
Histórico de usos preservado permanentemente.

---

## 7. Dados de teste — Coleção "Química · Teste"

20 cartas (9C + 5I + 3R + 2L + 1S)

### Comuns (9)

| Cod | Título | Conteúdo | Poder |
|---|---|---|---|
| T101 | O que é matéria? | Tudo que tem massa e ocupa lugar no espaço. | Você pode pedir uma pista curta ao professor. |
| T102 | O que é massa? | Quantidade de matéria de um corpo. | Você pode pedir ao professor para sublinhar os dados relevantes da questão. |
| T103 | O que é volume? | Espaço ocupado pela matéria. | Você pode pedir ao professor para trocar uma questão por uma equivalente. |
| T104 | O que é densidade? | Relação entre massa e volume. | Você pode pedir ao professor a definição de um termo da questão. |
| T105 | O que é filtração? | Separação de sólido e líquido por filtro. | Você pode pedir ao professor para eliminar uma alternativa errada. |
| T106 | O que é solubilidade? | Capacidade de uma substância se dissolver. | Você pode pedir ao professor para reexplicar o enunciado com outras palavras. |
| T107 | O que é ponto de fusão? | Temperatura em que sólido vira líquido. | Você pode pedir ao professor para informar a qual categoria o conteúdo pertence. |
| T108 | O que é uma mistura? | União de duas ou mais substâncias. | Você pode pedir ao professor para verificar se houve erro de leitura na sua resposta. |
| T109 | O que é substância pura? | Material formado por um único tipo de componente. | Você pode pedir ao professor uma palavra-chave do conteúdo cobrado. |

### Incomuns (5)

| Cod | Título | Conteúdo | Poder |
|---|---|---|---|
| T110 | Lei de Lavoisier | Em sistema fechado, a massa se conserva. | Você pode pedir um dia extra de prazo para uma atividade individual. |
| T111 | O que é número atômico? | Quantidade de prótons no núcleo do átomo. | Você pode escolher seu grupo na próxima atividade em equipe. |
| T112 | O que é uma molécula? | Conjunto de dois ou mais átomos ligados. | Você pode apresentar seu raciocínio e o professor dirá se está no caminho certo ou precisa revisar. |
| T113 | O que é número de massa? | Soma de prótons e nêutrons do átomo. | Você pode pedir ao professor uma palavra-chave do conteúdo cobrado na atividade. |
| T114 | O que é um elemento químico? | Conjunto de átomos com mesmo número de prótons. | Você pode pedir ao professor para retirar uma questão da sua prova. |

### Raras (3)

| Cod | Título | Conteúdo | Contexto | Poder |
|---|---|---|---|---|
| T115 | Indústria Farmacêutica | A produção de medicamentos depende do estudo das propriedades das substâncias, como solubilidade, estabilidade e pureza. | A química permite controlar composição e eficácia dos compostos usados na prevenção e tratamento de doenças. | Você pode refazer uma atividade após receber a correção. |
| T116 | Combustíveis e Energia | Os combustíveis liberam energia por reações de combustão, nas quais novas substâncias são formadas. | Esses processos seguem a Lei da Conservação da Massa e demonstram transformações químicas em larga escala. | Você pode fazer a prova com consulta ao seu caderno. |
| T117 | Análise Laboratorial | Em laboratórios, técnicas químicas modernas analisam propriedades como densidade, solubilidade e composição. | Essas análises permitem identificar materiais, controlar qualidade e desenvolver novos produtos. | Você pode pedir ao professor para retirar uma questão da sua prova. |

### Lendárias (2)

| Cod | Título | Conteúdo | Contexto | Poder |
|---|---|---|---|---|
| T118 | Marie Curie | Pioneira da radioatividade. Suas pesquisas ampliaram o entendimento da estrutura da matéria em nível atômico. | As descobertas de Curie levaram ao desenvolvimento de radioterapias usadas no tratamento de câncer. | Você pode refazer a prova inteira após receber a correção. |
| T119 | Robert Boyle | Rompeu com a alquimia ao defender a experimentação. Consolidou o conceito moderno de elemento químico. | Boyle é considerado o pai da química moderna — separou a ciência da especulação medieval. | Você pode fazer a próxima prova em dupla. |

### Secreta (1) — só por fusão, combinação oculta

| Cod | Título | Conteúdo | Contexto | Poder |
|---|---|---|---|---|
| T120 | Radioatividade | A emissão espontânea de partículas e energia por núcleos instáveis — fenômeno descoberto por Marie Curie em 1898 que redefiniu o conceito de matéria. | A radioatividade abriu caminho para a medicina nuclear, a energia atômica e a compreensão da estrutura do átomo. | Você pode fazer a prova sem nenhuma restrição de consulta. |

### Combinação secreta

```
T118 (Marie Curie) + T117 (Análise Laboratorial) + T109 (Substância Pura) → T120 (Radioatividade)
```

Lógica temática: a pessoa (Curie) + o método (laboratório) + o conceito base (substância pura) = o fenômeno que ela descobriu (radioatividade). Um aluno que domina o conteúdo consegue intuir.

---

## 8. Schema Firestore completo

```
codex/
  colecoes/{id}
    - nome: string
    - descricao: string
    - temporada: string
    - ativa: bool
    - combinacao_secreta: {
        lendaria_id: string
        rara_id: string
        comum_id: string
        resultado_id: string
      }
    - created_at: timestamp

  cartas/{id}
    - cod: string
    - titulo: string
    - conteudo: string
    - contexto: string?
    - tags: string[]
    - raridade: 'comum' | 'incomum' | 'rara' | 'lendaria' | 'secreta'
    - poder: string
    - colecao_id: string
    - imagem_url: string?
    - created_at: timestamp

temporadas/{id}
  - nome: string
  - colecao_id: string
  - turma_id: string
  - criada_por: uid_professor
  - inicio: timestamp
  - fim: timestamp?
  - status: 'ativa' | 'encerrada'

sessoes/{id}
  - criada_por: uid_professor
  - turma_id: string
  - temporada_id: string
  - aberta_em: timestamp
  - encerrada_em: timestamp?
  - status: 'aberta' | 'encerrada'

  pre_ativacoes/{uid_aluno}
    - cartas: [{ carta_id, poder, validada: bool }]

users/{uid}/codex/
  pacotes/{id}
    - tipo: 'padrao' | 'premium'
    - emitido_por: uid_professor
    - emitido_em: timestamp
    - temporada_id: string
    - aberto: bool
    - cartas_ids: string[]

  cartas/{carta_id}
    - carta_id: string
    - colecao_id: string
    - obtida_em: timestamp
    - quantidade: int
    - origem: 'pacote' | 'fusao' | 'loja' | 'brinde'

  usos/{uso_id}
    - carta_id: string
    - poder: string
    - temporada_id: string
    - ativada_em: timestamp
    - contexto: 'sessao' | 'livre'
    - sessao_id: string?
    - validada_em: timestamp?
    - validada_por: uid_professor?
```

---

## 9. Posicionamento no ecossistema

```
quasar_v2/
└── quasar-ferramentas/
      └── codex-arcano/
            ├── index.html       ← aluno: coleção, pacotes, álbum, fusão
            ├── professor.html   ← professor: emissão, sessão, temporada, painel
            └── admin.html       ← admin: CRUD de cartas, coleções, combinações secretas
```

**Stack:** Vanilla JS + ES Modules + Firebase Firestore
**Auth:** herdada do `_shared/gatekeeper.js`
**Integração MOVA:** via `postMessage` contract (`__MOVA_CONTEXT__`)

---

## 10. Sprints de desenvolvimento

### Pré-requisito absoluto
Sprint 0 do Quasar (sanitização Firebase) deve estar concluído antes do C-0.

| Sprint | Entrega |
|---|---|
| C-0 | Schema Firestore + regras de segurança + seed de dados de teste |
| C-1 | `admin.html` — CRUD completo + import XLSX (SheetJS) |
| C-2 | Cloud Function `emitirPacote` (padrão + premium) + seção de emissão em `professor.html` |
| C-3 | `index.html` — Aba Coleção: grid + silhueta + modal de detalhe |
| C-4 | `index.html` — Aba Pacotes + animação de abertura |
| C-5 | Mecânica de fusão + detecção de combinação secreta |
| C-6 | `professor.html` — gestão de temporada |
| C-7 | Sessão: painel professor + pré-ativação + uso livre + validação |
| C-8 | `index.html` — Aba Álbum + polimento visual + responsividade |
| C-9 | Integração no hub Quasar |
| C-10 | Integração MOVA via `postMessage` (sem data prevista) |

---

## 11. Estados de teste a validar

```
[ ] Aluno com 0 pacotes
[ ] Aluno com pacote não aberto
[ ] Abertura de pacote padrão
[ ] Abertura de pacote premium
[ ] Aluno com duplicatas suficientes para fusão
[ ] Fusão comum → incomum
[ ] Fusão com combinação secreta → Radioatividade
[ ] Carta com poder disponível
[ ] Carta com poder já usado (quantidade = 0)
[ ] Carta de temporada encerrada (poder bloqueado)
[ ] Sessão aberta → pré-ativação → validação → carta consumida
[ ] Sessão aberta → pré-ativação → sem validação → carta preservada
[ ] Uso livre fora de sessão
[ ] Professor emite pacote padrão
[ ] Professor emite pacote premium
[ ] Professor abre e encerra temporada
[ ] Professor abre e encerra sessão
```

---

## 12. Regras que nunca mudam

- `codex/cartas` → write somente por admin autenticado ou Cloud Function
- Sorteio de pacotes → sempre server-side, nunca client-side
- Carta secreta → nunca em pacote, nunca na loja
- Raras e Lendárias → nunca na loja
- Poderes → encerrados com a temporada, histórico preservado
- Fusão → válida apenas dentro da temporada ativa
- `firebase-config.js` → nunca duplicado, sempre importado da raiz
- Regras Firestore → sempre testar no emulador antes de deploy

---

## 13. Nota para o próximo agente

Robson é direto e autodidata — código completo e pronto para uso, sem explicações óbvias.

Começar pelo **C-0**. O seed de dados de teste é prioridade — sem ele nenhum sprint subsequente pode ser validado.

A Cloud Function do C-2 é a peça mais sensível — sorteio server-side é inegociável.

**Voz dos poderes:** a carta fala com o aluno como se fosse o professor concedendo o benefício. Padrão: "Você pode [benefício]." Nunca alterar esse padrão sem aprovação de Robson.
