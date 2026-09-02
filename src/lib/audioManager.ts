/**
 * Audio helper for UI triggers, Web Audio Fireworks synthesis, and YouTube synchronization
 */

class WeddingAudioManager {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private listeners: Array<(playing: boolean, muted: boolean) => void> = [];

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesizes a realistic firework launch whoosh + explosion boom + glittering crackles
   */
  public playFireworkBurst() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 1. Launch Whoosh (rising pitch)
      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.setValueAtTime(180, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(750, now + 0.35);
      whooshGain.gain.setValueAtTime(0.08, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      whooshOsc.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whooshOsc.start(now);
      whooshOsc.stop(now + 0.35);

      // 2. Explosion Boom (Deep resonant sub-bass thump)
      const boomTime = now + 0.32;
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(140, boomTime);
      boomOsc.frequency.exponentialRampToValueAtTime(35, boomTime + 0.9);
      boomGain.gain.setValueAtTime(0.45, boomTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, boomTime + 0.9);
      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomOsc.start(boomTime);
      boomOsc.stop(boomTime + 0.9);

      // 3. Explosion White Noise Burst (Air blast)
      const bufferSize = ctx.sampleRate * 0.4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, boomTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, boomTime + 0.4);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, boomTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, boomTime + 0.4);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(boomTime);

      // 4. Sparkler Crackles & Pops (3 to 6 randomized crackles)
      const numCrackles = 5;
      for (let j = 0; j < numCrackles; j++) {
        const crackleTime = boomTime + 0.2 + Math.random() * 0.7;
        const crackleOsc = ctx.createOscillator();
        const crackleGain = ctx.createGain();
        crackleOsc.type = 'square';
        crackleOsc.frequency.setValueAtTime(800 + Math.random() * 1200, crackleTime);
        crackleGain.gain.setValueAtTime(0.06, crackleTime);
        crackleGain.gain.exponentialRampToValueAtTime(0.0001, crackleTime + 0.04);
        crackleOsc.connect(crackleGain);
        crackleGain.connect(ctx.destination);
        crackleOsc.start(crackleTime);
        crackleOsc.stop(crackleTime + 0.05);
      }
    } catch (e) {
      console.warn('Firework sound error:', e);
    }
  }

  /**
   * Plays a 3-second choreographed fireworks sound show
   */
  public playFireworkShow() {
    this.playFireworkBurst();
    setTimeout(() => this.playFireworkBurst(), 400);
    setTimeout(() => this.playFireworkBurst(), 900);
    setTimeout(() => this.playFireworkBurst(), 1450);
    setTimeout(() => this.playFireworkBurst(), 2000);
  }

  public startMusic() {
    this.isPlaying = true;
    this.isMuted = false;
    this.notifyListeners();
  }

  public stopMusic() {
    this.isPlaying = false;
    this.notifyListeners();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    this.notifyListeners();
  }

  public subscribe(listener: (playing: boolean, muted: boolean) => void) {
    this.listeners.push(listener);
    listener(this.isPlaying, this.isMuted);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.isPlaying, this.isMuted));
  }
}

export const weddingAudio = new WeddingAudioManager();
