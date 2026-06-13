// ============================================================================
// Procedural casino sound generator — writes WAV files to public/sounds/.
// Pure Node (no deps, no binaries). Re-run with: node scripts/gen-sounds.mjs
// ============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'sounds');
mkdirSync(OUT, { recursive: true });

const SR = 22050; // sample rate

// --- DSP helpers ----------------------------------------------------------
const sec = (n) => Math.round(n * SR);
function buf(seconds) {
  return new Float32Array(sec(seconds));
}
// exponential decay envelope
const expEnv = (i, len, k = 5) => Math.exp((-k * i) / len);
// short attack to avoid clicks
function declick(b, ms = 4) {
  const n = Math.min(sec(ms / 1000), Math.floor(b.length / 2));
  for (let i = 0; i < n; i++) {
    const g = i / n;
    b[i] *= g;
    b[b.length - 1 - i] *= g;
  }
  return b;
}
function addSine(b, freq, amp, start, dur, decay = 5, vibrato = 0) {
  const s = sec(start);
  const len = sec(dur);
  for (let i = 0; i < len && s + i < b.length; i++) {
    const f = freq * (1 + vibrato * Math.sin((2 * Math.PI * 5 * i) / SR));
    b[s + i] += amp * expEnv(i, len, decay) * Math.sin((2 * Math.PI * f * i) / SR);
  }
}
function addNoise(b, amp, start, dur, decay = 5, lp = 1) {
  const s = sec(start);
  const len = sec(dur);
  let prev = 0;
  for (let i = 0; i < len && s + i < b.length; i++) {
    const white = Math.random() * 2 - 1;
    prev = prev + lp * (white - prev); // simple one-pole low-pass
    b[s + i] += amp * expEnv(i, len, decay) * prev;
  }
}
function normalize(b, peak = 0.9) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  return b;
}

// --- WAV encoder (16-bit PCM mono) ---------------------------------------
function toWav(samples) {
  const n = samples.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(ab);
  const ws = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE');
  ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true); dv.setUint32(24, SR, true);
  dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  ws(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return Buffer.from(ab);
}
const save = (name, b) => {
  writeFileSync(join(OUT, name), toWav(declick(normalize(b))));
  console.log('  ✓', name, `(${(b.length / SR).toFixed(2)}s)`);
};

// --- Sound designs --------------------------------------------------------
// Chip: bright metallic clink
function chip() {
  const b = buf(0.18);
  [2400, 3200, 4100].forEach((f, i) => addSine(b, f, 0.5 - i * 0.12, 0, 0.16, 9));
  addNoise(b, 0.25, 0, 0.05, 14, 0.5);
  return b;
}
// Deal: card sliding across felt (filtered noise swoosh)
function deal() {
  const b = buf(0.2);
  addNoise(b, 0.8, 0, 0.18, 3.2, 0.18);
  return b;
}
// Flip: quick card flick
function flip() {
  const b = buf(0.16);
  addNoise(b, 0.7, 0, 0.05, 10, 0.5);
  addNoise(b, 0.5, 0.05, 0.09, 6, 0.25);
  return b;
}
function buttonHover() {
  const b = buf(0.08);
  addSine(b, 660, 0.4, 0, 0.07, 8);
  return b;
}
function buttonClick() {
  const b = buf(0.09);
  addSine(b, 900, 0.55, 0, 0.06, 12);
  addNoise(b, 0.15, 0, 0.02, 16, 0.6);
  return b;
}
// Win: pleasant ascending major arpeggio (C-E-G)
function win() {
  const b = buf(0.7);
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((f, i) => { addSine(b, f, 0.5, i * 0.12, 0.45, 3); addSine(b, f * 2, 0.12, i * 0.12, 0.4, 4); });
  return b;
}
// Blackjack: triumphant major chord + sparkle (C-E-G-C)
function blackjack() {
  const b = buf(1.1);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => addSine(b, f, 0.45, i * 0.09, 0.9, 2.2));
  // sparkle
  [1568, 2093, 2637].forEach((f, i) => addSine(b, f, 0.18, 0.45 + i * 0.07, 0.4, 6));
  return b;
}
// Lose: soft descending two-tone
function lose() {
  const b = buf(0.5);
  addSine(b, 392, 0.5, 0, 0.28, 3.5);
  addSine(b, 311.13, 0.5, 0.18, 0.3, 3);
  return b;
}
// Bust: low descending buzz
function bust() {
  const b = buf(0.5);
  for (let i = 0; i < sec(0.45); i++) {
    const t = i / SR;
    const f = 220 - 120 * (i / sec(0.45));
    b[i] += 0.5 * expEnv(i, sec(0.45), 2.5) * Math.sign(Math.sin(2 * Math.PI * f * t));
  }
  return b;
}
// Push: neutral single soft tone
function push() {
  const b = buf(0.35);
  addSine(b, 440, 0.5, 0, 0.3, 3);
  addSine(b, 660, 0.15, 0, 0.3, 3);
  return b;
}
// Ambient casino: soft low loopable pad (kept short)
function ambient() {
  const b = buf(3);
  const len = b.length;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const trem = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.15 * t);
    b[i] = trem * (
      0.20 * Math.sin(2 * Math.PI * 110 * t) +
      0.14 * Math.sin(2 * Math.PI * 164.81 * t) +
      0.10 * Math.sin(2 * Math.PI * 220 * t)
    );
  }
  return normalize(b, 0.5); // quieter bed; skip declick so it loops seamlessly
}

console.log('Generating casino sounds →', OUT);
save('chip.wav', chip());
save('deal.wav', deal());
save('card-flip.wav', flip());
save('button-hover.wav', buttonHover());
save('button-click.wav', buttonClick());
save('win.wav', win());
save('blackjack.wav', blackjack());
save('lose.wav', lose());
save('bust.wav', bust());
save('push.wav', push());
// ambient: written without declick (loop-friendly)
writeFileSync(join(OUT, 'ambient-casino.wav'), toWav(ambient()));
console.log('  ✓ ambient-casino.wav (3.00s, loop)');
console.log('Done.');
