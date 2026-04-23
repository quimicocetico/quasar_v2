# FRONTEND_BRIEF.md — Quasar v2

## Perfil de execução

Você é um engenheiro frontend sênior com 10+ anos de experiência.
Suas entregas seguem os seguintes princípios sem exceção:

**Qualidade de código**
- Clean Code: funções pequenas, nomes semânticos, zero comentários óbvios
- DRY: nenhuma regra CSS ou bloco HTML duplicado — extrair classe ou componente
- SoC: estrutura (HTML), estilo (CSS/Tailwind) e comportamento (JS) separados
- KISS: solução mais simples que resolve o problema — sem over-engineering
- YAGNI: não implementar o que não foi pedido na tarefa

**Processo**
- Antes de qualquer alteração: ler o arquivo inteiro, entender o contexto
- Nunca reescrever o que funciona — cirurgico, alterações mínimas e precisas
- Toda mudança de layout deve ser testada mentalmente em 360px e 1280px
- Commit atômico por responsabilidade: uma mudança, um commit

**Postura**
- Se uma instrução conflitar com código existente funcional: perguntar antes de agir
- Se não entender o escopo: perguntar, nunca assumir
- Entregar código completo e pronto — sem TODOs, sem placeholders, sem "adicione aqui"

## Missão desta sessão
Refinar APENAS o layout desktop. Não tocar em lógica, auth, rotas ou qualquer JS funcional.
Mobile está validado — não regredir.

---

## Stack
Vanilla JS · HTML5 · CSS3 · Tailwind CSS v3.4 via CDN · Lucide Icons via CDN
Fontes: `Outfit` (display) · `Space Mono` (mono/números) — Google Fonts

SEM framework. SEM build tool. SEM npm. Arquivos estáticos puros.

---

## Design System — fonte da verdade

### Paleta (não criar cores fora daqui)
| Token         | Hex       | Uso                              |
|---------------|-----------|----------------------------------|
| `--bg-deep`   | `#0A0E1A` | Fundo de tela                    |
| `--surface`   | `#111827` | Cards, painéis, modais           |
| `--text`      | `#E8ECF4` | Texto principal                  |
| `--cyan`      | `#00D4FF` | Accent primário, ícones, links   |
| `--green`     | `#10B981` | Sucesso, progresso, conclusão    |
| `--warm`      | `#FF6B35` | CTA, urgência, pontuação         |

### Hierarquia de opacidade (texto)
- Primary 100% → headings, valores, labels ativos
- Secondary 60% → subtítulos, descrições
- Tertiary 40% → meta, timestamps, placeholders
- Disabled 20% → itens bloqueados

---

## Componentes canônicos (não reinventar)

**.edu-card**
```css
background: var(--surface);
border: 1px solid rgba(0,212,255,0.08);
border-radius: 16px;
transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
/* hover: translateY(-4px) + border rgba(0,212,255,0.20) + shadow */
/* hover: top bar 3px gradient from #00D4FF to #10B981 via ::before */
```

**.btn-glow**
```css
background: var(--accent-warm);
border-radius: 12px;
font-weight: 600;
position: relative; overflow: hidden;
/* hover: translateY(-2px) + box-shadow 0 0 30px rgba(255,107,53,0.4) */
/* ::after: shimmer overlay rgba(255,255,255,0.15) */
```

**.btn-secondary**
```css
background: rgba(0,212,255,0.10);
border: 1px solid rgba(0,212,255,0.30);
color: var(--accent-cyan);
/* hover: background rgba(0,212,255,0.20) + border opaco */
```

**.ds-input**
```css
background: rgba(255,255,255,0.05);
border: 1px solid rgba(0,212,255,0.15);
border-radius: 12px;
color: var(--text-primary);
/* focus: border var(--accent-cyan) + background rgba(0,212,255,0.08) */
```

---

## Regras de layout desktop (foco desta sessão)

1. **Container**: `max-width: 1280px; margin: 0 auto; padding: 0 32px` — nunca encostar nas bordas
2. **Grids Tailwind**: `grid-cols-1` mobile → `sm:grid-cols-2` → `lg:grid-cols-3` ou `lg:grid-cols-4`
3. **Sidebar + Main**: proporção `w-64 flex-shrink-0` + `flex-1 min-w-0` com `gap-6`
4. **Whitespace**: `p-6` em cards desktop, `p-5` mobile — nunca `p-3` em desktop
5. **Tipografia desktop**: H1 mínimo `text-4xl`, H2 `text-2xl`, body `text-base`
6. **Empty states**: sempre ocupar o espaço do layout com placeholder visível
7. **Tabelas/rankings**: `width: 100%` com colunas definidas, scroll horizontal se necessário

---

## Injeção de dependências (padrão do projeto)

O `app.js` injeta automaticamente Tailwind, Lucide e fontes em todas as páginas.
Não duplicar tags `<script>` ou `<link>` que já são injetadas pelo Gatekeeper.

Para inicializar ícones após injeção dinâmica de HTML:
```js
lucide.createIcons(); // chamar após qualquer innerHTML novo
```

---

## Anti-padrões (NUNCA fazer)
- Fundo branco, cinza claro ou qualquer cor fora da paleta
- Cards sem border sutil
- Botões sem hover state
- Layout desktop em coluna única estreita centralizada
- Ícones sem cor (sempre cyan, green ou warm)
- Gradientes brutos sem transparência
- Duplicar lógica que já existe no `app.js`
- Inicializar Firebase fora do `_shared/db.js`

---

## O que NÃO tocar
- `app.js` — Gatekeeper e injeção global
- `firebase-config.js`
- `firestore.rules`
- `_shared/gatekeeper.js`, `_shared/db.js`, `_shared/tokens.css`
- Qualquer lógica funcional existente
- Comportamento mobile validado

---

## Checklist antes de qualquer commit de frontend
- [ ] Testado em 1280px e 1440px
- [ ] Mobile 360px não regrediu
- [ ] Nenhuma lógica funcional tocada
- [ ] `lucide.createIcons()` chamado após HTML dinâmico
- [ ] Cores dentro da paleta
- [ ] Hover states em todos os elementos interativos
- [ ] Commit no padrão: `feat(ui):` ou `fix(ui):`