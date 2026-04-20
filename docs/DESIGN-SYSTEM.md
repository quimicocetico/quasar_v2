🎨 DESIGN SYSTEM QUASAR v1.0
PALETA DE CORES
🌊 BG-DEEP (Fundo Principal)
   Cor: #0A0E1A
   Uso: Body, viewport principal
   Efeito: Azul profundo quase preto, cria imersão

🏢 SURFACE (Painéis & Cards)
   Cor: #111827
   Uso: Cards, painéis, containers
   Efeito: Contraste sutil com fundo, mantém hierarquia

📝 TEXT-PRIMARY (Texto Principal)
   Cor: #E8ECF4
   Uso: Headings, body text, labels
   Efeito: Branco suave, conforto visual em fundo escuro

🔵 ACCENT-CYAN (Ações Primárias)
   Cor: #00D4FF
   Uso: Links, icons, UI primária, destaque
   Efeito: Ciano tecnológico, sensação futurista

🟢 ACCENT-GREEN (Sucesso & Progressos)
   Cor: #10B981
   Uso: Completado, sucesso, positivo
   Efeito: Verde natural, transmite segurança

🔴 ACCENT-WARM (Destaque Quente)
   Cor: #FF6B35
   Uso: Botões CTA, urgência, fogo/energia
   Efeito: Laranja energético, call-to-action

TIPOGRAFIA
📊 DISPLAY (Títulos, Headings)
   Font: Outfit (weights 300-800)
   Características: Geométrica, moderna, legível em telas
   Tamanhos:
     • H1: 64px (desktop), 48px (mobile)
     • H2: 32px (desktop), 24px (mobile)
     • H3: 24px
     • Body: 16px (base)

💻 MONO (Código, Números, Detalhe)
   Font: Space Mono (400, 700)
   Características: Monospace clean, sensação tech
   Uso: XP valores, estatísticas, labels técnicos

COMPONENTES
🔘 Botões

Primary (btn-glow)

Background: var(--accent-warm) (#FF6B35)
Hover: scale(1.05) + shadow(0 0 30px rgba(255,107,53,0.4))
Radius: 12-24px
Padding: 12-16px verticalmente, 24-32px horizontalmente
Secondary (btn-secondary)

Background: rgba(0,212,255,0.1)
Border: 1px solid rgba(0,212,255,0.3)
Hover: Background opaco aumenta para rgba(0,212,255,0.2)
Radius: 12px
🎴 Cards (edu-card)

Background: var(--surface)
Border: 1px solid rgba(0,212,255,0.08)
Border-radius: 16px
Box-shadow: 0 12px 40px rgba(0,0,0,0.4) on hover
Hover Effect: translateY(-4px)

/* Top border gradient appears on hover */
Top Bar: linear-gradient(90deg, #00D4FF, #10B981)
Top Bar Animation: opacity 0 → 1 on hover

🔷 Icon Containers

Size: 56px × 56px
Border-radius: 14px
Background: Transparent (usa bgColor do contexto)

Glow Effect:
  position: absolute
  inset: 0
  filter: blur(12px)
  opacity: 0.3
  z-index: -1

📥 Inputs & Formulários

Border-radius: 12px
Background: rgba(232,236,244,0.05)
Border: 1px solid rgba(0,212,255,0.15)
Color: var(--text-primary)

Focus:
  Border-color: var(--accent-cyan)
  Background: rgba(0,212,255,0.08)

ANIMAÇÕES & EFEITOS
🌊 orbPulse
   Duration: 8s
   Timing: ease-in-out
   Loop: infinite alternate
   Effect: scale(1) → scale(1.3), opacity shift

🎨 meshFloat
   Duration: 12s
   Effect: Gradient background flutuante
   Animation: scale(1) → scale(1.05) translate(-10px, -5px)

⚡ xpPulse
   Duration: 0.6s
   Effect: scale(0) → scale(1.2) → scale(1)
   Use: XP badges ganhos

🏆 achievementSlide
   Duration: 0.8s
   Timing: cubic-bezier(0.34, 1.56, 0.64, 1)
   Effect: Bounce in, translateY(100px) → translateY(0)

✨ confettiFall
   Duration: 2-3s
   Effect: confettiFall animation
   Path: Queda com rotação 720deg + fade out

🎯 staggerReveal
   Duration: 0.6s
   Effect: opacity 0 → 1, translateY(20px) → 0
   Use: Entrada escalonada de elementos

ESPAÇAMENTO (Spacing Scale)
xs: 4px       (gaps mínimos)
sm: 8px       (small gaps)
md: 12px      (padrão)
lg: 16px      (content padding)
xl: 24px      (section gaps)
2xl: 32px     (major sections)

SOMBRAS & DEPTH
sm: 0 2px 4px rgba(0,0,0,0.1)
md: 0 8px 16px rgba(0,0,0,0.2)
lg: 0 12px 40px rgba(0,0,0,0.4)

glow_cyan: 0 0 20px rgba(0,212,255,0.3)
glow_warm: 0 0 30px rgba(255,107,53,0.4)

PADRÕES DE DESIGN
🎮 Gamification Elements

XP Toast: Top-right fixed, slide-in animation, auto-dismiss 3s
Achievement Modal: Backdrop blur, centered, achievement-slide animation
Confetti: 30 partículas aleatórias, fall animation 2-3s
Progress Rings: SVG circles com stroke-dasharray animation
📱 Responsividade

Mobile: Stack vertical, nav mobile menu toggle
Tablet: 2 colunas em grids, nav normal
Desktop: Full layout, 4 colunas em grids, sticky nav
🌙 Dark Mode (Sistema Base)

Todo o sistema é dark-first. Cores são calculadas com opacidades para criar hierarquia:

Primary text: 100% opacity
Secondary text: 60% opacity
Tertiary: 40% opacity
Disabled: 20% opacity
COMPONENTES GAMIFICADOS
🎯 Quiz System

Timer: rgba(0,212,255,0.1) background, Space Mono font
Options: game-card class, hover effects
Correct: border #10B981, background rgba(16,185,129,0.2)
Incorrect: border #FF6B35, background rgba(255,107,53,0.1)
Progress Bar: linear-gradient(90deg, #00D4FF, #10B981)

🧠 Memory Game

Cards: game-card, 56px square, ?
Flipped: background rgba(0,212,255,0.15)
Matched: border #10B981, background rgba(16,185,129,0.15)

🧪 Drag & Drop

Drop Zone: border-dashed 2px rgba(0,212,255,0.3)
Drag Over: border-color #00D4FF, background rgba(0,212,255,0.08)
Atoms: H (ciano), O (verde), draggable

TOKENS CSS CUSTOMIZÁVEIS (Edit Panel)
--bg-deep: Background principal
--surface: Painéis & cards
--text-primary: Texto principal
--accent-cyan: Accent primário (links, icons)
--accent-warm: CTA e destaques

GUIA DE USO RÁPIDO
Para botões primários: Use .btn-glow com warm accent
Para cards: Use .edu-card com hover effects
Para animações: Use as classes stagger-in, xp-badge, achievement-unlock
Para gamificação: Toast + Confetti + Achievement Modal
Para responsividade: Grid cols 1 (mobile) → 2 (tablet) → 4 (desktop)