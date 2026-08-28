let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

export function setMuted(muted: boolean): void {
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.22, ctx.currentTime, 0.03);
}

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

function beep(freq: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const c = getCtx();
  if (!c || !master || !unlocked) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export function playHarvest(n: number, cascade: boolean) {
  const i = Math.min(PENTATONIC.length - 1, Math.max(0, n - 1));
  beep(PENTATONIC[i]!, cascade ? 0.28 : 0.18, cascade ? 0.35 : 0.22, "triangle");
  if (n >= 4) beep(PENTATONIC[i]! * 2, 0.22, 0.12, "sine");
}

export function playEvolve() {
  beep(196, 0.09, 0.1, "sine");
}

export function playGameOver() {
  beep(196, 0.22, 0.16, "sine");
  setTimeout(() => beep(146.8, 0.3, 0.14, "triangle"), 90);
}

export function playWin() {
  beep(392, 0.14, 0.18, "triangle");
  setTimeout(() => beep(523.25, 0.18, 0.18, "triangle"), 80);
  setTimeout(() => beep(659.25, 0.28, 0.16, "sine"), 160);
}

export function playTap() {
  beep(880, 0.04, 0.08, "sine");
}
