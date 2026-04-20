Markdown
# Criando Novas Aulas na Plataforma Quasar

Graças à automação implementada via Node.js, criar e disponibilizar uma nova aula na plataforma requer zero configuração de banco de dados ou alteração manual de menus. 

Siga este fluxo de trabalho profissional:

## Passo a Passo para Novas Aulas

**1. Preparando o Terreno:**
Copie a pasta base de templates (`/_dev/templates/aula-modelo`) e cole dentro da estrutura correta da escola. Exemplo: `/eespa/2-ano/quimica/`. Renomeie a pasta para o tema da aula (ex: `termoquimica`).

**2. Desenvolvendo o Conteúdo:**
Abra o `index.html` da sua nova aula.
- Altere a tag `<title>` (O robô lerá isso para dar nome à aula no catálogo!).
- Preencha o conteúdo, os textos e as questões.
- Se for usar ferramentas de terceiros (Lousa, Simulador PhET, Jogos), incorpore-os via `<iframe src="...">`.

**3. Configurando o Envio da Missão:**
No momento de programar o botão final de envio, certifique-se de definir um ID único para o pacote de respostas:
```javascript
const idDaMissao = "eespa_quimica_termoquimica_2ano_v1";
// A lógica de enviarAtividade() já está disponível globalmente.
O Robô do Catálogo (Obrigatório)
Sua aula não aparecerá no sistema até que o robô faça a varredura das pastas. Para atualizar a plataforma e disponibilizar sua aula:

Abra o terminal na raiz do projeto.

Execute o comando: npm run dev

O script gerar-catalogo.js será acionado automaticamente, lerá sua nova pasta e reescreverá o catalogo.json.

Pronto! A aula já está disponível para os alunos via Hub.

Adicionando Jogos e Ferramentas
Se você programou uma calculadora nova ou um jogo digital, não coloque os arquivos dentro da Plataforma Quasar.

Suba o jogo no repositório quasar-ferramentas.

Faça o deploy do jogo.

Pegue o link gerado e coloque dentro da sua aula usando um <iframe>.