# ESTADO DO PROJETO — Plataforma Quasar
> Última atualização: 2026-04-20 · Responsável: dev sênior MOVA

---

## ⚠️ Mapa do Ecossistema — Leia Antes de Tudo

Existem três projetos distintos. Confundi-los é o erro mais comum:

| Projeto | Repo | Stack | Função |
|---|---|---|---|
| **Plataforma Quasar** | `quimicocetico/quasar_v2` | HTML/CSS/JS Vanilla + Firebase | Motor de aulas. **Você está aqui.** |
| **Quasar Lab** | `quimicocetico/quasarlab` | React + Vite + Supabase | Módulo de Iniciação Científica (IC) — projeto separado, banco separado |
| **Plataforma MOVA** | privado | — | Plataforma mãe futura. Quasar e QuasarLab serão módulos dela |

**Regra de ouro:** Nenhum código deste repositório vai para o QuasarLab ou MOVA diretamente. A integração futura será via `<iframe>` ou contrato de API.

**Robson Dev ≠ Robson Professor.** O desenvolvedor usa o mesmo fluxo de qualquer professor — JSON gerado localmente é subido pela interface `/criar-aula.html`, não por deploy de pasta.

---

## Visão Geral

A Plataforma Quasar é o **motor de aulas** do ecossistema MOVA. Renderiza aulas a partir de arquivos JSON estruturados, gerencia quiz, coleta atividades dos alunos e oferece interface de criação/edição para professores. Atualmente em fase de testes com a **EESPA** (escola piloto). Público-alvo: alunos do Ensino Médio da rede pública do RN.

No futuro, a Quasar será incorporada à MOVA como ferramenta de criação e visualização de aulas dentro de trilhas de aprendizagem.

---

## Arquitetura Atual

```
/
├── app.js                  # Gatekeeper: auth + header global. PEÇA MAIS SENSÍVEL.
├── firebase-config.js      # Conexão Firebase + Google Auth
├── firestore.rules         # Regras de segurança — fonte de verdade de permissões
├── package.json
│
├── aula.html               # Shell único de aula. Carrega qualquer aula via ?id=
├── criar-aula.html         # [A CONSTRUIR] Upload de JSON + editor de mídias + publicação
├── catalogo.html           # Hub de missões do aluno — query Firestore (publicado)
├── login.html              # Único ponto de entrada para não-autenticados
├── index.html              # Portal de boas-vindas / redirecionamento
│
├── scripts/
│   ├── motor-de-aula.js    # Motor de renderização. Lê Firestore por ID.
│   └── atividades.js       # Abstração de envio ao backend (Firebase hoje, Supabase futuro)
│
├── _dev/                   # Ambiente local do Robson Dev — NÃO vai a deploy
│   ├── templates/
│   └── aulas-locais/       # JSONs em desenvolvimento, testados com ?json=caminho
│
└── docs/                   # Documentação técnica
```

**Arquivos aposentados nesta sessão:**
- `gerar-catalogo.js` — substituído por query Firestore
- `catalogo.json` — substituído por query Firestore
- `eespa/` (pastas de aula) — substituídas por Storage + Firestore

---

## Estrutura Firestore

```
aulas/
  {id_atividade}/
    titulo            string
    materia           string
    serie             string
    escola            string
    professor_email   string
    json_url          string    ← URL do arquivo no Firebase Storage
    status            string    ← "rascunho" | "publicado"
    criada_em         timestamp
    atualizada_em     timestamp

    midias/           subcoleção
      {id_midia}/
        tipo          string    ← "imagem" | "video"
        url           string
        atualizada_em timestamp
```

**Regras críticas:**
- Professor só lê/escreve documentos onde `professor_email == auth.token.email`
- Aluno só lê documentos com `status == "publicado"`
- Subcoleção `midias` segue as mesmas regras do documento pai
- IDs de atividade são imutáveis após criação

---

## Como o Motor Carrega uma Aula

```
/aula.html?id=eespa_bio_cap9_2ano_v1
      │
      ▼
motor-de-aula.js
  1. Busca doc em Firestore aulas/{id}
  2. Fetch do JSON em json_url (Firebase Storage)
  3. Busca subcoleção midias/{id}
  4. Sobrepõe URLs do Firestore nos placeholders do JSON
  5. Renderiza — modo aluno ou modo editor (se professor_email == currentUser)
```

**Compatibilidade legado (dev only):**
`/aula.html?json=_dev/aulas-locais/aula.json` — carrega direto do arquivo, sem Firestore. Apenas para desenvolvimento local.

---

## Fluxo do Professor

```
1. Acessa /criar-aula.html  (protegido: só @educar.rn.gov.br)
2. Faz upload do aula.json  (validação de campos obrigatórios)
3. Sistema salva JSON no Storage, cria doc no Firestore (status: rascunho)
4. Redireciona para /aula.html?id=xxx&modo=editor
5. Professor insere mídias nos placeholders (upload imagem / URL vídeo)
6. Clica "Publicar" → status: publicado
7. Copia link e envia para a turma
```

**Substituição de conteúdo:**
Professor acessa a aula, clica em "Substituir JSON", faz upload do arquivo novo com o mesmo `id_atividade`. O sistema detecta o ID existente e confirma a substituição. **As mídias já inseridas são preservadas** (ficam na subcoleção `midias`, não no JSON).

---

## Dois Papéis, Mesmo Domínio

| Papel | Email | Acesso |
|---|---|---|
| Aluno | `@estudante.rn.gov.br` | Aulas publicadas, entrega de atividades |
| Professor | `@educar.rn.gov.br` | Tudo acima + criar/editar/publicar aulas próprias |

Detectado via domínio do email autenticado. Sem tabela de papéis por enquanto — o domínio é suficiente para o piloto.

---

## Status dos Módulos

| Módulo | Arquivo | Status | Observações |
|---|---|---|---|
| Autenticação | `login.html` + `app.js` | ✅ Funcional | Restrição de domínio ativa |
| Header Global | `app.js` | ✅ Funcional | Injetado via JS em todas as páginas |
| Shell de Aula | `aula.html` | ✅ Pronto | Shell único, carrega por ?id= ou ?json= (dev) |
| Motor de Aula | `scripts/motor-de-aula.js` | ⚠️ Atualizar | Ainda lê JSON local — adaptar para Firestore |
| Abstração Backend | `scripts/atividades.js` | ✅ Pronto | Evento quasar:concluida + Firebase |
| Criação de Aula | `criar-aula.html` | 🔴 A construir | Upload JSON + editor mídias + publicação |
| Catálogo | `catalogo.html` | ⚠️ Atualizar | Migrar de catalogo.json para query Firestore |
| Segurança Firestore | `firestore.rules` | ⚠️ Atualizar | Adicionar regras para coleção `aulas/` |
| Firebase Storage | — | 🔴 Configurar | Habilitar + regras de acesso |

---

## Roadmap

### Imediato (próxima sessão)
- [ ] Verificar se Firebase Storage está habilitado no projeto
- [ ] Atualizar `firestore.rules` com regras para `aulas/` e `midias/`
- [ ] Criar `/criar-aula.html` — upload + validação + editor de mídias + publicação
- [ ] Adaptar `motor-de-aula.js` para buscar por ID no Firestore
- [ ] Atualizar `catalogo.html` para query Firestore

### Etapa 2
- [ ] Script de migração único: sobe aula de teste (`eespa/2-ano/biologia/...`) para Firestore/Storage
- [ ] Aposentar `gerar-catalogo.js` e pasta `eespa/`
- [ ] Testar fluxo completo professor → aluno na EESPA

### Etapa 3 (futuro)
- [ ] Migrar `_modules/` para repo `quasar-ferramentas`
- [ ] Estudo de integração com MOVA via Micro-Frontend
- [ ] Migração Firebase → Supabase (só trocar `atividades.js`)
