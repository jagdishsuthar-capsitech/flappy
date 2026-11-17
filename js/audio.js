
import { saveData, updateSettings } from "./storage.js";

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;

    this.soundEnabled = saveData.settings.sound;
    this.musicEnabled = saveData.settings.music;

    this.soundVolume = saveData.settings.soundVolume;
    this.musicVolume = saveData.settings.musicVolume;

    this.musicOscillators = [];
    this.musicTimer = null;
    this.musicStep = 0;

    this.initialized = false;
  }

  // INITIALIZE AUDIO

  async init() {
    if (this.initialized) {
      if (this.context?.state === "suspended") {
        await this.context.resume();
      }
      return true;
    }

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("Web Audio API not supported");
        return false;
      }

      this.context = new AudioContextClass();

      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();

      this.masterGain.gain.value = this.soundVolume;
      this.musicGain.gain.value = this.musicVolume;

      this.masterGain.connect(this.context.destination);
      this.musicGain.connect(this.context.destination);

      this.initialized = true;

      if (this.context.state === "suspended") {
        await this.context.resume();
      }

      if (this.musicEnabled) {
        this.startMusic();
      }

      return true;
    } catch (error) {
      console.error("Audio initialization failed:", error);
      return false;
    }
  }

  // GENERATE TONES

  playTone({
    frequency = 440,
    endFrequency = frequency,
    duration = 0.12,
    type = "sine",
    volume = 0.3,
    destination = this.masterGain
  } = {}) {
    if (!this.initialized || !this.context || !destination) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    const now = this.context.currentTime;

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(frequency, now);

    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFrequency),
      now + duration
    );

    gain.gain.setValueAtTime(
      Math.max(0.001, volume),
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  // SOUND EFFECTS

  flap() {
    if (!this.soundEnabled) return;

    this.playTone({
      frequency: 500,
      endFrequency: 280,
      duration: 0.09,
      type: "triangle",
      volume: 0.18
    });
  }

  coin() {
    if (!this.soundEnabled) return;

    this.playTone({
      frequency: 700,
      endFrequency: 1100,
      duration: 0.12,
      type: "sine",
      volume: 0.2
    });
  }

  score() {
    if (!this.soundEnabled) return;

    this.playTone({
      frequency: 520,
      endFrequency: 850,
      duration: 0.15,
      type: "triangle",
      volume: 0.2
    });
  }

  collision() {
    if (!this.soundEnabled) return;

    this.playTone({
      frequency: 220,
      endFrequency: 65,
      duration: 0.3,
      type: "sawtooth",
      volume: 0.2
    });
  }

  gameOver() {
    if (!this.soundEnabled) return;

    this.playTone({
      frequency: 400,
      endFrequency: 100,
      duration: 0.55,
      type: "triangle",
      volume: 0.22
    });
  }

  button() {
    if (!this.soundEnabled) return;

    this.playTone({
      frequency: 650,
      endFrequency: 750,
      duration: 0.06,
      type: "sine",
      volume: 0.1
    });
  }

  // SOUND SETTINGS

  setSound(enabled) {
    this.soundEnabled = Boolean(enabled);

    updateSettings({
      sound: this.soundEnabled
    });
  }

  setSoundVolume(volume) {
    this.soundVolume = this.normalizeVolume(volume);

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.soundVolume,
        this.context.currentTime,
        0.02
      );
    }

    updateSettings({
      soundVolume: this.soundVolume
    });
  }

  // MUSIC SETTINGS

  setMusic(enabled) {
    this.musicEnabled = Boolean(enabled);

    updateSettings({
      music: this.musicEnabled
    });

    if (!this.initialized) return;

    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = this.normalizeVolume(volume);

    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(
        this.musicVolume,
        this.context.currentTime,
        0.02
      );
    }

    updateSettings({
      musicVolume: this.musicVolume
    });
  }

  normalizeVolume(volume) {
    const value = Number(volume);

    if (!Number.isFinite(value)) return 0;

    return Math.max(0, Math.min(1, value));
  }

  // BACKGROUND MUSIC

  startMusic() {
    if (
      !this.initialized ||
      !this.musicEnabled ||
      this.musicTimer !== null
    ) {
      return;
    }

    const melody = [
      523, 659, 784, 659,
      587, 698, 880, 698,
      523, 659, 784, 1046,
      880, 784, 659, 587
    ];

    this.musicStep = 0;

    this.musicTimer = window.setInterval(() => {
      if (
        !this.musicEnabled ||
        !this.initialized ||
        this.context.state !== "running"
      ) {
        return;
      }

      const frequency = melody[
        this.musicStep % melody.length
      ];

      this.playTone({
        frequency,
        endFrequency: frequency,
        duration: 0.22,
        type: "sine",
        volume: 0.12,
        destination: this.musicGain
      });

      this.musicStep++;
    }, 260);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // CLEANUP

  async destroy() {
    this.stopMusic();

    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }

    this.context = null;
    this.initialized = false;
  }
}
