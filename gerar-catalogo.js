// gerar-catalogo.js
const fs = require('fs');
const path = require('path');

// 1. Defina aqui as escolas que o robô deve mapear
const escolas = ['eespa']; 

// 2. Estrutura base do catálogo
let catalogo = {
    "biologia": { icone: "🧬", nome: "Biologia", turmas: {} },
    "quimica": { icone: "🧪", nome: "Química", turmas: {} },
    "fisica": { icone: "⚛️", nome: "Física", turmas: {} }
};

function processarAulas() {
    escolas.forEach(escola => {
        const escolaPath = path.join(__dirname, escola);
        if (!fs.existsSync(escolaPath)) return;

        const anos = fs.readdirSync(escolaPath);
        anos.forEach(ano => {
            const anoPath = path.join(escolaPath, ano);
            if (!fs.statSync(anoPath).isDirectory()) return;

            const disciplinas = fs.readdirSync(anoPath);
            disciplinas.forEach(disciplina => {
                const disciplinaPath = path.join(anoPath, disciplina);
                if (!fs.statSync(disciplinaPath).isDirectory()) return;

                // Garante que a disciplina existe no catálogo
                if (!catalogo[disciplina]) {
                    catalogo[disciplina] = { icone: "📚", nome: disciplina.toUpperCase(), turmas: {} };
                }

                const turmaKey = ano;
                if (!catalogo[disciplina].turmas[turmaKey]) {
                    // Formata "1-ano" para "1 ano (EESPA)"
                    catalogo[disciplina].turmas[turmaKey] = {
                        nome: `${ano.replace('-', ' ')} (${escola.toUpperCase()})`,
                        aulas: []
                    };
                }

                const aulas = fs.readdirSync(disciplinaPath);
                aulas.forEach(aula => {
                    const aulaPath = path.join(disciplinaPath, aula);
                    if (!fs.statSync(aulaPath).isDirectory()) return;

                    const indexPath = path.join(aulaPath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        // MÁGICA: Lê o HTML e extrai o título da aba do navegador para usar como nome da aula
                        const htmlContent = fs.readFileSync(indexPath, 'utf-8');
                        const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
                        // Pega o título antes do hífen (ex: "Bases Químicas - Quasar" vira "Bases Químicas")
                        const tituloAula = titleMatch ? titleMatch[1].split('-')[0].trim() : aula;

                        catalogo[disciplina].turmas[turmaKey].aulas.push({
                            titulo: tituloAula,
                            escola: escola.toUpperCase(),
                            link: `./${escola}/${ano}/${disciplina}/${aula}/index.html`,
                            ativo: true
                        });
                    }
                });
            });
        });
    });

    // Salva o resultado no arquivo catalogo.json
    fs.writeFileSync(path.join(__dirname, 'catalogo.json'), JSON.stringify(catalogo, null, 2));
    console.log('✅ [Quasar] catalogo.json gerado com sucesso!');
}

processarAulas();