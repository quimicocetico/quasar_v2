# Plataforma Quasar

Hub de objetos educacionais interativos desenvolvido por [MOVA Educação Criativa](https://github.com/quimicocetico). Atualmente em fase de testes com aplicações gamificadas para o Ensino Médio.

---

## O que é

A Plataforma Quasar é um repositório único de ferramentas educacionais independentes. Cada ferramenta funciona de forma autônoma, mas todas compartilham o mesmo sistema de autenticação, banco de dados e design system.

O hub é intencionalmente leve — sua única responsabilidade é autenticar o usuário e dar acesso às ferramentas. Nenhuma lógica de conteúdo pedagógico vive aqui.

No futuro, as ferramentas serão integradas à **Plataforma MOVA** como uma biblioteca de objetos educacionais.

---

## Estrutura

```
quasar_v2/
├── app.js                    # gatekeeper: auth e redirecionamento
├── firebase-config.js        # configuração Firebase (não duplicar)
├── firestore.rules           # regras de segurança do banco
├── index.html                # hub: vitrine das ferramentas
├── login.html                # único ponto de entrada
│
├── _shared/                  # contrato compartilhado entre ferramentas
│   ├── tokens.css            # design tokens (cores, tipografia)
│   ├── gatekeeper.js         # guard de auth importável
│   └── db.js                 # helpers Firestore
│
└── quasar-ferramentas/       # ferramentas educacionais
    ├── desafio-timeline/
    ├── lousa-interativa/
    ├── calc-estequiometria/
    ├── primeira-guerra/
    ├── taca-das-casas/       # em desenvolvimento
    └── codex-arcano/         # em desenvolvimento
```

---

## Autenticação

Login restrito aos domínios institucionais:
- `@estudante.rn.gov.br` — alunos
- `@educar.rn.gov.br` — professores

Autenticação via Google OAuth centralizada no hub. Todas as ferramentas herdam a sessão automaticamente por estarem no mesmo domínio.

---

## Banco de dados

Firebase Firestore. Modelo de dados centrado no usuário:

```
users/{uid}
  profile: { nome, email, papel, escola_id }
  codex/{cartaId}             ← coleção do Codex Arcano

escolas/{escola_id}
  turmas/{turma_id}

matriculas/{matricula_id}     ← vínculo aluno ↔ turma

codex/{carta_id}              ← catálogo global de cartas (read-only)

taca_casas/temporadas/{id}
  casas/{casa_id}
    eventos/{evento_id}       ← histórico de pontuação
```

Cada ferramenta acessa apenas a própria subcoleção. As regras em `firestore.rules` garantem o isolamento.

---

## Como rodar localmente

**Pré-requisitos:** Firebase CLI instalado e autenticado.

```bash
# clonar
git clone https://github.com/quimicocetico/quasar_v2.git
cd quasar_v2

# emulador local
firebase emulators:start

# deploy de regras (após alterações em firestore.rules)
firebase deploy --only firestore:rules
```

Não há `npm install` necessário — as ferramentas são estáticas e não têm processo de build.

---

## Adicionando novas ferramentas

1. Criar pasta em `quasar-ferramentas/nome-da-ferramenta/`
2. Estrutura mínima:
   ```
   nome-da-ferramenta/
   ├── index.html
   ├── style.css      # importar _shared/tokens.css
   └── main.js        # importar _shared/gatekeeper.js na primeira linha
   ```
3. Adicionar card no `index.html` do hub apontando para a nova pasta
4. Se precisar de banco: usar `_shared/db.js`, nunca inicializar Firebase direto

---

## Ferramentas disponíveis

| Ferramenta | Descrição | Status |
|---|---|---|
| `desafio-timeline` | Ordenação cronológica de eventos históricos | Ativo |
| `lousa-interativa` | Lousa colaborativa para sala de aula | Ativo |
| `calc-estequiometria` | Calculadora de reações químicas | Em desenvolvimento |
| `primeira-guerra` | Quiz e timeline sobre a Primeira Guerra Mundial | Ativo |
| `taca-das-casas` | Ranking gamificado por casas/turmas | Em desenvolvimento |
| `codex-arcano` | Coleção de flashcards colecionáveis | Em desenvolvimento |

---

## Relação com a Plataforma MOVA

A criação e gestão de aulas, turmas e conteúdo pedagógico estruturado vive na **Plataforma MOVA**. O Quasar é complementar — um laboratório de ferramentas interativas que podem ou não ser integradas à MOVA no futuro.

O QuasarLab (iniciação científica via metodologia MCAT) roda em repositório separado com Supabase e é igualmente independente.

---

Mantido por [MOVA Educação Criativa](https://github.com/quimicocetico).
