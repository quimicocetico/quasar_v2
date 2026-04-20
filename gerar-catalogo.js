// gerar-catalogo.js
const fs = require('fs');
const path = require('path');

// Escolas mapeadas pelo robô
const escolas = ['eespa'];

// Estrutura base — adicione disciplinas aqui conforme expandir
let catalogo = {
    "biologia": { icone: "🧬", nome: "Biologia", turmas: {} },
    "quimica":  { icone: "🧪", nome: "Química",  turmas: {} },
    "fisica":   { icone: "⚛️", nome: "Física",   turmas: {} }
};

function processarAulas() {
    escolas.forEach(escola => {
        const escolaPath = path.join(__dirname, escola);
        if (!fs.existsSync(escolaPath)) {
            console.warn(`⚠️  Pasta não encontrada: ${escolaPath}`);
            return;
        }

        fs.readdirSync(escolaPath).forEach(ano => {
            const anoPath = path.join(escolaPath, ano);
            if (!fs.statSync(anoPath).isDirectory()) return;

            fs.readdirSync(anoPath).forEach(disciplina => {
                const disciplinaPath = path.join(anoPath, disciplina);
                if (!fs.statSync(disciplinaPath).isDirectory()) return;

                // Cria entrada da disciplina se não existir
                if (!catalogo[disciplina]) {
                    catalogo[disciplina] = { icone: "📚", nome: disciplina.toUpperCase(), turmas: {} };
                }

                // Cria entrada da turma se não existir
                if (!catalogo[disciplina].turmas[ano]) {
                    catalogo[disciplina].turmas[ano] = {
                        nome: `${ano.replace(/-/g, ' ')} (${escola.toUpperCase()})`,
                        aulas: []
                    };
                }

                fs.readdirSync(disciplinaPath).forEach(aulaDir => {
                    const aulaPath = path.join(disciplinaPath, aulaDir);
                    if (!fs.statSync(aulaPath).isDirectory()) return;

                    // NOVA LÓGICA: lê aula.json como fonte de verdade
                    const jsonPath = path.join(aulaPath, 'aula.json');
                    if (!fs.existsSync(jsonPath)) {
                        console.warn(`⚠️  Sem aula.json em: ${aulaPath} — pulando.`);
                        return;
                    }

                    let aulaData;
                    try {
                        aulaData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                    } catch (e) {
                        console.error(`❌ JSON inválido em ${jsonPath}:`, e.message);
                        return;
                    }

                    // Caminho relativo para o shell único (sem ./ para evitar ambiguidade)
                    const jsonRelativo = `${escola}/${ano}/${disciplina}/${aulaDir}/aula.json`;

                    catalogo[disciplina].turmas[ano].aulas.push({
                        id:     aulaData.id_atividade,
                        titulo: aulaData.titulo,
                        serie:  aulaData.serie  || ano.replace(/-/g, ' '),
                        escola: escola.toUpperCase(),
                        link:   `/aula.html?json=${jsonRelativo}`,
                        ativo:  true
                    });
                });
            });
        });
    });

    fs.writeFileSync(
        path.join(__dirname, 'catalogo.json'),
        JSON.stringify(catalogo, null, 2)
    );
    console.log('✅ [Quasar] catalogo.json gerado com sucesso!');
}

processarAulas();
