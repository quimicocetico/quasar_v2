# 📔 Diário de Sessão — Plataforma Quasar
**Data:** 20 de Abril de 2026
**Status:** Arquitetura Firestore-first definida. Motor estabilizado. Documentação atualizada.

---

## 🔍 1. Ponto de Partida

Retomamos a partir do Diário 03, com três pendências:
- Suporte a `tipo: video` no motor
- Placeholders visuais para mídias sem URL
- Editor de mídias (Opção B — download de JSON)

Antes de implementar o editor, abrimos uma discussão de arquitetura que mudou o rumo do projeto.

---

## 🏗️ 2. Decisões de Arquitetura (a mais importante da sessão)

### 2.1 Firestore-first — aulas saem das pastas
**Problema identificado:** Com aulas em pastas (`/eespa/.../index.html`), qualquer atualização de motor ou layout exigiria tocar arquivo por arquivo. Inviável com dezenas de aulas.

**Decisão:** Aulas vivem no Firestore + Firebase Storage. Pastas locais são exclusivas do ambiente de desenvolvimento. O motor sempre carrega por ID: `/aula.html?id=eespa_bio_cap9_2ano_v1`.

### 2.2 Shell único — `aula.html`
Um único `aula.html` na raiz substitui todos os `index.html` por aula. Atualização do motor = 1 arquivo, propaga para todas as aulas instantaneamente.

### 2.3 Robson Dev = Robson Professor
O desenvolvedor usa o mesmo fluxo de qualquer professor. JSONs são subidos via `/criar-aula.html`. Nunca mais deploy de pasta de aula.

### 2.4 Dois papéis por domínio de email
- `@estudante.rn.gov.br` → aluno
- `@educar.rn.gov.br` → professor (acesso ao editor e publicação)

Sem tabela de papéis — o domínio é suficiente para o piloto.

### 2.5 Mídias separadas do JSON
O JSON é conteúdo pedagógico imutável. Mídias ficam em subcoleção `midias/` no Firestore. Professor pode substituir o JSON sem perder imagens e vídeos já inseridos.

### 2.6 Contrato com a MOVA
Quatro operações que a MOVA precisará quando integrar:
- `POST` → criar aula (upload JSON)
- `PATCH` → publicar/despublicar
- `GET` → buscar aula por ID
- Associação com trilha → dado da MOVA, não da Quasar

O evento `quasar:concluida` já é disparado via `CustomEvent` ao finalizar quiz — a MOVA ouvirá via `postMessage`.

### 2.7 Migração Firebase → Supabase
Isolada em `scripts/atividades.js`. Quando chegar a hora, troca 1 arquivo.

---

## 🛠️ 3. O Que Foi Construído

| Arquivo | O que mudou |
|---|---|
| `scripts/motor-de-aula.js` | Suporte a `tipo: video` + placeholders + quiz corrigido com gabarito inline + `window.aulaAtual` exposto + lê `?id=` ou `?json=` (dev) |
| `scripts/atividades.js` | Novo — abstração de backend + evento `quasar:concluida` |
| `aula.html` | Novo — shell único, sem `id` duplicado, sem lógica |
| `gerar-catalogo.js` | Migrado para ler `aula.json` + gerar links `/aula.html?json=` |

**Quiz — correção crítica:**
- `renderGabarito` substituída por `renderQuestoesComGabarito`
- Ao revisitar aula concluída: todas as questões aparecem com alternativas destacadas (verde = correta, laranja = resposta do aluno errada)
- Nota das objetivas exibida com aviso de dissertativas pendentes
- Seed das questões sorteadas salvo no `localStorage` — gabarito sempre consistente

---

## 📐 4. Estrutura Firestore Definida

```
aulas/{id_atividade}
  titulo, materia, serie, escola
  professor_email
  json_url          ← Firebase Storage
  status            ← "rascunho" | "publicado"
  criada_em, atualizada_em

  midias/{id_midia}
    tipo            ← "imagem" | "video"
    url
    atualizada_em
```

---

## 📝 5. Pendências para a Próxima Sessão

### Obrigatório antes de qualquer teste com professores

- [ ] **Verificar Firebase Storage** — confirmar se está habilitado no projeto Firebase
- [ ] **Atualizar `firestore.rules`** — adicionar regras para coleção `aulas/` e subcoleção `midias/`
- [ ] **Criar `/criar-aula.html`** — a interface do professor:
  - Drag-and-drop de `aula.json`
  - Validação de campos obrigatórios com feedback claro
  - Upload para Firebase Storage
  - Criação do doc no Firestore (`status: rascunho`)
  - Redirect para `/aula.html?id=xxx&modo=editor`
- [ ] **Adaptar `motor-de-aula.js`** — implementar carregamento por ID do Firestore (hoje ainda lê arquivo local)
- [ ] **Modo editor no motor** — placeholders clicáveis quando `?modo=editor` + `currentUser.email === professor_email`
- [ ] **Editor de mídias** — upload de imagem pro Storage + URL de vídeo → salva em `midias/`
- [ ] **Botão Publicar** — muda `status` para `publicado`, gera link copiável
- [ ] **Atualizar `catalogo.html`** — migrar de `catalogo.json` para query Firestore (`status == publicado`)
- [ ] **Script de migração** — rodar uma vez para subir aula de teste atual para Firestore/Storage

### Ordem sugerida de implementação
1. `firestore.rules` (sem isso nada é seguro)
2. `motor-de-aula.js` — carregamento por Firestore
3. `criar-aula.html` — fluxo completo do professor
4. `catalogo.html` — query Firestore
5. Script de migração da aula de teste
6. Teste end-to-end com conta de professor real

---

## ⚠️ Nota para o Próximo Agente

- `gerar-catalogo.js` e a pasta `eespa/` estão **aposentados** — não recriar, não referenciar
- O motor ainda lê `?json=` localmente — isso é intencional para dev, mas a prioridade é implementar `?id=` com Firestore
- `/criar-aula.html` deve ter nome amigável para professor — sugestão: título da página "Criar Nova Aula"
- O desenvolvedor (Robson) é autodidata e direto — entregar código completo e pronto para substituir, sem explicações óbvias
- Sempre confirmar colunas/campos do Firestore antes de queries novas
