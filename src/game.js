/* MIMESIS: DESCENSO — build&play / 32 KB, sin librerías, sin assets.
   Dungeon crawler en primera persona, por turnos. El laboratorio te copia. */
(() => {
  'use strict';

  const W = 960, H = 540, VW = 320, VH = 180, MW = 24, MH = 24;
  const C = {
    bg: '#020604', line: 'rgba(125,255,90,.22)',
    green: '#7dff5a', lime: '#b6ff7a', pale: '#d8e8c8', dim: '#6f8a7d',
    amber: '#ffd166', red: '#ff4a5a', cyan: '#8de8ff', white: '#f7f0df'
  };
  const MODES = [
    { name: 'FÁCIL', hp: 10, mag: 8, packs: 3, meds: 2, plates: 0, mul: .72 },
    { name: 'MEDIO', hp: 8, mag: 6, packs: 2, meds: 1, plates: 0, mul: 1 },
    { name: 'DIFÍCIL', hp: 6, mag: 5, packs: 1, meds: 1, plates: 0, mul: 1.38 }
  ];
  const FLOORS = ['B1', 'B2', 'B3'];
  const MUTE_KEY = 'mim_mute_v2', MODE_KEY = 'mim_mode_v2';

  const cvs = document.getElementById('game');
  const screen = cvs.getContext('2d', { alpha: false });
  const pix = document.createElement('canvas');
  pix.width = VW; pix.height = VH;
  const pctx = pix.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  const img = pctx.createImageData(VW, VH);
  const buf = new Uint32Array(img.data.buffer);
  const view = { s: 1, ox: 0, oy: 0 };
  let ctx = screen;

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
  const angNorm = a => Math.atan2(Math.sin(a), Math.cos(a));
  const col = h => {
    const n = parseInt(h.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  };
  const hash = (x, y, s) => ((x * 928371 + y * 1237 + s * 7919) % 101 + 101) % 101 / 101;
  const DIRX = [1, 0, -1, 0], DIRY = [0, 1, 0, -1];

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function sg(c) {
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.lineWidth = 1;
    return g;
  }
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const SANS = 'system-ui, -apple-system, Segoe UI, sans-serif';
  function text(t, x, y, size, color, align, font) {
    ctx.font = `700 ${size}px ${font || FONT}`;
    ctx.textAlign = align || 'left';
    ctx.lineWidth = Math.max(2, size * .16);
    ctx.strokeStyle = '#020604';
    ctx.strokeText(t, x, y);
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
  }

  /* ------------------------------------------------------------- texturas */
  function makeTex(fn) {
    const base = new Uint32Array(256);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        base[y * 16 + x] = fn(x, y);
    const levels = [];
    for (let l = 0; l < 8; l++) {
      const f = l / 7, a = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        const c = base[i];
        a[i] = (0xff000000 | ((((c >> 16) & 255) * f | 0) << 16) | ((((c >> 8) & 255) * f | 0) << 8) | ((c & 255) * f | 0)) >>> 0;
      }
      levels.push(a);
    }
    return levels;
  }
  const W1 = {
    d: col('#04140f'), m: col('#08231a'), b: col('#0c2b21'), h: col('#1b4a36'), g: col('#2a6b46')
  };
  const TEX = [];
  TEX[1] = makeTex((x, y) => {
    if (x === 0 || y === 0) return W1.d;
    if (x === 15 || y === 15) return W1.m;
    if (y === 7) return W1.m;
    const v = hash(x, y, 3);
    if (v > .9) return W1.h;
    if (v > .78) return W1.g;
    if (v < .06) return W1.d;
    return W1.b;
  });
  TEX[2] = makeTex((x, y) => {
    if (x === 0 || y === 0) return col('#100a06');
    if (x === 15 || y === 15) return col('#1a1009');
    if (x === 4 || x === 11) return col('#25150c');
    if (y === 5 || y === 13) return col('#3a2312');
    if ((x === 4 || x === 11) && (y === 5 || y === 13)) return col('#8a5a2a');
    const v = hash(x, y, 7);
    if (v > .9) return col('#6a3f1e');
    if (v < .08) return col('#1d120b');
    return col('#2c1a0e');
  });
  TEX[3] = makeTex((x, y) => {
    if (x === 0 || y === 0) return col('#04100b');
    if (x === 3 || x === 8 || x === 13) return col('#123a24');
    if (x === 4 || x === 9 || x === 14) return col('#2c7a4a');
    if (x === 5 || x === 10) return col('#5fbf6a');
    if (y === 2 || y === 14) return col('#1d4a36');
    return col('#091e16');
  });
  const FLOOR = makeTex((x, y) => {
    if (x % 8 === 0 || y % 8 === 0) return col('#07130e');
    if (x % 8 === 1 || y % 8 === 1) return col('#183228');
    if (x % 8 === 7 || y % 8 === 7) return col('#0c2119');
    const v = hash(x, y, 11);
    if (v > .93) return col('#2a5a3e');
    if (v < .06) return col('#06100c');
    return col('#102820');
  });
  const CEIL = makeTex((x, y) => {
    if (y === 2 || y === 11) return col('#0a1813');
    if (y === 3 || y === 12) return col('#183028');
    if (x === 7 || x === 8) return col('#11241d');
    const v = hash(x, y, 17);
    if (v > .94) return col('#2a4a38');
    return col('#06100c');
  });

  /* -------------------------------------------------------------- sprites */
  const S = {};
  function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function E(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(cx, cy, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
    g.fill();
  }
  function spr(w, h, fn) {
    const c = mk(w, h), g = sg(c);
    fn(g);
    return c;
  }
  const K = '#06100b', EY = '#d6ff6a';
  S.bat = spr(16, 12, g => {
    R(g, 0, 5, 3, 1, K); R(g, 13, 5, 3, 1, K);
    R(g, 2, 4, 3, 2, K); R(g, 11, 4, 3, 2, K);
    E(g, 8, 6, 3, 3, K); E(g, 8, 6, 2, 2, '#4a2a3a');
    R(g, 6, 5, 1, 1, '#ff6a8a'); R(g, 9, 5, 1, 1, '#ff6a8a');
  });
  S.skeleton = spr(14, 20, g => {
    R(g, 4, 17, 2, 3, K); R(g, 8, 17, 2, 3, K);
    R(g, 5, 10, 4, 7, K);
    R(g, 3, 8, 8, 2, '#c8c0a8');
    R(g, 3, 11, 8, 1, '#8a8a7a');
    R(g, 4, 4, 6, 5, K); R(g, 5, 5, 4, 3, '#d8d0b8');
    R(g, 5, 6, 1, 1, '#ff6a8a'); R(g, 8, 6, 1, 1, '#ff6a8a');
    R(g, 6, 8, 2, 1, '#2a1a1a');
    R(g, 1, 10, 2, 6, K); R(g, 11, 10, 2, 6, K);
    R(g, 1, 14, 2, 1, '#c8c0a8'); R(g, 11, 14, 2, 1, '#c8c0a8');
  });
  S.spider = spr(16, 12, g => {
    R(g, 0, 4, 4, 1, K); R(g, 12, 4, 4, 1, K);
    R(g, 1, 7, 3, 1, K); R(g, 12, 7, 3, 1, K);
    E(g, 8, 6, 4, 3, K); E(g, 8, 6, 3, 2, '#3a2a3a');
    R(g, 5, 5, 2, 2, '#ff6a8a'); R(g, 9, 5, 2, 2, '#ff6a8a');
    R(g, 7, 8, 2, 1, '#8a1e2a');
  });
  S.clone = spr(14, 20, g => {
    R(g, 5, 17, 2, 3, K); R(g, 8, 17, 2, 3, K);
    R(g, 4, 7, 6, 10, K); R(g, 5, 8, 4, 8, '#5a2a4a');
    E(g, 7, 5, 3, 3, K); E(g, 7, 5, 2, 2, '#9a4a7a');
    R(g, 5, 4, 1, 1, '#ff6a8a'); R(g, 8, 4, 1, 1, '#ff6a8a');
    R(g, 1, 8, 3, 7, K); R(g, 10, 8, 3, 7, K);
  });
  S.pot = spr(12, 15, g => {
    R(g, 2, 1, 8, 2, '#2a1a0e'); R(g, 3, 3, 6, 2, '#6a4a2a');
    E(g, 6, 9, 5, 5, '#2a1a0e'); E(g, 6, 9, 4, 4, '#3f7a4e');
    R(g, 3, 6, 6, 1, '#5fbf6a'); R(g, 4, 9, 2, 2, '#9adf8a');
  });
  S.crate = spr(14, 14, g => {
    R(g, 1, 1, 12, 12, '#1a1009'); R(g, 2, 2, 10, 10, '#3a2312');
    R(g, 3, 3, 8, 8, '#2c1a0e');
    R(g, 2, 6, 10, 2, '#6a3f1e'); R(g, 6, 2, 2, 10, '#6a3f1e');
  });
  S.chest = spr(16, 14, g => {
    R(g, 1, 4, 14, 9, '#1a1009'); R(g, 2, 5, 12, 7, '#6a3f1e');
    R(g, 1, 2, 14, 4, '#24150b'); R(g, 2, 3, 12, 3, '#8a5a2a');
    R(g, 7, 5, 2, 7, '#2a1a0e'); R(g, 7, 6, 2, 3, EY);
    R(g, 3, 7, 2, 1, '#c98a4a'); R(g, 11, 7, 2, 1, '#c98a4a');
  });
  S.med = spr(12, 12, g => {
    R(g, 1, 2, 10, 9, '#0a140e'); R(g, 2, 3, 8, 7, '#d8e8c8');
    R(g, 5, 4, 2, 5, '#c23a2e'); R(g, 3, 6, 6, 2, '#c23a2e');
    R(g, 3, 9, 6, 1, '#6f8a7d');
  });
  S.pack = spr(12, 10, g => {
    R(g, 1, 1, 10, 8, '#0a140e'); R(g, 2, 2, 8, 6, '#2c3a2e');
    R(g, 3, 3, 2, 4, '#b8862a'); R(g, 6, 3, 2, 4, '#b8862a');
    R(g, 9, 3, 1, 4, '#6f8a7d'); R(g, 2, 7, 8, 1, '#6f8a7d');
  });
  S.plate = spr(12, 12, g => {
    R(g, 2, 1, 8, 2, '#6f8a7d'); R(g, 1, 3, 10, 6, '#8a9a8a');
    R(g, 3, 4, 6, 4, '#b8c8b0'); R(g, 5, 4, 2, 4, '#5f6f5f');
    R(g, 2, 9, 8, 2, '#5f6f5f'); R(g, 4, 10, 4, 1, '#2a3a32');
  });
  S.key = spr(10, 13, g => {
    R(g, 2, 1, 6, 8, '#1a1009'); R(g, 3, 2, 4, 6, '#b8862a');
    R(g, 4, 4, 2, 2, '#ffd166'); R(g, 3, 9, 4, 2, '#8a5a2a');
    R(g, 3, 10, 1, 2, '#ffd166'); R(g, 6, 10, 1, 2, '#ffd166');
  });
  S.stairs = spr(24, 18, g => {
    R(g, 1, 2, 22, 15, '#04100b');
    for (let i = 0; i < 4; i++) {
      R(g, 3 + i, 4 + i * 3, 18 - i * 2, 2, i % 2 ? '#2a6b46' : '#1b4a36');
    }
    R(g, 2, 1, 20, 1, '#5fbf6a'); R(g, 2, 16, 20, 1, '#5fbf6a');
    R(g, 10, 15, 4, 1, '#d6ff6a');
  });
  S.gun = spr(52, 38, g => {
    R(g, 12, 10, 24, 9, '#0a0e0c');
    R(g, 16, 7, 18, 4, '#2c3a2e');
    R(g, 23, 4, 4, 2, '#d6ff6a');
    R(g, 34, 11, 10, 6, '#1a2420');
    R(g, 41, 12, 6, 3, '#0a0e0c');
    R(g, 8, 18, 8, 18, '#24150b'); R(g, 10, 18, 4, 16, '#8a5a2a');
    R(g, 6, 33, 12, 4, '#0a0e0c'); R(g, 12, 14, 14, 10, '#1a2420');
  });

  const varCache = new Map();
  function variant(c, lv) {
    let v = varCache.get(c);
    if (!v) {
      v = [c];
      for (const f of [.72, .46, .26]) {
        const o = mk(c.width, c.height), g = sg(o);
        g.drawImage(c, 0, 0);
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = `rgba(0,0,0,${1 - f})`;
        g.fillRect(0, 0, c.width, c.height);
        v.push(o);
      }
      varCache.set(c, v);
    }
    return v[lv] || c;
  }

  /* ---------------------------------------------------------------- audio */
  let AC = null, master = null, noz = null, mt = null, ms = 0;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { }
  function ensureAudio() {
    if (AC) {
      if (AC.state === 'suspended') AC.resume();
      return;
    }
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    AC = new A();
    master = AC.createGain();
    master.gain.value = muted ? 0 : .55;
    master.connect(AC.destination);
    noz = AC.createBuffer(1, AC.sampleRate * .25, AC.sampleRate);
    const d = noz.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    music();
  }
  function tone(f, d, type, v, slide) {
    if (!AC || muted) return;
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + d);
  }
  function noise(d, v, cut) {
    if (!AC || muted || !noz) return;
    const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter(), t = AC.currentTime;
    s.buffer = noz;
    f.type = 'lowpass'; f.frequency.value = cut || 1200;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + d);
  }
  function sfxShot() { noise(.08, .1, 1600); tone(150, .08, 'square', .06, 50); }
  function sfxReload() { tone(280, .06, 'square', .04, 480); noise(.05, .035, 2200); }
  function sfxHit() { noise(.06, .08, 700); tone(170, .08, 'square', .05, 80); }
  function sfxDeath() { tone(180, .18, 'sawtooth', .06, 50); noise(.18, .08, 600); }
  function sfxWin() { [330, 440, 550, 660].forEach((f, i) => setTimeout(() => tone(f, .18, 'square', .05), i * 120)); }
  function sfxLose() { [180, 140, 100].forEach((f, i) => setTimeout(() => tone(f, .3, 'sawtooth', .07), i * 180)); }
  function music() {
    if (mt) return;
    mt = setInterval(() => {
      if (!AC || muted || state !== 'play') return;
      const i = ms++;
      if (i % 2 === 0) tone(110 * Math.pow(2, [0, 0, 3, 5, 0, -2, 3, 5][i / 2 % 8] / 12), .16, 'square', .026, 0);
      if (i % 4 === 1) tone(440 * Math.pow(2, [0, 3, 7, 3][i >> 2 & 3] / 12), .07, 'square', .014, 0);
    }, 230);
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { }
    if (master) master.gain.value = muted ? 0 : .55;
  }

  /* ---------------------------------------------------------------- estado */
  let state = 'menu';
  let mode = 1;
  try {
    const m = +localStorage.getItem(MODE_KEY);
    if (m >= 0 && m <= 2) mode = m;
  } catch (e) { }

  let map = new Uint8Array(MW * MH), seen = new Uint8Array(MW * MH);
  let rooms = [], ents = [];
  let floorN = 1, turnN = 0, runTime = 0, kills = 0, shots = 0, hits = 0;
  let hp = 8, maxHp = 8, mag = 6, ammoMax = 6, packs = 2, meds = 1, plates = 0;
  let hasKey = false, bossAlive = false;
  let pgx = 1, pgy = 1, px = 1.5, py = 1.5, pmx = 1, pmy = 1;
  let pdir = 0, pAng = 0, pAng0 = 0, pAngT = 0, pMoveT = 1, pTurnT = 1;
  let time = 0, menuAng = 0, flash = 0, nextFlash = 8, iframe = 0;
  let recoil = 0, muzzle = 0, hurtFlash = 0;
  let logs = [];
  let held = {}, heldCd = 0;
  const zbuf = new Float32Array(VW);

  function msg(t, color) {
    logs.unshift({ t, c: color || C.pale, life: 7 });
    if (logs.length > 4) logs.pop();
  }
  function cfg() { return MODES[mode]; }

  function idx(x, y) { return y * MW + x; }
  function wallAt(x, y) {
    return x < 0 || y < 0 || x >= MW || y >= MH || map[idx(x, y)] !== 0;
  }
  function entAt(x, y) {
    for (const e of ents) if (!e.dead && e.x === x && e.y === y) return e;
  }
  function cellFree(x, y, forEnemy) {
    if (wallAt(x, y)) return false;
    for (const e of ents) {
      if (e.dead || !e.solid || e.x !== x || e.y !== y) continue;
      if (forEnemy) return false;
      if (e.type === 'prop') return false;
    }
    return true;
  }
  function occupied(x, y) {
    for (const e of ents) if (!e.dead && e.x === x && e.y === y && (e.solid || e.type === 'exit')) return true;
    return false;
  }
  function los(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 10));
    for (let i = 1; i < n; i++) {
      const x = Math.floor(x0 + dx * i / n), y = Math.floor(y0 + dy * i / n);
      if (wallAt(x, y)) return false;
    }
    return true;
  }
  function addEnt(o) {
    o.vx = o.x + .5; o.vy = o.y + .5;
    o.anim = 1; o.born = -1; o.dead = false;
    ents.push(o);
    return o;
  }
  function addItem(kind, x, y) {
    addEnt({ type: 'item', kind, x, y, solid: false, size: .32, z: 0, bob: rnd(0, 6) });
  }
  function addProp(kind, x, y) {
    addEnt({ type: 'prop', kind, x, y, solid: true, size: kind === 'chest' ? .5 : .42, z: 0 });
  }
  function spawnEnemy(kind, x, y) {
    const base = kind === 'bat' ? [1, 1, .55, .3] :
      kind === 'skeleton' ? [2, 1, 1, 0] :
      kind === 'spider' ? [2, 1, .6, 0] :
      kind === 'monster' ? [4, 2, 1.5, 0] :
      kind === 'shadow' ? [999, 999, 1.7, 0] :
      kind === 'king' ? [12 + (mode === 2 ? 2 : 0), 2, 1.8, 0] : [1, 1, 1, 0];
    const tough = mode === 2 && kind !== 'clone' ? 2 : 0;
    return addEnt({
      type: 'enemy', kind, x, y, solid: true, hp: base[0] + tough, maxHp: base[0] + tough,
      dmg: base[1], size: base[2], z: base[3],
      cd: kind === 'king' ? 2 : 1, boss: kind === 'king'
    });
  }

  /* ------------------------------------------------------------- mazmorra */
  function carveRect(r) {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) map[idx(x, y)] = 0;
  }
  function carveH(x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) map[idx(x, y)] = 0;
  }
  function carveV(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) map[idx(x, y)] = 0;
  }
  function connect(a, b) {
    if (Math.random() < .5) {
      carveH(a.cx, b.cx, a.cy);
      carveV(a.cy, b.cy, b.cx);
    } else {
      carveV(a.cy, b.cy, a.cx);
      carveH(a.cx, b.cx, b.cy);
    }
  }
  function nearFloor(x, y) {
    return !wallAt(x - 1, y) || !wallAt(x + 1, y) || !wallAt(x, y - 1) || !wallAt(x, y + 1);
  }
  function bestDir(x, y) {
    let bd = 0, bl = -1;
    for (let d = 0; d < 4; d++) {
      let l = 0;
      while (l < 10 && !wallAt(x + DIRX[d] * (l + 1), y + DIRY[d] * (l + 1))) l++;
      if (l > bl) { bl = l; bd = d; }
    }
    return bd;
  }
  function roomCell(r) {
    return { x: ri(r.x, r.x + r.w - 1), y: ri(r.y, r.y + r.h - 1) };
  }
  function spawnCell(r, minDist) {
    for (let i = 0; i < 40; i++) {
      const c = roomCell(r);
      if (Math.abs(c.x - pgx) + Math.abs(c.y - pgy) < (minDist || 2)) continue;
      if (entAt(c.x, c.y)) continue;
      if (!occupied(c.x, c.y)) return c;
    }
    return null;
  }
  function genFloor(n) {
    floorN = n;
    map = new Uint8Array(MW * MH);
    map.fill(1);
    seen = new Uint8Array(MW * MH);
    ents = [];
    rooms = [];
    let guard = 0;
    while (rooms.length < 8 && guard++ < 400) {
      const w = ri(3, 7), h = ri(3, 7);
      const x = ri(1, MW - w - 2), y = ri(1, MH - h - 2);
      const r = { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) };
      let bad = false;
      for (const o of rooms)
        if (x < o.x + o.w + 1 && x + w + 1 > o.x && y < o.y + o.h + 1 && y + h + 1 > o.y) { bad = true; break; }
      if (bad) continue;
      carveRect(r);
      if (rooms.length) connect(rooms[rooms.length - 1], r);
      rooms.push(r);
    }
    for (let i = 0; i < 3 && rooms.length > 3; i++)
      connect(rooms[ri(0, rooms.length - 1)], rooms[ri(0, rooms.length - 1)]);

    const start = rooms[0];
    let exitRoom = rooms[0], exitD = -1;
    for (const r of rooms) {
      const d = Math.abs(r.cx - start.cx) + Math.abs(r.cy - start.cy);
      if (d > exitD) { exitD = d; exitRoom = r; }
    }
    let keyRoom = rooms[1] || start, keyD = -1;
    for (const r of rooms) {
      if (r === exitRoom || r === start) continue;
      const d = Math.abs(r.cx - start.cx) + Math.abs(r.cy - start.cy);
      if (d > keyD) { keyD = d; keyRoom = r; }
    }

    for (let y = 0; y < MH; y++)
      for (let x = 0; x < MW; x++) {
        const i = idx(x, y);
        if (map[i] !== 0 && nearFloor(x, y)) map[i] = 1 + ((x * 7 + y * 13 + n * 5) % 3);
      }
    pgx = start.cx; pgy = start.cy;
    px = pgx + .5; py = pgy + .5; pmx = pgx; pmy = pgy;
    pdir = bestDir(pgx, pgy);
    pAng = pAngT = pdir * Math.PI / 2;
    pMoveT = pTurnT = 1;
    hasKey = false;
    bossAlive = n >= 3;

    addEnt({ type: 'exit', kind: 'stairs', x: exitRoom.cx, y: exitRoom.cy, solid: false, size: .72, z: 0 });
    if (n < 3) addItem('key', keyRoom.cx, keyRoom.cy);

    if (n >= 3) {
      let bx = exitRoom.cx + 1, by = exitRoom.cy;
      if (!cellFree(bx, by, true)) { bx = exitRoom.cx - 1; }
      if (!cellFree(bx, by, true)) { bx = exitRoom.cx; by = exitRoom.cy + 1; }
      if (!cellFree(bx, by, true)) { bx = exitRoom.cx; by = exitRoom.cy - 1; }
      spawnEnemy('king', bx, by);
    }

    const spawnRooms = rooms.filter(r => r !== exitRoom && r !== start);
    const enemyN = Math.round((3 + n * 2 + (mode === 2 ? 3 : 0)) * cfg().mul);
    for (let i = 0; i < enemyN; i++) {
      const r = spawnRooms[ri(0, spawnRooms.length - 1)] || start;
      const c = spawnCell(r, 4);
      if (!c) continue;
      const rr2 = Math.random();
      const kind = rr2 < .3 ? 'bat' : rr2 < .52 ? 'spider' : n >= 2 && rr2 < .68 ? 'monster' : 'skeleton';
      spawnEnemy(kind, c.x, c.y);
    }
    for (let i = 1; i < rooms.length; i++) {
      const r = rooms[i];
      const propN = ri(0, 2);
      for (let j = 0; j < propN; j++) {
        const c = spawnCell(r, 2);
        if (!c) continue;
        addProp(Math.random() < .55 ? 'pot' : 'crate', c.x, c.y);
      }
      if (i === 2 || i === 5) {
        const c = spawnCell(r, 2);
        if (c) addProp('chest', c.x, c.y);
      }
    }
    const loot = ['med', 'pack', 'pack', 'plate'];
    for (let i = 0; i < 4 + n - (mode === 2 ? 2 : 0); i++) {
      const r = rooms[ri(1, rooms.length - 1)] || start;
      const c = spawnCell(r, 2);
      if (!c) continue;
      addItem(loot[ri(0, loot.length - 1)], c.x, c.y);
    }
    markSeen();
  }

  /* ---------------------------------------------------------------- turnos */
  function canAct() {
    return state === 'play' && pMoveT >= 1 && pTurnT >= 1;
  }
  function canShoot() {
    return state === 'play' && pTurnT >= 1;
  }
  function markSeen() {
    for (let y = Math.max(0, pgy - 6); y <= Math.min(MH - 1, pgy + 6); y++)
      for (let x = Math.max(0, pgx - 6); x <= Math.min(MW - 1, pgx + 6); x++) {
        if (Math.abs(x - pgx) + Math.abs(y - pgy) > 7) continue;
        if (los(pgx, pgy, x, y)) seen[idx(x, y)] = 1;
      }
    for (let y = Math.max(0, pgy - 6); y <= Math.min(MH - 1, pgy + 6); y++)
      for (let x = Math.max(0, pgx - 6); x <= Math.min(MW - 1, pgx + 6); x++)
        if (seen[idx(x, y)])
          for (let d = 0; d < 4; d++) {
            const nx = x + DIRX[d], ny = y + DIRY[d];
            if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && map[idx(nx, ny)]) seen[idx(nx, ny)] = 1;
          }
    seen[idx(pgx, pgy)] = 1;
  }
  function pickupAt(x, y) {
    for (const e of ents) {
      if (e.dead || e.type !== 'item' || e.x !== x || e.y !== y) continue;
      e.dead = true;
      if (e.kind === 'med') { meds++; msg('BOTIQUÍN +1 (×' + meds + ')'); }
      else if (e.kind === 'pack') { packs++; msg('CARGADOR +1 (×' + packs + ')'); }
      else if (e.kind === 'plate') { plates++; msg('PLACA +1 (×' + plates + ')'); }
      else if (e.kind === 'key') { hasKey = true; msg('TARJETA OBTENIDA', C.amber); }
    }
  }
  function endTurn() {
    if (state !== 'play') return;
    turnN++;
    iframe = 0;
    nextFlash--;
    if (nextFlash <= 0) {
      flash = 1.25;
      nextFlash = ri(7, 11);
      msg('DESTELLO', C.cyan);
    }
    enemiesAct();
    if (state === 'play') markSeen();
    ents = ents.filter(e => !e.dead || e.type === 'exit');
  }
  function tryMove(dx, dy) {
    if (!canAct()) return;
    const nx = pgx + dx, ny = pgy + dy;
    if (wallAt(nx, ny)) return;
    const e = entAt(nx, ny);
    if (e && e.type === 'enemy') { melee(e); return; }
    if (e && e.type === 'prop') {
      if (e.kind === 'chest') { msg('COFRE CERRADO — F', C.amber); return; }
      destroyProp(e);
      endTurn();
      return;
    }
    if (e && e.solid) return;
    pmx = pgx; pmy = pgy; pgx = nx; pgy = ny;
    px = pmx + .5; py = pmy + .5;
    pMoveT = 0;
    pickupAt(nx, ny);
    markSeen();
    endTurn();
  }
  function actMove(f) {
    if (!canAct()) return;
    tryMove(DIRX[pdir] * f, DIRY[pdir] * f);
  }
  function actStrafe(f) {
    const d = (pdir + (f > 0 ? 1 : 3)) % 4;
    tryMove(DIRX[d], DIRY[d]);
  }
  function actTurn(d) {
    if (state !== 'play' || pTurnT < 1) return;
    pdir = (pdir + d + 4) % 4;
    pAng0 = pAng;
    pAngT += d * Math.PI / 2;
    pTurnT = 0;
  }
  function targetInSight() {
    let bestE = null, bestD = 10;
    for (const e of ents) {
      if (e.dead || e.kind === 'shadow' || (e.type !== 'enemy' && e.type !== 'prop')) continue;
      const dx = e.x + .5 - px, dy = e.y + .5 - py;
      const d = Math.hypot(dx, dy);
      if (d > 9 || d >= bestD) continue;
      if (Math.abs(angNorm(Math.atan2(dy, dx) - pAng)) > .2) continue;
      if (!los(pgx, pgy, e.x, e.y)) continue;
      bestD = d; bestE = e;
    }
    return bestE;
  }
  function shoot() {
    if (!canShoot()) return;
    if (mag <= 0) { msg('SIN MUNICIÓN — R', C.red); return; }
    mag--; shots++; recoil = 1; muzzle = .09; sfxShot();
    const t = targetInSight();
    if (t) {
      if (t.type === 'enemy') {
        hits++;
        damageEnemy(t, 2);
      } else {
        destroyProp(t);
      }
    } else {
      msg('DISPARO PERDIDO', C.dim);
    }
    endTurn();
  }
  function reload() {
    if (state !== 'play' || pTurnT < 1) return;
    if (mag >= ammoMax) { msg('CARGADOR LLENO', C.dim); return; }
    if (packs <= 0) { msg('SIN CARGADORES', C.red); return; }
    packs--; mag = ammoMax; sfxReload(); msg('RECARGADO'); endTurn();
  }
  function useItem(n) {
    if (!canAct()) return;
    if (n === 1) {
      if (meds <= 0) { msg('SIN BOTIQUINES', C.red); return; }
      if (hp >= maxHp) { msg('VIDA LLENA', C.dim); return; }
      meds--; hp = Math.min(maxHp, hp + 4); msg('BOTIQUÍN USADO', C.green); endTurn();
    } else if (n === 2) {
      if (packs <= 0 || mag >= ammoMax) { msg('NO PUEDES RECARGAR', C.red); return; }
      packs--; mag = ammoMax; sfxReload(); msg('RECARGADO'); endTurn();
    } else if (n === 3) {
      if (plates <= 0) { msg('SIN PLACAS', C.red); return; }
      plates--; maxHp += 2; hp = Math.min(maxHp, hp + 2); msg('PLACA +2 VIDA', C.green); endTurn();
    }
  }
  function interact() {
    if (!canAct()) return;
    const here = entAt(pgx, pgy);
    if (here && here.type === 'exit') { tryExit(); return; }
    const nx = pgx + DIRX[pdir], ny = pgy + DIRY[pdir];
    const e = entAt(nx, ny);
    if (e && e.type === 'exit') { tryExit(); return; }
    if (e && e.type === 'prop') {
      if (e.kind === 'chest') { openChest(e); endTurn(); }
      else { destroyProp(e); endTurn(); }
      return;
    }
    msg('NADA QUE USAR', C.dim);
  }
  function tryExit() {
    if (floorN >= 3) {
      if (bossAlive) { msg('EL REY BLOQUEA LA SALIDA', C.red); return; }
      winGame();
      return;
    }
    if (!hasKey) { msg('FALTA LA TARJETA', C.amber); return; }
    nextFloor();
  }
  function nextFloor() {
    hasKey = false;
    floorN++;
    genFloor(floorN);
    hp = Math.min(maxHp, hp + 2);
    msg('SECTOR B' + floorN, C.cyan);
  }
  function melee(e) {
    sfxHit();
    damageEnemy(e, 1);
    endTurn();
  }
  function damageEnemy(e, n) {
    if (e.dead) return;
    e.hp -= n;
    if (e.hp <= 0) killEnemy(e);
    else msg(e.kind === 'king' ? 'EL REY RESISTE' : 'IMPACTO', C.green);
  }
  function killEnemy(e) {
    e.dead = true;
    kills++;
    sfxDeath();
    if (e.kind === 'clone') msg('COPIA DISUELTA', C.cyan);
    if (e.boss) {
      bossAlive = false;
      for (const o of ents) if (!o.dead && o.kind === 'clone') o.dead = true;
      if (mode === 2) {
        const ex = ents.find(x => x.type === 'exit');
        if (ex) { ex.x = rooms[0].cx; ex.y = rooms[0].cy; ex.vx = ex.x + .5; ex.vy = ex.y + .5; }
        let sx = e.x, sy = e.y;
        if (ex) {
          const dx = sign(pgx - ex.x), dy = sign(pgy - ex.y);
          for (const o of [[dx, dy], [dx, 0], [0, dy]]) {
            const nx = pgx + o[0], ny = pgy + o[1];
            if ((o[0] || o[1]) && cellFree(nx, ny, true) && !(nx === ex.x && ny === ex.y)) { sx = nx; sy = ny; break; }
          }
        }
        const s = spawnEnemy('shadow', sx, sy);
        s.delay = 3;
        msg('¡CORRE!', C.red);
      } else msg('EL REY HUESO CAYÓ', C.amber);
    }
    dropLoot(e.x, e.y, e.boss);
  }
  function destroyProp(e) {
    if (e.dead) return;
    e.dead = true;
    sfxHit();
    dropLoot(e.x, e.y, false);
    msg(e.kind === 'pot' ? 'FRASCO ROTO' : 'CAJA DESTROZADA', C.dim);
  }
  function openChest(e) {
    e.dead = true;
    msg('COFRE ABIERTO', C.amber);
    dropLoot(e.x, e.y, false);
    dropLoot(e.x, e.y, false);
  }
  function dropLoot(x, y, boss) {
    if (boss) {
      addItem('med', x, y); addItem('pack', x, y); addItem('plate', x, y);
      return;
    }
    if (Math.random() > (mode === 2 ? .4 : .62)) return;
    const r = Math.random();
    if (r < .3) addItem('med', x, y);
    else if (r < .6) addItem('pack', x, y);
    else addItem('plate', x, y);
  }
  function spawnClone() {
    let count = 0;
    for (const e of ents) if (!e.dead && e.kind === 'clone') count++;
    if (count >= 3) return false;
    const dirs = [[DIRX[pdir], DIRY[pdir]], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (const d of dirs) {
      const x = pgx + d[0], y = pgy + d[1];
      if (!cellFree(x, y, true) || x === pgx && y === pgy) continue;
      const c = spawnEnemy('clone', x, y);
      c.born = turnN;
      msg('COPIA — ELIMÍNALA', C.red);
      return true;
    }
    return false;
  }
  function hurtPlayer(n, src) {
    if (state !== 'play' || iframe > 0) return;
    hp -= n;
    iframe = 1;
    hurtFlash = .32;
    if (src === 'king') spawnClone();
    if (hp <= 0) {
      hp = 0;
      die();
    } else {
      msg(src === 'king' ? 'EL REY TE GOLPEA' : src === 'clone' ? 'TU COPIA TE ALCANZA' : src === 'shadow' ? 'LA SOMBRA TE ALCANZÓ' : 'RECIBES DAÑO', C.red);
    }
  }
  function enemiesAct() {
    const list = ents.filter(e => e.type === 'enemy' && !e.dead && e.born !== turnN);
    for (const e of list) {
      if (state !== 'play') break;
      const d = Math.abs(e.x - pgx) + Math.abs(e.y - pgy);
      if (e.kind === 'shadow') {
        if (e.delay) { e.delay--; continue; }
        if (d <= 1) { iframe = 0; hurtPlayer(999, 'shadow'); }
        else { stepToward(e); stepToward(e); }
        continue;
      }
      if (e.kind === 'king') {
        if (!e.summoned && d <= 9 && los(e.x, e.y, pgx, pgy) && spawnClone()) e.summoned = true;
        e.cd--;
        if (d > 1 && d <= 7 && e.cd <= 0 && los(e.x, e.y, pgx, pgy)) {
          tone(240, .16, 'sawtooth', .05, 120);
          hurtPlayer(1, 'king');
          e.cd = 3;
          continue;
        }
      }
      if (d === 1) {
        hurtPlayer(e.dmg, e.kind === 'king' ? 'king' : e.kind === 'clone' ? 'clone' : 'skeleton');
      } else if (e.kind === 'monster' && turnN % 2) {
        continue;
      } else if (d <= 9 && (d <= 4 || los(e.x, e.y, pgx, pgy))) {
        stepToward(e);
        if ((e.kind === 'bat' || e.kind === 'spider') && d > 5) stepToward(e);
      }
      if (e.hp <= 0) e.dead = true;
    }
  }
  function stepToward(e) {
    const ex = e.kind === 'shadow' && ents.find(x => x.type === 'exit');
    const dx = sign(pgx - e.x), dy = sign(pgy - e.y);
    const opts = [];
    if (dx) opts.push([dx, 0]);
    if (dy) opts.push([0, dy]);
    if (Math.random() < .5) opts.reverse();
    for (const o of opts) {
      const nx = e.x + o[0], ny = e.y + o[1];
      if (cellFree(nx, ny, true) && !(nx === pgx && ny === pgy) && !(ex && nx === ex.x && ny === ex.y)) { moveEnemy(e, nx, ny); return; }
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
      const nx = e.x + d[0], ny = e.y + d[1];
      if (cellFree(nx, ny, true) && !(nx === pgx && ny === pgy) && !(ex && nx === ex.x && ny === ex.y)) { moveEnemy(e, nx, ny); return; }
    }
  }
  function moveEnemy(e, nx, ny) {
    e.vx = e.x + .5; e.vy = e.y + .5;
    e.x = nx; e.y = ny;
    e.anim = 0;
  }

  /* ----------------------------------------------------------- iluminación */
  function lightAt(x, y) {
    if (flash > 0) return 0;
    const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
    const a = Math.abs(angNorm(Math.atan2(dy, dx) - pAng));
    if (d < 1.8) return 0;
    if (d < 8 && a < .62) return d < 5 ? 0 : 1;
    return 3;
  }

  /* -------------------------------------------------------------- render 3D */
  function renderWorld(showGun) {
    const dirX = Math.cos(pAng), dirY = Math.sin(pAng);
    const planeX = -dirY * .66, planeY = dirX * .66;
    const horizon = VH / 2 + (pMoveT < 1 ? Math.sin(pMoveT * Math.PI) * 1.5 : 0);
    const flick = .86 + .08 * Math.sin(time * 11) + .04 * Math.sin(time * 23);
    const ray0X = dirX - planeX, ray0Y = dirY - planeY;
    const ray1X = dirX + planeX, ray1Y = dirY + planeY;
    const fl = flash > 0 ? 7 : -1;

    for (let y = 0; y < VH; y++) {
      const isFloor = y > horizon;
      const p = isFloor ? y - horizon : horizon - y;
      const row = y * VW;
      if (p < 1) {
        const c = fl >= 0 ? 0xff506040 : 0xff040a08;
        for (let x = 0; x < VW; x++) buf[row + x] = c;
        continue;
      }
      const rowDist = (0.5 * VH) / p;
      const stepX = rowDist * (ray1X - ray0X) / VW;
      const stepY = rowDist * (ray1Y - ray0Y) / VW;
      let fx = px + rowDist * ray0X, fy = py + rowDist * ray0Y;
      const tex = isFloor ? FLOOR : CEIL;
      for (let x = 0; x < VW; x++) {
        const tx = (fx * 16 | 0) & 15, ty = (fy * 16 | 0) & 15;
        let lv;
        if (fl >= 0) lv = 7;
        else {
          const cx = Math.abs(x / VW * 2 - 1);
          const cone = .16 + .84 * Math.max(0, 1 - cx * cx * 1.45);
          lv = clamp(Math.round(7 * cone * Math.max(0, 1 - rowDist / 11) * flick), 0, 7);
        }
        buf[row + x] = tex[lv][ty * 16 + tx];
        fx += stepX; fy += stepY;
      }
    }

    for (let x = 0; x < VW; x++) {
      const cameraX = 2 * x / VW - 1;
      const rdx = dirX + planeX * cameraX, rdy = dirY + planeY * cameraX;
      let mapX = Math.floor(px), mapY = Math.floor(py);
      const ddx = Math.abs(1 / (rdx || .0001)), ddy = Math.abs(1 / (rdy || .0001));
      let sx, sy, side, hit = 0, steps = 0;
      if (rdx < 0) { sx = -1; sx = (px - mapX) * ddx; } else { sx = 1; sx = (mapX + 1 - px) * ddx; }
      if (rdy < 0) { sy = -1; sy = (py - mapY) * ddy; } else { sy = 1; sy = (mapY + 1 - py) * ddy; }
      while (!hit && steps++ < 40) {
        if (sx < sy) { sx += ddx; mapX += sign(rdx); side = 0; }
        else { sy += ddy; mapY += sign(rdy); side = 1; }
        if (mapX < 0 || mapY < 0 || mapX >= MW || mapY >= MH) { hit = 1; break; }
        hit = map[idx(mapX, mapY)] ? 1 : 0;
      }
      if (!hit) { zbuf[x] = 99; continue; }
      const perp = side === 0
        ? (mapX - px + (1 - sign(rdx)) / 2) / (rdx || .0001)
        : (mapY - py + (1 - sign(rdy)) / 2) / (rdy || .0001);
      const dist = Math.max(.05, perp);
      zbuf[x] = dist;
      const lineH = VH / dist;
      const drawStart = Math.floor(-lineH / 2 + horizon);
      const drawEnd = Math.ceil(lineH / 2 + horizon);
      const wallType = map[idx(mapX, mapY)] || 1;
      let wallX = side === 0 ? py + dist * rdy : px + dist * rdx;
      wallX -= Math.floor(wallX);
      let texX = (wallX * 16) | 0;
      if (side === 0 && rdx > 0) texX = 15 - texX;
      if (side === 1 && rdy < 0) texX = 15 - texX;
      texX = clamp(texX, 0, 15);
      const step = 16 / lineH;
      const y0 = Math.max(0, drawStart), y1 = Math.min(VH, drawEnd);
      let texPos = (y0 - horizon + lineH / 2) * step;
      let lv;
      if (flash > 0) lv = 7;
      else {
        const cx = Math.abs(cameraX);
        const cone = .22 + .78 * Math.max(0, 1 - cx * cx * 1.45);
        lv = clamp(Math.round(7 * cone * Math.max(0, 1 - dist / 10) * flick * (side ? .76 : 1)), 0, 7);
      }
      const tex = TEX[wallType] || TEX[1];
      const ts = tex[lv];
      for (let y = y0; y < y1; y++) {
        const ty = (texPos | 0) & 15;
        texPos += step;
        buf[y * VW + x] = ts[ty * 16 + texX];
      }
    }
    pctx.putImageData(img, 0, 0);

    const list = [];
    for (const e of ents) {
      if (e.dead) continue;
      const dx = e.vx - px, dy = e.vy - py;
      const inv = 1 / (planeX * dirY - dirX * planeY);
      const tx = inv * (dirY * dx - dirX * dy);
      const ty = inv * (-planeY * dx + planeX * dy);
      if (ty > .18) list.push({ e, tx, ty });
    }
    list.sort((a, b) => b.ty - a.ty);
    for (const o of list) {
      const e = o.e, ty = o.ty, tx = o.tx;
      const sp = spriteFor(e);
      if (!sp) continue;
      const hpx = e.size * VH / ty;
      const wpx = hpx * sp.width / sp.height;
      const bottom = VH / 2 + (0.5 - e.z) * VH / ty;
      const top = bottom - hpx;
      const sx = (VW / 2) * (1 + tx / ty) - wpx / 2;
      const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(VW, Math.ceil(sx + wpx));
      if (x1 <= x0 || bottom < 0 || top > VH) continue;
      const lv = lightAt(e.vx, e.vy);
      const imgSpr = variant(sp, lv === 0 ? 0 : lv === 1 ? 1 : 3);
      for (let x = x0; x < x1; x++) {
        if (ty >= zbuf[x]) continue;
        const u = (x - sx) / wpx;
        const srcX = Math.floor(u * sp.width);
        pctx.drawImage(imgSpr, srcX, 0, 1, sp.height, x, top, 1, hpx + .6);
      }
      if (e.type === 'enemy' && lv >= 2) {
        const gx = Math.round(sx + wpx * .38), gy = Math.round(top + hpx * .2);
        if (gx >= 0 && gx < VW && ty < zbuf[gx]) {
          pctx.globalCompositeOperation = 'lighter';
          pctx.fillStyle = '#ff6a8a';
          pctx.fillRect(gx, gy, 2, 2);
          pctx.fillRect(gx + Math.max(2, Math.round(wpx * .2)), gy, 2, 2);
          pctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    if (showGun) drawGun();
  }
  function spriteFor(e) {
    if (e.type === 'enemy')
      return e.kind === 'bat' ? S.bat : e.kind === 'spider' || e.kind === 'monster' ? S.spider : e.kind === 'clone' ? S.clone : S.skeleton;
    if (e.type === 'prop') return e.kind === 'pot' ? S.pot : e.kind === 'crate' ? S.crate : S.chest;
    if (e.type === 'item') {
      return e.kind === 'med' ? S.med : e.kind === 'pack' ? S.pack : e.kind === 'plate' ? S.plate : S.key;
    }
    if (e.type === 'exit') return S.stairs;
    return null;
  }
  function drawGun() {
    const bob = Math.sin(time * 7) * (pMoveT < 1 ? 2 : .5);
    const rec = recoil * 8;
    pctx.drawImage(S.gun, VW - 84 + bob, VH - 48 + rec, 62, 46);
    if (muzzle > 0) {
      pctx.globalCompositeOperation = 'lighter';
      pctx.fillStyle = '#fff0a0';
      pctx.beginPath();
      pctx.arc(VW - 18 + bob, VH - 36 + rec, 7 + recoil * 7, 0, 6.283);
      pctx.fill();
      pctx.fillStyle = '#ffd166';
      pctx.beginPath();
      pctx.arc(VW - 18 + bob, VH - 36 + rec, 13 + recoil * 9, 0, 6.283);
      pctx.fill();
      pctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ------------------------------------------------------------------- HUD */
  function drawHud() {
    const target = targetInSight();
    // vida
    rr(20, 16, 280, 30, 6);
    ctx.fillStyle = 'rgba(3,10,7,.82)'; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    const bw = 262 * clamp(hp / maxHp, 0, 1);
    ctx.fillStyle = hp <= maxHp * .3 ? C.red : C.green;
    ctx.fillRect(29, 25, bw, 12);
    text('VIDA ' + hp + '/' + maxHp, 34, 36, 13, C.white);
    // botones
    drawBtn(312, 16, 'II', state === 'paused');
    drawBtn(354, 16, muted ? 'M×' : 'M', muted);
    // inventario
    rr(20, 52, 330, 28, 6);
    ctx.fillStyle = 'rgba(3,10,7,.82)'; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
    text('1 BOTIQUÍN ×' + meds + ' · 2 CARGADOR ×' + packs + ' · 3 PLACA ×' + plates, 30, 70, 9, C.pale);
    // sector
    text('SECTOR ' + FLOORS[floorN - 1] + ' · ' + (hasKey ? 'TARJETA OK' : floorN >= 3 ? (bossAlive ? 'MATA AL REY' : 'SALIDA LIBRE') : 'BUSCA LA TARJETA'), W / 2, 40, 11, C.amber, 'center');
    // minimapa
    drawMap();
    drawBossBar();
    // munición
    const aw = ammoMax * 16 + 40, hx = W / 2 - aw / 2, hy = H - 50;
    rr(hx, hy, aw, 34, 8);
    ctx.fillStyle = 'rgba(3,10,7,.84)'; ctx.fill();
    ctx.strokeStyle = C.line; ctx.stroke();
    for (let i = 0; i < ammoMax; i++) {
      const bx = hx + 20 + i * 16;
      ctx.fillStyle = i < mag ? C.amber : 'rgba(255,209,102,.15)';
      ctx.fillRect(bx, hy + 11, 9, 12);
    }
    // crosshair
    const cx = W / 2, cy = H / 2;
    ctx.strokeStyle = target ? C.amber : 'rgba(125,255,90,.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 12);
    ctx.stroke();
    ctx.fillStyle = target ? C.amber : 'rgba(125,255,90,.8)';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
    // mensajes
    for (let i = 0; i < Math.min(3, logs.length); i++) {
      const l = logs[i], a = clamp(l.life / 2, 0, 1);
      ctx.globalAlpha = a;
      text(l.t, 24, 94 + i * 18, 12, l.c);
      ctx.globalAlpha = 1;
    }
    // prompt
    const pr = promptText();
    if (pr) {
      ctx.globalAlpha = .85 + .15 * Math.sin(time * 5);
      text(pr, W / 2, H - 92, 13, C.amber, 'center');
      ctx.globalAlpha = 1;
    }
    drawWarn();
    if (isTouch) drawTouch();
  }
  function drawBossBar() {
    const k = ents.find(e => e.kind === 'king' && !e.dead);
    if (!k) return;
    const x = 360, y = 52, w = 400;
    rr(x, y, w, 34, 6);
    ctx.fillStyle = 'rgba(10,3,3,.86)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,74,90,.55)'; ctx.lineWidth = 1; ctx.stroke();
    text('REY HUESO', x + 10, y + 12, 9, C.amber);
    ctx.fillStyle = 'rgba(255,74,90,.18)';
    ctx.fillRect(x + 10, y + 18, w - 20, 8);
    ctx.fillStyle = C.red;
    ctx.fillRect(x + 10, y + 18, (w - 20) * clamp(k.hp / k.maxHp, 0, 1), 8);
  }
  function drawWarn() {
    if (state !== 'play') return;
    const sh = ents.some(e => e.kind === 'shadow' && !e.dead);
    const lowHp = hp <= maxHp * .3, lowAmmo = mag <= 2;
    if (!sh && !lowHp && !lowAmmo) return;
    let w = sh ? '¡CORRE A LA SALIDA!' : '';
    if (!sh) {
      if (lowHp) w = '¡VIDA BAJA!';
      if (lowAmmo) w += (w ? ' · ' : '') + (packs ? '¡POCAS BALAS!' : '¡SIN MUNICIÓN!');
    }
    const a = .70 + .30 * Math.sin(time * 9);
    ctx.globalAlpha = a;
    rr(W / 2 - 230, H / 2 + 64, 460, 40, 8);
    ctx.fillStyle = 'rgba(10,3,3,.86)'; ctx.fill();
    ctx.strokeStyle = sh || lowHp ? C.red : C.amber; ctx.lineWidth = 2; ctx.stroke();
    text(w, W / 2, H / 2 + 90, 15, sh || lowHp ? C.red : C.amber, 'center');
    ctx.globalAlpha = 1;
  }
  function drawBtn(x, y, label, active) {
    rr(x, y, 34, 30, 5);
    ctx.fillStyle = active ? 'rgba(125,255,90,.18)' : 'rgba(3,10,7,.82)';
    ctx.fill();
    ctx.strokeStyle = active ? C.green : C.line;
    ctx.stroke();
    text(label, x + 17, y + 20, 11, active ? C.green : C.pale, 'center');
  }
  function drawMap() {
    const mx = W - 152, my = 16, ms = 136, off = 8, cs = 5;
    rr(mx, my, ms, ms, 6);
    ctx.fillStyle = 'rgba(2,10,14,.88)'; ctx.fill();
    ctx.strokeStyle = 'rgba(141,232,255,.40)'; ctx.lineWidth = 1; ctx.stroke();
    for (let y = 0; y < MH; y++)
      for (let x = 0; x < MW; x++) {
        const i = idx(x, y);
        if (!seen[i]) continue;
        ctx.fillStyle = map[i] ? 'rgba(141,232,255,.44)' : 'rgba(20,70,80,.74)';
        ctx.fillRect(mx + off + x * cs, my + off + y * cs, cs, cs);
      }
    for (const e of ents) {
      if (e.dead || !seen[idx(e.x, e.y)]) continue;
      if (e.type === 'enemy') {
        const d = e.boss ? 7 : 4;
        ctx.fillStyle = e.boss ? C.amber : C.red;
        ctx.fillRect(mx + off + e.x * cs + (cs - d) / 2, my + off + e.y * cs + (cs - d) / 2, d, d);
      } else if (e.type === 'exit') {
        ctx.fillStyle = bossAlive && floorN >= 3 ? C.red : C.lime;
        ctx.fillRect(mx + off + e.x * cs, my + off + e.y * cs, cs, cs);
      } else if (e.kind === 'key') {
        ctx.fillStyle = C.amber;
        ctx.fillRect(mx + off + e.x * cs, my + off + e.y * cs, cs, cs);
      }
    }
    const pxm = mx + off + pgx * cs + 2, pym = my + off + pgy * cs + 2;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.moveTo(pxm + DIRX[pdir] * 5, pym + DIRY[pdir] * 5);
    ctx.lineTo(pxm - DIRX[pdir] * 2 - DIRY[pdir] * 3, pym - DIRY[pdir] * 2 + DIRX[pdir] * 3);
    ctx.lineTo(pxm - DIRX[pdir] * 2 + DIRY[pdir] * 3, pym - DIRY[pdir] * 2 - DIRX[pdir] * 3);
    ctx.closePath();
    ctx.fill();
  }
  function promptText() {
    const p = isTouch ? '' : 'F  ';
    const nx = pgx + DIRX[pdir], ny = pgy + DIRY[pdir];
    const here = entAt(pgx, pgy), front = entAt(nx, ny);
    if (here && here.type === 'exit') return p + (floorN >= 3 ? (bossAlive ? 'SALIDA BLOQUEADA' : 'EXTRAERSE') : (hasKey ? 'BAJAR' : 'FALTA LA TARJETA'));
    if (front && front.type === 'exit') return p + (floorN >= 3 ? (bossAlive ? 'SALIDA BLOQUEADA' : 'EXTRAERSE') : (hasKey ? 'BAJAR' : 'FALTA LA TARJETA'));
    if (front && front.type === 'prop') return p + (front.kind === 'chest' ? 'ABRIR COFRE' : 'ROMPER');
    return '';
  }
  function drawTouch() {
    touchRects.length = 0;
    const y = H - 108;
    touchBtn(20, y - 26, 58, 44, '▲', 'fwd');
    touchBtn(20, y + 24, 58, 44, '▼', 'back');
    touchBtn(84, y, 46, 48, '◀', 'left');
    touchBtn(136, y, 46, 48, '▶', 'right');
    touchBtn(W - 132, y - 10, 114, 72, 'FUEGO', 'fire');
    touchBtn(W - 252, y + 32, 116, 42, 'RECARGA', 'reload');
    touchBtn(W - 252, y - 18, 116, 42, promptText() ? 'ACCIÓN' : 'USAR', 'use');
  }
  const touchRects = [];
  function touchBtn(x, y, w, h, label, act) {
    rr(x, y, w, h, 7);
    ctx.fillStyle = 'rgba(3,10,7,.72)'; ctx.fill();
    ctx.strokeStyle = 'rgba(125,255,90,.35)'; ctx.stroke();
    text(label, x + w / 2, y + h / 2 + 5, 12, C.pale, 'center');
    touchRects.push({ x, y, w, h, act });
  }

  /* ---------------------------------------------------------------- menús */
  const menuRects = [];
  function drawMenu() {
    ctx.fillStyle = 'rgba(2,6,4,.58)';
    ctx.fillRect(0, 0, W, H);

    text('MIMESIS', W / 2, 132, 92, C.green, 'center', SANS);
    ctx.globalAlpha = .35;
    text('MIMESIS', W / 2 - 5, 132, 92, C.cyan, 'center', SANS);
    text('MIMESIS', W / 2 + 5, 132, 92, C.amber, 'center', SANS);
    ctx.globalAlpha = 1;
    text('DESCENSO', W / 2, 172, 30, C.white, 'center', SANS);
    text('EL LABORATORIO TE COPIA', W / 2, 202, 12, C.dim, 'center');

    menuRects.length = 0;
    const cw = 210, gap = 15, mx = W / 2 - (cw * 3 + gap * 2) / 2;
    for (let i = 0; i < 3; i++) {
      const m = MODES[i], x = mx + i * (cw + gap), y = 248, sel = mode === i;
      rr(x, y, cw, 86, 8);
      ctx.fillStyle = sel ? 'rgba(125,255,90,.16)' : 'rgba(3,10,7,.76)'; ctx.fill();
      ctx.strokeStyle = sel ? C.green : C.line; ctx.lineWidth = sel ? 2 : 1; ctx.stroke();
      text(m.name, x + cw / 2, y + 28, 20, sel ? C.white : C.pale, 'center');
      text(m.hp + ' VIDA · ' + m.mag + ' BALAS', x + cw / 2, y + 49, 10, sel ? C.green : C.dim, 'center');
      menuRects.push({ x, y, w: cw, h: 86, act: 'mode', i });
    }
    const sx = W / 2 - 190, sy = 360;
    rr(sx, sy, 380, 52, 9);
    ctx.fillStyle = 'rgba(125,255,90,.14)'; ctx.fill();
    ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = .8 + .2 * Math.sin(time * 4);
    text('ENTRAR AL SECTOR B1', W / 2, sy + 34, 20, C.white, 'center');
    ctx.globalAlpha = 1;
    menuRects.push({ x: sx, y: sy, w: 380, h: 52, act: 'start' });

    text('WASD mover · A/D girar · Q/E lateral', W / 2, 444, 10, C.dim, 'center');
    text('CLIC/ESPACIO disparar · F usar · R recargar', W / 2, 462, 10, C.dim, 'center');
    text('1/2/3 objetos · P pausa · M silencio · móvil: botones', W / 2, 480, 10, C.dim, 'center');
  }
  function drawOverlay() {
    if (state === 'paused') {
      ctx.fillStyle = 'rgba(2,6,4,.7)'; ctx.fillRect(0, 0, W, H);
      text('PAUSA', W / 2, 250, 46, C.white, 'center', SANS);
      text('P O ESC PARA SEGUIR', W / 2, 292, 15, C.green, 'center');
      return;
    }
    const dead = state === 'dead', win = state === 'win';
    if (!dead && !win) return;
    ctx.fillStyle = 'rgba(2,6,4,.82)'; ctx.fillRect(0, 0, W, H);
    const title = win ? 'EXTRACCIÓN COMPLETA' : 'TE COPIARON';
    text(title, W / 2, 140, win ? 54 : 62, win ? C.green : C.white, 'center', SANS);
    text(win ? 'EL REY HUESO CAYÓ' : 'EL LABERINTO TE COPIÓ', W / 2, 172, 13, win ? C.lime : C.red, 'center');
    const score = finalScore();
    const rk = rankFor(score);
    text(rk, W / 2, 260, 82, win ? C.green : C.amber, 'center', SANS);
    text('RANGO', W / 2, 284, 10, C.dim, 'center');
    text('SECTOR B' + floorN + ' · ' + turnN + ' TURNOS · ' + Math.floor(runTime) + ' SEG · ' + kills + ' BAJAS', W / 2, 322, 13, C.white, 'center');
    text(shots + ' DISPAROS · ' + accuracy() + '% PRECISIÓN', W / 2, 344, 12, C.pale, 'center');
    text(score + ' PTS', W / 2, 366, 12, C.amber, 'center');
    ctx.globalAlpha = .8 + .2 * Math.sin(time * 4);
    text('TOCA O PULSA ESPACIO', W / 2, 442, 17, C.green, 'center');
    ctx.globalAlpha = 1;
  }
  function rankFor(s) {
    if (s >= 7600) return 'S';
    if (s >= 5600) return 'A';
    if (s >= 3600) return 'B';
    return 'C';
  }
  function accuracy() { return shots ? Math.round(hits / shots * 100) : 100; }
  function finalScore() {
    return floorN * 1200 + kills * 80 + Math.max(0, 2200 - turnN * 4) + (state === 'win' ? 2500 : 0);
  }
  function die() {
    state = 'dead';
    sfxLose();
  }
  function winGame() {
    state = 'win';
    sfxWin();
  }

  /* --------------------------------------------------------------- partida */
  function startRun(i) {
    mode = i;
    try { localStorage.setItem(MODE_KEY, String(mode)); } catch (e) { }
    const m = cfg();
    hp = maxHp = m.hp;
    ammoMax = m.mag; mag = m.mag; packs = m.packs; meds = m.meds; plates = m.plates;
    turnN = 0; runTime = 0; kills = 0; shots = 0; hits = 0;
    flash = 0; nextFlash = 8; iframe = 0; recoil = 0; muzzle = 0; hurtFlash = 0;
    logs = []; bossAlive = false;
    floorN = 1;
    genFloor(1);
    state = 'play';
  }
  function toMenu() {
    state = 'menu';
    floorN = 1;
    genFloor(1);
    menuAng = pAng = pdir * Math.PI / 2;
    pAngT = pAng;
    logs = [];
    held = {};
  }

  /* ---------------------------------------------------------------- update */
  function update(dt) {
    time += dt;
    if (state === 'menu') {
      pAng = menuAng + Math.sin(time * .32) * .07;
      px = pgx + .5; py = pgy + .5;
    } else {
      if (state === 'play') runTime += dt;
      if (pMoveT < 1) {
        pMoveT = Math.min(1, pMoveT + dt / .12);
        const t = pMoveT * pMoveT * (3 - 2 * pMoveT);
        px = lerp(pmx + .5, pgx + .5, t);
        py = lerp(pmy + .5, pgy + .5, t);
      }
      if (pTurnT < 1) {
        pTurnT = Math.min(1, pTurnT + dt / .1);
        const t = pTurnT * pTurnT * (3 - 2 * pTurnT);
        pAng = lerp(pAng0, pAngT, t);
      }
      for (const e of ents) {
        if (e.anim < 1) {
          e.anim = Math.min(1, e.anim + dt / .13);
          const t = e.anim * e.anim * (3 - 2 * e.anim);
          e.vx = lerp(e.vx, e.x + .5, Math.min(1, t * 1.8));
          e.vy = lerp(e.vy, e.y + .5, Math.min(1, t * 1.8));
        }
      }
      if (state === 'play') handleHeld(dt);
    }
    flash = Math.max(0, flash - dt);
    recoil = Math.max(0, recoil - dt * 7);
    muzzle = Math.max(0, muzzle - dt);
    hurtFlash = Math.max(0, hurtFlash - dt);
    for (const l of logs) l.life -= dt;
    while (logs.length && logs[logs.length - 1].life <= 0) logs.pop();
  }
  function handleHeld(dt) {
    if (!canAct()) { heldCd = Math.min(heldCd, .06); return; }
    heldCd -= dt;
    if (heldCd > 0) return;
    let acted = false;
    if (held.w) { actMove(1); acted = true; }
    else if (held.s) { actMove(-1); acted = true; }
    else if (held.a) { actTurn(-1); acted = true; }
    else if (held.d) { actTurn(1); acted = true; }
    else if (held.q) { actStrafe(-1); acted = true; }
    else if (held.e) { actStrafe(1); acted = true; }
    if (acted) heldCd = .17;
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    screen.setTransform(1, 0, 0, 1, 0, 0);
    screen.fillStyle = C.bg;
    screen.fillRect(0, 0, cvs.width, cvs.height);
    if (window.innerHeight > window.innerWidth) {
      screen.setTransform(1, 0, 0, 1, 0, 0);
      screen.textAlign = 'center';
      screen.fillStyle = C.green;
      screen.font = `900 ${Math.round(cvs.width * .065)}px ${SANS}`;
      screen.fillText('GIRA TU TELÉFONO', cvs.width / 2, cvs.height / 2);
      screen.fillStyle = C.white;
      screen.font = `${Math.round(cvs.width * .032)}px ${SANS}`;
      screen.fillText('MIMESIS se juega en horizontal', cvs.width / 2, cvs.height / 2 + cvs.width * .07);
      return;
    }
    screen.setTransform(view.s, 0, 0, view.s, view.ox, view.oy);
    ctx = screen;
    renderWorld(state !== 'menu');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pix, 0, 0, W, H);
    // vignette / scanlines
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .22, W / 2, H / 2, H * .72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .035;
    ctx.fillStyle = '#7dff5a';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    if (flash > 0) {
      ctx.globalAlpha = Math.min(.18, flash * .16);
      ctx.fillStyle = '#d6ff6a'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (hurtFlash > 0) {
      ctx.globalAlpha = hurtFlash * .7;
      ctx.fillStyle = C.red; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (state === 'menu') drawMenu();
    else {
      drawHud();
      drawOverlay();
    }
  }

  /* ---------------------------------------------------------------- input */
  function toLogic(e) {
    const r = cvs.getBoundingClientRect();
    const cx = (e.clientX - r.left) * (cvs.width / r.width);
    const cy = (e.clientY - r.top) * (cvs.height / r.height);
    return { x: (cx - view.ox) / view.s, y: (cy - view.oy) / view.s };
  }
  function inRect(p, r) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }
  const isTouch = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window;

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    ensureAudio();
    if (state === 'menu') {
      if (k === '1') mode = 0;
      else if (k === '2') mode = 1;
      else if (k === '3') mode = 2;
      else if (k === 'enter' || k === ' ') startRun(mode);
      else if (k === 'm') toggleMute();
      return;
    }
    if (state === 'dead' || state === 'win') {
      if (k === 'enter' || k === ' ' || k === 'escape') toMenu();
      return;
    }
    if (state === 'paused') {
      if (k === 'p' || k === 'escape') { state = 'play'; }
      return;
    }
    if (k === 'p' || k === 'escape') { state = 'paused'; held = {}; return; }
    if (k === 'm') { toggleMute(); return; }
    if (k === 'w' || k === 'arrowup') { held.w = 1; actMove(1); heldCd = .22; return; }
    if (k === 's' || k === 'arrowdown') { held.s = 1; actMove(-1); heldCd = .22; return; }
    if (k === 'a' || k === 'arrowleft') { held.a = 1; actTurn(-1); heldCd = .22; return; }
    if (k === 'd' || k === 'arrowright') { held.d = 1; actTurn(1); heldCd = .22; return; }
    if (k === 'q') { held.q = 1; actStrafe(-1); heldCd = .22; return; }
    if (k === 'e') { held.e = 1; actStrafe(1); heldCd = .22; return; }
    if (k === 'f') interact();
    else if (k === 'r') reload();
    else if (k === '1') useItem(1);
    else if (k === '2') useItem(2);
    else if (k === '3') useItem(3);
    else if (k === ' ') shoot();
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') delete held.w;
    if (k === 's' || k === 'arrowdown') delete held.s;
    if (k === 'a' || k === 'arrowleft') delete held.a;
    if (k === 'd' || k === 'arrowright') delete held.d;
    if (k === 'q') delete held.q;
    if (k === 'e') delete held.e;
  });
  window.addEventListener('blur', () => { held = {}; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'play') state = 'paused';
  });

  let touchStart = null, touchActed = false;
  cvs.addEventListener('pointerdown', e => {
    ensureAudio();
    const p = toLogic(e);
    if (state === 'menu') {
      for (const r of menuRects)
        if (inRect(p, r)) {
          if (r.act === 'mode') mode = r.i;
          else if (r.act === 'start') startRun(mode);
          return;
        }
      return;
    }
    if (state === 'dead' || state === 'win') { toMenu(); return; }
    if (state === 'paused') { state = 'play'; return; }
    if (state === 'play') {
      if (inRect(p, { x: 312, y: 16, w: 34, h: 30 })) { state = 'paused'; return; }
      if (inRect(p, { x: 354, y: 16, w: 34, h: 30 })) { toggleMute(); return; }
      if (isTouch) {
        for (const r of touchRects)
          if (inRect(p, r)) {
            if (r.act === 'fwd') actMove(1);
            else if (r.act === 'back') actMove(-1);
            else if (r.act === 'left') actTurn(-1);
            else if (r.act === 'right') actTurn(1);
            else if (r.act === 'fire') shoot();
            else if (r.act === 'reload') reload();
            else if (r.act === 'use') {
              if (promptText()) interact();
              else if (hp < maxHp && meds > 0) useItem(1);
              else if (plates > 0) useItem(3);
              else useItem(1);
            }
            return;
          }
        if (p.y > 140 && p.y < H - 80) {
          touchStart = { x: p.x, y: p.y, t: performance.now() };
          touchActed = false;
        }
      } else if (p.y > 140 && p.y < H - 80) {
        shoot();
      }
    }
  });
  cvs.addEventListener('pointermove', e => {
    if (!isTouch || state !== 'play' || !touchStart) return;
    const p = toLogic(e);
    const dx = p.x - touchStart.x, dy = p.y - touchStart.y;
    if (Math.hypot(dx, dy) < 34) return;
    if (Math.abs(dx) > Math.abs(dy)) actTurn(dx > 0 ? 1 : -1);
    else actMove(dy < 0 ? 1 : -1);
    touchActed = true;
    touchStart = { x: p.x, y: p.y, t: performance.now() };
  });
  cvs.addEventListener('pointerup', e => {
    if (!isTouch || state !== 'play' || !touchStart) return;
    if (!touchActed && performance.now() - touchStart.t < 320) shoot();
    touchStart = null;
  });
  cvs.addEventListener('pointercancel', () => { touchStart = null; });
  cvs.addEventListener('contextmenu', e => e.preventDefault());

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.max(1, Math.round(window.innerWidth * dpr));
    cvs.height = Math.max(1, Math.round(window.innerHeight * dpr));
    view.s = Math.min(cvs.width / W, cvs.height / H);
    view.ox = (cvs.width - W * view.s) / 2;
    view.oy = (cvs.height - H * view.s) / 2;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));

  let last = 0;
  function frame(ts) {
    const dt = Math.min(.05, last ? (ts - last) / 1000 : .016);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  resize();
  toMenu();
  requestAnimationFrame(frame);
})();
