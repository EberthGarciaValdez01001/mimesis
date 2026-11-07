/* MIMESIS — build&play / 32 KB, sin librerías, sin assets.
   El gusano te copia. Tienes 8 vidas y un machete. */
(() => {
  'use strict';

  const W = 960, H = 540;
  const ARENA = { l: 28, t: 96, r: 932, b: 486 };
  const PR = 13, PSPEED = 215;
  let LIVES = 8, MAX_CLONES = 8;
  const HEAD_R = 22, SEG_R = 16, SPACING = 30;
  let ATK_RANGE = 82, ATK_CD = .22;
  const ATK_X = 916, ATK_Y = 506, ATK_R = 34;
  const BEST_KEY = 'mim_best_v1', MUTE_KEY = 'mim_mute_v1', MODE_KEY = 'mim_mode_v1';

  const C = {
    bg: '#040a08', deep: '#081510', floor: '#07110f', line: 'rgba(125,255,90,.07)',
    green: '#7dff5a', lime: '#b6ff7a', toxic: '#38f28a', pale: '#d8e8c8',
    cyan: '#8de8ff', white: '#f7f0df', red: '#ff4a5a', dim: '#6f8a7d',
    amber: '#ffd166', armor: '#8a9a8a',
    outline: '#04100b', pale2: '#b8c8a0', green3: '#4fbf6a', green4: '#2a6b3a',
    armor2: '#5f6f5f', mouth: '#200812', suit2: '#c5d5d5', tank: '#46524a', dark: '#0b1a12'
  };

  const MODES = [
    { name: 'FÁCIL', key: 'e', lives: 10, cap: 5, inv: 2, form: 1.8, clone: .78, worm: .82, lunge: 5.4, slime: 4.4, range: 94, cd: .18, extra: -1, desc: 'Copias lentas · más margen' },
    { name: 'MEDIO', key: 'm', lives: 8, cap: 8, inv: 1.4, form: 1.3, clone: .89, worm: 1, lunge: 4.2, slime: 3.2, range: 82, cd: .22, extra: 0, desc: 'Equilibrio · la experiencia base' },
    { name: 'DIFÍCIL', key: 'h', lives: 6, cap: 10, inv: 1, form: 1, clone: .96, worm: 1.15, lunge: 3.3, slime: 2.5, range: 74, cd: .26, extra: 1, desc: 'Gusano y copias al límite' }
  ];

  const cvs = document.getElementById('game');
  const screen = cvs.getContext('2d', { alpha: false });
  const pix = document.createElement('canvas');
  pix.width = 480;
  pix.height = 270;
  const pctx = pix.getContext('2d', { alpha: false });
  const PW = pix.width, PH = pix.height;
  let ctx = screen;
  const view = { s: 1, ox: 0, oy: 0, dpr: 1 };

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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

  function ell(x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
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

  function fmt(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  /* ---------------------------------------------------------------- sprites */

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

  function srr(g, x, y, w, h, r, fill, stroke) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
  }

  function sel(g, x, y, rx, ry, fill, stroke) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
  }

  function srect(g, x, y, w, h, fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }

  function spoly(g, p, fill, stroke) {
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
  }

  function agentSprite(dir, clone, fury) {
    const c = mk(32, 32), g = sg(c);
    const outline = C.outline;
    const suit = clone ? C.green : C.white;
    const suit2 = clone ? C.green3 : C.suit2;
    const dark = clone ? C.green4 : C.dark;
    const accent = clone ? C.toxic : C.cyan;
    const visor = clone ? C.outline : C.cyan;
    const tank = clone ? C.green4 : C.tank;
    const lamp = clone ? C.red : C.amber;

    function mach(x, y) {
      const blade = clone ? C.green : C.white;
      const edge = clone ? C.toxic : C.cyan;
      spoly(g, [[x, y], [x + 5, y - 8], [x + 6, y - 7], [x + 1, y + 1]], blade, outline);
      g.beginPath();
      g.moveTo(x + 1, y - 1);
      g.lineTo(x + 4, y - 5);
      g.strokeStyle = edge;
      g.lineWidth = 1;
      g.stroke();
      srect(g, x - 2, y + 1, 3, 2, C.armor2);
      g.strokeStyle = outline;
      g.lineWidth = 1;
      g.strokeRect(x - 2.5, y + .5, 3, 2);
    }

    if (dir === 'down' || dir === 'up') {
      srr(g, 6, 10, 20, 13, 4, suit, outline);
      srr(g, 9, 3, 14, 9, 4, suit, outline);
      srect(g, 14, 10, 5, 2, dark);
      if (dir === 'down') {
        srect(g, 11, 6, 10, 3, visor);
        srect(g, 13, 7, 6, 1, accent);
        srect(g, 10, 13, 1, 7, accent);
        srect(g, 21, 13, 1, 7, accent);
        srect(g, 15, 14, 2, 2, accent);
      } else {
        srr(g, 11, 12, 10, 9, 3, tank, outline);
        g.strokeStyle = C.armor2;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(12, 13); g.lineTo(20, 13);
        g.moveTo(12, 19); g.lineTo(20, 19);
        g.stroke();
        srect(g, 9, 12, 1, 9, dark);
        srect(g, 22, 12, 1, 9, dark);
      }
      srr(g, 3, 12, 4, 9, 2, suit2, outline);
      srr(g, 25, 12, 4, 9, 2, suit2, outline);
      srect(g, 3, 19, 4, 3, dark);
      srect(g, 25, 19, 4, 3, dark);
      srect(g, 7, 20, 18, 2, dark);
      srect(g, 14, 20, 4, 2, lamp);
      srect(g, 9, 22, 5, 6, dark);
      srect(g, 18, 22, 5, 6, dark);
      srect(g, 8, 27, 6, 2, outline);
      srect(g, 18, 27, 6, 2, outline);
      srect(g, 5, 11, 2, 2, lamp);
      mach(25, 15);
      if (clone) {
        srect(g, 12, 6, 2, 2, C.mouth);
        srect(g, 18, 6, 2, 2, C.mouth);
        srect(g, 12, 7, 1, 1, C.red);
        srect(g, 19, 7, 1, 1, C.red);
      }
    } else {
      srr(g, 11, 4, 14, 9, 4, suit, outline);
      srect(g, 19, 7, 6, 3, visor);
      srect(g, 21, 8, 3, 1, accent);
      srect(g, 18, 12, 5, 2, dark);
      srr(g, 9, 11, 16, 12, 4, suit, outline);
      srr(g, 4, 12, 6, 9, 3, tank, outline);
      srect(g, 9, 12, 1, 9, dark);
      srr(g, 19, 14, 7, 6, 3, suit2, outline);
      srect(g, 23, 18, 3, 3, dark);
      srect(g, 10, 20, 14, 2, dark);
      srect(g, 14, 20, 2, 2, lamp);
      srect(g, 13, 22, 5, 6, dark);
      srect(g, 19, 22, 5, 6, dark);
      srect(g, 12, 27, 6, 2, outline);
      srect(g, 19, 27, 6, 2, outline);
      mach(24, 15);
      if (clone) {
        srect(g, 21, 8, 2, 2, C.mouth);
        srect(g, 22, 9, 1, 1, C.red);
      }
    }

    if (clone) {
      for (const q of [[4, 17], [7, 21], [19, 19], [16, 22], [2, 12]]) {
        srect(g, q[0], q[1], 1, 2, C.green);
        srect(g, q[0] + 1, q[1], 1, 1, C.green3);
      }
    }
    if (fury) {
      const ex = dir === 'right' ? 21 : 12;
      const ey = dir === 'right' ? 8 : 6;
      srect(g, ex, ey, 2, 2, C.red);
      srect(g, ex + 6, ey, 2, 2, C.red);
      if (dir === 'down' || dir === 'up') {
        spoly(g, [[2, 11], [4, 7], [5, 12]], C.green, outline);
        spoly(g, [[21, 12], [23, 7], [24, 12]], C.green, outline);
      }
    }
    return c;
  }

  function wormHeadSprite(armored) {
    const c = mk(40, 40), g = sg(c);
    sel(g, 7, 20, 6, 7, C.pale2, C.outline);
    sel(g, 8, 20, 3, 4, C.pale, C.armor2);
    sel(g, 22, 20, 15, 16, C.pale, C.outline);
    g.beginPath();
    g.arc(22, 20, 13, Math.PI, Math.PI * 2);
    g.strokeStyle = C.pale2;
    g.lineWidth = 2;
    g.stroke();
    sel(g, 32, 20, 7, 9, C.mouth, C.outline);
    sel(g, 33, 20, 5, 6, '#480a1a', C.red);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const cx = 33 + Math.cos(a) * 5.8;
      const cy = 20 + Math.sin(a) * 5.8;
      spoly(g, [[cx - 1, cy - 1], [cx + 2, cy + 1], [cx - 1, cy + 2]], C.white, C.outline);
    }
    const eye = armored ? C.dark : C.red;
    srect(g, 14, 10, 4, 4, eye);
    srect(g, 14, 26, 4, 4, eye);
    g.strokeStyle = C.outline;
    g.lineWidth = 1;
    g.strokeRect(13.5, 9.5, 5, 5);
    g.strokeRect(13.5, 25.5, 5, 5);
    if (armored) {
      spoly(g, [[2, 10], [20, 4], [27, 12], [25, 28], [10, 35], [2, 26]], C.armor, C.outline);
      g.strokeStyle = C.armor2;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(4, 13); g.lineTo(22, 8);
      g.moveTo(4, 22); g.lineTo(24, 20);
      g.moveTo(6, 29); g.lineTo(23, 26);
      g.stroke();
      for (const q of [[5, 15], [5, 24], [20, 12], [20, 26], [14, 5]]) {
        srect(g, q[0], q[1], 2, 2, C.amber);
        g.strokeStyle = C.outline;
        g.lineWidth = 1;
        g.strokeRect(q[0] - .5, q[1] - .5, 3, 3);
      }
      srect(g, 3, 18, 2, 4, C.amber);
      srect(g, 3, 20, 2, 1, C.outline);
    } else {
      g.beginPath();
      g.arc(22, 20, 16, 0, Math.PI * 2);
      g.strokeStyle = C.red;
      g.lineWidth = 2;
      g.stroke();
      g.strokeStyle = C.red;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(18, 7); g.lineTo(21, 12);
      g.moveTo(20, 30); g.lineTo(17, 34);
      g.stroke();
      sel(g, 9, 20, 3, 4, C.toxic);
    }
    for (const q of [[39, 22], [38, 26], [35, 30], [32, 33]]) srect(g, q[0], q[1], 1, 1, C.green);
    return c;
  }

  function bodySegSprite(kind) {
    const c = mk(28, 28), g = sg(c);
    sel(g, 14, 14, 12, 8, C.pale, C.outline);
    g.beginPath();
    g.arc(14, 14, 9, Math.PI, Math.PI * 2);
    g.strokeStyle = C.pale2;
    g.lineWidth = 2;
    g.stroke();
    g.beginPath();
    g.arc(14, 14, 7, 0, Math.PI * 2);
    g.strokeStyle = C.green3;
    g.lineWidth = 1;
    g.stroke();
    sel(g, 7, 14, 2, 2, C.toxic, C.outline);
    g.beginPath();
    g.arc(5, 14, 3, Math.PI / 2, Math.PI * 1.5);
    g.strokeStyle = C.armor2;
    g.lineWidth = 2;
    g.stroke();
    for (const q of [[21, 20], [22, 22], [5, 21]]) srect(g, q[0], q[1], 1, 1, C.green);
    if (kind === 'damaged') {
      g.strokeStyle = C.red;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(12, 8); g.lineTo(15, 13); g.lineTo(11, 18);
      g.stroke();
      g.strokeStyle = C.outline;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(18, 9); g.lineTo(17, 17);
      g.stroke();
      g.clearRect(20, 12, 2, 3);
    }
    if (kind === 'cut') {
      g.clearRect(0, 0, 28, 28);
      sel(g, 12, 14, 10, 8, C.pale, C.outline);
      sel(g, 23, 14, 4, 7, C.green3, C.outline);
      sel(g, 24, 14, 2, 4, C.pale, C.green4);
      sel(g, 25, 14, 1, 2, C.green);
      for (const q of [[21, 23], [24, 24], [26, 20], [18, 24]]) srect(g, q[0], q[1], 1, 1, C.green);
    }
    return c;
  }

  function mirrorSprite(c) {
    const m = mk(c.width, c.height), g = sg(m);
    g.translate(c.width, 0);
    g.scale(-1, 1);
    g.drawImage(c, 0, 0);
    return m;
  }

  const SPR = { agent: {}, clone: {}, fury: {}, seg: {} };

  function buildSprites() {
    for (const d of ['down', 'up', 'right']) {
      SPR.agent[d] = agentSprite(d);
      SPR.clone[d] = agentSprite(d, true);
      SPR.fury[d] = agentSprite(d, true, true);
    }
    SPR.agent.left = mirrorSprite(SPR.agent.right);
    SPR.clone.left = mirrorSprite(SPR.clone.right);
    SPR.fury.left = mirrorSprite(SPR.fury.right);
    SPR.headA = wormHeadSprite(true);
    SPR.headE = wormHeadSprite(false);
    SPR.seg.ok = bodySegSprite('ok');
    SPR.seg.dam = bodySegSprite('damaged');
    SPR.seg.cut = bodySegSprite('cut');
  }

  function dirOf(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return Math.abs(c) > Math.abs(s) ? (c > 0 ? 'right' : 'left') : (s > 0 ? 'down' : 'up');
  }

  /* ---------------------------------------------------------------- state */

  let state = 'menu';
  let time = 0, runT = 0;
  let lives = LIVES, invuln = 0, atkCd = 0, heartT = 0;
  let player = { x: 300, y: 300, vx: 0, vy: 0, face: 0, slashT: 0, slashA: 0 };
  let worm = { segs: [], ang: 0, lunge: '', lt: 0, lungeCd: 2, slimeCd: 2, spit: 0, dx: 0, dy: 0 };
  let clones = [], slimes = [], parts = [], texts = [], chunks = [];
  let cuts = 0, dissolved = 0, lastHit = '', banner = null;
  let shake = 0, flash = 0, flashColor = '255,70,80', freeze = 0;
  let best = {}, newBest = false, muted = false;
  let mode = 1, D = MODES[1];

  let keys = {}, atkMouse = false, atkPointers = new Set();
  let touch = false;
  let joy = { id: null, active: false, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 };

  let AC = null, master = null, hum = null, humGain = null, noiseBuf = null;

  try {
    const b = JSON.parse(localStorage.getItem(BEST_KEY) || 'null');
    best = b ? (b.r ? { m: b } : b) : {};
    const mm = localStorage.getItem(MODE_KEY);
    if (mm !== null) {
      const i = +mm;
      if (i >= 0 && i < 3) mode = i;
    }
    D = MODES[mode];
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) { best = {}; }

  function rankFor(t, l) {
    if (l >= LIVES - 1 && t <= 100) return 'S';
    if (l >= Math.max(3, LIVES - 3) && t <= 160) return 'A';
    if (l >= 3) return 'B';
    return 'C';
  }
  function rankVal(r) { return r === 'S' ? 4 : r === 'A' ? 3 : r === 'B' ? 2 : 1; }
  function bestFor() { return best && best[D.key] ? best[D.key] : null; }
  function saveBest(r) {
    const b = bestFor();
    if (!b || rankVal(r) > rankVal(b.r) || (rankVal(r) === rankVal(b.r) && runT < b.t)) {
      best[D.key] = { r, t: runT, l: lives };
      newBest = true;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch (e) {}
    }
  }

  /* ---------------------------------------------------------------- audio */

  function ensureAudio() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        master = AC.createGain();
        master.gain.value = muted ? 0 : .32;
        master.connect(AC.destination);
        noiseBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * .4), AC.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        hum = AC.createOscillator();
        hum.type = 'sine';
        hum.frequency.value = 45;
        humGain = AC.createGain();
        humGain.gain.value = .006;
        hum.connect(humGain);
        humGain.connect(master);
        hum.start();
      } catch (e) {}
    }
    if (AC && AC.state === 'suspended') AC.resume();
  }

  function toneAt(freq, when, dur, type, vol, slide) {
    if (!AC || muted) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, when);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), when + dur);
    g.gain.setValueAtTime(.0001, when);
    g.gain.exponentialRampToValueAtTime(vol || .1, when + .01);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.connect(g);
    g.connect(master);
    o.start(when);
    o.stop(when + dur + .03);
  }

  function noiseAt(when, dur, freq, vol) {
    if (!AC || muted || !noiseBuf) return;
    const s = AC.createBufferSource();
    s.buffer = noiseBuf;
    const f = AC.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq || 800;
    f.Q.value = 1.1;
    const g = AC.createGain();
    g.gain.setValueAtTime(vol || .1, when);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(when, Math.random() * .1, dur);
  }

  function tone(f, d, t, v, s) { if (AC) toneAt(f, AC.currentTime, d, t, v, s); }
  function noise(d, v, f) { if (AC) noiseAt(AC.currentTime, d, f, v); }

  function sfxSlash() { noise(.09, .06, 1800); tone(240, .08, 'triangle', .04, 420); }
  function sfxHit() { noise(.08, .09, 500); tone(180, .1, 'square', .06, 90); }
  function sfxCut() {
    noise(.25, .18, 300);
    tone(95, .22, 'sawtooth', .12, 45);
  }
  function sfxHurt() {
    tone(320, .25, 'sawtooth', .14, 70);
    noise(.3, .15, 180);
  }
  function sfxClone() { noise(.22, .1, 400); tone(120, .25, 'sine', .08, 60); }
  function sfxSlime() { noise(.1, .06, 700); }
  function sfxLunge() { tone(90, .3, 'sawtooth', .1, 55); }
  function sfxClang() { tone(700, .08, 'square', .05, 500); noise(.05, .04, 2200); }
  function sfxStart() { tone(220, .12, 'square', .07); tone(330, .14, 'square', .06); }
  function sfxWin() {
    tone(440, .15, 'square', .07);
    tone(660, .18, 'square', .07);
    tone(880, .22, 'triangle', .06);
  }
  function sfxLose() {
    tone(220, .6, 'sawtooth', .14, 40);
    noise(.5, .14, 120);
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (master && AC) master.gain.setTargetAtTime(muted ? 0 : .32, AC.currentTime, .03);
  }

  function updateAudio() {
    if (!AC || !humGain) return;
    humGain.gain.setTargetAtTime(state === 'play' ? .018 : .005, AC.currentTime, .1);
    hum.frequency.setTargetAtTime(state === 'win' ? 60 : 45, AC.currentTime, .2);
  }

  /* ---------------------------------------------------------------- game */

  function initWorm() {
    worm = { segs: [], ang: Math.PI, lunge: '', lt: 0, lungeCd: 2.4, slimeCd: 2.6, spit: 0, dx: 0, dy: 0 };
    for (let i = 0; i < 10; i++) {
      worm.segs.push({
        x: 640 + i * SPACING, y: 250, r: i ? SEG_R : HEAD_R,
        hp: 2, head: i === 0, armored: i === 0, flash: 0
      });
    }
  }

  function startGame() {
    ensureAudio();
    D = MODES[mode];
    LIVES = D.lives;
    MAX_CLONES = D.cap;
    ATK_RANGE = D.range;
    ATK_CD = D.cd;
    state = 'play';
    runT = 0; lives = LIVES; invuln = D.inv; atkCd = 0; heartT = .8;
    cuts = 0; dissolved = 0; lastHit = ''; newBest = false;
    player = { x: 300, y: 300, vx: 0, vy: 0, face: 0, slashT: 0, slashA: 0 };
    clones = []; slimes = []; parts = []; texts = []; chunks = [];
    shake = 0; flash = .45; flashColor = '255,255,255'; freeze = 0;
    initWorm();
    banner = { title: 'MIMESIS', sub: D.name + ' · CÓRTALO ANTES DE QUE TE COPIE', life: 2, max: 2 };
    joy.id = null; joy.active = false; joy.dx = joy.dy = 0;
    atkPointers.clear(); atkMouse = false; keys = {};
    sfxStart();
  }

  function spawnClone() {
    if (clones.length >= MAX_CLONES) clones.shift();
    const a = rnd(0, 6.283), d = rnd(12, 28);
    clones.push({
      x: clamp(player.x + Math.cos(a) * d, ARENA.l + PR, ARENA.r - PR),
      y: clamp(player.y + Math.sin(a) * d, ARENA.t + PR, ARENA.b - PR),
      form: D.form, seed: rnd(0, 6.283), face: player.face
    });
    sfxClone();
  }

  function hurt(src) {
    if (state !== 'play' || invuln > 0) return;
    lives--;
    invuln = D.inv;
    lastHit = src;
    shake = 16;
    freeze = .05;
    flash = .42;
    flashColor = '255,70,80';
    sfxHurt();
    if (src !== 'clone') spawnClone();
    burst(player.x, player.y, 14, src === 'clone' ? C.green : C.red);
    popup(src === 'clone' ? 'TU COPIA' : '¡COPIA!', player.x, player.y - 32, C.green, 14);
    if (lives <= 0) lose();
  }

  function burst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      if (parts.length > 240) parts.shift();
      parts.push({
        x, y, vx: rnd(-180, 180), vy: rnd(-190, 100), life: rnd(.3, .8),
        max: .8, color, s: rnd(1.5, 4.5), g: 300
      });
    }
  }

  function popup(t, x, y, color, size) {
    texts.push({ t, x, y, color, size: size || 13, life: 1, max: 1 });
  }

  function bodyCount() { return Math.max(0, worm.segs.length - 1); }

  function getTarget() {
    let target = null, bd = ATK_RANGE;
    let wounded = null, wd = ATK_RANGE;
    if (worm.segs.length > 1) {
      for (let i = 1; i < worm.segs.length; i++) {
        const s = worm.segs[i];
        const d = dist(s, player);
        if (d <= bd) { bd = d; target = s; }
        if (s.hp === 1 && d <= wd) { wd = d; wounded = s; }
      }
    } else {
      const h = worm.segs[0];
      if (h && !h.armored && dist(h, player) <= bd) target = h;
    }
    return wounded || target;
  }

  function attack() {
    if (state !== 'play' || atkCd > 0) return;
    atkCd = ATK_CD;
    const t = getTarget();
    if (t) {
      player.face = Math.atan2(t.y - player.y, t.x - player.x);
      player.slashA = player.face;
      player.slashT = .13;
      sfxSlash();
      hitSeg(t);
    } else {
      player.slashA = player.face;
      player.slashT = .13;
      sfxSlash();
      if (worm.segs.length > 1 && dist(worm.segs[0], player) <= ATK_RANGE) {
        popup('BLINDADO', worm.segs[0].x, worm.segs[0].y - 30, C.armor, 11);
        sfxClang();
      }
    }
  }

  function hitSeg(seg) {
    seg.hp--;
    seg.flash = .2;
    if (seg.hp > 0) {
      sfxHit();
      burst(seg.x, seg.y, 6, C.pale);
      return;
    }
    if (seg.head) {
      cuts++;
      win();
      return;
    }

    const idx = worm.segs.indexOf(seg);
    if (idx > 0) worm.segs.splice(idx, 1);
    cuts++;
    shake = 10;
    freeze = .05;
    flash = .2;
    flashColor = '125,255,90';
    sfxCut();
    burst(seg.x, seg.y, 28, C.green);

    if (worm.segs.length === 1) {
      const h = worm.segs[0];
      h.armored = false;
      h.hp = 2;
      h.flash = .35;
      banner = { title: 'CABEZA EXPUESTA', sub: 'DOS GOLPES', life: 1.8, max: 1.8 };
      flash = .3;
    } else if (worm.segs.length === 7) {
      banner = { title: 'FASE 2', sub: 'SE ESTÁ ROMPIENDO', life: 1.6, max: 1.6 };
    } else if (worm.segs.length === 4) {
      banner = { title: 'FASE 3', sub: 'NO MIRES ATRÁS', life: 1.6, max: 1.6 };
    }

    chunks.push({
      x: seg.x, y: seg.y, vx: rnd(-70, 70), vy: rnd(-120, -30),
      life: .7, rot: rnd(0, 6.28), vr: rnd(-8, 8)
    });

    if (clones.length) {
      let bi = 0, bd = 1e9;
      for (let i = 0; i < clones.length; i++) {
        const d = dist(clones[i], player);
        if (d < bd) { bd = d; bi = i; }
      }
      const c = clones.splice(bi, 1)[0];
      dissolved++;
      burst(c.x, c.y, 22, C.green);
      popup('COPIA DISUELTA', c.x, c.y - 22, C.green, 11);
    }
  }

  function spit() {
    if (!worm.segs.length) return;
    const h = worm.segs[0];
    const n = clamp((bodyCount() >= 6 ? 1 : bodyCount() >= 3 ? 2 : 3) + D.extra, 1, 4);
    const base = Math.atan2(player.y - h.y, player.x - h.x);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * .26;
      slimes.push({
        x: h.x + Math.cos(a) * 20, y: h.y + Math.sin(a) * 20,
        vx: Math.cos(a) * 260, vy: Math.sin(a) * 260,
        r: 9, life: 3
      });
    }
    sfxSlime();
  }

  function updateWorm(dt) {
    if (!worm.segs.length) return;
    const h = worm.segs[0];
    const body = worm.segs.length - 1;
    worm.ang = Math.atan2(player.y - h.y, player.x - h.x);
    worm.lungeCd = Math.max(0, worm.lungeCd - dt);
    worm.slimeCd = Math.max(0, worm.slimeCd - dt);

    if (worm.lunge === 'wind') {
      worm.lt -= dt;
      h.flash = Math.max(h.flash, .1);
      if (worm.lt <= 0) {
        worm.lunge = 'dash';
        worm.lt = .36;
        worm.dx = Math.cos(worm.ang);
        worm.dy = Math.sin(worm.ang);
        sfxLunge();
      }
    } else if (worm.lunge === 'dash') {
      h.x += worm.dx * 440 * D.worm * dt;
      h.y += worm.dy * 440 * D.worm * dt;
      worm.lt -= dt;
      if (worm.lt <= 0) { worm.lunge = 'recover'; worm.lt = .5; }
    } else if (worm.lunge === 'recover') {
      worm.lt -= dt;
      if (worm.lt <= 0) worm.lunge = '';
    } else {
      if (worm.lungeCd <= 0) {
        worm.lunge = 'wind';
        worm.lt = .75;
        worm.lungeCd = Math.max(2.1, D.lunge - body * .16);
      } else {
        const sp = (115 + (9 - body) * 6) * D.worm;
        const d = Math.hypot(player.x - h.x, player.y - h.y);
        if (d > 2) {
          h.x += Math.cos(worm.ang) * sp * dt;
          h.y += Math.sin(worm.ang) * sp * dt;
        }
      }
    }

    if (worm.spit > 0) {
      worm.spit -= dt;
      if (worm.spit <= 0) spit();
    } else if (worm.slimeCd <= 0) {
      worm.spit = .35;
      worm.slimeCd = Math.max(1.5, D.slime - body * .12);
    }

    h.x = clamp(h.x, ARENA.l + h.r, ARENA.r - h.r);
    h.y = clamp(h.y, ARENA.t + h.r, ARENA.b - h.r);

    for (let i = 1; i < worm.segs.length; i++) {
      const prev = worm.segs[i - 1], s = worm.segs[i];
      let dx = s.x - prev.x, dy = s.y - prev.y;
      const d = Math.hypot(dx, dy);
      if (d > .01) {
        s.x = prev.x + dx / d * SPACING;
        s.y = prev.y + dy / d * SPACING;
      } else {
        s.x = prev.x + SPACING;
        s.y = prev.y;
      }
      s.x = clamp(s.x, ARENA.l + s.r, ARENA.r - s.r);
      s.y = clamp(s.y, ARENA.t + s.r, ARENA.b - s.r);
      if (s.flash > 0) s.flash -= dt;
    }
    if (h.flash > 0) h.flash -= dt;

    for (const s of worm.segs) {
      if (dist(s, player) < s.r + PR) hurt('worm');
    }
  }

  function updateSlimes(dt) {
    for (let i = slimes.length - 1; i >= 0; i--) {
      const s = slimes[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      let gone = s.life <= 0 || s.x < ARENA.l - 20 || s.x > ARENA.r + 20 || s.y < ARENA.t - 20 || s.y > ARENA.b + 20;
      if (!gone && dist(s, player) < s.r + PR) {
        hurt('slime');
        gone = true;
      }
      if (gone) {
        burst(s.x, s.y, 6, C.green);
        slimes.splice(i, 1);
      }
    }
  }

  function updateClones(dt) {
    for (const c of clones) {
      if (c.form > 0) { c.form -= dt; continue; }
      const dx = player.x - c.x, dy = player.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        c.x += dx / d * PSPEED * D.clone * dt;
        c.y += dy / d * PSPEED * D.clone * dt;
        c.face = Math.atan2(dy, dx);
      }
      c.x = clamp(c.x, ARENA.l + PR, ARENA.r - PR);
      c.y = clamp(c.y, ARENA.t + PR, ARENA.b - PR);
      if (dist(c, player) < PR + 13) hurt('clone');
    }
  }

  function updateFx(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life -= dt;
      t.y -= 24 * dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
    for (let i = chunks.length - 1; i >= 0; i--) {
      const c = chunks[i];
      c.life -= dt;
      if (c.life <= 0) { chunks.splice(i, 1); continue; }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 320 * dt;
      c.rot += c.vr * dt;
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 65);
    if (flash > 0) flash = Math.max(0, flash - dt * 3.1);
  }

  function update(dt) {
    time += dt;
    updateFx(dt);
    updateAudio();

    if (state === 'menu' || state === 'paused' || state === 'dead' || state === 'win') return;
    if (freeze > 0) { freeze -= dt; return; }

    runT += dt;
    invuln = Math.max(0, invuln - dt);
    atkCd = Math.max(0, atkCd - dt);
    player.slashT = Math.max(0, player.slashT - dt);

    let ix = 0, iy = 0;
    if (keys.a || keys.arrowleft) ix--;
    if (keys.d || keys.arrowright) ix++;
    if (keys.w || keys.arrowup) iy--;
    if (keys.s || keys.arrowdown) iy++;
    if (joy.active) { ix += joy.dx; iy += joy.dy; }
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }
    player.vx = lerp(player.vx, ix * PSPEED, Math.min(1, dt * 12));
    player.vy = lerp(player.vy, iy * PSPEED, Math.min(1, dt * 12));
    player.x = clamp(player.x + player.vx * dt, ARENA.l + PR, ARENA.r - PR);
    player.y = clamp(player.y + player.vy * dt, ARENA.t + PR, ARENA.b - PR);
    if (ix || iy) player.face = Math.atan2(iy, ix);

    if (keys[' '] || keys.j || keys.k || atkMouse || atkPointers.size > 0) attack();

    updateWorm(dt);
    if (state !== 'play') return;
    updateSlimes(dt);
    if (state !== 'play') return;
    updateClones(dt);
    if (state !== 'play') return;

    if (banner) {
      banner.life -= dt;
      if (banner.life <= 0) banner = null;
    }

    if (lives <= 3) {
      heartT -= dt;
      if (heartT <= 0) {
        heartT = .9;
        tone(48, .12, 'sine', .08);
      }
    }
  }

  function win() {
    if (state !== 'play') return;
    state = 'win';
    newBest = false;
    saveBest(rankFor(runT, lives));
    if (worm.segs.length) burst(worm.segs[0].x, worm.segs[0].y, 42, C.green);
    worm.segs = [];
    clones = [];
    slimes = [];
    flash = .6;
    flashColor = '125,255,90';
    shake = 12;
    sfxWin();
  }

  function lose() {
    if (state !== 'play') return;
    state = 'dead';
    flash = .5;
    flashColor = '255,70,80';
    shake = 18;
    sfxLose();
  }

  /* ---------------------------------------------------------------- draw */

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#081510');
    g.addColorStop(1, C.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = ARENA.l; x <= ARENA.r; x += 48) {
      ctx.moveTo(x, ARENA.t);
      ctx.lineTo(x, ARENA.b);
    }
    for (let y = ARENA.t; y <= ARENA.b; y += 48) {
      ctx.moveTo(ARENA.l, y);
      ctx.lineTo(ARENA.r, y);
    }
    ctx.stroke();

    // pipes
    ctx.strokeStyle = 'rgba(30,60,48,.65)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(ARENA.l + 10, ARENA.t + 16);
    ctx.lineTo(ARENA.r - 10, ARENA.t + 16);
    ctx.moveTo(ARENA.l + 10, ARENA.b - 14);
    ctx.lineTo(ARENA.r - 10, ARENA.b - 14);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56,242,138,.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ARENA.l + 10, ARENA.t + 16);
    ctx.lineTo(ARENA.r - 10, ARENA.t + 16);
    ctx.moveTo(ARENA.l + 10, ARENA.b - 14);
    ctx.lineTo(ARENA.r - 10, ARENA.b - 14);
    ctx.stroke();

    // specimen tanks
    for (const side of [0, 1]) {
      const x = side ? ARENA.r - 54 : ARENA.l + 24;
      const y = ARENA.t + 64;
      ctx.fillStyle = 'rgba(20,50,40,.55)';
      rr(x, y, 30, 168, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(125,255,90,.2)';
      ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(56,242,138,.15)';
      rr(x + 5, y + 76 + Math.sin(time + side) * 4, 20, 82, 6); ctx.fill();
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(125,255,90,.28)';
        ell(x + 10 + i * 6, y + 100 + Math.sin(time * 2 + i + side) * 16, 2, 3); ctx.fill();
      }
    }

    // central drain
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ell(480, 300, 52, 30); ctx.fill();
    ctx.strokeStyle = 'rgba(125,255,90,.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(480, 300, 10 + i * 7, 0, 6.283);
      ctx.stroke();
    }

    // warning stripes
    ctx.fillStyle = 'rgba(255,209,102,.1)';
    for (let x = ARENA.l; x < ARENA.r; x += 34) {
      ctx.save();
      ctx.translate(x, ARENA.t - 4);
      ctx.rotate(-.4);
      ctx.fillRect(0, -3, 12, 6);
      ctx.restore();
    }

    const v = ctx.createRadialGradient(480, 270, 90, 480, 270, 620);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  function drawArena() {
    ctx.strokeStyle = 'rgba(125,255,90,.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA.l, ARENA.t, ARENA.r - ARENA.l, ARENA.b - ARENA.t);
    ctx.strokeStyle = 'rgba(247,240,223,.4)';
    ctx.lineWidth = 3;
    const c = 14;
    for (const [x, y, sx, sy] of [
      [ARENA.l, ARENA.t, 1, 1], [ARENA.r, ARENA.t, -1, 1],
      [ARENA.l, ARENA.b, 1, -1], [ARENA.r, ARENA.b, -1, -1]
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * c);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * c, y);
      ctx.stroke();
    }
  }

  function drawSlimes() {
    for (const s of slimes) {
      ctx.fillStyle = 'rgba(56,242,138,.12)';
      ell(s.x - s.vx * .025, s.y - s.vy * .025, s.r * 1.2, s.r * 1.2); ctx.fill();
      ctx.fillStyle = C.toxic;
      ctx.strokeStyle = '#07110f';
      ctx.lineWidth = 2;
      ell(s.x, s.y, s.r, s.r); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.lime;
      ell(s.x - 3, s.y - 3, 3, 3); ctx.fill();
    }
  }

  function drawEntities() {
    const segs = worm.segs;

    if (segs.length > 1) {
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(segs[segs.length - 1].x, segs[segs.length - 1].y);
      for (let i = segs.length - 2; i >= 1; i--) ctx.lineTo(segs[i].x, segs[i].y);
      ctx.lineTo(segs[0].x, segs[0].y);
      ctx.stroke();
      ctx.strokeStyle = C.pale2;
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
    }

    for (let i = segs.length - 1; i >= 1; i--) {
      const s = segs[i];
      const spr = s.hp === 1 ? SPR.seg.dam : SPR.seg.ok;
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ell(s.x + 2, s.y + 7, 13, 7);
      ctx.fill();
      ctx.drawImage(spr, s.x - 14, s.y - 14);
      if (s.flash > 0) {
        ctx.globalAlpha = Math.min(.45, s.flash * 2);
        ctx.fillStyle = '#fff';
        ell(s.x, s.y, 14, 10);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    if (worm.lunge === 'wind' && segs.length) {
      const h = segs[0];
      ctx.strokeStyle = 'rgba(255,74,90,.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 8]);
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.lineTo(player.x, player.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (segs.length) {
      const h = segs[0];
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(worm.ang);
      ctx.drawImage(h.armored ? SPR.headA : SPR.headE, -20, -20);
      ctx.restore();
      if (h.flash > 0) {
        ctx.globalAlpha = Math.min(.4, h.flash * 1.5);
        ctx.fillStyle = '#fff';
        ell(h.x, h.y, 20, 20);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (worm.spit > 0) {
        ctx.fillStyle = 'rgba(56,242,138,.6)';
        ell(h.x + Math.cos(worm.ang) * 20, h.y + Math.sin(worm.ang) * 20, 9 + Math.sin(time * 20) * 2, 7);
        ctx.fill();
      }
    }

    for (const c of chunks) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.globalAlpha = Math.max(0, c.life / .7);
      ctx.drawImage(SPR.seg.cut, -14, -14);
      ctx.restore();
    }

    const fury = clones.length >= 6 || lives <= 3;
    for (const c of clones) {
      const spr = (fury ? SPR.fury : SPR.clone)[dirOf(c.face)];
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ell(c.x + 2, c.y + 10, 14, 6);
      ctx.fill();
      if (c.form > 0) {
        const r = 16 + (1 - c.form / D.form) * 14;
        ctx.globalAlpha = .3;
        ctx.fillStyle = C.green;
        ell(c.x, c.y, r, r);
        ctx.fill();
        ctx.globalAlpha = .45;
        ctx.drawImage(spr, c.x - 16, c.y - 16);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(125,255,90,.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, 6.283);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(125,255,90,.1)';
        ell(c.x, c.y, 20, 20);
        ctx.fill();
        ctx.drawImage(spr, c.x - 16, c.y - 16);
        ctx.strokeStyle = 'rgba(56,242,138,.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(c.x, c.y, 20, 0, 6.283);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ell(player.x + 2, player.y + 12, 14, 6);
    ctx.fill();
    const blink = invuln > 0 && Math.floor(time * 20) % 2 === 0 ? .35 : 1;
    ctx.globalAlpha = blink;
    ctx.drawImage(SPR.agent[dirOf(player.face)], player.x - 16, player.y - 16);
    ctx.globalAlpha = 1;

    if (player.slashT > 0) {
      const a = player.slashA;
      ctx.save();
      ctx.globalAlpha = player.slashT / .13;
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 60, a - .9, a + .9);
      ctx.stroke();
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 74, a - .65, a + .65);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParts() {
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawTexts() {
    for (const t of texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2);
      text(t.t, t.x, t.y, t.size, t.color, 'center');
    }
    ctx.globalAlpha = 1;
  }

  function drawLives() {
    for (let i = 0; i < LIVES; i++) {
      const x = 28 + i * 16, y = 58;
      ctx.fillStyle = i < lives ? (lives <= 3 ? C.red : C.toxic) : '#14261e';
      rr(x, y, 10, 18, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(247,240,223,.25)';
      ctx.lineWidth = 1; ctx.stroke();
      if (i < lives) {
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillRect(x + 2, y + 3, 2, 10);
      }
    }
    text('VIDAS', 28 + LIVES * 16 + 6, 71, 9, C.dim);
  }

  function drawWormBar() {
    const x0 = 352, y0 = 30;
    text('ESPÉCIMEN', x0, 20, 9, C.dim);
    const body = worm.segs.length - 1;
    for (let i = 0; i < 9; i++) {
      const x = x0 + i * 23;
      ctx.fillStyle = i < body ? '#1b3428' : '#0e1c16';
      rr(x, y0, 18, 9, 3); ctx.fill();
      if (i < body) {
        const s = worm.segs[i + 1];
        ctx.fillStyle = s.hp === 2 ? C.green : C.amber;
        rr(x, y0, 18 * (s.hp / 2), 9, 3); ctx.fill();
      }
    }
    const hx = x0 + 9 * 23;
    const h = worm.segs[0];
    ctx.fillStyle = h && !h.armored ? C.red : C.armor;
    rr(hx, y0 - 2, 28, 13, 4); ctx.fill();
    ctx.strokeStyle = '#04100b';
    ctx.lineWidth = 1.5; ctx.stroke();
    if (h && !h.armored) text('☠', hx + 14, y0 + 11, 11, '#2a0008', 'center');
    else text('▣', hx + 14, y0 + 11, 10, '#04100b', 'center');
  }

  function drawHud() {
    text('MIMESIS', 28, 24, 12, C.green);
    text(fmt(runT), 28, 44, 19, C.white);
    text(D.name, 94, 44, 10, C.dim);
    drawLives();
    drawWormBar();

    text('COPIAS ' + String(clones.length).padStart(2, '0'), W - 70, 30, 12, clones.length ? C.green : C.dim, 'right');
    if (clones.length >= 7) text('¡PELIGRO!', W - 70, 48, 10, C.red, 'right');

    const ready = atkCd <= 0;
    ctx.fillStyle = ready ? 'rgba(125,255,90,.16)' : 'rgba(11,25,18,.8)';
    ctx.strokeStyle = ready ? C.green : 'rgba(125,255,90,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ATK_X, ATK_Y, ATK_R, 0, 6.283);
    ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.translate(ATK_X, ATK_Y);
    ctx.rotate(-.6);
    ctx.strokeStyle = ready ? C.white : C.dim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(8, -10);
    ctx.stroke();
    ctx.strokeStyle = ready ? C.cyan : C.dim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(16, -14);
    ctx.stroke();
    ctx.restore();
    text('CORTE', ATK_X, ATK_Y + 26, 8, C.dim, 'center');
    if (!ready) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ATK_X, ATK_Y, ATK_R - 4, -1.57, -1.57 + 6.283 * (1 - atkCd / ATK_CD));
      ctx.stroke();
    }

    if (runT < 12) {
      text(touch ? 'JOYSTICK · BOTÓN CORTE' : 'WASD / FLECHAS · ESPACIO / CLIC PARA CORTAR', W / 2, H - 68, 11, 'rgba(247,240,223,.55)', 'center');
    }
  }

  function drawJoy() {
    if (!joy.active) return;
    ctx.globalAlpha = .2;
    ctx.fillStyle = C.green;
    ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 52, 0, 6.283); ctx.fill();
    ctx.globalAlpha = .4;
    ctx.beginPath(); ctx.arc(joy.x, joy.y, 22, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawBanner() {
    if (!banner) return;
    ctx.globalAlpha = Math.min(1, banner.life * 1.8);
    text(banner.title, W / 2, 150, 38, C.green, 'center', SANS);
    text(banner.sub, W / 2, 172, 12, C.white, 'center');
    ctx.globalAlpha = 1;
  }

  function drawMute() {
    const x = W - 34, y = 32;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = muted ? '#4a5a50' : C.white;
    ctx.strokeStyle = '#020604';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-11, -4);
    ctx.lineTo(-4, -4);
    ctx.lineTo(4, -12);
    ctx.lineTo(4, 12);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-11, 4);
    ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.strokeStyle = muted ? C.red : C.white;
    ctx.lineWidth = 3;
    if (muted) {
      ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(5, 0, 7, -.6, .6); ctx.stroke();
    }
    ctx.restore();
  }

  function drawMenu() {
    ctx.fillStyle = 'rgba(3,8,6,.74)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    text('BUILD & PLAY · 32 KB · CERO ASSETS', W / 2, 76, 12, C.green, 'center');
    ctx.font = `900 84px ${SANS}`;
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#020604';
    ctx.strokeText('MIMESIS', W / 2, 174);
    ctx.fillStyle = 'rgba(125,255,90,.55)';
    ctx.fillText('MIMESIS', W / 2 - 4, 174);
    ctx.fillStyle = 'rgba(141,232,255,.55)';
    ctx.fillText('MIMESIS', W / 2 + 4, 174);
    ctx.fillStyle = C.white;
    ctx.fillText('MIMESIS', W / 2, 174);

    text('EL GUSANO TE COPIA', W / 2, 204, 14, C.green, 'center');
    text(D.name + ' · ' + D.lives + ' VIDAS · 10 SEGMENTOS', W / 2, 228, 11, C.dim, 'center');

    ctx.fillStyle = 'rgba(3,8,6,.65)';
    rr(W / 2 - 300, 252, 600, 146, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(125,255,90,.28)';
    ctx.lineWidth = 2; ctx.stroke();

    text('MOVER', W / 2 - 150, 284, 17, C.white, 'center');
    text('WASD / flechas / joystick', W / 2 - 150, 304, 11, C.dim, 'center');
    text('CORTAR', W / 2 + 150, 284, 17, C.green, 'center');
    text('espacio / clic / botón', W / 2 + 150, 304, 11, C.dim, 'center');
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.fillRect(W / 2, 274, 2, 42);
    text('Cada golpe del gusano: −1 vida y nace una copia tuya.', W / 2, 336, 12, C.white, 'center');
    text('Cada corte: el gusano se acorta y disuelve una copia.', W / 2, 356, 12, C.green, 'center');
    text('La cabeza está blindada hasta cortar el cuerpo.', W / 2, 376, 12, C.green, 'center');

    const mx = W / 2 - 229, my = 408, mw = 146, gap = 10;
    for (let i = 0; i < 3; i++) {
      const m = MODES[i], bx = mx + i * (mw + gap), sel = mode === i;
      ctx.fillStyle = sel ? 'rgba(125,255,90,.18)' : 'rgba(3,8,6,.8)';
      rr(bx, my, mw, 30, 8); ctx.fill();
      ctx.strokeStyle = sel ? C.green : 'rgba(125,255,90,.3)';
      ctx.lineWidth = 2; ctx.stroke();
      text(m.name + ' · ' + m.lives, bx + mw / 2, my + 20, 11, sel ? C.white : C.dim, 'center');
    }
    text(D.desc, W / 2, 448, 10, C.dim, 'center');

    const a = .85 + .15 * Math.sin(time * 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(3,8,6,.8)';
    rr(W / 2 - 190, 460, 380, 32, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(125,255,90,.45)';
    ctx.stroke();
    text('ENTRAR AL LABORATORIO', W / 2, 482, 20, C.white, 'center');
    ctx.globalAlpha = 1;

    const b = bestFor();
    text('MEJOR ' + D.name + ': ' + (b ? b.r + ' · ' + fmt(b.t) : '—'), W / 2, 512, 11, C.dim, 'center');
    if (window.innerWidth < window.innerHeight) {
      text('Gira el teléfono para verlo mejor', W / 2, 530, 9, 'rgba(247,240,223,.45)', 'center');
    }
  }

  function drawWin() {
    ctx.fillStyle = 'rgba(3,8,6,.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = `900 56px ${SANS}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#020604';
    ctx.strokeText('MIMESIS CONTENIDA', W / 2, 154);
    ctx.fillStyle = C.green;
    ctx.fillText('MIMESIS CONTENIDA', W / 2, 154);
    text(D.name + ' · ESPÉCIMEN 10 NEUTRALIZADO', W / 2, 184, 14, C.white, 'center');

    const r = rankFor(runT, lives);
    text(r, W / 2, 260, 78, C.green, 'center', SANS);
    text('RANGO', W / 2, 284, 11, C.dim, 'center');

    text(fmt(runT) + '  ·  ' + lives + ' VIDAS  ·  ' + cuts + ' CORTES  ·  ' + dissolved + ' COPIAS DISUELTAS', W / 2, 330, 13, C.white, 'center');
    const bw = bestFor();
    text(newBest ? '¡NUEVO RÉCORD!' : 'MEJOR: ' + (bw ? bw.r + ' · ' + fmt(bw.t) : '—'), W / 2, 362, 13, newBest ? C.cyan : C.dim, 'center');

    const a = .78 + .22 * Math.sin(time * 4);
    ctx.globalAlpha = a;
    text('TOCA PARA ELEGIR MODO', W / 2, 432, 21, C.green, 'center');
    ctx.globalAlpha = 1;
  }

  function drawDead() {
    ctx.fillStyle = 'rgba(3,8,6,.8)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      ctx.globalAlpha = rnd(.02, .1);
      ctx.fillStyle = Math.random() < .5 ? C.red : C.green;
      ctx.fillRect(rnd(0, W), rnd(0, H), rnd(20, 130), rnd(1, 3));
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.font = `900 58px ${SANS}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#020604';
    ctx.strokeText('TE COPIARON', W / 2, 160);
    ctx.fillStyle = C.white;
    ctx.fillText('TE COPIARON', W / 2, 160);
    text(D.name + ' · AHORA HAY ' + D.lives + ' DE TI', W / 2, 190, 14, C.green, 'center');

    text(lastHit === 'clone' ? 'TU PROPIA COPIA TE ALCANZÓ' : lastHit === 'slime' ? 'LA BABA TE HIZO UNA COPIA' : 'EL GUSANO TE HIZO UNA COPIA', W / 2, 236, 13, C.dim, 'center');
    text(fmt(runT) + '  ·  ' + cuts + ' CORTES  ·  ' + dissolved + ' COPIAS DISUELTAS', W / 2, 282, 13, C.white, 'center');
    const bd = bestFor();
    text('MEJOR: ' + (bd ? bd.r + ' · ' + fmt(bd.t) : '—'), W / 2, 316, 13, C.dim, 'center');

    const a = .8 + .2 * Math.sin(time * 4);
    ctx.globalAlpha = a;
    text('TOCA PARA ELEGIR MODO', W / 2, 410, 21, C.green, 'center');
    ctx.globalAlpha = 1;
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(3,8,6,.68)';
    ctx.fillRect(0, 0, W, H);
    text('CONTENCIÓN EN PAUSA', W / 2, 248, 34, C.white, 'center', SANS);
    text('TOCA PARA SEGUIR', W / 2, 300, 18, C.green, 'center');
  }

  function render() {
    ctx = screen;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020604';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    ctx = pctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020604';
    ctx.fillRect(0, 0, PW, PH);
    ctx.setTransform(PW / W, 0, 0, PH / H, 0, 0);

    let sx = 0, sy = 0;
    if (shake > .2) {
      sx = rnd(-shake, shake);
      sy = rnd(-shake, shake);
    }

    ctx.save();
    if (sx || sy) ctx.translate(sx, sy);
    drawBg();
    drawArena();
    drawSlimes();
    drawParts();
    ctx.restore();

    ctx = screen;
    ctx.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, view.dpr * view.ox, view.dpr * view.oy);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pix, 0, 0, PW, PH, 0, 0, W, H);
    ctx.save();
    if (sx || sy) ctx.translate(sx, sy);
    drawEntities();
    ctx.restore();
    ctx.imageSmoothingEnabled = true;

    drawTexts();

    if (state === 'play' || state === 'paused') {
      drawHud();
      drawJoy();
      if (state === 'play') drawBanner();
    }

    if (flash > .001) {
      ctx.globalAlpha = Math.min(.55, flash);
      ctx.fillStyle = 'rgb(' + flashColor + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    if (state === 'menu') drawMenu();
    else if (state === 'dead') drawDead();
    else if (state === 'win') drawWin();
    else if (state === 'paused') drawPaused();

    drawMute();
  }

  /* ---------------------------------------------------------------- input */

  function toLocal(e) {
    return { x: (e.clientX - view.ox) / view.s, y: (e.clientY - view.oy) / view.s };
  }

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (e.repeat) return;
    ensureAudio();
    keys[k] = true;
    if (k === 'm') { toggleMute(); return; }
    if (state === 'menu' && (k === '1' || k === '2' || k === '3')) {
      mode = +k - 1; D = MODES[mode];
      try { localStorage.setItem(MODE_KEY, String(mode)); } catch (e) {}
      return;
    }
    if (k === 'p' || k === 'escape') {
      if (state === 'play') state = 'paused';
      else if (state === 'paused') state = 'play';
      return;
    }
    if (k === ' ' || k === 'enter') {
      if (state === 'menu') startGame();
      else if ((state === 'dead' || state === 'win') && time > .35) state = 'menu';
      else if (state === 'paused') state = 'play';
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener('blur', () => {
    keys = {};
    atkMouse = false;
    atkPointers.clear();
    joy.id = null; joy.active = false; joy.dx = joy.dy = 0;
    if (state === 'play') state = 'paused';
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'play') {
      keys = {};
      atkMouse = false;
      atkPointers.clear();
      state = 'paused';
    }
  });

  cvs.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    ensureAudio();
    const p = toLocal(e);
    if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) return;
    if (p.x > W - 66 && p.y < 64) { toggleMute(); return; }
    if (state === 'menu') {
      const mx = W / 2 - 229, my = 408, mw = 146, gap = 10;
      for (let i = 0; i < 3; i++) {
        const bx = mx + i * (mw + gap);
        if (p.x >= bx && p.x <= bx + mw && p.y >= my && p.y <= my + 30) {
          mode = i; D = MODES[i];
          try { localStorage.setItem(MODE_KEY, String(i)); } catch (e) {}
          return;
        }
      }
      startGame(); return;
    }
    if (state === 'dead' || state === 'win') { if (time > .35) state = 'menu'; return; }
    if (state === 'paused') { state = 'play'; return; }
    if (state !== 'play') return;

    if (e.pointerType === 'mouse') {
      atkMouse = true;
      return;
    }
    if (Math.hypot(p.x - ATK_X, p.y - ATK_Y) < ATK_R + 14) {
      atkPointers.add(e.pointerId);
      return;
    }
    if (joy.id === null) {
      joy.id = e.pointerId;
      joy.active = true;
      joy.ox = joy.x = p.x;
      joy.oy = joy.y = p.y;
      joy.dx = joy.dy = 0;
    }
  });

  window.addEventListener('pointermove', e => {
    if (e.pointerId !== joy.id) return;
    const p = toLocal(e);
    let dx = p.x - joy.ox, dy = p.y - joy.oy;
    const d = Math.hypot(dx, dy), max = 58;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    joy.x = joy.ox + dx;
    joy.y = joy.oy + dy;
    joy.dx = dx / max;
    joy.dy = dy / max;
  });

  window.addEventListener('pointerup', e => {
    if (e.pointerType === 'mouse') atkMouse = false;
    atkPointers.delete(e.pointerId);
    if (e.pointerId === joy.id) {
      joy.id = null; joy.active = false; joy.dx = joy.dy = 0;
    }
  });

  window.addEventListener('pointercancel', e => {
    if (e.pointerType === 'mouse') atkMouse = false;
    atkPointers.delete(e.pointerId);
    if (e.pointerId === joy.id) {
      joy.id = null; joy.active = false; joy.dx = joy.dy = 0;
    }
  });

  cvs.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));

  /* ---------------------------------------------------------------- boot */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
    const s = Math.min(w / W, h / H);
    view.s = s;
    view.ox = (w - W * s) / 2;
    view.oy = (h - H * s) / 2;
    view.dpr = dpr;
  }

  try { touch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; } catch (e) {}
  buildSprites();
  initWorm();
  resize();

  let last = 0;
  function frame(ts) {
    const dt = Math.min(.033, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
