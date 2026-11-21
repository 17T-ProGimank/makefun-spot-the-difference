// Twin Lookout game logic: rounds, timer, score, hints, input and the frame
// loop that composites the two painted panels with markers on top. The two
// pictures are painted once per round to offscreen canvases; every animation
// frame only draws those images plus rings, hint pulses and score popups.

import { SCENES, PANEL_W, PANEL_H, paintScene } from './scenes.js';
import { SoundEngine } from './audio.js';

export const DIFFICULTIES = {
  relaxed: { label: 'Relaxed', seconds: 180, points: 100 },
  classic: { label: 'Classic', seconds: 120, points: 100 },
  blitz: { label: 'Blitz', seconds: 60, points: 150 },
};

const HINT_SECONDS = 2.5;
const WRONG_PENALTY = 25;
const HINT_COST = 50;

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function el(id) {
  return document.getElementById(id);
}

export class SpotGame {
  constructor() {
    this.sound = new SoundEngine();
    this.screen = 'menu';
    this.difficulty = 'classic';
    this.sceneIndex = 0;
    this.found = new Set();
    this.foundAt = new Map();
    this.hintsLeft = 3;
    this.score = 0;
    this.streak = 0;
    this.best = Number(localStorage.getItem('twin-lookout-best') || 0);
    this.timeLeft = DIFFICULTIES.classic.seconds;
    this.timeTotal = DIFFICULTIES.classic.seconds;
    this.lastTickSecond = -1;
    this.frozen = false;
    this.hintTarget = null;
    this.hintUntil = 0;
    this.wrongFlashes = [];
    this.popups = [];
    this.crosshair = { x: PANEL_W / 2, y: PANEL_H / 2, side: 'left', visible: false };
    this.messageTimer = 0;
    this.leftBase = document.createElement('canvas');
    this.rightBase = document.createElement('canvas');
    this.leftBase.width = PANEL_W;
    this.leftBase.height = PANEL_H;
    this.rightBase.width = PANEL_W;
    this.rightBase.height = PANEL_H;
    this.leftCtx = el('panelLeft').getContext('2d');
    this.rightCtx = el('panelRight').getContext('2d');
    this.leftCanvas = el('panelLeft');
    this.rightCanvas = el('panelRight');
    this.lastFrame = performance.now();
    this.bindInput();
    this.showMenu();
    requestAnimationFrame((now) => this.frame(now));
  }

  get scene() {
    return SCENES[this.sceneIndex];
  }

  get pointsPerFind() {
    return DIFFICULTIES[this.difficulty].points;
  }

  bindInput() {
    const clickAt = (canvas, side, event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * PANEL_W;
      const y = ((event.clientY - rect.top) / rect.height) * PANEL_H;
      this.handlePick(x, y);
    };
    this.leftCanvas.addEventListener('click', (event) => clickAt(this.leftCanvas, 'left', event));
    this.rightCanvas.addEventListener('click', (event) => clickAt(this.rightCanvas, 'right', event));
    this.leftCanvas.addEventListener('mousemove', (event) => {
      const rect = this.leftCanvas.getBoundingClientRect();
      this.crosshair = {
        x: ((event.clientX - rect.left) / rect.width) * PANEL_W,
        y: ((event.clientY - rect.top) / rect.height) * PANEL_H,
        side: 'left',
        visible: false,
      };
    });
    this.rightCanvas.addEventListener('mousemove', (event) => {
      const rect = this.rightCanvas.getBoundingClientRect();
      this.crosshair = {
        x: ((event.clientX - rect.left) / rect.width) * PANEL_W,
        y: ((event.clientY - rect.top) / rect.height) * PANEL_H,
        side: 'right',
        visible: false,
      };
    });
    document.addEventListener('keydown', (event) => this.handleKey(event));
    el('btnHint').addEventListener('click', () => this.useHint());
    el('btnMute').addEventListener('click', () => this.toggleMute());
    el('btnPause').addEventListener('click', () => this.togglePause());
    el('btnPlay').addEventListener('click', () => {
      this.sound.unlock();
      this.sound.playClick();
      this.startRun();
    });
    el('btnResume').addEventListener('click', () => this.togglePause());
    el('btnQuit').addEventListener('click', () => this.showMenu());
    el('btnNext').addEventListener('click', () => this.nextScene());
    el('btnAgain').addEventListener('click', () => this.startRun());
    el('btnMenuFromOver').addEventListener('click', () => this.showMenu());
    document.querySelectorAll('.diff-btn').forEach((button) => {
      button.addEventListener('click', () => {
        this.difficulty = button.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.toggle('active', b === button));
        this.sound.unlock();
        this.sound.playClick();
      });
    });
  }

  handleKey(event) {
    if (this.screen === 'menu' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.sound.unlock();
      this.startRun();
      return;
    }
    if (this.screen !== 'playing' && this.screen !== 'paused') return;
    if (event.key === 'm' || event.key === 'M') {
      this.toggleMute();
      return;
    }
    if (event.key === 'h' || event.key === 'H') {
      this.useHint();
      return;
    }
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      this.togglePause();
      return;
    }
    if (this.screen !== 'playing') return;
    const step = event.shiftKey ? 4 : 16;
    const c = this.crosshair;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      c.visible = true;
      c.x -= step;
      if (c.x < 0 && c.side === 'right') { c.side = 'left'; c.x = PANEL_W - 1; }
      c.x = Math.max(0, c.x);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      c.visible = true;
      c.x += step;
      if (c.x >= PANEL_W && c.side === 'left') { c.side = 'right'; c.x = 0; }
      c.x = Math.min(PANEL_W - 1, c.x);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      c.visible = true;
      c.y = Math.max(0, c.y - step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      c.visible = true;
      c.y = Math.min(PANEL_H - 1, c.y + step);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      c.visible = true;
      this.handlePick(c.x, c.y);
    }
  }

  showOverlay(name) {
    for (const id of ['menuOverlay', 'pauseOverlay', 'roundOverlay', 'overOverlay']) {
      el(id).classList.toggle('hidden', id !== name);
    }
  }

  showMenu() {
    this.screen = 'menu';
    this.sceneIndex = 0;
    this.score = 0;
    el('bestScore').textContent = this.best > 0 ? `Best score: ${this.best}` : 'No best score yet — be the first!';
    this.paintRound();
    this.updateHud();
    this.showOverlay('menuOverlay');
  }

  startRun() {
    this.sceneIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.startRound();
  }

  startRound() {
    const scene = this.scene;
    this.found = new Set();
    this.foundAt = new Map();
    this.hintsLeft = 3;
    this.hintTarget = null;
    this.wrongFlashes = [];
    this.popups = [];
    this.timeTotal = DIFFICULTIES[this.difficulty].seconds;
    this.timeLeft = this.timeTotal;
    this.lastTickSecond = -1;
    this.screen = 'playing';
    this.paintRound();
    this.updateHud();
    this.setMessage(`Round ${this.sceneIndex + 1}: ${scene.name} — find all 7 differences!`);
    this.showOverlay(null);
  }

  paintRound() {
    const scene = this.scene;
    const allIds = new Set(scene.diffs.map((d) => d.id));
    paintScene(this.leftBase.getContext('2d'), scene, new Set());
    paintScene(this.rightBase.getContext('2d'), scene, allIds);
    el('sceneName').textContent = `${scene.name} · Round ${this.sceneIndex + 1} of ${SCENES.length}`;
    el('sceneTag').textContent = scene.tagline;
    el('roundDots').innerHTML = SCENES.map((_, i) => (
      `<span class="dot${i === this.sceneIndex ? ' current' : ''}${i < this.sceneIndex ? ' done' : ''}"></span>`
    )).join('');
  }

  handlePick(x, y) {
    if (this.screen !== 'playing') return;
    this.sound.unlock();
    let best = null;
    let bestDist = Infinity;
    for (const diff of this.scene.diffs) {
      if (this.found.has(diff.id)) continue;
      const dist = Math.hypot(diff.x - x, diff.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = diff;
      }
    }
    if (best && bestDist <= Math.max(best.r, 26)) {
      this.found.add(best.id);
      this.foundAt.set(best.id, performance.now());
      this.streak += 1;
      const gained = this.pointsPerFind + (this.streak - 1) * 10;
      this.score += gained;
      this.popups.push({ x: best.x, y: best.y, text: `+${gained}`, born: performance.now() });
      this.sound.playFind();
      this.setMessage(`Found: ${best.label} — +${gained} points${this.streak > 1 ? ` (streak ×${this.streak})` : ''}`);
      this.updateHud();
      if (this.found.size === this.scene.diffs.length) this.completeRound();
    } else {
      this.streak = 0;
      this.score = Math.max(0, this.score - WRONG_PENALTY);
      this.wrongFlashes.push({ x, y, born: performance.now() });
      this.sound.playWrong();
      this.setMessage(`Not a difference — −${WRONG_PENALTY} points. Look closer!`);
      document.querySelector('.board').classList.add('shake');
      setTimeout(() => document.querySelector('.board').classList.remove('shake'), 300);
      this.updateHud();
    }
  }

  useHint() {
    if (this.screen !== 'playing') return;
    if (this.hintsLeft <= 0) {
      this.setMessage('No hints left this round.');
      return;
    }
    const remaining = this.scene.diffs.filter((d) => !this.found.has(d.id));
    if (remaining.length === 0) return;
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - HINT_COST);
    this.hintTarget = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintUntil = performance.now() + HINT_SECONDS * 1000;
    this.sound.playHint();
    this.setMessage(`Hint: something changed near the ${this.hintTarget.label.toLowerCase()}… (−${HINT_COST} points)`);
    this.updateHud();
  }

  toggleMute() {
    this.sound.unlock();
    this.sound.setMuted(!this.sound.muted);
    el('btnMute').textContent = this.sound.muted ? '🔇 Muted' : '🔊 Sound';
    el('btnMute').classList.toggle('muted', this.sound.muted);
  }

  togglePause() {
    if (this.screen === 'playing') {
      this.screen = 'paused';
      this.showOverlay('pauseOverlay');
    } else if (this.screen === 'paused') {
      this.screen = 'playing';
      this.showOverlay(null);
    }
  }

  completeRound() {
    this.screen = 'roundDone';
    const timeBonus = Math.round(this.timeLeft) * 5;
    this.score += timeBonus;
    this.sound.playRoundWin();
    const isLast = this.sceneIndex === SCENES.length - 1;
    el('roundTitle').textContent = isLast ? 'All scenes cleared!' : `${this.scene.name} cleared!`;
    el('roundStats').innerHTML = [
      `<div><span>Found</span><b>${this.scene.diffs.length} / ${this.scene.diffs.length}</b></div>`,
      `<div><span>Time left</span><b>${formatTime(this.timeLeft)}</b></div>`,
      `<div><span>Time bonus</span><b>+${timeBonus}</b></div>`,
      `<div><span>Total score</span><b>${this.score}</b></div>`,
    ].join('');
    el('btnNext').textContent = isLast ? 'See final score' : 'Next scene →';
    this.updateHud();
    this.showOverlay('roundOverlay');
  }

  nextScene() {
    if (this.sceneIndex === SCENES.length - 1) {
      this.endRun(false);
    } else {
      this.sceneIndex += 1;
      this.startRound();
    }
  }

  endRun(outOfTime) {
    this.screen = 'over';
    this.sound.playGameOver();
    const isBest = this.score > this.best;
    if (isBest) {
      this.best = this.score;
      localStorage.setItem('twin-lookout-best', String(this.best));
    }
    el('overTitle').textContent = outOfTime ? "Time's up!" : 'Hunt complete!';
    el('overStats').innerHTML = [
      `<div><span>Final score</span><b>${this.score}</b></div>`,
      `<div><span>Best score</span><b>${this.best}</b></div>`,
      `<div><span>Scenes cleared</span><b>${this.sceneIndex + (outOfTime ? 0 : 1)} / ${SCENES.length}</b></div>`,
      `<div><span>Difficulty</span><b>${DIFFICULTIES[this.difficulty].label}</b></div>`,
    ].join('');
    el('overNote').textContent = isBest
      ? '🎉 New best score! The lookout salutes you.'
      : 'Tip: hints cost 50 points — save them for the last two differences.';
    this.updateHud();
    this.showOverlay('overOverlay');
  }

  setMessage(text) {
    el('messageText').textContent = text;
    this.messageTimer = performance.now() + 4000;
  }

  updateHud() {
    const remaining = this.scene.diffs.length - this.found.size;
    el('timerText').textContent = formatTime(this.timeLeft);
    el('timerBar').style.width = `${Math.max(0, (this.timeLeft / this.timeTotal) * 100)}%`;
    el('timerBar').classList.toggle('low', this.timeLeft <= 30);
    el('scoreText').textContent = String(this.score);
    el('foundText').textContent = `🔍 ${this.found.size} / ${this.scene.diffs.length} found · ${remaining} left`;
    el('streakText').textContent = this.streak > 1 ? `🔥 Streak ×${this.streak}` : '';
    el('hintCount').textContent = `💡 Hints: ${this.hintsLeft}`;
    el('btnHint').disabled = this.screen !== 'playing' || this.hintsLeft <= 0;
  }

  frame(now) {
    const delta = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.screen === 'playing' && !this.frozen) {
      this.timeLeft -= delta;
      const whole = Math.ceil(this.timeLeft);
      if (whole !== this.lastTickSecond) {
        this.lastTickSecond = whole;
        if (whole <= 10 && whole > 0) this.sound.playTick();
        this.updateHud();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateHud();
        this.endRun(true);
      }
    }
    if (this.messageTimer && now > this.messageTimer && this.screen === 'playing') {
      el('messageText').textContent = 'Click a difference on either picture — or press H for a hint.';
      this.messageTimer = 0;
    }
    this.drawPanels(now);
    requestAnimationFrame((next) => this.frame(next));
  }

  drawPanels(now) {
    for (const [ctx, base] of [[this.leftCtx, this.leftBase], [this.rightCtx, this.rightBase]]) {
      ctx.clearRect(0, 0, PANEL_W, PANEL_H);
      ctx.drawImage(base, 0, 0);
      for (const diff of this.scene.diffs) {
        if (!this.found.has(diff.id)) continue;
        const age = now - (this.foundAt.get(diff.id) || now);
        const pop = age < 300 ? 1 + (1 - age / 300) * 0.35 : 1;
        const r = Math.max(diff.r, 22) * pop;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(diff.x + r * 0.7, diff.y - r * 0.7, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', diff.x + r * 0.7, diff.y - r * 0.7 + 0.5);
      }
      if (this.hintTarget && now < this.hintUntil && !this.found.has(this.hintTarget.id)) {
        const pulse = 1 + Math.sin(now / 160) * 0.12;
        const r = Math.max(this.hintTarget.r, 22) * pulse;
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd23e';
        ctx.beginPath();
        ctx.arc(this.hintTarget.x, this.hintTarget.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (const flash of this.wrongFlashes) {
        const age = now - flash.born;
        if (age > 700) continue;
        const alpha = 1 - age / 700;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        const s = 12;
        ctx.beginPath();
        ctx.moveTo(flash.x - s, flash.y - s);
        ctx.lineTo(flash.x + s, flash.y + s);
        ctx.moveTo(flash.x + s, flash.y - s);
        ctx.lineTo(flash.x - s, flash.y + s);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      for (const popup of this.popups) {
        const age = now - popup.born;
        if (age > 1200) continue;
        const rise = (age / 1200) * 34;
        ctx.globalAlpha = 1 - age / 1200;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(popup.text, popup.x, popup.y - rise);
        ctx.fillStyle = '#ffd23e';
        ctx.fillText(popup.text, popup.x, popup.y - rise);
        ctx.globalAlpha = 1;
      }
      this.wrongFlashes = this.wrongFlashes.filter((f) => now - f.born <= 700);
      this.popups = this.popups.filter((p) => now - p.born <= 1200);
    }
    if (this.crosshair.visible && this.screen === 'playing') {
      const ctx = this.crosshair.side === 'left' ? this.leftCtx : this.rightCtx;
      const { x, y } = this.crosshair;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x - 8, y);
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 20, y);
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x, y - 8);
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
    }
  }

  // Deterministic staged state for screenshots: start a round, pre-mark the
  // first N differences as found, freeze the clock and optionally light a hint.
  stageShot({ scene = 0, found = 3, timer = 97, score = 320, hint = false } = {}) {
    this.sceneIndex = scene;
    this.startRound();
    this.frozen = true;
    this.timeLeft = timer;
    this.score = score;
    const diffs = this.scene.diffs.slice(0, found);
    for (const diff of diffs) {
      this.found.add(diff.id);
      this.foundAt.set(diff.id, performance.now() - 1000);
    }
    if (diffs.length > 0) {
      const last = diffs[diffs.length - 1];
      this.setMessage(`Found: ${last.label} — +${this.pointsPerFind} points (streak ×${diffs.length})`);
    }
    if (hint) {
      const remaining = this.scene.diffs.filter((d) => !this.found.has(d.id));
      if (remaining.length > 0) {
        this.hintTarget = remaining[0];
        this.hintUntil = performance.now() + 60000;
        this.hintsLeft = 2;
        this.score = Math.max(0, this.score - HINT_COST);
      }
    }
    this.updateHud();
  }
}
