/**
 * LOUSA INTERATIVA — App Principal
 * Controle de UI, upload de JSON, integração Firebase
 */

// ── Firebase Import ────────────────────────────────────────
import { db } from '../firebase-config.js';

// ── Estado da aplicação ────────────────────────────────────
let currentLesson = null;
let currentPanelIndex = 0;
let firestoreDb = db;

// ── Inicialização ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  hideBanner();
  bindUI();
  await loadDefaultLesson();
});

// ── Banner Firebase ────────────────────────────────────────
function showBanner() {
  const banner = document.getElementById('firebase-banner');
  if (banner) banner.style.display = 'flex';
}

function hideBanner() {
  const banner = document.getElementById('firebase-banner');
  if (banner) banner.style.display = 'none';
}

// ── Carrega aula padrão (arquivo local) ────────────────────
async function loadDefaultLesson() {
  try {
    const res = await fetch('./data/aula-exemplo.json');
    const json = await res.json();
    loadLesson(json);
  } catch (e) {
    console.warn('[App] Não foi possível carregar aula padrão.');
    showEmptyState();
  }
}

// ── Carrega e renderiza uma aula ───────────────────────────
function loadLesson(lessonData) {
  currentLesson = lessonData;
  currentPanelIndex = 0;

  // Topbar
  document.getElementById('lesson-title-bar').textContent =
    lessonData.titulo || 'Sem título';

  // Tags
  const tagsRow = document.getElementById('tags-row');
  tagsRow.innerHTML = '';
  (lessonData.metadados?.tags || []).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag-pill';
    span.textContent = tag;
    tagsRow.appendChild(span);
  });

  // Header do quadro
  document.getElementById('board-title').textContent = lessonData.titulo || '';
  document.getElementById('board-subtitle').textContent = lessonData.subtitulo || '';

  // Abas de painel
  buildPanelTabs(lessonData.paineis || []);

  // Teleprompter
  buildTeleprompter(lessonData.notas_professor || []);

  // Renderiza primeiro painel
  renderCurrentPanel();

  showToast('Aula carregada com sucesso!');
}

// ── Abas de Painel ────────────────────────────────────────
function buildPanelTabs(paineis) {
  const container = document.getElementById('panel-tabs');
  container.innerHTML = '';

  paineis.forEach((painel, i) => {
    const btn = document.createElement('button');
    btn.className = 'panel-tab' + (i === 0 ? ' active' : '');
    btn.textContent = painel.menu || `Painel ${i + 1}`;
    btn.addEventListener('click', () => {
      currentPanelIndex = i;
      document.querySelectorAll('.panel-tab').forEach((b, j) =>
        b.classList.toggle('active', j === i)
      );
      renderCurrentPanel();
    });
    container.appendChild(btn);
  });
}

// ── Renderiza painel atual ─────────────────────────────────
function renderCurrentPanel() {
  if (!currentLesson) return;
  const painel = currentLesson.paineis[currentPanelIndex];
  const container = document.getElementById('board-content');
  if (painel && container) {
    window.LousaParser.renderPainel(painel, container);
  }
}

// ── Teleprompter ──────────────────────────────────────────
function buildTeleprompter(notas) {
  const body = document.getElementById('tp-body');
  body.innerHTML = '';

  document.getElementById('tp-counter').textContent = `${notas.length} notas`;

  notas.forEach((nota, idx) => {
    const { type, label, text } = parseNota(nota);

    const div = document.createElement('div');
    div.className = `tp-note ${type}`;
    div.style.animationDelay = `${idx * 0.05}s`;
    div.innerHTML = `
      <div class="tp-note-label">${label}</div>
      <div class="tp-note-text">${text}</div>
    `;
    body.appendChild(div);
  });
}

function parseNota(nota) {
  if (nota.startsWith('AÇÃO:') || nota.startsWith('ACAO:')) {
    return { type: 'acao', label: 'Ação', text: nota.replace(/^A[ÇC]ÃO:\s*/i, '') };
  }
  if (nota.startsWith('PAUSA:')) {
    return { type: 'pausa', label: 'Pausa', text: nota.replace(/^PAUSA:\s*/i, '') };
  }
  if (nota.startsWith('GATILHO:')) {
    return { type: 'gatilho', label: 'Gatilho', text: nota.replace(/^GATILHO:\s*/i, '') };
  }
  return { type: 'acao', label: 'Nota', text: nota };
}

// ── View Toggle ────────────────────────────────────────────
function setView(view) {
  const mc = document.getElementById('main-content');
  mc.className = 'main-content';

  const btns = document.querySelectorAll('.view-btn');
  btns.forEach(b => b.classList.toggle('active', b.dataset.view === view));

  if (view === 'board') {
    mc.classList.add('view-board');
  } else if (view === 'teleprompter') {
    mc.classList.add('view-teleprompter');
  }
  // 'split' → sem classe extra
}

// ── Modal de Upload ────────────────────────────────────────
function openUploadModal() {
  document.getElementById('upload-modal').classList.add('open');
  document.getElementById('json-textarea').value = '';
  document.getElementById('modal-error').style.display = 'none';
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('open');
}

function confirmUpload() {
  const raw = document.getElementById('json-textarea').value.trim();
  const errorEl = document.getElementById('modal-error');
  errorEl.style.display = 'none';

  if (!raw) {
    errorEl.textContent = 'Cole o JSON da aula antes de confirmar.';
    errorEl.style.display = 'block';
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    errorEl.textContent = `JSON inválido: ${e.message}`;
    errorEl.style.display = 'block';
    return;
  }

  if (!parsed.paineis || !Array.isArray(parsed.paineis)) {
    errorEl.textContent = 'Estrutura inválida: o JSON precisa ter o campo "paineis".';
    errorEl.style.display = 'block';
    return;
  }

  closeUploadModal();
  loadLesson(parsed);
  saveToFirestore(parsed);
}

// ── Drag & Drop de arquivo JSON ────────────────────────────
function initDropZone() {
  const zone = document.getElementById('drop-zone');

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      readJsonFile(file);
    } else {
      showError('Apenas arquivos .json são aceitos.');
    }
  });

  zone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
      if (e.target.files[0]) readJsonFile(e.target.files[0]);
    };
    input.click();
  });
}

function readJsonFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('json-textarea').value = e.target.result;
  };
  reader.readAsText(file);
}

function showError(msg) {
  const el = document.getElementById('modal-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Firebase: salva aula no Firestore ─────────────────────
async function saveToFirestore(lessonData) {
  if (!firestoreDb) return;

  try {
    const { disciplina = 'geral', modulo = 'geral' } = lessonData.metadados || {};

    const disciplinaId = slugify(disciplina);
    const moduloId     = slugify(modulo);

    const ref = firestoreDb
      .collection('disciplinas')
      .doc(disciplinaId)
      .collection('modulos')
      .doc(moduloId)
      .collection('aulas')
      .doc(); // ID auto-gerado

    await ref.set({
      titulo:           lessonData.titulo || '',
      subtitulo:        lessonData.subtitulo || '',
      data_criacao:     firebase.firestore.FieldValue.serverTimestamp(),
      tags:             lessonData.metadados?.tags || [],
      notas_professor:  lessonData.notas_professor || [],
      paineis:          lessonData.paineis || [],
    });

    showToast('Aula salva no Firebase!');
    console.log(`[Firebase] Aula salva: disciplinas/${disciplinaId}/modulos/${moduloId}/aulas/${ref.id}`);
  } catch (e) {
    console.error('[Firebase] Erro ao salvar:', e);
    showToast('Erro ao salvar no Firebase. Veja o console.');
  }
}

// ── Empty State ────────────────────────────────────────────
function showEmptyState() {
  const container = document.getElementById('board-content');
  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="32" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <line x1="4" y1="34" x2="36" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="12" y1="34" x2="10" y2="38" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="28" y1="34" x2="30" y2="38" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <p>Nenhuma aula carregada. Clique em "Nova Aula".</p>
    </div>
  `;
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Helpers ────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Bind de eventos da UI ─────────────────────────────────
function bindUI() {
  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // Upload modal
  document.getElementById('btn-upload').addEventListener('click', openUploadModal);
  document.getElementById('btn-new-lesson').addEventListener('click', openUploadModal);
  document.getElementById('modal-close').addEventListener('click', closeUploadModal);
  document.getElementById('btn-cancel').addEventListener('click', closeUploadModal);
  document.getElementById('btn-confirm').addEventListener('click', confirmUpload);

  // Fecha modal ao clicar fora
  document.getElementById('upload-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeUploadModal();
  });

  // Drop zone
  initDropZone();

  // Dismiss banner
  document.getElementById('dismiss-banner')?.addEventListener('click', () => {
    document.getElementById('firebase-banner').style.display = 'none';
  });
}
