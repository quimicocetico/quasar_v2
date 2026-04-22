// app.js

// Função para validar os inputs
function validarInputs(equacao, reagente, produto) {
    // Verificar se os inputs estão vazios
    if (equacao === "" || reagente === "" || produto === "") {
        return false;
    }

    // Verificar se a equação química está no formato correto
    if (!equacao.includes("→")) {
        return false;
    }

    // Verificar se o reagente e o produto estão no formato correto
    if (!reagente.includes("(") || !reagente.includes(")")) {
        return false;
    }
    if (!produto.includes("(") || !produto.includes(")")) {
        return false;
    }

    return true;
}

// Função para balancear as equações químicas
function balancearEquacao(equacao) {
    // Splitar a equação química em reagentes e produtos
    const reagentes = equacao.split("→")[0].trim().split("+");
    const produtos = equacao.split("→")[1].trim().split("+");

    // Criar um objeto para armazenar os coeficientes dos reagentes e produtos
    const coeficientes = {};

    // Calcular os coeficientes dos reagentes
    for (let reagente of reagentes) {
        const formula = reagente.trim();
        const elementos = formula.match(/[A-Z][a-z]?/g);
        const quantidade = formula.match(/[0-9]+/g);

        for (let elemento of elementos) {
            if (!coeficientes[elemento]) {
                coeficientes[elemento] = 0;
            }
            coeficientes[elemento] += quantidade ? parseInt(quantidade[0]) : 1;
        }
    }

    // Calcular os coeficientes dos produtos
    for (let produto of produtos) {
        const formula = produto.trim();
        const elementos = formula.match(/[A-Z][a-z]?/g);
        const quantidade = formula.match(/[0-9]+/g);

        for (let elemento of elementos) {
            if (!coeficientes[elemento]) {
                coeficientes[elemento] = 0;
            }
            coeficientes[elemento] -= quantidade ? parseInt(quantidade[0]) : 1;
        }
    }

    // Balancear a equação química
    let equacaoBalanceada = "";
    for (let reagente of reagentes) {
        const formula = reagente.trim();
        const elementos = formula.match(/[A-Z][a-z]?/g);
        const quantidade = formula.match(/[0-9]+/g);

        equacaoBalanceada += quantidade ? quantidade[0] + " " + formula + " + ";
    }
    equacaoBalanceada = equacaoBalanceada.substring(0, equacaoBalanceada.length - 3) + " → ";
    for (let produto of produtos) {
        const formula = produto.trim();
        const elementos = formula.match(/[A-Z][a-z]?/g);
        const quantidade = formula.match(/[0-9]+/g);

        equacaoBalanceada += quantidade ? quantidade[0] + " " + formula + " + ";
    }
    equacaoBalanceada = equacaoBalanceada.substring(0, equacaoBalanceada.length - 3);

    return equacaoBalanceada;
}

// Ação ao clicar no botão de calcular
document.getElementById("calcular").addEventListener("click", function() {
    const equacao = document.getElementById("equacao").value;
    const reagente = document.getElementById("reagente").value;
    const produto = document.getElementById("produto").value;

    if (validarInputs(equacao, reagente, produto)) {
        const equacaoBalanceada = balancearEquacao(equacao);
        document.getElementById("resultados").innerHTML = equacaoBalanceada;
    } else {
        document.getElementById("resultados").innerHTML = "Erro: Inputs inválidos";
    }
});