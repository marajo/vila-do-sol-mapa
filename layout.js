// Protótipo do mapa novo da Vila do Sol: planta da fazenda (dados e contas, sem desenho).
// Mundo de 4950 × 2850 (3× a largura e 3× a altura do mapa atual de 1654 × 951).
// O rio desce do norte para o sul; a estrada entra pelo oeste e cruza o rio pela ponte.
// Também roda no Node (tests/mapa-prototipo.cjs), por isso não toca no DOM.
(function (raiz) {
  'use strict';
  const W = 4950, H = 2850;

  // ---------- rio ----------
  // linha do meio x = rx(y), meia largura hw(y) medida na perpendicular da corrente
  const rxBruto = y => 1540 + 250 * Math.sin(y / 520 + 0.6) + 115 * Math.sin(y / 233 + 1.9) + 12 * Math.sin(y / 97 + 0.4);
  const hwBruto = y => 104 + 24 * Math.sin(y / 410 + 2) + 11 * Math.sin(y / 150 + 1.1);
  // cada margem tem o próprio recorte (barranco comido pela água, prainhas): ±20 px sem repetição
  const recorte = (y, s) => 9 * Math.sin(y / 53 + s * 1.7) + 6 * Math.sin(y / 23.7 + s * 0.6) + 3.5 * Math.sin(y / 9.7 + s * 2.3) + 5 * Math.sin(y / 131 + s * 4.1);
  const PAD = 500, N = H + PAD * 2;
  const RX = new Float32Array(N), HW = new Float32Array(N), INC = new Float32Array(N), INV = new Float32Array(N);
  const HO = new Float32Array(N), HL = new Float32Array(N); // meia largura do lado oeste e do lado leste
  for (let i = 0; i < N; i++) {
    const y = i - PAD;
    RX[i] = rxBruto(y); HW[i] = hwBruto(y);
    HO[i] = HW[i] + recorte(y, -1); HL[i] = HW[i] + recorte(y, 1);
    INC[i] = (rxBruto(y + 0.5) - rxBruto(y - 0.5));
    INV[i] = 1 / Math.sqrt(1 + INC[i] * INC[i]);
  }
  const iy = y => Math.max(0, Math.min(N - 1, Math.round(y) + PAD));
  const rio = {
    rx: y => RX[iy(y)], hw: y => HW[iy(y)], inc: y => INC[iy(y)], inv: y => INV[iy(y)],
    /** meia largura de um lado (s = -1 oeste, 1 leste), já com o recorte da margem */
    hwLado: (y, s) => (s < 0 ? HO : HL)[iy(y)],
    /** distância (na perpendicular) até a margem: negativa dentro d'água */
    margem(x, y) { const i = iy(y), d = (x - RX[i]) * INV[i]; return Math.abs(d) - (d < 0 ? HO[i] : HL[i]); },
    /** posição a "o" px da linha do meio (o < 0: margem oeste) na altura y da linha do meio */
    ponto(y, o) { const i = iy(y), n = INV[i]; return [RX[i] + o * n, y - o * INC[i] * n]; },
    /** -1 oeste, 1 leste */
    lado(x, y) { return x < RX[iy(y)] ? -1 : 1; },
  };

  // ---------- ponte: onde o rio corre mais reto entre y 1300 e 1700 ----------
  let yb = 1500, melhor = 9;
  for (let y = 1300; y <= 1700; y += 2) { const s = Math.abs(rio.inc(y)) + Math.abs(rio.inc(y - 60)) + Math.abs(rio.inc(y + 60)); if (s < melhor) { melhor = s; yb = y; } }
  // a ponte atravessa de leste a oeste; cada cabeceira entra 46 px em terra firme
  let xa = rio.rx(yb), xb = xa;
  while (rio.margem(xa, yb - 40) < 0 || rio.margem(xa, yb + 40) < 0 || rio.margem(xa, yb) < 0) xa -= 2;
  while (rio.margem(xb, yb - 40) < 0 || rio.margem(xb, yb + 40) < 0 || rio.margem(xb, yb) < 0) xb += 2;
  const ponte = { x0: Math.round(xa - 46), x1: Math.round(xb + 46), y: Math.round(yb), meia: 40, aguaX0: xa, aguaX1: xb };

  // ---------- estradas (linha do meio + largura). duasTrilhas = estrada de terra com rastro de roda e capim no meio ----------
  const P = ponte;
  const estradas = [
    { nome: 'Estrada da porteira', larg: 116, duasTrilhas: true,
      pts: [[-40, P.y + 64], [380, P.y + 30], [820, P.y - 22], [P.x0 - 120, P.y], [P.x0 + 30, P.y]] },
    { nome: 'Saída da ponte', larg: 116, duasTrilhas: true, pts: [[P.x1 - 30, P.y], [P.x1 + 90, P.y], [2290, P.y], [2400, P.y]] },
    { nome: 'Estrada da horta', larg: 104, duasTrilhas: true,
      pts: [[2640, 900], [2480, 950], [2405, 1080], [2400, 1300], [2400, 1700], [2400, 2200], [2410, 2560], [2480, 2640]] },
    { nome: 'Corredor do meio', larg: 96, duasTrilhas: false, pts: [[2400, 1805], [2900, 1805], [3300, 1805]] },
    { nome: 'Estrada dos currais', larg: 100, duasTrilhas: true,
      pts: [[3300, 960], [3300, 1300], [3300, 1805], [3300, 2300], [3290, 2580], [3220, 2640]] },
    { nome: 'Volta de baixo', larg: 96, duasTrilhas: false, pts: [[2480, 2640], [2900, 2650], [3220, 2640]] },
    { nome: 'Caminho do galinheiro', larg: 92, duasTrilhas: false, pts: [[3860, 880], [4150, 880], [4350, 874], [4410, 870]] },
    { nome: 'Trilha do pomar', larg: 64, duasTrilhas: false, pts: [[790, P.y - 30], [740, (P.y + 1070) / 2], [620, 1075]] },
    // ramais curtos até as porteiras (lote = qual lote a porteira serve)
    { nome: 'Porteira do galinheiro', larg: 52, duasTrilhas: false, lote: 'galinheiro', pts: [[4410, 860], [4410, 778]] },
    { nome: 'Porteira do pomar', larg: 52, duasTrilhas: false, lote: 'pomar', pts: [[620, 1070], [620, 998]] },
    { nome: 'Porteira da horta', larg: 52, duasTrilhas: false, lote: 'horta', pts: [[2440, 1400], [2512, 1400]] },
    { nome: 'Porteira das vacas', larg: 56, duasTrilhas: false, lote: 'vacas', pts: [[3340, 1490], [3462, 1490]] },
    { nome: 'Porteira das ovelhas', larg: 52, duasTrilhas: false, lote: 'ovelhas', pts: [[3260, 2230], [3138, 2230]] },
    { nome: 'Porteira do chiqueiro', larg: 52, duasTrilhas: false, lote: 'porcos', pts: [[3340, 2250], [3462, 2250]] },
  ];

  // curva suave (Catmull-Rom) amostrada a cada ~10 px
  function suavizar(pts) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const passos = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 10));
      for (let k = 0; k < passos; k++) {
        const t = k / passos, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }
  for (const e of estradas) {
    e.linha = suavizar(e.pts);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of e.linha) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const m = e.larg / 2 + 60;
    e.caixa = [x0 - m, y0 - m, x1 + m, y1 + m];
  }

  // ---------- pátio de terra na frente da casa e do celeiro ----------
  const patio = { x0: 2520, y0: 735, x1: 3900, y1: 1010, raio: 120 };
  // a borda do pátio entra e sai até ~26 px (terra pisada não tem forma de régua)
  const recortePatio = (x, y) => 11 * Math.sin(x / 61 + 1.3) + 8 * Math.sin(y / 37 + x / 143) + 5 * Math.sin((x - y) / 23) + 4;
  const sdfPatio = (x, y) => {
    const cx = (patio.x0 + patio.x1) / 2, cy = (patio.y0 + patio.y1) / 2;
    const ax = (patio.x1 - patio.x0) / 2 - patio.raio, ay = (patio.y1 - patio.y0) / 2 - patio.raio;
    const qx = Math.max(Math.abs(x - cx) - ax, 0), qy = Math.max(Math.abs(y - cy) - ay, 0);
    return Math.hypot(qx, qy) - patio.raio;
  };
  /** distância até a borda do pátio (negativa dentro) */
  const noPatio = (x, y) => sdfPatio(x, y) + recortePatio(x, y);
  /** contorno do pátio afastado "e" px para fora (para pintar) */
  patio.contorno = e => {
    const cx = (patio.x0 + patio.x1) / 2, cy = (patio.y0 + patio.y1) / 2, ax = (patio.x1 - patio.x0) / 2 - patio.raio, ay = (patio.y1 - patio.y0) / 2 - patio.raio, out = [];
    for (let k = 0; k < 4; k++) { // quatro cantos arredondados ligados por retas
      const sx = k === 0 || k === 3 ? 1 : -1, sy = k < 2 ? 1 : -1;
      for (let a = 0; a <= 16; a++) {
        const ang = (k * 90 + (a / 16) * 90) * Math.PI / 180, nx = Math.cos(ang), ny = Math.sin(ang);
        const bx = cx + sx * ax + nx * patio.raio, by = cy + sy * ay + ny * patio.raio, d = e - recortePatio(bx, by);
        out.push([bx + nx * d, by + ny * d]);
      }
      const prox = k + 1 & 3, tx = prox === 0 || prox === 3 ? 1 : -1, ty = prox < 2 ? 1 : -1;
      const ang = ((k + 1) * 90) * Math.PI / 180, nx = Math.cos(ang), ny = Math.sin(ang);
      const ini = [cx + sx * ax + nx * patio.raio, cy + sy * ay + ny * patio.raio], fim = [cx + tx * ax + nx * patio.raio, cy + ty * ay + ny * patio.raio];
      const passos = Math.ceil(Math.hypot(fim[0] - ini[0], fim[1] - ini[1]) / 12);
      for (let i = 1; i < passos; i++) {
        const bx = ini[0] + (fim[0] - ini[0]) * i / passos, by = ini[1] + (fim[1] - ini[1]) * i / passos, d = e - recortePatio(bx, by);
        out.push([bx + nx * d, by + ny * d]);
      }
    }
    return out;
  };

  // ---------- lotes reservados (ainda sem construção): nada pode ficar em cima de nada ----------
  const lotes = [
    { id: 'casa', nome: 'Casa', x: 2600, y: 380, w: 420, h: 320 },
    { id: 'celeiro', nome: 'Celeiro', x: 3350, y: 330, w: 480, h: 370 },
    { id: 'galinheiro', nome: 'Galinheiro', x: 4150, y: 400, w: 520, h: 380 },
    { id: 'horta', nome: 'Horta', x: 2510, y: 1180, w: 640, h: 450 },
    { id: 'vacas', nome: 'Curral das vacas', x: 3460, y: 1180, w: 950, h: 620 },
    { id: 'ovelhas', nome: 'Curral das ovelhas', x: 2500, y: 1980, w: 640, h: 500 },
    { id: 'porcos', nome: 'Chiqueiro', x: 3460, y: 2020, w: 640, h: 460 },
    { id: 'pomar', nome: 'Pomar', x: 180, y: 380, w: 720, h: 620 },
  ];

  // ---------- campo de distância das estradas (grade de 4 px) ----------
  const G = 4, GW = Math.ceil(W / G) + 1, GH = Math.ceil(H / G) + 1;
  const dEstrada = new Float32Array(GW * GH).fill(999); // distância até a borda da estrada mais perto (negativa dentro)
  const uEstrada = new Uint8Array(GW * GH);              // 0 = meio da estrada, 255 = borda (só dentro)
  const tEstrada = new Uint8Array(GW * GH);              // 1 = estrada de duas trilhas
  for (const e of estradas) {
    const meia = e.larg / 2, alcance = meia + 60, L = e.linha;
    for (let i = 0; i < L.length - 1; i++) {
      const [ax, ay] = L[i], [bx, by] = L[i + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const gx0 = Math.max(0, Math.floor((Math.min(ax, bx) - alcance) / G)), gx1 = Math.min(GW - 1, Math.ceil((Math.max(ax, bx) + alcance) / G));
      const gy0 = Math.max(0, Math.floor((Math.min(ay, by) - alcance) / G)), gy1 = Math.min(GH - 1, Math.ceil((Math.max(ay, by) + alcance) / G));
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const px = gx * G, py = gy * G, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
        const d = Math.hypot(px - ax - dx * t, py - ay - dy * t), k = gx + gy * GW, borda = d - meia;
        if (borda < dEstrada[k]) {
          dEstrada[k] = borda;
          uEstrada[k] = Math.min(255, Math.round((d / meia) * 255));
          tEstrada[k] = e.duasTrilhas ? 1 : 0;
        }
      }
    }
  }
  const celula = (x, y) => Math.max(0, Math.min(GW - 1, Math.round(x / G))) + Math.max(0, Math.min(GH - 1, Math.round(y / G))) * GW;
  const estrada = {
    borda: (x, y) => dEstrada[celula(x, y)],
    meio: (x, y) => uEstrada[celula(x, y)] / 255,
    duasTrilhas: (x, y) => tEstrada[celula(x, y)] === 1,
  };

  /** está sobre o tabuleiro da ponte (com folga) */
  const naPonte = (x, y, folga = 0) => x >= P.x0 - folga && x <= P.x1 + folga && Math.abs(y - P.y) <= P.meia + folga;

  raiz.MapaLayout = { W, H, rio, ponte, estradas, patio, noPatio, lotes, estrada, naPonte };
})(typeof self !== 'undefined' ? self : globalThis);
