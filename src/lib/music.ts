import type { BgmKey } from "./templates";

interface Note {
  freq: number;
  beats: number;
}

// Frequencies in Hz (0 = rest)
const N = {
  REST: 0,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  Fs5: 739.99,
  G5: 783.99,
  A5: 880.0,
};

const MELODIES: Record<Exclude<BgmKey, "none">, { tempoMs: number; notes: Note[] }> = {
  "jingle-bells": {
    tempoMs: 280,
    notes: [
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 2 },
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 2 },
      { freq: N.E5, beats: 1 },
      { freq: N.G5, beats: 1 },
      { freq: N.C5, beats: 1.5 },
      { freq: N.D5, beats: 0.5 },
      { freq: N.E5, beats: 4 },
      { freq: N.F5, beats: 1 },
      { freq: N.F5, beats: 1 },
      { freq: N.F5, beats: 1.5 },
      { freq: N.F5, beats: 0.5 },
      { freq: N.F5, beats: 1 },
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 0.5 },
      { freq: N.E5, beats: 0.5 },
      { freq: N.E5, beats: 1 },
      { freq: N.D5, beats: 1 },
      { freq: N.D5, beats: 1 },
      { freq: N.E5, beats: 1 },
      { freq: N.D5, beats: 2 },
      { freq: N.G5, beats: 2 },
    ],
  },
  "silent-night": {
    tempoMs: 420,
    notes: [
      { freq: N.G4, beats: 1.5 },
      { freq: N.A4, beats: 0.5 },
      { freq: N.G4, beats: 1 },
      { freq: N.E5, beats: 3 },
      { freq: N.G4, beats: 1.5 },
      { freq: N.A4, beats: 0.5 },
      { freq: N.G4, beats: 1 },
      { freq: N.E5, beats: 3 },
      { freq: N.D5, beats: 2 },
      { freq: N.D5, beats: 1 },
      { freq: N.B4, beats: 3 },
      { freq: N.C5, beats: 2 },
      { freq: N.C5, beats: 1 },
      { freq: N.G4, beats: 3 },
    ],
  },
  "we-wish": {
    tempoMs: 310,
    notes: [
      { freq: N.G4, beats: 1 },
      { freq: N.C5, beats: 1 },
      { freq: N.C5, beats: 0.5 },
      { freq: N.D5, beats: 0.5 },
      { freq: N.C5, beats: 0.5 },
      { freq: N.B4, beats: 0.5 },
      { freq: N.A4, beats: 1 },
      { freq: N.A4, beats: 1 },
      { freq: N.A4, beats: 1 },
      { freq: N.D5, beats: 1 },
      { freq: N.D5, beats: 0.5 },
      { freq: N.E5, beats: 0.5 },
      { freq: N.D5, beats: 0.5 },
      { freq: N.C5, beats: 0.5 },
      { freq: N.B4, beats: 1 },
      { freq: N.G4, beats: 1 },
      { freq: N.G4, beats: 1 },
      { freq: N.E5, beats: 1 },
      { freq: N.E5, beats: 0.5 },
      { freq: N.F5, beats: 0.5 },
      { freq: N.E5, beats: 0.5 },
      { freq: N.D5, beats: 0.5 },
      { freq: N.C5, beats: 1 },
      { freq: N.A4, beats: 1 },
      { freq: N.G4, beats: 0.5 },
      { freq: N.G4, beats: 0.5 },
      { freq: N.A4, beats: 1 },
      { freq: N.D5, beats: 1 },
      { freq: N.B4, beats: 1 },
      { freq: N.C5, beats: 2 },
    ],
  },
};

export interface MusicPlayerHandle {
  stop: () => void;
}

/**
 * Plays a soft music-box melody using the browser Web Audio API.
 * Must be triggered from a user interaction on browsers with autoplay restrictions.
 */
export function startChristmasMusic(bgmKey: BgmKey): MusicPlayerHandle | null {
  if (bgmKey === "none" || typeof window === "undefined") {
    return null;
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  const melody = MELODIES[bgmKey];
  if (!melody) return null;

  const ctx = new AudioCtx();
  let stopped = false;
  let timerId: number | null = null;
  let index = 0;

  const playNote = (freq: number, durationSec: number) => {
    if (stopped || freq <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(freq * 2, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.03, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.95);

    osc.connect(gain);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + durationSec);
    harmonic.stop(now + durationSec);
  };

  const scheduleNext = () => {
    if (stopped) return;
    const note = melody.notes[index % melody.notes.length];
    index += 1;
    const durationMs = note.beats * melody.tempoMs;
    playNote(note.freq, durationMs / 1000);
    timerId = window.setTimeout(scheduleNext, durationMs);
  };

  if (ctx.state === "suspended") {
    void ctx.resume().then(scheduleNext);
  } else {
    scheduleNext();
  }

  return {
    stop: () => {
      stopped = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      void ctx.close().catch(() => {});
    },
  };
}
