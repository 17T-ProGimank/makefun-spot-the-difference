// Tiny WebAudio sound engine for Twin Lookout: all sounds are synthesized
// oscillators, so the game ships no audio files and works fully offline.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.master = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return true;
  }

  unlock() {
    this.ensureContext();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.22;
  }

  tone(frequency, startAt, duration, type, volume) {
    if (this.muted || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const t0 = this.context.currentTime + startAt;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(t0);
    oscillator.stop(t0 + duration + 0.05);
  }

  playFind() {
    if (!this.ensureContext()) return;
    this.tone(660, 0, 0.12, 'sine', 0.5);
    this.tone(880, 0.09, 0.18, 'sine', 0.5);
    this.tone(1320, 0.18, 0.22, 'triangle', 0.3);
  }

  playWrong() {
    if (!this.ensureContext()) return;
    this.tone(160, 0, 0.18, 'sawtooth', 0.35);
    this.tone(110, 0.05, 0.22, 'sawtooth', 0.3);
  }

  playHint() {
    if (!this.ensureContext()) return;
    this.tone(520, 0, 0.1, 'sine', 0.35);
    this.tone(780, 0.08, 0.14, 'sine', 0.35);
  }

  playClick() {
    if (!this.ensureContext()) return;
    this.tone(440, 0, 0.06, 'square', 0.15);
  }

  playRoundWin() {
    if (!this.ensureContext()) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, index) => this.tone(note, index * 0.11, 0.22, 'triangle', 0.4));
  }

  playGameOver() {
    if (!this.ensureContext()) return;
    const notes = [392, 330, 262, 196];
    notes.forEach((note, index) => this.tone(note, index * 0.14, 0.26, 'triangle', 0.35));
  }

  playTick() {
    if (!this.ensureContext()) return;
    this.tone(980, 0, 0.05, 'square', 0.12);
  }
}
