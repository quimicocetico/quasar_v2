### 2. REGRAS_DO_PROJETO.md

```markdown
# Plataforma Quasar: Regras de Arquitetura e Engenharia

Este documento dita as regras de desenvolvimento para garantir que a Plataforma Quasar se mantenha escalável, segura e pronta para a integração futura com a Plataforma MOVA.

## 1. Arquitetura Multi-Repo (Micro-Frontends)
A plataforma é dividida estrategicamente para evitar falhas em cascata e facilitar contribuições:
- **`plataforma-quasar` (Privado):** Motor de autenticação, catálogo de rotas, envio de atividades ao banco de dados e controle de gamificação.
- **`quasar-ferramentas` (Público/Aberto):** Repositório separado contendo Lousa Interativa, Simuladores e Jogos Digitais.
- **Regra de Injeção:** Toda ferramenta externa deve ser incorporada às aulas da plataforma principal utilizando a tag `<iframe>`. Nunca insira lógicas pesadas de canvas ou jogos diretamente nas pastas de rotas.

## 2. Autenticação e Gatekeeper
- **Zero Lógica de Auth nas Aulas:** As aulas (arquivos em `/eespa/`, etc.) **nunca** devem lidar com autenticação. O script `app.js` importado atua como "Segurança de Porta" e lida com toda a validação de sessão em background.
- **Validação Dupla:** E-mails institucionais são validados tanto no Front-end (`firebase-config.js`) quanto no Back-end (`firestore.rules`).

## 3. Banco de Dados e Segurança (Firestore)
- Nenhuma regra de segurança deve ser alterada diretamente no painel web do Firebase.
- Todas as permissões de leitura e gravação vivem no arquivo `firestore.rules` na raiz do projeto.
- Para aplicar novas regras, utilize estritamente o comando: `firebase deploy --only firestore:rules`.
- É expressamente proibido o uso de `allow update, delete: if true` na coleção `atividades_alunos` para evitar adulteração de gabaritos.

## 4. Estrutura de Rotas e Aulas
- O catálogo de aulas não é manual. Ele é uma Aplicação de Página Única (SPA) que lê o arquivo `catalogo.json`.
- Pastas e arquivos devem seguir o padrão: **minúsculas, sem acentos e sem espaços** separados por hífen. (Ex: `/eespa/1-ano/fisica/leis-de-newton/`).

## 5. IDs de Atividade
- O `id_atividade` no Firestore deve ser exclusivo e imutável.
- Padrão obrigatório: `[escola]_[materia]_[tema]_[ano]_v[versao]`. 
- Exemplo: `eespa_quimica_modelos-atomicos_1ano_v1`.