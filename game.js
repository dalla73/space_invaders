/* Space Invaders — tribute build.
   Vanilla canvas, no dependencies. 1978 rules: one shot on screen, eroding
   shields, a mystery saucer, and a march that speeds up as the fleet thins. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Geometry
   * ------------------------------------------------------------------ */
  const W = 560, H = 760;
  const LEFT = 24, RIGHT = W - 24;
  const COLW = 40, ROWH = 40, ALIEN_H = 24;
  const BC = 3, BCOLS = 22, BROWS = 16;
  const BAND1 = Math.round(H * 0.235);
  const BAND2 = Math.round(H * 0.64);

  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function blinkOn() {
    return reduceMotion || Math.floor(time * 2.2) % 2 === 0;
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const irnd = (a, b) => Math.floor(rnd(a, b + 1));
  const pad = (n, len) => String(n).padStart(len, '0');

  /* ------------------------------------------------------------------ *
   *  Bitmap font, 5x7
   * ------------------------------------------------------------------ */
  const RAW_FONT = {
    'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    'B': '####.|#...#|#...#|####.|#...#|#...#|####.',
    'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
    'D': '###..|#..#.|#...#|#...#|#...#|#..#.|###..',
    'E': '#####|#....|#....|####.|#....|#....|#####',
    'F': '#####|#....|#....|####.|#....|#....|#....',
    'G': '.###.|#...#|#....|#.###|#...#|#...#|.###.',
    'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    'I': '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    'J': '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
    'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    'L': '#....|#....|#....|#....|#....|#....|#####',
    'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    'N': '#...#|##..#|#.#.#|#.#.#|#..##|#...#|#...#',
    'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    'P': '####.|#...#|#...#|####.|#....|#....|#....',
    'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    'S': '.####|#....|#....|.###.|....#|....#|####.',
    'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    'W': '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
    'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
    '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
    '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
    '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
    '3': '####.|....#|....#|.###.|....#|....#|####.',
    '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
    '5': '#####|#....|####.|....#|....#|#...#|.###.',
    '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
    '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
    '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
    ' ': '.....|.....|.....|.....|.....|.....|.....',
    '.': '.....|.....|.....|.....|.....|.....|..#..',
    ':': '.....|..#..|..#..|.....|..#..|..#..|.....',
    '-': '.....|.....|.....|#####|.....|.....|.....',
    '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    '/': '....#|....#|...#.|..#..|.#...|#....|#....',
    '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.',
    '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
    '=': '.....|.....|#####|.....|#####|.....|.....',
    '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    ',': '.....|.....|.....|.....|.....|..##.|..#..',
    "'": '..#..|..#..|.....|.....|.....|.....|.....'
  };

  const FONT = {};
  for (const key in RAW_FONT) FONT[key] = RAW_FONT[key].split('|');

  function text(str, x, y, size, color, align) {
    str = String(str).toUpperCase();
    const w = str.length * 6 * size - size;
    let sx = align === 'center' ? Math.round(x - w / 2)
           : align === 'right' ? Math.round(x - w)
           : Math.round(x);
    const py = Math.round(y);
    ctx.fillStyle = color || '#ffffff';
    for (let i = 0; i < str.length; i++) {
      const glyph = FONT[str[i]];
      if (glyph) {
        for (let r = 0; r < 7; r++) {
          const row = glyph[r];
          for (let c = 0; c < 5; c++) {
            if (row[c] === '#') ctx.fillRect(sx + c * size, py + r * size, size, size);
          }
        }
      }
      sx += 6 * size;
    }
    return w;
  }

  /* ------------------------------------------------------------------ *
   *  Sprites
   * ------------------------------------------------------------------ */
  const SQUID_1 = ['...##...', '..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.', '#.#..#.#'];
  const SQUID_2 = ['...##...', '..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.'];
  const CRAB_1 = ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'];
  const CRAB_2 = ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.'];
  const OCTO_1 = ['...#####...', '.#########.', '###########', '##..###..##', '###########', '..###.###..', '.##.###.##.', '##.......##'];
  const OCTO_2 = ['...#####...', '.#########.', '###########', '##..###..##', '###########', '.###..###..', '##..###..##', '..##...##..'];
  const SHIP = ['......#......', '.....###.....', '.....###.....', '.###########.', '#############', '#############', '#############', '#############'];
  const SAUCER = ['.....######.....', '...##########...', '..############..', '.##############.', '################', '...###..###.....', '....#....#......'];
  const BURST_A = ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'];
  const BURST_B = ['.#...#.', '#..#..#', '..#.#..', '.#...#.', '..#.#..', '#..#..#', '.#...#.'];

  function sprite(rows, scale) {
    const c = document.createElement('canvas');
    c.width = rows[0].length * scale;
    c.height = rows.length * scale;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === '#') g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  const SPR = {};

  function buildSprites() {
    SPR.squid = [sprite(SQUID_1, 3), sprite(SQUID_2, 3)];
    SPR.crab = [sprite(CRAB_1, 3), sprite(CRAB_2, 3)];
    SPR.octo = [sprite(OCTO_1, 3), sprite(OCTO_2, 3)];
    SPR.player = sprite(SHIP, 3);
    SPR.playerSmall = sprite(SHIP, 2);
    SPR.ufo = sprite(SAUCER, 3);
    SPR.burst = {
      2: [sprite(BURST_A, 2), sprite(BURST_B, 2), sprite(BURST_B, 2)],
      3: [sprite(BURST_A, 3), sprite(BURST_B, 3), sprite(BURST_B, 3)],
      5: [sprite(BURST_A, 5), sprite(BURST_B, 5), sprite(BURST_B, 5)]
    };
  }

  /* ------------------------------------------------------------------ *
   *  Sound
   * ------------------------------------------------------------------ */
  const sfx = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ufoFlip: false,
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.ctx.destination);
      const n = Math.floor(this.ctx.sampleRate * 0.4);
      this.noiseBuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    },
    ok() { return !!(this.ctx && !this.muted); },
    tone(freq, dur, opt) {
      if (!this.ok()) return;
      opt = opt || {};
      const t0 = this.ctx.currentTime + (opt.delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = opt.type || 'square';
      o.frequency.setValueAtTime(freq, t0);
      if (opt.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.to), t0 + dur);
      const v = opt.vol == null ? 0.2 : opt.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t0);
      o.stop(t0 + dur + 0.04);
    },
    noise(dur, vol) {
      if (!this.ok()) return;
      const t0 = this.ctx.currentTime;
      const s = this.ctx.createBufferSource();
      s.buffer = this.noiseBuf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(g);
      g.connect(this.master);
      s.start(t0);
      s.stop(t0 + dur + 0.02);
    },
    march(i) { this.tone([196, 175, 165, 147][i] || 196, 0.09, { vol: 0.15 }); },
    shoot() { this.tone(880, 0.1, { to: 220, vol: 0.13 }); },
    alienDie() { this.noise(0.16, 0.14); this.tone(150, 0.12, { to: 60, vol: 0.11 }); },
    ufo() { this.tone(this.ufoFlip ? 640 : 560, 0.09, { vol: 0.06 }); this.ufoFlip = !this.ufoFlip; },
    ufoDie() { this.tone(900, 0.5, { to: 80, type: 'sawtooth', vol: 0.18 }); },
    playerDie() { this.tone(240, 0.7, { to: 40, type: 'sawtooth', vol: 0.24 }); this.noise(0.5, 0.1); },
    extra() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, { delay: i * 0.09, vol: 0.15 })); },
    waveClear() { [392, 523, 659].forEach((f, i) => this.tone(f, 0.14, { delay: i * 0.1, vol: 0.15 })); },
    thud() { this.tone(70, 0.08, { vol: 0.09 }); }
  };

  function toggleMute() {
    sfx.muted = !sfx.muted;
    if (sfx.master) sfx.master.gain.value = sfx.muted ? 0 : 0.3;
  }

  /* ------------------------------------------------------------------ *
   *  State
   * ------------------------------------------------------------------ */
  let state = 'title';
  let score = 0;
  let hi = 0;
  let lives = 3;
  let wave = 1;
  let extraGiven = false;
  let time = 0;
  let shake = 0;

  const player = { x: W / 2, y: H - 46, w: 39, h: 24, speed: 300 };

  let aliens = [];
  let bunkers = [];
  let bullet = null;
  let bombs = [];
  let ufo = null;
  let bursts = [];
  let dir = 1;
  let marchDist = 0;
  let marchStep = 0;
  let alienFrame = 0;
  let bombTimer = 1.5;
  let ufoTimer = 20;
  let dyingTimer = 0;
  let waveFlash = 0;

  const keys = { left: false, right: false };
  const stars = [];

  try { hi = parseInt(window.localStorage.getItem('si.hi') || '0', 10) || 0; } catch (e) { hi = 0; }

  function saveHi() {
    try { window.localStorage.setItem('si.hi', String(hi)); } catch (e) { /* ignore */ }
  }

  function newStars() {
    stars.length = 0;
    for (let i = 0; i < 54; i++) {
      stars.push({ x: irnd(0, W - 2), y: irnd(0, H - 2), s: rnd(0.7, 1.8), a: rnd(0.06, 0.22), p: rnd(0, 6.28) });
    }
  }

  /* ------------------------------------------------------------------ *
   *  Bunkers
   * ------------------------------------------------------------------ */
  function bunkerMask() {
    const cells = new Uint8Array(BCOLS * BROWS);
    const arch = { 11: 9, 12: 8, 13: 7, 14: 6, 15: 6 };
    for (let cy = 0; cy < BROWS; cy++) {
      for (let cx = 0; cx < BCOLS; cx++) {
        let on = true;
        if (cy === 0 && (cx < 2 || cx > 19)) on = false;
        if (cy === 1 && (cx < 1 || cx > 20)) on = false;
        if (cy >= 11 && cx >= arch[cy] && cx <= 21 - arch[cy]) on = false;
        if (on) cells[cy * BCOLS + cx] = 1;
      }
    }
    return cells;
  }

  function buildBunkers() {
    const mask = bunkerMask();
    return [48, 181, 313, 446].map((x) => {
      const c = document.createElement('canvas');
      c.width = BCOLS * BC;
      c.height = BROWS * BC;
      return { x: x, y: 566, cells: mask.slice(), canvas: c, ctx: c.getContext('2d'), dirty: true };
    });
  }

  function paintBunker(bk) {
    const g = bk.ctx;
    g.clearRect(0, 0, bk.canvas.width, bk.canvas.height);
    g.fillStyle = '#ffffff';
    for (let r = 0; r < BROWS; r++) {
      for (let c = 0; c < BCOLS; c++) {
        if (bk.cells[r * BCOLS + c]) g.fillRect(c * BC, r * BC, BC, BC);
      }
    }
  }

  function hitBunkers(x, y, w, h) {
    let hit = false;
    for (let i = 0; i < bunkers.length; i++) {
      const bk = bunkers[i];
      if (x + w <= bk.x || x >= bk.x + BCOLS * BC || y + h <= bk.y || y >= bk.y + BROWS * BC) continue;
      const c0 = clamp(Math.floor((x - bk.x) / BC), 0, BCOLS - 1);
      const c1 = clamp(Math.floor((x + w - 1 - bk.x) / BC), 0, BCOLS - 1);
      const r0 = clamp(Math.floor((y - bk.y) / BC), 0, BROWS - 1);
      const r1 = clamp(Math.floor((y + h - 1 - bk.y) / BC), 0, BROWS - 1);
      let removed = 0;
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const idx = r * BCOLS + c;
          if (!bk.cells[idx]) continue;
          bk.cells[idx] = 0;
          removed++;
          if (Math.random() < 0.6) {
            const around = [idx - 1, idx + 1, idx - BCOLS, idx + BCOLS];
            const j = around[irnd(0, 3)];
            if (j >= 0 && j < bk.cells.length && bk.cells[j]) bk.cells[j] = 0;
          }
        }
      }
      if (removed) {
        bk.dirty = true;
        hit = true;
      }
    }
    return hit;
  }

  /* ------------------------------------------------------------------ *
   *  Wave setup
   * ------------------------------------------------------------------ */
  const ROWS = [
    { type: 'squid', pts: 30 },
    { type: 'crab', pts: 20 },
    { type: 'crab', pts: 20 },
    { type: 'octo', pts: 10 },
    { type: 'octo', pts: 10 }
  ];

  function newWave() {
    aliens = [];
    bombs = [];
    bullet = null;
    ufo = null;
    bursts = [];
    dir = 1;
    marchDist = 0;
    marchStep = 0;
    alienFrame = 0;
    player.x = W / 2;
    bombTimer = 1.4;
    ufoTimer = rnd(14, 22);
    shake = 0;
    bunkers = buildBunkers();
    for (let r = 0; r < ROWS.length; r++) {
      for (let c = 0; c < 11; c++) {
        aliens.push({
          col: c, row: r, type: ROWS[r].type, pts: ROWS[r].pts,
          x: 60 + c * COLW, y: 132 + r * ROWH, alive: true
        });
      }
    }
  }

  function startGame() {
    sfx.init();
    score = 0;
    lives = 3;
    wave = 1;
    extraGiven = false;
    state = 'playing';
    newWave();
  }

  function addScore(n) {
    score += n;
    if (!extraGiven && score >= 1500) {
      extraGiven = true;
      lives++;
      sfx.extra();
    }
    if (score > hi) hi = score;
  }

  function gameOver() {
    state = 'gameover';
    saveHi();
  }

  /* ------------------------------------------------------------------ *
   *  Helpers
   * ------------------------------------------------------------------ */
  function alienRect(a) { return { x: a.x, y: a.y, w: COLW, h: ALIEN_H }; }
  function playerRect() { return { x: player.x - player.w / 2, y: player.y, w: player.w, h: player.h }; }
  function ufoRect() { return { x: ufo.x, y: ufo.y, w: ufo.w, h: ufo.h }; }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function burst(x, y, size) {
    bursts.push({ x: x, y: y, t: 0, life: 0.4, size: size || 3 });
  }

  function fire() {
    if (state !== 'playing' || bullet) return;
    bullet = { x: Math.round(player.x) - 1, y: player.y - 10, w: 3, h: 10, vy: -640 };
    sfx.shoot();
  }

  function playerHit() {
    lives = Math.max(0, lives - 1);
    sfx.playerDie();
    burst(player.x, player.y + 10, 5);
    shake = 1;
    bombs = [];
    bullet = null;
    state = 'dying';
    dyingTimer = 1.6;
  }

  function killAlien(a) {
    a.alive = false;
    addScore(a.pts);
    burst(a.x + COLW / 2, a.y + ALIEN_H / 2, 2);
    sfx.alienDie();
  }

  function maxBombs() { return Math.min(5, 1 + Math.floor(wave / 2)); }

  function dropBomb() {
    const lowest = {};
    for (let i = 0; i < aliens.length; i++) {
      const a = aliens[i];
      if (!a.alive) continue;
      if (!lowest[a.col] || a.y > lowest[a.col].y) lowest[a.col] = a;
    }
    const cols = Object.keys(lowest);
    if (!cols.length) return;
    const a = lowest[cols[irnd(0, cols.length - 1)]];
    bombs.push({ x: a.x + COLW / 2 - 1, y: a.y + ALIEN_H, w: 3, h: 10, vy: 200 + Math.min(120, wave * 14) });
  }

  /* ------------------------------------------------------------------ *
   *  Update
   * ------------------------------------------------------------------ */
  function update(dt) {
    time += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 2.2);

    for (let i = bursts.length - 1; i >= 0; i--) {
      bursts[i].t += dt;
      if (bursts[i].t >= bursts[i].life) bursts.splice(i, 1);
    }

    if (state === 'playing') updatePlaying(dt);
    else if (state === 'dying') updateDying(dt);
    else if (state === 'waveclear') updateWaveClear(dt);
  }

  function updatePlaying(dt) {
    // player
    if (keys.left) player.x -= player.speed * dt;
    if (keys.right) player.x += player.speed * dt;
    player.x = clamp(player.x, LEFT + player.w / 2, RIGHT - player.w / 2);

    // bullet
    if (bullet) {
      bullet.y += bullet.vy * dt;
      let consumed = false;

      for (let i = 0; i < aliens.length; i++) {
        const a = aliens[i];
        if (a.alive && overlap(bullet, alienRect(a))) {
          killAlien(a);
          consumed = true;
          break;
        }
      }

      if (!consumed && ufo && overlap(bullet, ufoRect())) {
        addScore(ufo.pts);
        burst(ufo.x + ufo.w / 2, ufo.y + ufo.h / 2, 3);
        sfx.ufoDie();
        ufo = null;
        consumed = true;
      }

      if (!consumed) {
        for (let i = bombs.length - 1; i >= 0; i--) {
          if (overlap(bullet, bombs[i])) {
            burst(bombs[i].x + 1, bombs[i].y, 2);
            bombs.splice(i, 1);
            consumed = true;
            break;
          }
        }
      }

      if (!consumed && hitBunkers(bullet.x - 1, bullet.y, bullet.w + 2, bullet.h)) consumed = true;

      if (consumed || bullet.y + bullet.h < 0) bullet = null;
    }

    // bombs
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      b.y += b.vy * dt;
      if (b.y > H) { bombs.splice(i, 1); continue; }
      if (hitBunkers(b.x - 1, b.y, b.w + 2, b.h)) { bombs.splice(i, 1); continue; }
      if (overlap(b, playerRect())) {
        bombs.splice(i, 1);
        playerHit();
        return;
      }
    }

    // fleet
    updateFleet(dt);

    // saucer
    if (ufo) {
      ufo.x += ufo.vx * dt;
      ufo.sound -= dt;
      if (ufo.sound <= 0) { ufo.sound = 0.18; sfx.ufo(); }
      if (ufo.x < -80 || ufo.x > W + 80) ufo = null;
    } else {
      ufoTimer -= dt;
      if (ufoTimer <= 0) {
        const fromLeft = Math.random() < 0.5;
        ufo = {
          x: fromLeft ? -60 : W + 60,
          y: 72,
          w: 48,
          h: 21,
          vx: (fromLeft ? 1 : -1) * rnd(90, 130),
          pts: [50, 100, 150, 300][irnd(0, 3)],
          sound: 0
        };
        ufoTimer = rnd(16, 26);
      }
    }

    // bombing cadence
    bombTimer -= dt;
    if (bombTimer <= 0) {
      if (bombs.length < maxBombs()) dropBomb();
      bombTimer = Math.max(0.45, 1.7 - wave * 0.12) * rnd(0.7, 1.3);
    }

    // wave cleared?
    let any = false;
    for (let i = 0; i < aliens.length; i++) if (aliens[i].alive) { any = true; break; }
    if (!any) {
      state = 'waveclear';
      waveFlash = 2;
      bullet = null;
      bombs = [];
      sfx.waveClear();
    }
  }

  function updateFleet(dt) {
    let alive = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < aliens.length; i++) {
      const a = aliens[i];
      if (!a.alive) continue;
      alive++;
      if (a.x < minX) minX = a.x;
      if (a.x + COLW > maxX) maxX = a.x + COLW;
    }
    if (!alive) return;

    const ratio = alive / aliens.length;
    const speed = (11 + wave * 4) * (1 + 2.1 * (1 - ratio));
    const dx = dir * speed * dt;

    if (minX + dx < LEFT || maxX + dx > RIGHT) {
      dir = -dir;
      for (let i = 0; i < aliens.length; i++) {
        const a = aliens[i];
        if (!a.alive) continue;
        a.y += 12;
        hitBunkers(a.x, a.y, COLW, ALIEN_H);
      }
      sfx.thud();
      for (let i = 0; i < aliens.length; i++) {
        const a = aliens[i];
        if (a.alive && a.y + ALIEN_H >= player.y - 2) {
          lives = 0;
          playerHit();
          return;
        }
      }
      return;
    }

    for (let i = 0; i < aliens.length; i++) {
      if (aliens[i].alive) aliens[i].x += dx;
    }

    marchDist += speed * dt;
    if (marchDist >= 18) {
      marchDist -= 18;
      marchStep = (marchStep + 1) % 4;
      alienFrame = alienFrame ? 0 : 1;
      sfx.march(marchStep);
    }
  }

  function updateDying(dt) {
    dyingTimer -= dt;
    if (dyingTimer > 0) return;
    if (lives <= 0) {
      gameOver();
    } else {
      player.x = W / 2;
      bullet = null;
      bombs = [];
      state = 'playing';
    }
  }

  function updateWaveClear(dt) {
    waveFlash -= dt;
    if (waveFlash > 0) return;
    wave++;
    newWave();
    state = 'playing';
  }

  /* ------------------------------------------------------------------ *
   *  Draw
   * ------------------------------------------------------------------ */
  const glow = document.createElement('canvas');
  glow.width = 140;
  glow.height = 190;

  function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(time * 1.3 + s.p));
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawFleet() {
    for (let i = 0; i < aliens.length; i++) {
      const a = aliens[i];
      if (!a.alive) continue;
      const sp = SPR[a.type][alienFrame];
      ctx.drawImage(sp, Math.round(a.x + (COLW - sp.width) / 2), Math.round(a.y + (ALIEN_H - sp.height) / 2));
    }
  }

  function drawBunkers() {
    for (let i = 0; i < bunkers.length; i++) {
      const bk = bunkers[i];
      if (bk.dirty) { paintBunker(bk); bk.dirty = false; }
      ctx.drawImage(bk.canvas, bk.x, bk.y);
    }
  }

  function drawBursts() {
    for (let i = 0; i < bursts.length; i++) {
      const b = bursts[i];
      const phase = b.t / b.life;
      const frames = SPR.burst[b.size] || SPR.burst[3];
      const sp = frames[phase < 0.34 ? 0 : phase < 0.7 ? 1 : 2] || frames[0];
      ctx.globalAlpha = Math.max(0, 1 - phase * 0.9);
      ctx.drawImage(sp, Math.round(b.x - sp.width / 2), Math.round(b.y - sp.height / 2));
    }
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    text('SCORE ' + pad(score, 5), 22, 14, 2);
    text('HI ' + pad(hi, 5), W / 2, 14, 2, '#ffffff', 'center');
    text('WAVE ' + pad(wave, 2), W - 22, 14, 2, '#ffffff', 'right');

    const n = Math.min(lives, 5);
    for (let i = 0; i < n; i++) {
      ctx.drawImage(SPR.playerSmall, 22 + i * 30, H - 40);
    }
    if (sfx.muted) text('MUTE', W - 22, H - 40, 2, '#ffffff', 'right');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(22, H - 18, W - 44, 2);
  }

  function plaque(y, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, y, W, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, y, W, 2);
    ctx.fillRect(0, y + h - 2, W, 2);
  }

  function drawScene() {
    drawFleet();
    drawBunkers();

    if (ufo) {
      ctx.drawImage(SPR.ufo, Math.round(ufo.x), Math.round(ufo.y + Math.sin(time * 4) * 2));
    }

    if (bullet) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(bullet.x), Math.round(bullet.y), bullet.w, bullet.h);
    }

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < bombs.length; i++) {
      const b = bombs[i];
      const flip = Math.floor(time * 14) % 2;
      for (let k = 0; k < 3; k++) {
        const dx = (k % 2 === 0 ? 1 : -1) * (flip ? 1 : -1);
        ctx.fillRect(Math.round(b.x + dx), Math.round(b.y + k * 3), 2, 2);
      }
    }

    if (state === 'playing' || state === 'paused' || state === 'waveclear') {
      ctx.drawImage(SPR.player, Math.round(player.x - SPR.player.width / 2), player.y);
    }

    drawBursts();
    drawHud();

    if (state === 'waveclear') {
      if (blinkOn()) {
        text('WAVE ' + (wave + 1), W / 2, 352, 4, '#ffffff', 'center');
      }
    }

    if (state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(0, 0, W, H);
      plaque(292, 168);
      text('PAUSED', W / 2, 318, 5, '#ffffff', 'center');
      text('PRESS P', W / 2, 396, 2, '#ffffff', 'center');
    }

    if (state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      plaque(268, 272);
      text('GAME OVER', W / 2, 292, 5, '#ffffff', 'center');
      text('SCORE ' + pad(score, 5), W / 2, 372, 3, '#ffffff', 'center');
      text('HI ' + pad(hi, 5), W / 2, 416, 3, '#ffffff', 'center');
      if (blinkOn()) {
        text('PRESS ENTER', W / 2, 486, 2, '#ffffff', 'center');
      }
    }
  }

  function drawTitle() {
    const f = Math.floor(time * 1.6) % 2;
    text('SPACE', W / 2, 116, 6, '#ffffff', 'center');
    text('INVADERS', W / 2, 184, 5, '#ffffff', 'center');

    for (let i = 0; i < 9; i++) {
      const sp = SPR.crab[f];
      ctx.drawImage(sp, 96 + i * 42, 238);
    }

    const rows = [
      { sp: SPR.ufo, label: 'MYSTERY', y: 300 },
      { sp: SPR.squid[f], label: '30 PTS', y: 348 },
      { sp: SPR.crab[f], label: '20 PTS', y: 396 },
      { sp: SPR.octo[f], label: '10 PTS', y: 444 }
    ];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      ctx.drawImage(r.sp, Math.round(178 - r.sp.width / 2), Math.round(r.y + (24 - r.sp.height) / 2));
      text(r.label, 230, r.y + 4, 2);
    }

    if (blinkOn()) {
      text('PRESS SPACE', W / 2, 520, 3, '#ffffff', 'center');
    }
    text('ARROWS MOVE  SPACE FIRE', W / 2, 584, 2, '#ffffff', 'center');
    text('P PAUSE  M SOUND', W / 2, 612, 2, '#ffffff', 'center');
    text('HI ' + pad(hi, 5), W / 2, 664, 2, '#ffffff', 'center');
    text('1978 TRIBUTE', W / 2, 696, 2, '#ffffff', 'center');
  }

  function drawBands() {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#ff5a4a';
    ctx.fillRect(0, 0, W, BAND1);
    ctx.fillStyle = '#f4efe2';
    ctx.fillRect(0, BAND1, W, BAND2 - BAND1);
    ctx.fillStyle = '#46ff8a';
    ctx.fillRect(0, BAND2, W, H - BAND2);
    ctx.restore();
  }

  function drawBloom() {
    const g = glow.getContext('2d');
    g.clearRect(0, 0, glow.width, glow.height);
    g.filter = 'blur(2px)';
    g.drawImage(canvas, 0, 0, glow.width, glow.height);
    g.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.18;
    ctx.drawImage(glow, 0, 0, W, H);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (shake > 0.01 && !reduceMotion) {
      ctx.translate(Math.round((Math.random() - 0.5) * 9 * shake), Math.round((Math.random() - 0.5) * 9 * shake));
    }
    drawStars();
    if (state === 'title') {
      drawTitle();
    } else {
      drawScene();
    }
    ctx.restore();

    drawBands();
    drawBloom();
  }

  /* ------------------------------------------------------------------ *
   *  Input
   * ------------------------------------------------------------------ */
  function togglePause() {
    if (state === 'playing') state = 'paused';
    else if (state === 'paused') state = 'playing';
  }

  function handleKey(code) {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = true;
        break;
      case 'Space':
        sfx.init();
        if (state === 'title' || state === 'gameover') startGame();
        else if (state === 'paused') state = 'playing';
        else if (state === 'playing') fire();
        break;
      case 'Enter':
        sfx.init();
        if (state === 'title' || state === 'gameover') startGame();
        else if (state === 'paused') state = 'playing';
        break;
      case 'KeyP':
      case 'Escape':
        togglePause();
        break;
      case 'KeyM':
        toggleMute();
        break;
    }
  }

  function releaseKey(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyP', 'KeyM', 'Enter', 'Escape'].indexOf(e.code) >= 0) {
      e.preventDefault();
    }
    if (e.repeat) return;
    handleKey(e.code);
  });

  window.addEventListener('keyup', (e) => releaseKey(e.code));

  window.addEventListener('blur', () => {
    keys.left = false;
    keys.right = false;
  });

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sfx.init();
    canvas.focus();
    if (state === 'title' || state === 'gameover') startGame();
    else if (state === 'playing') fire();
    else if (state === 'paused') state = 'playing';
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') state = 'paused';
  });

  const touch = document.getElementById('touch');
  if (touch) {
    const buttons = touch.querySelectorAll('.tbtn');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const key = btn.getAttribute('data-key');
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sfx.init();
        if (key === 'fire') handleKey('Space');
        else keys[key] = true;
      });
      const stop = () => { if (key !== 'fire') keys[key] = false; };
      btn.addEventListener('pointerup', stop);
      btn.addEventListener('pointercancel', stop);
      btn.addEventListener('pointerleave', stop);
    }
  }

  /* ------------------------------------------------------------------ *
   *  Loop
   * ------------------------------------------------------------------ */
  let last = 0;
  let acc = 0;
  const STEP = 1 / 60;

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) {
      update(STEP);
      acc -= STEP;
      guard++;
    }
    if (guard >= 5) acc = 0;
    draw();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ *
   *  Boot
   * ------------------------------------------------------------------ */
  buildSprites();
  newStars();
  newWave();
  state = 'title';
  draw();
  requestAnimationFrame(frame);

  // Exposed for automated checks; harmless in the browser.
  window.SI = {
    tick(dt) { update(dt); },
    render() { draw(); },
    start: startGame,
    press(code) { handleKey(code); },
    release(code) { releaseKey(code); },
    get state() { return state; },
    get score() { return score; },
    get hi() { return hi; },
    get lives() { return lives; },
    get wave() { return wave; },
    get alive() { return aliens.filter((a) => a.alive).length; },
    get bombs() { return bombs.length; },
    get bullet() { return !!bullet; },
    get hasUfo() { return !!ufo; },
    setState(s) { state = s; }
  };
})();
