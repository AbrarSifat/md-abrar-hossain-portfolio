'use client';

/**
 * Leica Precision Acoustic Synthesis Engine
 * Mathematically synthesizes the legendary mechanical acoustics of Leica M rangefinder cameras
 * in real-time via the Web Audio API.
 * 
 * 0 KB external audio files · Zero latency · Analog micro-pitch randomized warmth.
 */

class LeicaSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 50; // Default 50% (range: 0 to 100, maps to 0.0 to 4.0 gain headroom)
  private lastScrollTickTime: number = 0;
  private lastInteractiveSoundTime: number = 0;
  private listeners: Set<(enabled: boolean, volume: number) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('abrar-sound-enabled');
        // Default to enabled unless explicitly turned off
        this.enabled = saved !== 'false';
      } catch {
        this.enabled = true;
      }

      try {
        const savedVol = localStorage.getItem('abrar-sound-volume-v2');
        if (savedVol !== null) {
          const parsed = parseInt(savedVol, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            this.volume = parsed;
          } else {
            this.volume = 50;
          }
        } else {
          this.volume = 50; // Default 50%
        }
      } catch {
        this.volume = 50;
      }
    }
  }

  public initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        const target = this.enabled ? (this.volume / 100) * 4.0 : 0;
        this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      const target = this.enabled ? (this.volume / 100) * 4.0 : 0;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  private get destination(): AudioNode {
    if (this.masterGain) return this.masterGain;
    if (this.ctx) {
      this.masterGain = this.ctx.createGain();
      const target = this.enabled ? (this.volume / 100) * 4.0 : 0;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return this.masterGain;
    }
    throw new Error('AudioContext not available');
  }

  private updateGain() {
    if (this.masterGain && this.ctx) {
      const target = this.enabled ? (this.volume / 100) * 4.0 : 0;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getVolumePercent(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    const clamped = Math.round(Math.min(100, Math.max(0, val)));
    this.volume = clamped;
    try {
      localStorage.setItem('abrar-sound-volume-v2', String(clamped));
    } catch {
      // storage unavailable
    }

    if (clamped > 0 && !this.enabled) {
      this.enabled = true;
      try {
        localStorage.setItem('abrar-sound-enabled', 'true');
      } catch {}
    } else if (clamped === 0 && this.enabled) {
      this.enabled = false;
      try {
        localStorage.setItem('abrar-sound-enabled', 'false');
      } catch {}
    }

    this.updateGain();
    this.notify();
  }

  public setVolumePercent(pct: number) {
    this.setVolume(pct);
  }

  public subscribe(fn: (enabled: boolean, volume: number) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.enabled, this.volume));
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('abrar-sound-enabled', String(this.enabled));
    } catch {
      // storage unavailable
    }

    if (this.enabled && this.volume <= 0) {
      this.volume = 50; // Restore to 50% default
      try {
        localStorage.setItem('abrar-sound-volume-v2', '50');
      } catch {}
    }

    this.updateGain();
    this.notify();

    if (this.enabled) {
      this.initCtx();
      this.playLeicaShutter();
    }
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('abrar-sound-enabled', String(this.enabled));
    } catch {
      // storage unavailable
    }
    this.updateGain();
    this.notify();
  }

  /**
   * Dedicated Leica mechanical ratchet tick for the volume slider.
   * Crisp, immediate, with mechanical brass detent timbre.
   */
  public playVolumeTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High transient snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1750, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.009);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.009);

      // Low brass chassis resonance
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(540, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(280, now + 0.014);

      bodyGain.gain.setValueAtTime(0.05, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.destination);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.014);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * Helper: White Noise Buffer for mechanical friction transients
   */
  private createNoiseBuffer(durationSec: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * 1. The Iconic Leica M Mechanical Cloth Focal-Plane Shutter ("Snick")
   * Dual-curtain release: crisp mechanical curtain trip + damped rubber bumper brake.
   * Used for primary actions (Hero CTAs, CV download, Send Message, 3D Globe beam).
   */
  public playLeicaShutter() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Part A: Front Curtain Trip (High-frequency mechanical impulse)
      const noiseBuf = this.createNoiseBuffer(0.009);
      if (noiseBuf) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.Q.setValueAtTime(3.4, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.075, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.destination);
        noise.start(now);
      }

      // Part B: Low-Frequency Curtain Travel & Bumper Thud (Damped acoustic body)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.028);

      oscGain.gain.setValueAtTime(0.075, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(oscGain);
      oscGain.connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.028);

      // Part C: Rear Curtain Catch Bumper (+14ms mechanical settle)
      const catchOsc = this.ctx.createOscillator();
      const catchGain = this.ctx.createGain();
      catchOsc.type = 'triangle';
      catchOsc.frequency.setValueAtTime(480, now + 0.014);
      catchOsc.frequency.exponentialRampToValueAtTime(120, now + 0.026);

      catchGain.gain.setValueAtTime(0.055, now + 0.014);
      catchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

      catchOsc.connect(catchGain);
      catchGain.connect(this.destination);
      catchOsc.start(now + 0.014);
      catchOsc.stop(now + 0.026);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * 2. Leica Summicron Aperture Half-Stop Ball Detent ("Click")
   * Precision 3-tier machined ball-bearing click into solid brass grooves.
   * Noticeable, crisp, tactile, and distinct across mobile and laptop speakers.
   */
  public playApertureClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const jitter = (Math.random() - 0.5) * 45;

      // Component 1: High metallic ball snap transient
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2850 + jitter, now);
      osc.frequency.exponentialRampToValueAtTime(1420 + jitter, now + 0.012);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.012);

      // Component 2: Spring-loaded bearing notch strike (tactile mechanical friction)
      const noiseBuf = this.createNoiseBuffer(0.007);
      if (noiseBuf) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200 + jitter, now);
        filter.Q.setValueAtTime(3.6, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.destination);
        noise.start(now);
      }

      // Component 3: Solid machined brass chassis resonance
      const body = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(740 + jitter * 0.5, now);
      body.frequency.exponentialRampToValueAtTime(320, now + 0.018);

      bodyGain.gain.setValueAtTime(0.085, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

      body.connect(bodyGain);
      bodyGain.connect(this.destination);
      body.start(now);
      body.stop(now + 0.018);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * Site-wide debounced interactive tap feedback for links, buttons, and controls.
   */
  public playInteractiveTap() {
    const nowMs = performance.now();
    if (nowMs - this.lastInteractiveSoundTime < 45) return;
    this.lastInteractiveSoundTime = nowMs;
    this.playApertureClick();
  }

  /**
   * 3. Precision Film Advance Ratchet / Knurled Focus Ring Detent (Scroll Tick)
   * Ultra-soft, whisper-quiet micro detent specifically engineered for continuous scrolling.
   * Decreased by 25% for a subtle, silky acoustic texture.
   */
  public playScrollTick(velocity: number = 1) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const nowMs = performance.now();
    // Intelligent 75ms throttle so scrolling sounds like a precision ratchet wheel
    if (nowMs - this.lastScrollTickTime < 75) return;
    this.lastScrollTickTime = nowMs;

    try {
      const now = this.ctx.currentTime;
      const jitter = (Math.random() - 0.5) * 50;
      const normalizedVel = Math.min(2.5, Math.max(0.6, Math.abs(velocity)));
      // Decreased by 25% (from 0.012 to 0.009)
      const vol = 0.009 * normalizedVel;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1020 + jitter, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.005);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);

      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.005);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * 4. Leica M Bayonet Lens Mount Lock Snap
   * Solid mechanical spring-loaded pin snap into the camera flange.
   * Used for opening Case Study dossiers or asset dialogs.
   */
  public playLensMount() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Stage 1: Bayonet slide friction
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(840, now);
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.012);
      gain1.gain.setValueAtTime(0.025, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc1.connect(gain1);
      gain1.connect(this.destination);
      osc1.start(now);
      osc1.stop(now + 0.012);

      // Stage 2: Solid flange lock pin engagement at +16ms
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1380, now + 0.016);
      osc2.frequency.exponentialRampToValueAtTime(320, now + 0.038);
      gain2.gain.setValueAtTime(0.045, now + 0.016);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
      osc2.connect(gain2);
      gain2.connect(this.destination);
      osc2.start(now + 0.016);
      osc2.stop(now + 0.038);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * 5. Damped Mechanical Latch Release
   * Soft spring release when closing modals or dismissing dossiers.
   */
  public playLensUnmount() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.018);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.018);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * 6. Leica Rangefinder Split-Image Prism Alignment Snap
   * Optical glass alignment snap for certificate pop-up and hover inspections.
   */
  public playPrismSnap() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1650, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.008);

      gain.gain.setValueAtTime(0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      osc.connect(gain);
      gain.connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.008);
    } catch {
      // Audio gracefully suppressed
    }
  }

  /**
   * 7. Executive Two-Tone Golden Confirmation Chime (E5 -> G#5)
   * Warm harmonic chime for copy email, verification, and completion.
   */
  public playChime() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Note 1 (E5: 659.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.035, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2 (G#5: 830.61 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.05);
      gain2.gain.setValueAtTime(0.04, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.22);
    } catch {
      // Audio gracefully suppressed
    }
  }

  // Aliases for backward compatibility
  public playClick() {
    this.playLeicaShutter();
  }

  public playTick() {
    this.playApertureClick();
  }
}

export const sounds = new LeicaSoundEngine();
