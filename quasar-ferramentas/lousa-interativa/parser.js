/**
 * LOUSA INTERATIVA — Parser & Renderer
 * Transforma o JSON Master em componentes do quadro negro
 * Estética: Caveat Brush + Kalam, cores de giz do quadro-simulador
 */

// Mapa de chave → classe CSS de cor
const COR_CLASS = {
  y: 'y', g: 'g', r: 'r', p: 'p', o: 'o', b: 'b', w: 'w', d: 'd', white: 'w'
};

function corClass(key) {
  return COR_CLASS[key] || 'w';
}

/** Normaliza class='ch-ul' → classe CSS real */
function safeHtml(str) {
  return (str || '')
    .replace(/class='ch-ul'/g, "class='ch-ul'")
    .replace(/class="ch-ul"/g, "class='ch-ul'");
}

/* ══════════════════════════════════════════════════════════
   RENDERERS
══════════════════════════════════════════════════════════ */

function renderTituloSecao(bloco) {
  const cor = corClass(bloco.cor);
  const div = document.createElement('div');
  div.className = `chalk-section-title ${cor}`;

  if (bloco.icone) {
    const circle = document.createElement('span');
    circle.className = `icon-circle ${cor}`;
    circle.textContent = bloco.icone;
    div.appendChild(circle);
  }

  const span = document.createElement('span');
  span.className = `section-title-text ${cor}`;
  span.textContent = bloco.texto || '';
  div.appendChild(span);

  return div;
}

function renderTexto(bloco) {
  const div = document.createElement('div');
  // Respeita classes do JSON (ch, txt-md, etc.) mas garante a fonte
  div.className = bloco.classes || 'ch txt-md';
  if (bloco.estilo) div.style.cssText = bloco.estilo;
  div.innerHTML = safeHtml(bloco.conteudo);
  return div;
}

function renderCaixaDestaque(bloco) {
  const div = document.createElement('div');
  const cor = corClass(bloco.cor);
  div.className = `chalk-box ${cor}`;

  const content = document.createElement('div');
  content.className = 'box-content';
  content.innerHTML = safeHtml(bloco.conteudo);
  div.appendChild(content);
  return div;
}

function renderCaixaFormula(bloco) {
  const div = document.createElement('div');
  const cor = corClass(bloco.cor);
  // chalk-formula sobrescreve chalk-box para borda completa + label flutuante
  div.className = `chalk-box chalk-formula ${cor}`;

  if (bloco.label) {
    const label = document.createElement('div');
    label.className = 'box-label';
    label.textContent = bloco.label;
    div.appendChild(label);
  }

  const content = document.createElement('div');
  content.className = 'box-content';
  if (bloco.tamanhoTexto) content.style.fontSize = bloco.tamanhoTexto;
  content.innerHTML = safeHtml(bloco.texto || '');
  div.appendChild(content);

  if (bloco.subtexto) {
    const sub = document.createElement('div');
    sub.className = 'txt-sm ch';
    sub.style.marginTop = '6px';
    sub.innerHTML = safeHtml(bloco.subtexto);
    div.appendChild(sub);
  }

  return div;
}

function renderLista(bloco) {
  const ul = document.createElement('ul');
  ul.className = `chalk-list ${bloco.classes || 'txt-md'}`;

  (bloco.itens || []).forEach(item => {
    const li = document.createElement('li');
    // suporta estilo de bullet do quadro-simulador
    if (bloco.estilo) li.className = bloco.estilo;
    li.innerHTML = safeHtml(item);
    ul.appendChild(li);
  });

  return ul;
}

function renderColunas(bloco) {
  const div = document.createElement('div');

  // suporta tanto "proporcao": "1-1" quanto "layout": "cols2"
  if (bloco.layout) {
    // formato quadro-simulador: cols2, cols3
    const map = { cols2: 'prop-1-1', cols3: 'prop-1-1-1' };
    div.className = `chalk-cols ${map[bloco.layout] || 'prop-1-1'}`;
  } else {
    const prop = (bloco.proporcao || '1-1').replace(':', '-');
    div.className = `chalk-cols prop-${prop}`;
  }

  if (bloco.estilo) div.style.cssText = bloco.estilo;

  // suporta col1/col2/col3 (quadro-simulador) e coluna1/coluna2 (JSON Master)
  const cols = [
    bloco.col1 || bloco.coluna1,
    bloco.col2 || bloco.coluna2,
    bloco.col3
  ].filter(Boolean);

  cols.forEach(col => {
    const wrap = document.createElement('div');
    (col || []).forEach(b => wrap.appendChild(renderBloco(b)));
    div.appendChild(wrap);
  });

  return div;
}

function renderTabela(bloco) {
  const table = document.createElement('table');
  table.className = 'chalk-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  (bloco.cabecalhos || []).forEach(h => {
    const th = document.createElement('th');
    th.innerHTML = safeHtml(h);
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  (bloco.linhas || []).forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.className = corClass(cell.cor);
      td.innerHTML = safeHtml(cell.texto);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  return table;
}

function renderExercicio(bloco) {
  const div = document.createElement('div');
  div.className = 'exercise-box';

  const q = document.createElement('div');
  q.className = 'exercise-question';
  q.textContent = bloco.pergunta || '';
  div.appendChild(q);

  const opts = document.createElement('div');
  opts.className = 'exercise-options';

  const exp = document.createElement('div');
  exp.className = 'explanation-box';
  exp.textContent = bloco.explicacao || '';

  (bloco.alternativas || []).forEach((alt, i) => {
    const btn = document.createElement('button');
    btn.className = 'exercise-opt';
    btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + i)})</span>${alt}`;
    btn.addEventListener('click', () => {
      opts.querySelectorAll('.exercise-opt').forEach(b => (b.disabled = true));
      btn.classList.add(i === bloco.correta ? 'correct' : 'wrong');
      if (i !== bloco.correta) {
        opts.querySelectorAll('.exercise-opt')[bloco.correta].classList.add('correct');
      }
      exp.style.display = 'block';
    });
    opts.appendChild(btn);
  });

  div.appendChild(opts);
  div.appendChild(exp);
  return div;
}

function renderLinha() {
  const hr = document.createElement('hr');
  hr.className = 'ch-line';
  return hr;
}

function renderCarimbo(bloco) {
  const wrap = document.createElement('div');
  wrap.style.textAlign = bloco.alinhamento || 'right';
  wrap.style.marginTop = '14px';
  const span = document.createElement('span');
  span.className = `stamp ${corClass(bloco.cor) || 'd'}`;
  span.textContent = bloco.texto || '';
  wrap.appendChild(span);
  return wrap;
}

/* ── Dispatcher principal ── */
function renderBloco(bloco) {
  switch (bloco.tipo) {
    case 'titulo-secao':   return renderTituloSecao(bloco);
    case 'texto':          return renderTexto(bloco);
    case 'caixa-destaque': return renderCaixaDestaque(bloco);
    case 'caixa-formula':  return renderCaixaFormula(bloco);
    case 'lista':          return renderLista(bloco);
    case 'colunas':        return renderColunas(bloco);
    case 'tabela':         return renderTabela(bloco);
    case 'exercicio':      return renderExercicio(bloco);
    case 'linha':          return renderLinha();
    case 'carimbo':        return renderCarimbo(bloco);
    default: {
      const d = document.createElement('div');
      d.style.cssText = 'font-family:Kalam,cursive;font-size:0.8rem;opacity:0.4;color:var(--chalk)';
      d.textContent = `[tipo: ${bloco.tipo}]`;
      return d;
    }
  }
}

/** Renderiza um painel completo no container DOM */
function renderPainel(painel, container) {
  container.innerHTML = '';
  container.classList.remove('chalk-panel-enter');
  // força reflow para re-disparar a animação
  void container.offsetWidth;
  container.classList.add('chalk-panel-enter');
  (painel.blocos || []).forEach(bloco => container.appendChild(renderBloco(bloco)));
}

window.LousaParser = { renderPainel, renderBloco };
