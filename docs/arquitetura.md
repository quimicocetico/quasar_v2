# Arquitetura da Plataforma Quasar

## 1. Visão Geral
A Plataforma Quasar foi remodelada para atuar como um **Hub Central** seguro e minimalista. Sua função primordial é centralizar o acesso a diversos **Objetos Educacionais** (ferramentas) desenvolvidos de forma isolada e modular. 

A plataforma não hospeda mais o antigo "Motor de Aulas" e "Catálogos" nativamente, passando a focar exclusivamente em fornecer as ferramentas educacionais como mini-aplicações independentes.

## 2. Tecnologias Utilizadas
* **Frontend Core:** HTML5, Vanilla JavaScript (ES Modules), CSS3.
* **Estilização Global:** TailwindCSS (via CDN) combinado com variáveis e classes personalizadas no arquivo `global.css` e escopo do `app.js`.
* **Backend & Infraestrutura (Firebase):**
  * **Firebase Authentication:** Autenticação exclusiva via Google (OAuth).
  * **Firebase Firestore:** Banco de dados NoSQL (preparado com regras de segurança).
  * **Firebase Hosting:** Para deploy e hospedagem estática rápida.

## 3. Estrutura de Diretórios e Componentes

A estrutura de arquivos foi limpa para refletir a nova arquitetura orientada a ferramentas isoladas.

```
/
├── index.html                # Hub Central (Portal de acesso)
├── login.html                # Página de Autenticação
├── app.js                    # Gatekeeper de Autenticação e Injetor de Header/UI
├── firebase-config.js        # Configuração Firebase e funções de acesso
├── global.css                # Estilos globais adicionais
├── firestore.rules           # Regras de segurança do Banco de Dados
└── quasar-ferramentas/       # Diretório contendo os Objetos Educacionais isolados
    ├── calc-estequiometria/  
    ├── desafio-timeline/
    ├── lousa-interativa/
    └── primeira-guerra/
```

### 3.1. Hub Central (`index.html`)
Página inicial após o login. Apresenta o menu visual para as ferramentas disponíveis na pasta `quasar-ferramentas/`.

### 3.2. Gatekeeper e UI Global (`app.js`)
Atua como o motor de segurança do frontend. Suas responsabilidades incluem:
1. Renderizar e injetar o cabeçalho de navegação dinamicamente nas páginas.
2. Identificar se o usuário possui sessão ativa (persistência de login).
3. Redirecionar acessos indevidos (ex: forçar usuários não logados para `login.html`).

### 3.3. Autenticação (`firebase-config.js`)
Gerencia o fluxo de login com restrição de domínio corporativo institucional. Apenas usuários com e-mails terminados em `@estudante.rn.gov.br` ou `@educar.rn.gov.br` têm permissão para autenticar.

### 3.4. Ferramentas Isoladas (`/quasar-ferramentas/`)
Cada pasta dentro deste diretório funciona como uma aplicação frontend própria e isolada. O acesso a essas aplicações é feito exclusivamente através dos links fornecidos pelo Hub Central.

## 4. Segurança (Firestore Rules)
As regras do Firestore permitem leitura pública (sem autenticação) para as coleções de `escolas`, `turmas` e `taca_casas`, visando suportar o ranking público. Operações de escrita permanecem restritas a professores autenticados. Dados sensíveis de usuários permanecem protegidos.

## 5. Como Adicionar Novas Ferramentas
1. Crie uma nova pasta dentro de `quasar-ferramentas/` com os arquivos HTML, JS e CSS da aplicação isolada.
2. No Hub Central (`index.html`), adicione um novo bloco `<a href="./quasar-ferramentas/sua-ferramenta/index.html" class="quest-card">` no grid de missões.
3. Se a ferramenta precisar de acesso ao banco ou autenticação, ela deverá importar das abstrações em `_shared/gatekeeper.js` e `_shared/db.js` para garantir consistência e segurança. O cabeçalho global é injetado automaticamente ao importar o `/app.js` no `index.html` da ferramenta.
