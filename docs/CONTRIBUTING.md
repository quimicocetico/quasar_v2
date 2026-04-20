# Criando Novas Aulas na Plataforma Quasar

Graças à automação via Node.js, criar e disponibilizar uma aula requer zero configuração manual de menus ou banco de dados.

---

## Passo a Passo

**1. Preparando a pasta**

Copie `/_dev/templates/aula-modelo` para dentro da estrutura correta:
```
/eespa/2-ano/quimica/termoquimica/
```
Renomeie para o tema da aula. Padrão: minúsculas, sem acentos, sem espaços, hífens.

**2. Head obrigatório**

Toda aula deve ter este `<head>` exato (ordem importa):

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nome da Aula — Plataforma Quasar</title>

  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
</head>
```

**⚠️ O `<title>` é lido pelo robô** para nomear a aula no catálogo. Use o nome da aula antes do hífen.  
Exemplo: `<title>Termoquímica — Plataforma Quasar</title>` → catálogo exibe "Termoquímica".

**3. Gatekeeper nas aulas**

No final do `<body>`, **último script**:
```html
<script type="module" src="/app.js"></script>
```

Nunca implemente lógica de auth dentro da aula. O `app.js` cuida disso.

**4. Configurando o envio da missão**

```javascript
const idDaMissao = "eespa_quimica_termoquimica_2ano_v1";
// enviarAtividade() está disponível via firebase-config.js importado pelo app.js
```

Padrão de ID: `escola_materia_tema_ano_v{N}` — imutável após o primeiro uso.

**5. Rodando o robô do catálogo**

Sua aula não aparece no sistema até o robô varrer as pastas:

```bash
npm run dev
```

O script `gerar-catalogo.js` roda automaticamente (via `predev`), lê a pasta nova e reescreve o `catalogo.json`. Pronto.

---

## Adicionando Ferramentas Externas (Lousa, Simuladores, Jogos)

Ferramentas pesadas **não ficam neste repositório**.

1. Suba no repositório `quasar-ferramentas`
2. Faça o deploy
3. Incorpore na aula via `<iframe src="URL_DO_DEPLOY">`
