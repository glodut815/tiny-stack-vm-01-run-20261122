import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function run(p: Uint8Array, q: Uint8Array): { b: Uint8Array; c: number } {
  const s = new Int32Array(256);
  const k = new Int32Array(64);
  const m = new Int32Array(256);
  const o = new Uint8Array(65536);
  let sp = 0, kp = 0, ol = 0, ip = 0, pc = 0, st = 0;
  const end = (c: number) => ({ b: o.slice(0, ol), c });
  for (;;) {
    if (st === 1000000) return end(10);
    if (pc < 0 || pc >= p.length) return end(9);
    const op = p[pc];
    let im = 0, po = 0, pu = 0;
    if (op === 1) { im = 1; pu = 1; }
    else if (op === 2) { im = 4; pu = 1; }
    else if (op === 3) po = 1;
    else if (op === 4) { po = 1; pu = 2; }
    else if (op === 5) { po = 2; pu = 2; }
    else if (op === 6) { po = 2; pu = 3; }
    else if (op === 7) { po = 3; pu = 3; }
    else if (op === 0x17 || op === 0x1b) { po = 1; pu = 1; }
    else if ((op >= 0x10 && op <= 0x16) || (op >= 0x18 && op <= 0x1e) || (op >= 0x20 && op <= 0x22)) { po = 2; pu = 1; }
    else if (op >= 0x30 && op <= 0x33) { im = 2; if (op === 0x31 || op === 0x32) po = 1; }
    else if (op === 0x40) { po = 1; pu = 1; }
    else if (op === 0x41) po = 2;
    else if (op === 0x50 || op === 0x51 || op === 0x53) po = 1;
    else if (op === 0x52) pu = 1;
    else if (op !== 0 && op !== 0x34) return end(5);
    if (pc + im >= p.length) return end(9);
    st++;
    const nx = pc + 1 + im;
    if (sp < po) return end(2);
    if (sp - po + pu > 256) return end(3);
    pc = nx;
    if (op === 0) return end(0);
    if (op === 1) { s[sp++] = (p[nx - 1] << 24) >> 24; continue; }
    if (op === 2) { s[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); continue; }
    if (op === 3) { sp--; continue; }
    if (op === 4) { s[sp] = s[sp - 1]; sp++; continue; }
    if (op === 5) { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; continue; }
    if (op === 6) { s[sp] = s[sp - 2]; sp++; continue; }
    if (op === 7) { const t = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = t; continue; }
    if (op === 0x17) { s[sp - 1] = -s[sp - 1] | 0; continue; }
    if (op === 0x1b) { s[sp - 1] = ~s[sp - 1]; continue; }
    if (op >= 0x30 && op <= 0x32) {
      const r = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
      let go = op === 0x30;
      if (!go) { const v = s[--sp]; go = op === 0x31 ? v === 0 : v !== 0; }
      if (go) pc = nx + r;
      continue;
    }
    if (op === 0x33) {
      if (kp === 64) return end(7);
      k[kp++] = nx;
      pc = p[nx - 2] | (p[nx - 1] << 8);
      continue;
    }
    if (op === 0x34) {
      if (kp === 0) return end(8);
      pc = k[--kp];
      continue;
    }
    if (op === 0x40) {
      const a = s[sp - 1];
      if (a < 0 || a > 255) return end(6);
      s[sp - 1] = m[a];
      continue;
    }
    if (op === 0x41) {
      const a = s[sp - 1];
      if (a < 0 || a > 255) return end(6);
      m[a] = s[sp - 2];
      sp -= 2;
      continue;
    }
    if (op === 0x50) {
      const t = String(s[sp - 1]);
      if (ol + t.length > 65536) return end(11);
      sp--;
      for (let j = 0; j < t.length; j++) o[ol++] = t.charCodeAt(j);
      continue;
    }
    if (op === 0x51) {
      if (ol + 1 > 65536) return end(11);
      o[ol++] = s[--sp] & 255;
      continue;
    }
    if (op === 0x52) { s[sp++] = ip < q.length ? q[ip++] : -1; continue; }
    if (op === 0x53) return end(s[--sp] & 255);
    const b = s[sp - 1], a = s[sp - 2];
    let r = 0;
    if (op === 0x10) r = (a + b) | 0;
    else if (op === 0x11) r = (a - b) | 0;
    else if (op === 0x12) r = Math.imul(a, b);
    else if (op === 0x13) {
      if (b === 0) return end(4);
      r = (a / b) | 0;
    } else if (op === 0x14) {
      if (b === 0) return end(4);
      r = b === -1 ? 0 : (a % b) | 0;
    } else if (op === 0x15) {
      if (b === 0) return end(4);
      r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
    } else if (op === 0x16) {
      if (b === 0) return end(4);
      r = ((a >>> 0) % (b >>> 0)) | 0;
    } else if (op === 0x18) r = a & b;
    else if (op === 0x19) r = a | b;
    else if (op === 0x1a) r = a ^ b;
    else if (op === 0x1c) r = a << (b & 31);
    else if (op === 0x1d) r = a >> (b & 31);
    else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
    else if (op === 0x20) r = a === b ? 1 : 0;
    else if (op === 0x21) r = a < b ? 1 : 0;
    else if (op === 0x22) r = (a >>> 0) < (b >>> 0) ? 1 : 0;
    sp -= 2;
    s[sp++] = r;
  }
}
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.b);
  writeFileSync(join(O, id, 'exit.txt'), r.c + '\n');
}
