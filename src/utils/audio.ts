/**
 * Web Audio API synthesizer for the Birthday app.
 * Generates beautiful custom music, plucks, chime sweeps,
 * firework explosions, and a sweet Glockenspiel "Happy Birthday" song.
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private emotionalMusicTimer: any = null;
  private birthdaySongTimer: any = null;
  private emotionalMusicNodes: AudioNode[] = [];
  private birthdaySongNodes: AudioNode[] = [];
  private magicalShimmerTimer: any = null;
  private magicalShimmerNodes: AudioNode[] = [];
  
  // Performance and rate limiting cache
  private noiseBuffer: AudioBuffer | null = null;
  private lastExplosionTime: number = 0;
  private lastPopTime: number = 0;

  public isMuted: boolean = false;
  private onMuteChangeCallbacks: ((muted: boolean) => void)[] = [];

  private unlocking = false;

  constructor() {
    // Lazy initialisation and automatic context unlocking on first user interaction.
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.ctx && this.ctx.state === 'running') {
          window.removeEventListener('click', unlock, true);
          window.removeEventListener('touchstart', unlock, true);
          window.removeEventListener('pointerdown', unlock, true);
          window.removeEventListener('keydown', unlock, true);
        }
      };
      window.addEventListener('click', unlock, { capture: true, passive: true });
      window.addEventListener('touchstart', unlock, { capture: true, passive: true });
      window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
      window.addEventListener('keydown', unlock, { capture: true, passive: true });
    }
  }

  private async ensureContextRunning(): Promise<AudioContext | null> {
    this.init();
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended' && !this.unlocking) {
      this.unlocking = true;
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed', e);
      }
      this.unlocking = false;
    }
    return this.ctx.state === 'running' ? this.ctx : null;
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Warm up the high-performance noise matrix once context is created
    if (this.ctx && !this.noiseBuffer) {
      try {
        const sampleRate = this.ctx.sampleRate || 44100;
        const bufferSize = Math.floor(sampleRate * 0.4); // 0.4 seconds of static noise
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } catch (e) {
        console.error("Failed to pre-allocate noise buffer", e);
      }
    }
  }

  public subscribeMuteChange(callback: (muted: boolean) => void) {
    this.onMuteChangeCallbacks.push(callback);
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    this.onMuteChangeCallbacks.forEach(cb => cb(this.isMuted));
    
    if (this.isMuted) {
      this.stopAllBackgroundMusic();
    } else {
      // Background music can be restarted based on current state later
    }
  }

  /**
   * Short, sweet keyboard pluck note
   */
  public async playKeypadSound(index: number = 0) {
    const ctx = await this.ensureContextRunning();
    if (!ctx || this.isMuted) return;

    // Map keys to an elegant pentatonic scale so keys sound musical
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const freq = notes[index % notes.length] || 440;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Quick pluck envelope
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  /**
   * Wrong passcode buzzer
   */
  public async playWrongSound() {
    const ctx = await this.ensureContextRunning();
    if (!ctx || this.isMuted) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130, ctx.currentTime);
    osc2.frequency.setValueAtTime(133, ctx.currentTime); // Detuned for fat buzzer sound

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 0.26);
    osc2.stop(ctx.currentTime + 0.26);
  }

  /**
   * Magical success chime sweep
   */
  public async playSuccessSound() {
    const ctx = await this.ensureContextRunning();
    if (!ctx || this.isMuted) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];

    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      // Lowpass filter to make it soft and twinkly
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, ctx.currentTime);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.45);
    });
  }

  /**
   * Synthesize a firework bloom explosion with a rich, magnificent crackling/exploding firecracker sound
   */
  public async playExplosionSound() {
    const ctx = await this.ensureContextRunning();
    if (this.isMuted || !ctx) return;

    // Rate limit: Max 1 explosion sound every 80ms to avoid UI stutter and audio saturation
    const nowMs = Date.now();
    if (nowMs - this.lastExplosionTime < 80) {
      return;
    }
    this.lastExplosionTime = nowMs;

    try {
      const now = ctx.currentTime;
      const sampleRate = ctx.sampleRate || 44100;

      // 1. Sudden sharp high-frequency "crack" using cached noise
      const crackSource = ctx.createBufferSource();
      if (this.noiseBuffer) {
        crackSource.buffer = this.noiseBuffer;
      } else {
        // Fallback buffer if not fully warmed up
        const fallback = ctx.createBuffer(1, Math.floor(sampleRate * 0.15), sampleRate);
        const data = fallback.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        crackSource.buffer = fallback;
      }

      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(1500, now);

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.3, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      crackSource.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(ctx.destination);

      // Start at random offset inside cached buffer for natural sensory diversity
      const offset = this.noiseBuffer ? Math.random() * 0.15 : 0;
      crackSource.start(now, offset);
      crackSource.stop(now + 0.15);

      // 2. Heavy bass deep boom/thump swept oscillator
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'triangle';
      
      boomOsc.frequency.setValueAtTime(150, now);
      boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      boomGain.gain.setValueAtTime(0.45, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      const boomFilter = ctx.createBiquadFilter();
      boomFilter.type = 'lowpass';
      boomFilter.frequency.setValueAtTime(200, now);

      boomOsc.connect(boomFilter);
      boomFilter.connect(boomGain);
      boomGain.connect(ctx.destination);

      boomOsc.start(now);
      boomOsc.stop(now + 0.35);

      // 3. Simple singular crackle tail (cheap secondary spark simulation)
      const crackleSource = ctx.createBufferSource();
      crackleSource.buffer = this.noiseBuffer || crackleSource.buffer;

      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.setValueAtTime(2200, now + 0.08);

      const crackleGain = ctx.createGain();
      crackleGain.gain.setValueAtTime(0.08, now + 0.08);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      crackleSource.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(ctx.destination);

      crackleSource.start(now + 0.08, offset + 0.1);
      crackleSource.stop(now + 0.14);

    } catch (e) {
      console.error("Synthesizing explosion sound failed", e);
    }
  }

  /**
   * Play synthesized high-fidelity balloon pop/crack sound
   */
  public async playPopSound() {
    const ctx = await this.ensureContextRunning();
    if (this.isMuted || !ctx) return;

    // Throttle pops so sequential balloons popping in a loop don't stack up or lag
    const nowMs = Date.now();
    if (nowMs - this.lastPopTime < 45) {
      return;
    }
    this.lastPopTime = nowMs;

    try {
      const now = ctx.currentTime;
      const sampleRate = ctx.sampleRate || 44100;

      // 1. Crisp pop snap using cached noise buffer
      const noiseSource = ctx.createBufferSource();
      if (this.noiseBuffer) {
        noiseSource.buffer = this.noiseBuffer;
      } else {
        const fallback = ctx.createBuffer(1, Math.floor(sampleRate * 0.06), sampleRate);
        const data = fallback.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noiseSource.buffer = fallback;
      }

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const offset = this.noiseBuffer ? Math.random() * 0.2 : 0;
      noiseSource.start(now, offset);
      noiseSource.stop(now + 0.06);

      // 2. Low-mid pop body sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.error("Synthesizing pop sound failed", e);
    }
  }

  /**
   * Loop emotional ambient music: soft piano chords
   */
  public async playEmotionalMusic() {
    const ctx = await this.ensureContextRunning();
    if (this.isMuted || !ctx) return;
    this.stopAllBackgroundMusic();

    let step = 0;
    // Ambient simple chord progression notes:
    // Am7 (A3, C4, E4, G4)
    // Fmaj7 (F3, A3, C4, E4)
    // Cmaj7 (C3, E3, G3, B3)
    // G (G3, B3, D4, G4)
    const chordProgressions = [
      [110.00, 130.81, 164.81, 196.00], // Am7
      [87.31, 110.00, 130.81, 164.81],  // Fmaj7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [98.00, 123.47, 146.83, 196.00]   // G
    ];

    const playChord = () => {
      if (this.isMuted) return;
      const now = ctx.currentTime;
      const chord = chordProgressions[step % chordProgressions.length];
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Soft sine-triangle hybrid
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        // Add a tiny detune to sound natural & lush
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.5, now + i * 0.05);

        // Slow attack, long release
        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.04, now + i * 0.05 + 1.2);
        gain.gain.setValueAtTime(0.04, now + 3.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

        osc.connect(gain);
        gain.connect(filter);
        
        osc.start(now + i * 0.05);
        osc.stop(now + 4.3);

        this.emotionalMusicNodes.push(osc as any, gain as any);
      });

      filter.connect(ctx.destination);
      this.emotionalMusicNodes.push(filter as any);

      step++;
    };

    playChord();
    this.emotionalMusicTimer = setInterval(playChord, 4500);
  }

  /**
   * Loops a sweet chime glockenspiel version of "Happy Birthday" on Page 3
   */
  public async playBirthdayMusic() {
    const ctx = await this.ensureContextRunning();
    if (this.isMuted || !ctx) return;
    this.stopAllBackgroundMusic();

    // Notes of Happy Birthday to You:
    // C C D C F E
    // C C D C G F
    // C C C(oct) A F E D
    // Bb Bb A F G F
    const hbdMelody = [
      { f: 261.63, d: 0.35, t: 0 },    // C4
      { f: 261.63, d: 0.15, t: 0.4 },  // C4
      { f: 293.66, d: 0.5,  t: 0.6 },  // D4
      { f: 261.63, d: 0.5,  t: 1.2 },  // C4
      { f: 349.23, d: 0.5,  t: 1.8 },  // F4
      { f: 329.63, d: 1.0,  t: 2.4 },  // E4

      { f: 261.63, d: 0.35, t: 3.6 },  // C4
      { f: 261.63, d: 0.15, t: 4.0 },  // C4
      { f: 293.66, d: 0.5,  t: 4.2 },  // D4
      { f: 261.63, d: 0.5,  t: 4.8 },  // C4
      { f: 392.00, d: 0.5,  t: 5.4 },  // G4
      { f: 349.23, d: 1.0,  t: 6.0 },  // F4

      { f: 261.63, d: 0.35, t: 7.2 },  // C4
      { f: 261.63, d: 0.15, t: 7.6 },  // C4
      { f: 523.25, d: 0.5,  t: 7.8 },  // C5 (octave up!)
      { f: 440.00, d: 0.5,  t: 8.4 },  // A4
      { f: 349.23, d: 0.5,  t: 9.0 },  // F4
      { f: 329.63, d: 0.5,  t: 9.6 },  // E4
      { f: 293.66, d: 1.0,  t: 10.2 }, // D4

      { f: 466.16, d: 0.35, t: 11.4 }, // Bb4
      { f: 466.16, d: 0.15, t: 11.8 }, // Bb4
      { f: 440.00, d: 0.5,  t: 12.0 }, // A4
      { f: 349.23, d: 0.5,  t: 12.6 }, // F4
      { f: 392.00, d: 0.5,  t: 13.2 }, // G4
      { f: 349.23, d: 1.2,  t: 13.8 }  // F4
    ];

    const playMelodyOnce = () => {
      if (this.isMuted) return;
      const now = ctx.currentTime;

      // Add a simple underlying harmony (gentle, warm bass notes)
      const harmony = [
        { f: 130.81, t: 0 },    // C3
        { f: 174.61, t: 2.0 },  // F3
        { f: 130.81, t: 3.6 },  // C3
        { f: 196.00, t: 5.6 },  // G3
        { f: 130.81, t: 7.2 },  // C3
        { f: 174.61, t: 9.0 },  // F3
        { f: 116.54, t: 11.4 }, // Bb2
        { f: 174.61, t: 13.2 }  // F3
      ];

      harmony.forEach((h) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(h.f, now + h.t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now + h.t);

        gain.gain.setValueAtTime(0, now + h.t);
        gain.gain.linearRampToValueAtTime(0.08, now + h.t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.t + 2.5);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(ctx.destination);

        osc.start(now + h.t);
        osc.stop(now + h.t + 2.6);

        this.birthdaySongNodes.push(osc as any, gain as any, filter as any);
      });

      // Play chimey Glockenspiel melody
      hbdMelody.forEach((m) => {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator(); // Sub-sine for extra roundness
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(m.f, now + m.t);

        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(m.f / 2, now + m.t); // Octave down warmth

        // Glockenspiel fast pluck envelope: instant attack, bell-like decay
        gain.gain.setValueAtTime(0, now + m.t);
        gain.gain.linearRampToValueAtTime(0.08, now + m.t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + m.t + m.d * 1.5);

        // Highpass to sparkle
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(200, now + m.t);

        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(hp);
        hp.connect(ctx.destination);

        osc.start(now + m.t);
        subOsc.start(now + m.t);
        osc.stop(now + m.t + m.d * 1.6);
        subOsc.stop(now + m.t + m.d * 1.6);

        this.birthdaySongNodes.push(osc as any, subOsc as any, gain as any, hp as any);
      });
    };

    playMelodyOnce();
    // Restart every 16 seconds
    this.birthdaySongTimer = setInterval(playMelodyOnce, 16000);
  }

  /**
   * Loops a soft, magical 'shimmer' or 'chime' sound effect in the background
   */
  public async playMagicalShimmerMusic() {
    const ctx = await this.ensureContextRunning();
    if (this.isMuted || !ctx) return;
    this.stopAllBackgroundMusic();

    const playShimmer = () => {
      if (this.isMuted) return;
      const now = ctx.currentTime;
      const notes = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00, 2349.32, 2637.02, 3135.96];

      for (let i = 0; i < 12; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const baseFreq = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.setValueAtTime(baseFreq + (Math.random() - 0.5) * 15, now + i * 0.28);
        osc.type = Math.random() > 0.45 ? 'sine' : 'triangle';

        const triggerTime = now + i * 0.28;
        gain.gain.setValueAtTime(0, triggerTime);
        gain.gain.linearRampToValueAtTime(0.012, triggerTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 1.2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1100, triggerTime);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(ctx.destination);

        osc.start(triggerTime);
        osc.stop(triggerTime + 1.5);

        this.magicalShimmerNodes.push(osc as any, gain as any, filter as any);
      }
    };

    playShimmer();
    this.magicalShimmerTimer = setInterval(playShimmer, 4500);
  }

  public stopAllBackgroundMusic() {
    if (this.emotionalMusicTimer) {
      clearInterval(this.emotionalMusicTimer);
      this.emotionalMusicTimer = null;
    }
    if (this.birthdaySongTimer) {
      clearInterval(this.birthdaySongTimer);
      this.birthdaySongTimer = null;
    }
    if (this.magicalShimmerTimer) {
      clearInterval(this.magicalShimmerTimer);
      this.magicalShimmerTimer = null;
    }

    // Disconnect/stop all active playing nodes safely
    this.emotionalMusicNodes.forEach((node: any) => {
      try {
        node.stop();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.emotionalMusicNodes = [];

    this.birthdaySongNodes.forEach((node: any) => {
      try {
        node.stop();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.birthdaySongNodes = [];

    this.magicalShimmerNodes.forEach((node: any) => {
      try {
        node.stop();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.magicalShimmerNodes = [];
  }
}

export const audio = new AudioManager();
