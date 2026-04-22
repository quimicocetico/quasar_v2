# Quasar — Plataforma de Objetos Educacionais Interativos

A Plataforma Quasar é um ecossistema de ferramentas educacionais leves, modulares e gamificadas, projetado pela **MOVA Educação Criativa** para o Ensino Médio.

---

## 💎 Filosofias de Engenharia

Este projeto é regido por rigorosos padrões de qualidade de software. Cada linha de código deve respeitar os seguintes princípios:

1.  **SOLID**: Código orientado a objetos (ou funcional modular) com responsabilidades únicas e interfaces claras.
2.  **DRY (Don't Repeat Yourself)**: Lógicas compartilhadas (Auth, DB, UI Tokens) vivem exclusivamente na pasta `_shared/`.
3.  **KISS (Keep It Simple, Stupid)**: Soluções simples sobre complexidade desnecessária. O hub é intencionalmente leve.
4.  **YAGNI (You Aren't Gonna Need It)**: Implementamos apenas o que é necessário para a sprint atual. Sem "over-engineering".
5.  **Clean Code**: Nomes semânticos, funções pequenas e código autoexplicativo.
6.  **Regra do Escoteiro**: Sempre deixe o código um pouco mais limpo do que o encontrou.
7.  **SoC (Separation of Concerns)**: HTML para estrutura, CSS para estilo e JS para comportamento. Lógica de negócio isolada da UI.
8.  **Composição sobre Herança**: Plugins e componentes modulares em vez de hierarquias rígidas.
9.  **Fail Fast**: Validações rigorosas no início de cada processo (ex: Gatekeeper bloqueando acesso antes do carregamento).
10. **Lei de Deméter**: Um módulo deve falar apenas com seus amigos próximos; evitamos encadeamentos profundos de dependência.
11. **TDD (Test-Driven Development)**: Desenvolvimento orientado a testes para garantir estabilidade.
12. **Mobile First**: Interfaces pensadas para dispositivos móveis, escalando para desktop.

---

## 🏗️ Arquitetura da Solução

A Quasar utiliza uma arquitetura de **Micro-Apps Estáticos** compartilhando um Core unificado.

```
quasar_v2/
├── _shared/                  # O CORE: DRY e SoC aplicados aqui
│   ├── tokens.css            # Design System (Single Source of Truth)
│   ├── gatekeeper.js         # Segurança Centralizada (Fail Fast)
│   └── db.js                 # Abstração de Dados (Encapsulamento)
│
├── quasar-ferramentas/       # Micro-Apps Independentes (KISS)
│   ├── desafio-timeline/     # Refatorado (Clean Code)
│   ├── taca-das-casas/       # Real-time (SOLID)
│   └── ...
│
├── app.js                    # Orquestrador do Hub
├── index.html                # Entry-point (Mobile First)
└── firestore.rules           # Segurança de Nível 0
```

---

## 🚀 Como Contribuir

Ao desenvolver para a Quasar, siga o checklist:
- [ ] A nova lógica está em `_shared` se for útil para outros apps? (**DRY**)
- [ ] O app funciona em telas de 360px? (**Mobile First**)
- [ ] As funções têm mais de 20 linhas? Se sim, refatore. (**Clean Code**)
- [ ] O Firebase está sendo inicializado fora do `_shared/db.js`? (Não faça isso - **SoC**)

---

## 🛠️ Tecnologias
- **Frontend:** Vanilla JS, HTML5, CSS3 (Tailwind para prototipagem rápida).
- **Backend:** Firebase (Auth, Firestore, Hosting).
- **Icons:** Lucide Icons.
- **Fonts:** Outfit (Google Fonts).

---

Mantido com ❤️ por [MOVA Educação Criativa](https://github.com/quimicocetico).
