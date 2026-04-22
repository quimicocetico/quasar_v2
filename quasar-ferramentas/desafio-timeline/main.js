import { requireAuth } from "../../_shared/gatekeeper.js";
import { db, auth } from "/firebase-config.js";
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ============ STATE ============
let challengeId = null;
let challengeData = null;
let gameState = {
  player1: '',
  player2: '',
  turma: '',
  score: 0,
  streak: 0,
  burst: false,
  multiplier: 1.0,
  answeredEvents: {},
  visitedEvents: {},
  totalQuestions: 0,
  answeredCount: 0
};
let currentEventId = null;
let rankingUnsub = null;

// ============ INIT ============
async function init() {
  try {
    // Check active challenge
    const metaRef = doc(db, 'config', 'activeChallenge');
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists() || !metaSnap.data().challengeId) {
      showLoginNoChallengeMode();
      return;
    }

    challengeId = metaSnap.data().challengeId;
    const localPath = metaSnap.data().localPath;

    if (localPath) {
      // Load from local file
      const response = await fetch(`./conteudos/${localPath}`);
      challengeData = await response.json();
    } else {
      // Fallback to Firestore (legacy mode)
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeSnap = await getDoc(challengeRef);
      if (!challengeSnap.exists()) {
        showLoginNoChallengeMode();
        return;
      }
      challengeData = challengeSnap.data();
    }

    gameState.totalQuestions = challengeData.events.filter(e => e.tipo === 'detalhe' && e.questao).length;

    document.getElementById('challengeTitle').textContent = challengeData.titulo || 'Desafio Histórico';
    
    // Preenche automaticamente a turma se estiver no JSON
    if (challengeData.turma) {
      const tInput = document.getElementById('turmaInput');
      if (tInput) {
        tInput.value = challengeData.turma;
        tInput.readOnly = true;
        tInput.style.opacity = '0.7';
      }
    }

    showScreen('loginScreen');
  } catch (err) {
    console.error(err);
    showLoginNoChallengeMode();
  }
}

function showLoginNoChallengeMode() {
  document.getElementById('challengeTitle').textContent = 'Nenhum desafio ativo';
  document.getElementById('noChallengeMsg').style.display = 'block';
  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').style.opacity = '0.4';
  showScreen('loginScreen');
}

// ============ SCREENS ============
window.showScreen = function(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
}

// ============ START GAME ============
window.startGame = async function() {
  const p1 = document.getElementById('player1Input').value.trim();
  const p2 = document.getElementById('player2Input').value.trim();
  const t = document.getElementById('turmaInput').value.trim();
  
  if (!p1 || !p2 || !t) { 
    alert('Insira os nomes dos guerreiros e a turma!'); 
    return; 
  }

  console.log('Iniciando missão para:', p1, p2);
  gameState.player1 = p1;
  gameState.player2 = p2;
  gameState.turma = t;

  // Lógica de Recuperação de Progresso (Checkpoint)
  try {
    const safeP1 = gameState.player1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeP2 = gameState.player2.toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeTurma = gameState.turma.toLowerCase().replace(/[^a-z0-9]/g, '');
    const duplaId = `${safeP1}_${safeP2}_${safeTurma}`;

    const snap = await getDoc(doc(db, 'sessoes_timeline', challengeId, 'jogadores', duplaId));
    if (snap.exists()) {
      const data = snap.data();
      if (confirm(`⚔️ Olá Guerreiros! Encontramos um progresso salvo (${data.score} pts). Desejam continuar?`)) {
        gameState.score = data.score || 0;
        gameState.streak = data.streak || 0;
        gameState.answeredEvents = data.respostas || {};
        gameState.answeredCount = data.answeredCount || 0;
        gameState.multiplier = data.burst ? 1.5 : 1.0;
        updateHUD();
        updateStreakDots(gameState.streak);
        console.log('Progresso recuperado do Firebase');
      }
    }
  } catch (err) {
    console.warn('Erro ao tentar recuperar progresso:', err);
  }

  hideAllScreens();
  document.getElementById('timelineContainer').style.display = 'block';
  document.getElementById('header').classList.add('visible');
  document.getElementById('rankingBtn').style.display = 'flex';

  document.getElementById('headerTitle').textContent = challengeData.titulo;
  document.getElementById('duoNames').textContent = `${p1} & ${p2}`;

  buildTimeline();
  subscribeRanking();
  
  // Força o primeiro salvamento para aparecer no ranking
  await saveProgress();
  console.log('Progresso inicial salvo no Firebase');
}

// ============ TIMELINE ============
function buildTimeline() {
  const container = document.getElementById('timelineContent');
  container.innerHTML = '';
  const events = challengeData.events;
  let sideToggle = false;
  let lastEra = null;

  events.forEach((ev, idx) => {
    // Era divider
    if (ev.era && ev.era !== lastEra) {
      lastEra = ev.era;
      const era = document.createElement('div');
      era.className = 'tl-era';
      era.innerHTML = `<span class="tl-era-label">— ${ev.era} —</span>`;
      container.appendChild(era);
    }

    const wrap = document.createElement('div');

    if (ev.tipo === 'contexto') {
      wrap.className = 'tl-node-wrap ' + (sideToggle ? 'right' : 'left');
      const side = document.createElement('div');
      side.className = 'tl-card-side';
      const label = document.createElement('div');
      label.className = 'tl-context-label';
      label.innerHTML = `
        <div class="context-year">${ev.ano || ''}</div>
        <div class="context-title">${ev.titulo}</div>`;
      side.appendChild(label);

      const center = document.createElement('div');
      center.className = 'tl-node-center';
      const node = document.createElement('div');
      node.className = 'tl-node context-node';
      node.textContent = ev.icone || '◆';
      center.appendChild(node);

      const emptySide = document.createElement('div');
      emptySide.className = 'tl-card-side';

      if (sideToggle) {
        wrap.appendChild(emptySide);
        wrap.appendChild(center);
        wrap.appendChild(side);
      } else {
        wrap.appendChild(side);
        wrap.appendChild(center);
        wrap.appendChild(emptySide);
      }

    } else {
      // Detail node
      wrap.className = 'tl-node-wrap ' + (sideToggle ? 'right' : 'left');
      const cardSide = document.createElement('div');
      cardSide.className = 'tl-card-side';

      const preview = document.createElement('div');
      preview.className = 'tl-card-preview';
      preview.id = `card_${ev.id}`;
      preview.onclick = () => openDetail(ev.id);
      const hasQ = ev.questao ? true : false;
      const alreadyDone = gameState.answeredEvents[ev.id];
      preview.innerHTML = `
        <div class="card-year">${ev.ano || ''}</div>
        <div class="card-title">${ev.titulo}</div>
        <div class="card-hint">${hasQ ? (alreadyDone ? '✅ Completada' : '📜 Contém questão') : '📖 Leitura'}</div>`;
      if (alreadyDone) preview.classList.add('complete');
      cardSide.appendChild(preview);

      const center = document.createElement('div');
      center.className = 'tl-node-center';
      const node = document.createElement('div');
      node.className = 'tl-node';
      if (gameState.answeredEvents[ev.id]) node.classList.add('complete');
      node.id = `node_${ev.id}`;
      node.textContent = ev.icone || '📌';
      node.onclick = () => openDetail(ev.id);
      center.appendChild(node);

      const emptySide = document.createElement('div');
      emptySide.className = 'tl-card-side';

      if (sideToggle) {
        wrap.appendChild(emptySide);
        wrap.appendChild(center);
        wrap.appendChild(cardSide);
      } else {
        wrap.appendChild(cardSide);
        wrap.appendChild(center);
        wrap.appendChild(emptySide);
      }

      sideToggle = !sideToggle;
    }

    container.appendChild(wrap);

    // Animate in on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animationPlayState = 'running';
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(wrap);
  });
}

// ============ OPEN DETAIL ============
window.openDetail = function(eventId) {
  const ev = challengeData.events.find(e => e.id === eventId);
  if (!ev || ev.tipo !== 'detalhe') return;

  currentEventId = eventId;

  // Mark visited
  gameState.visitedEvents[eventId] = true;
  const node = document.getElementById(`node_${eventId}`);
  if (node) node.classList.add('visited');

  document.getElementById('detailYear').textContent = ev.ano || '';
  document.getElementById('detailTitle').textContent = ev.titulo;
  document.getElementById('detailContent').textContent = ev.conteudo || '';

  const img = document.getElementById('detailImage');
  if (ev.imagem) {
    img.src = ev.imagem;
    img.alt = ev.titulo;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  const quizBtn = document.getElementById('detailQuizBtn');
  const alreadyAnswered = gameState.answeredEvents[eventId];
  quizBtn.disabled = !ev.questao; // Só desativa se não houver questão
  quizBtn.textContent = alreadyAnswered
    ? '👁️ REVISAR RESPOSTA'
    : ev.questao
    ? '📜 RESPONDER QUESTÃO   +10 pts'
    : '📖 Apenas Leitura';

  openModal('detailModal');
  saveProgress(); // Atualiza o status (lastUpdate) ao explorar um evento
}

// ============ OPEN QUIZ ============
window.openQuiz = function() {
  const ev = challengeData.events.find(e => e.id === currentEventId);
  if (!ev || !ev.questao) return;

  closeModal('detailModal');

  document.getElementById('quizEventLabel').textContent = ev.titulo.toUpperCase();
  document.getElementById('quizQuestion').textContent = ev.questao.pergunta;
  document.getElementById('quizFeedback').className = 'quiz-feedback';
  document.getElementById('quizFeedback').textContent = '';

  const optsEl = document.getElementById('quizOptions');
  optsEl.innerHTML = '';
  const letters = ['A','B','C','D','E'];
  const alreadyAnswered = gameState.answeredEvents[currentEventId];

  ev.questao.opcoes.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.innerHTML = `<span class="quiz-opt-letter">${letters[i]}</span>${opt}`;
    
    if (alreadyAnswered) {
      btn.disabled = true;
      if (i === ev.questao.correta) btn.classList.add('correct');
    } else {
      btn.onclick = () => answerQuestion(i, ev);
    }
    optsEl.appendChild(btn);
  });

  openModal('quizModal');
}

// ============ ANSWER ============
function answerQuestion(selectedIdx, ev) {
  const correct = ev.questao.correta;
  const isCorrect = selectedIdx === correct;
  const opts = document.querySelectorAll('.quiz-opt');

  opts.forEach((btn, i) => {
    btn.disabled = true;
    if (isCorrect) {
      if (i === correct) btn.classList.add('correct');
    } else {
      if (i === selectedIdx) btn.classList.add('wrong');
      // Não mostra a correta se errou
    }
  });

  const feedback = document.getElementById('quizFeedback');

  if (isCorrect) {
    gameState.streak++;
    updateStreakDots(gameState.streak);

    // Check burst trigger
    if (gameState.streak >= 3 && !gameState.burst) {
      gameState.burst = true;
      gameState.multiplier = 1.5;
      triggerBurst();
    }

    const pts = Math.round(10 * gameState.multiplier);
    gameState.score += pts;

    showScorePopup(`+${pts}`, true);

    feedback.className = 'quiz-feedback correct-fb';
    const fbMsgs = [
      `⚔️ ${ev.questao.feedback_correto || 'Excelente! Seu conhecimento histórico é admirável!'}`,
      `🏆 Resposta correta! +${pts} pontos${gameState.burst ? ' (×1.5 BURST!)' : ''}`,
    ];
    feedback.textContent = fbMsgs[0];

    if (gameState.streak === 3) confetti();

    // Mark node complete
    gameState.answeredEvents[currentEventId] = true;
    gameState.answeredCount++;
    const node = document.getElementById(`node_${currentEventId}`);
    if (node) { node.classList.remove('visited'); node.classList.add('complete'); }
    const card = document.getElementById(`card_${currentEventId}`);
    if (card) card.classList.add('complete');

  } else {
    gameState.streak = 0;
    gameState.burst = false;
    gameState.multiplier = 1.0;
    gameState.score = Math.max(0, gameState.score - 5);
    updateStreakDots(0);
    updateMultiplierDisplay();

    showScorePopup('-5', false);
    feedback.className = 'quiz-feedback wrong-fb';
    feedback.textContent = `🗡️ ${ev.questao.feedback_errado || 'Incorreto. Revise este período histórico e tente novamente!'}`;
  }

  updateHUD();
  saveProgress();

  setTimeout(() => {
    closeModal('quizModal');
  }, 2800);
}

// ============ HUD ============
function updateHUD() {
  const score = document.getElementById('scoreDisplay');
  score.textContent = gameState.score;
  score.classList.remove('bump');
  void score.offsetWidth;
  score.classList.add('bump');

  document.getElementById('streakDisplay').textContent = gameState.streak;
  updateMultiplierDisplay();
  updateProgress();
}

function updateMultiplierDisplay() {
  const chip = document.getElementById('multiplierChip');
  document.getElementById('multDisplay').textContent = `×${gameState.multiplier.toFixed(1)}`;
  if (gameState.burst) {
    chip.classList.add('burst');
  } else {
    chip.classList.remove('burst');
  }
}

function updateStreakDots(streak) {
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (dot) dot.classList.toggle('filled', i < streak);
  }
}

function updateProgress() {
  const total = gameState.totalQuestions;
  const done = gameState.answeredCount;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circ = 113.1;
  const offset = circ - (circ * pct / 100);
  document.getElementById('progressRing').style.strokeDashoffset = offset;
  document.getElementById('progressText').textContent = pct + '%';
}

// ============ BURST ============
function triggerBurst() {
  const overlay = document.getElementById('burstOverlay');
  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 1400);
  updateMultiplierDisplay();
}

// ============ SCORE POPUP ============
function showScorePopup(text, positive) {
  const popup = document.createElement('div');
  popup.className = 'score-popup ' + (positive ? 'positive' : 'negative');
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2100);
}

// ============ CONFETTI ============
function confetti() {
  const colors = ['#8b7355','#d4a574','#6ee7b7','#fca5a5','#f5f5f7','#2d5a3d'];
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      --duration: ${1.5 + Math.random()}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2500);
  }
}

// ============ MODALS ============
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Click outside to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ============ RANKING ============
window.showRanking = function() {
  document.getElementById('rankingSubtitle').textContent = `Turma: ${gameState.turma}`;
  document.getElementById('rankingPage').classList.add('visible');
}
window.hideRanking = function() {
  document.getElementById('rankingPage').classList.remove('visible');
}

function subscribeRanking() {
  if (!challengeId) return;
  if (rankingUnsub) rankingUnsub();

  // Escuta todos os jogadores da sessão
  const q = query(
    collection(db, 'sessoes_timeline', challengeId, 'jogadores'),
    orderBy('score', 'desc')
  );

  rankingUnsub = onSnapshot(q, (snap) => {
    const list = document.getElementById('rankingList');
    list.innerHTML = '';
    const medals = ['🥇','🥈','🥉'];
    const posClasses = ['gold','silver','bronze'];

    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;color:rgba(245,245,247,0.3);font-style:italic;padding:40px">Nenhuma dupla iniciou ainda...</div>';
      return;
    }

    snap.docs.forEach((doc, i) => {
      const aluno = doc.data();
      const p1 = aluno.player1 || (aluno.nome ? aluno.nome.split('&')[0].trim() : 'Jogador');
      const p2 = aluno.player2 || (aluno.nome ? aluno.nome.split('&')[1]?.trim() : '');
      
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.style.animationDelay = `${i * 0.08}s`;
      item.innerHTML = `
        <div class="rank-pos ${posClasses[i] || ''}">${i < 3 ? medals[i] : (i+1)+'º'}</div>
        <div class="rank-names">
          <div class="rank-duo">${p1} ${p2 ? '& ' + p2 : ''}</div>
          <div class="rank-duo-sub">${aluno.answeredCount || 0} questões respondidas</div>
        </div>
        <div class="rank-score">${aluno.score} pts</div>
        <div class="rank-badge"></div>
      `;
      list.appendChild(item);
    });
  }, (err) => console.warn('Erro ao carregar ranking:', err));
}

// ============ SAVE TO FIREBASE ============
async function saveProgress() {
  if (!challengeId || !gameState.player1) return;
  
  const safeP1 = gameState.player1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeP2 = gameState.player2.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeTurma = gameState.turma.toLowerCase().replace(/[^a-z0-9]/g, '');
  const duplaId = `${safeP1}_${safeP2}_${safeTurma}`;

  try {
    // Salva no documento individual da dupla
    const payload = {
      nome: `${gameState.player1} & ${gameState.player2}`,
      player1: gameState.player1,
      player2: gameState.player2,
      turma: gameState.turma,
      score: gameState.score || 0,
      streak: gameState.streak || 0,
      burst: gameState.burst || false,
      answeredCount: gameState.answeredCount || 0,
      respostas: gameState.answeredEvents || {},
      lastUpdate: Date.now()
    };

    await setDoc(doc(db, 'sessoes_timeline', challengeId, 'jogadores', duplaId), payload, { merge: true });
    console.log('SaveProgress sucesso:', duplaId);

    // Atualiza metadados da sessão (opcional)
    await setDoc(doc(db, 'sessoes_timeline', challengeId), {
      lastActivity: Date.now(),
      status: 'active'
    }, { merge: true });

  } catch (err) {
    console.warn('Erro ao salvar progresso:', err);
  }
}

// Gatekeeper integration
requireAuth((user) => {
  // Preenche automaticamente o nome do primeiro aluno (Guerreiro 1)
  if (user.displayName) {
    const firstName = user.displayName.split(' ')[0];
    const p1Input = document.getElementById('player1Input');
    if (p1Input) {
      p1Input.value = firstName;
      p1Input.readOnly = true;
      p1Input.style.opacity = '0.7';
      p1Input.title = "Nome identificado pelo login institucional";
    }
  }

  init().then(() => {
    const loading = document.getElementById('loadingScreen');
    if (loading) loading.classList.add('hidden');
  });
});
