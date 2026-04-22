# Whiteboard Generator — Projeto de Teste

**Status:** 🏗️ Em desenvolvimento (Sessão 003)  
**Mantenedor:** Robson Oliveira  
**Ecossistema:** 100% Open Source / Local Dev  

## 1. Descrição
Este é um Objeto Educacional (OEV) projetado para converter documentos PDF em resumos estruturados que simulam um quadro branco (whiteboard) para uso em sala de aula.

## 2. Stack Técnica
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Processamento de PDF:** `pdf.js` (via CDN)
- **Inteligência Artificial (Local):** Ollama via API (`localhost:11434`)
- **Modelo Padrão:** `llama3.1` (para resumos em PT-BR) ou `mistral`

## 3. Estrutura de Pastas
Conforme o padrão do ecossistema para projetos vanilla:
```text
whiteboard-generator/
├── index.html    # Estrutura do app (Upload + View)
├── style.css     # Estilização do quadro branco
├── app.js        # Lógica de extração PDF e chamada Ollama
├── README.md     # Esta documentação
└── .gitignore    # Exclusão de arquivos sensíveis
4. Como Executar
Certifique-se de que o Ollama está rodando (ollama serve).

Garanta que o modelo llama3.1 foi baixado (ollama pull llama3.1).

Use a extensão Live Server do VS Code para abrir o index.html.

5. Fluxo de Trabalho (Commit)
Seguir o padrão Conventional Commits.

Exemplo: feat: adiciona extração de texto com pdf.js.


### 3. O próximo passo (Commit)
Agora que a documentação está no lugar, você pode fazer o seu primeiro commit com segurança. No terminal:

```bash
git add .
git commit -m "docs: adiciona documentação técnica inicial do projeto de teste"