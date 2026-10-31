// Cidadezinha a oeste do rio, abaixo da estrada da porteira: ruas de paralelepípedo com calçadas, avenida saindo da
// estrada, rotatória com chafariz, mercado, igreja, padaria, escola, casas, árvores e postes (acendem à noite).
// O chão da cidade é pintado nos ladrilhos (uma vez só) e lá não nasce capim: a região fica bem leve.
(function (raiz) {
  'use strict';
  const R = { x0: 60, y0: 1400, x1: 960, y1: 2805 };             // retângulo da cidade
  const ROT = { x: 500, y: 2080, r: 150, ilha: 76 };              // rotatória: raio externo da pista e da ilha
  const PISTA = 56, CAL = 18;                                     // largura da pista e da calçada
  const RUAS = [
    { nome: 'Avenida da Vila', pts: [[500, 1300], [500, ROT.y]] },
    { nome: 'Rua das Flores', pts: [[90, 1560], [915, 1560]] },
    { nome: 'Rua do Mercado', pts: [[R.x0, ROT.y], [930, ROT.y]] },
    { nome: 'Rua da Escola', pts: [[500, ROT.y], [500, 2760]] },
    { nome: 'Rua de Baixo', pts: [[90, 2760], [915, 2760]] },
  ];
  // rua = linha do meio da rua em frente (o caminho de pedra vai da porta até a calçada)
  const PREDIOS = [
    { id: 'casaD', nome: 'Casa azul', tipo: 'casa', x: 165, base: 1500, rua: 1560, w: 150, h: 70, d: 70, parede: '#c9dcea', telha: '#a5492c', varanda: true, chamine: true, ven: '#2d5d9a' },
    { id: 'casaC', nome: 'Sobrado rosa', tipo: 'casa', x: 345, base: 1500, rua: 1560, w: 150, h: 112, d: 74, parede: '#f2c9c4', telha: '#8f3e28', andares: 2, ven: '#7a3b52' },
    { id: 'correio', nome: 'Correio', tipo: 'loja', x: 670, base: 1500, rua: 1560, w: 170, h: 80, d: 74, parede: '#f1d27a', tom: '#2d5d9a', placa: 'CORREIO' },
    { id: 'casaE', nome: 'Casa lilás', tipo: 'casa', x: 855, base: 1500, rua: 1560, w: 140, h: 70, d: 70, parede: '#ddd0ec', telha: '#a94b2c', chamine: true, ven: '#5b4a86' },
    { id: 'mercado', nome: 'Mercado da Vila', tipo: 'mercado', x: 205, base: 2010, rua: ROT.y, w: 250, h: 92, d: 80, parede: '#e9dcc0', tom: '#c0392b' },
    { id: 'igreja', nome: 'Igreja Matriz', tipo: 'igreja', x: 800, base: 2010, rua: ROT.y, w: 200, h: 118, d: 120, parede: '#f3efe6' },
    { id: 'padaria', nome: 'Padaria Pão Quente', tipo: 'loja', x: 175, base: 2700, rua: 2760, w: 200, h: 86, d: 76, parede: '#f2cf72', tom: '#8e4b25', placa: 'PADARIA' },
    { id: 'casaA', nome: 'Casa amarela', tipo: 'casa', x: 375, base: 2700, rua: 2760, w: 140, h: 70, d: 70, parede: '#f4e3a4', telha: '#a94b2c', varanda: true, ven: '#2f6b4a' },
    { id: 'escola', nome: 'Escola da Vila', tipo: 'escola', x: 665, base: 2700, rua: 2760, w: 230, h: 84, d: 90, parede: '#cfe0e8', telha: '#8f3e28' },
    { id: 'casaB', nome: 'Sobrado verde', tipo: 'casa', x: 870, base: 2700, rua: 2760, w: 120, h: 108, d: 70, parede: '#cde3c0', telha: '#9c4a2e', andares: 2, chamine: true, ven: '#6b4423' },
  ];
  const CORETO = { x: 255, y: 2390, r: 58 };
  const ARVORES = [[140, 1700], [330, 1690], [255, 1880], [640, 1690], [905, 1720], [615, 1880], [880, 1890],
    [120, 2210], [410, 2230], [640, 2250], [800, 2240], [905, 2440], [690, 2450], [125, 2520], [420, 2530]];
  const BANCOS = [[330, 1790], [700, 1800], [160, 2330], [380, 2360], [800, 2350]];
  const POSTES = [];
  for (const y of [1440, 1700, 1880]) POSTES.push([500 - PISTA / 2 - 10, y]);
  for (const y of [1660, 1820]) POSTES.push([500 + PISTA / 2 + 10, y]);
  for (const x of [120, 280, 720, 880]) POSTES.push([x, 1560 + PISTA / 2 + 12], [x, ROT.y + PISTA / 2 + 12]); // do lado de baixo da rua: não tapam as fachadas
  for (let y = 2290; y < 2700; y += 170) POSTES.push([500 - PISTA / 2 - 10, y]);
  for (const x of [130, 330, 670, 860]) POSTES.push([x, 2760 + PISTA / 2 + 12]);

  function segDist(x, y, [ax, ay], [bx, by]) { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - ax - dx * t, y - ay - dy * t); }
  /** distância até a beira da pista (negativa em cima da pista); a ilha da rotatória não é pista */
  function naRua(x, y) {
    let m = 1e9;
    for (const r of RUAS) m = Math.min(m, segDist(x, y, r.pts[0], r.pts[1]) - PISTA / 2);
    const d = Math.hypot(x - ROT.x, y - ROT.y);
    if (d < ROT.ilha) return ROT.ilha - d; // ilha: fora da pista
    return Math.min(m, d - ROT.r);
  }
  const caminhoDe = p => [p.x - 18, p.base - 4, p.x + 18, p.rua - PISTA / 2 - CAL + 2];
  /** gramado da cidade: 0 nas ruas, calçadas, caminhos, prédios, coreto e fonte; 1 no resto (null = fora da cidade) */
  function capim(x, y) {
    if (!dentro(x, y, 12)) return null;
    if (naRua(x, y) < CAL + 4) return 0;
    const d = Math.hypot(x - ROT.x, (y - ROT.y) * 1.05);
    if (d < ROT.ilha) return d > ROT.ilha - 18 || d < 60 ? 0 : 0.8; // canteiro de flores na borda e a fonte no meio
    for (const p of PREDIOS) {
      if (x > p.x - p.w / 2 - 8 && x < p.x + p.w / 2 + 8 && y > p.base - p.d - 6 && y < p.base + 6) return 0;
      const c = caminhoDe(p); if (x > c[0] - 3 && x < c[2] + 3 && y > c[1] && y < c[3]) return 0;
    }
    if (Math.hypot(x - CORETO.x, (y - CORETO.y) * 1.6) < CORETO.r + 6) return 0;
    for (const [ax, ay] of ARVORES) if (Math.hypot(x - ax, y - ay) < 14) return 0.3; // pé da árvore: o capim cobre só a raiz
    return 1;
  }
  const dentro = (x, y, folga = 0) => x > R.x0 - folga && x < R.x1 + folga && y > R.y0 - folga && y < R.y1 + folga;
  const pegada = p => [p.x - p.w / 2, p.base - p.d, p.x + p.w / 2, p.base];
  /** prédios, ilha e troncos bloqueiam o caminho */
  function bloqueia(x, y, folga = 0) {
    if (!dentro(x, y, 20)) return false;
    for (const p of PREDIOS) { const [a, b, c, d] = pegada(p); if (x > a - folga && x < c + folga && y > b - folga && y < d + folga) return true; }
    if (Math.hypot(x - ROT.x, y - ROT.y) < ROT.ilha + folga) return true;
    if (Math.hypot(x - CORETO.x, (y - CORETO.y) * 1.6) < CORETO.r + folga) return true;
    for (const [ax, ay] of ARVORES) if (Math.hypot(x - ax, y - ay) < 12 + folga) return true;
    return false;
  }

  function criar(U) {
    const { tom, degradeV, degradeH } = U;
    // ---------- texturas (presas ao mundo: os ladrilhos emendam sem costura) ----------
    function textura(tam, pintar) { const c = document.createElement('canvas'); c.width = c.height = tam; pintar(c.getContext('2d'), tam); return c; }
    const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(91);
    const paralelepipedo = textura(48, (g, t) => {
      g.fillStyle = '#4f4b46'; g.fillRect(0, 0, t, t);
      for (let j = 0; j < 4; j++) for (let i = -1; i < 5; i++) {
        const x = i * 12 + (j % 2) * 6 + 0.8, y = j * 12 + 0.8, k = 0.82 + rnd() * 0.36;
        g.fillStyle = tom('#8a857c', k); g.beginPath(); g.roundRect(x, y, 10.4, 10.4, 3); g.fill();
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 1.5, y + 1.2, 6, 1.6);
        g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x + 1, y + 8.4, 9, 1.6);
      }
    });
    const calcada = textura(40, (g, t) => {
      g.fillStyle = '#bdb6a6'; g.fillRect(0, 0, t, t);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { g.fillStyle = tom('#cfc8b8', 0.93 + rnd() * 0.12); g.fillRect(i * 20 + 0.8, j * 20 + 0.8, 18.4, 18.4); }
      for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(80,70,60,${0.05 + rnd() * 0.08})`; g.fillRect(rnd() * t, rnd() * t, 1.2, 1.2); }
    });
    const gramado = textura(64, (g, t) => {
      g.fillStyle = '#62822f'; g.fillRect(0, 0, t, t);
      for (let k = 0; k < 160; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(40,70,20,.35)' : 'rgba(150,190,80,.3)'; g.fillRect(rnd() * t, rnd() * t, 1.4, 2.6); }
    });
    const tracar = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); };

    /** chão da cidade dentro do ladrilho (x0, y0)–(x1, y1) */
    function pintarChao(g, x0, y0, x1, y1) {
      if (x1 < R.x0 - 80 || x0 > R.x1 + 80 || y1 < R.y0 - 200 || y0 > R.y1 + 80) return;
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      // gramado da cidade (rente, sem capim alto) com borda de terra
      g.fillStyle = 'rgba(70,52,30,.55)'; g.beginPath(); g.roundRect(R.x0 - 8, R.y0 - 8, R.x1 - R.x0 + 16, R.y1 - R.y0 + 16, 40); g.fill();
      g.fillStyle = g.createPattern(gramado, 'repeat'); g.beginPath(); g.roundRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0, 34); g.fill();
      // calçadas, meio-fio e pista (rotatória junto)
      const camada = (larg, estilo) => {
        g.strokeStyle = estilo; g.fillStyle = estilo; g.lineWidth = larg;
        for (const r of RUAS) { tracar(g, r.pts); g.stroke(); }
        g.beginPath(); g.arc(ROT.x, ROT.y, ROT.r + (larg - PISTA) / 2, 0, 7); g.fill();
      };
      camada(PISTA + CAL * 2 + 4, 'rgba(60,50,40,.35)');
      camada(PISTA + CAL * 2, g.createPattern(calcada, 'repeat'));
      camada(PISTA + 5, '#8f8a80');
      camada(PISTA, g.createPattern(paralelepipedo, 'repeat'));
      // ilha da rotatória: meio-fio, gramado e flores em volta do chafariz
      g.fillStyle = '#d8d2c4'; g.beginPath(); g.arc(ROT.x, ROT.y, ROT.ilha + 5, 0, 7); g.fill();
      g.fillStyle = g.createPattern(gramado, 'repeat'); g.beginPath(); g.arc(ROT.x, ROT.y, ROT.ilha, 0, 7); g.fill();
      const cores = ['#e8506a', '#f4c542', '#f08a3c', '#c467d6', '#ffffff'];
      let s = 7; const r2 = () => (s = (s * 16807) % 2147483647) / 2147483647;
      g.fillStyle = '#4a3524'; g.beginPath(); g.arc(ROT.x, ROT.y, ROT.ilha - 1, 0, 7); g.arc(ROT.x, ROT.y, ROT.ilha - 19, 0, 7, true); g.fill();
      for (let i = 0; i < 260; i++) { const a = r2() * 6.283, d = ROT.ilha - 4 - r2() * 13; g.fillStyle = cores[Math.floor(r2() * cores.length)]; g.beginPath(); g.arc(ROT.x + Math.cos(a) * d, ROT.y + Math.sin(a) * d * 0.98, 1.8, 0, 7); g.fill(); }
      // faixas de pedestre na chegada de cada rua
      g.fillStyle = 'rgba(245,242,232,.85)';
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
        const cx = ROT.x + dx * (ROT.r + 34), cy = ROT.y + dy * (ROT.r + 34);
        for (let k = -2; k <= 2; k++) {
          if (dx) g.fillRect(cx - 9, cy + k * 11 - 3.5, 18, 7); else g.fillRect(cx + k * 11 - 3.5, cy - 9, 7, 18);
        }
      }
      // caminhos de pedra até as portas e o piso do coreto
      g.fillStyle = g.createPattern(calcada, 'repeat');
      for (const p of PREDIOS) { const c = caminhoDe(p); g.fillRect(c[0], c[1], c[2] - c[0], c[3] - c[1]); }
      g.fillStyle = 'rgba(60,50,40,.35)'; g.beginPath(); g.ellipse(CORETO.x, CORETO.y, CORETO.r + 10, (CORETO.r + 10) / 1.6, 0, 0, 7); g.fill();
      g.fillStyle = g.createPattern(calcada, 'repeat'); g.beginPath(); g.ellipse(CORETO.x, CORETO.y, CORETO.r + 6, (CORETO.r + 6) / 1.6, 0, 0, 7); g.fill();
      for (const p of PREDIOS) { const c = caminhoDe(p); g.fillRect(c[0], c[1], c[2] - c[0], c[3] - c[1]); }
      // sombras dos prédios no chão (sol a noroeste)
      g.fillStyle = 'rgba(20,24,10,.28)';
      for (const p of PREDIOS) { const [a, b, c, d] = pegada(p); g.beginPath(); g.moveTo(c, d); g.lineTo(c + 22, d - 8); g.lineTo(c + 22, b - 10); g.lineTo(c, b); g.closePath(); g.fill(); }
      g.restore();
    }

    // ---------- desenho dos prédios ----------
    function telhado(g, x0, x1, topo, alto, cor, quatroAguas = true) {
      const rec = quatroAguas ? Math.min(alto * 1.1, (x1 - x0) * 0.3) : 0;
      g.fillStyle = degradeV(g, topo - alto, topo, [[0, tom(cor, 1.25)], [1, tom(cor, 0.85)]]);
      g.beginPath(); g.moveTo(x0 - 10, topo + 4); g.lineTo(x0 - 10 + rec, topo - alto); g.lineTo(x1 + 10 - rec, topo - alto); g.lineTo(x1 + 10, topo + 4); g.closePath(); g.fill();
      g.save(); g.clip();
      for (let y = topo - alto + 5; y < topo + 4; y += 6) {
        g.strokeStyle = tom(cor, 0.62, 0.7); g.lineWidth = 1.1; g.beginPath(); g.moveTo(x0 - 14, y); g.lineTo(x1 + 14, y); g.stroke();
        g.strokeStyle = tom(cor, 0.75, 0.5); g.lineWidth = 0.7;
        for (let x = x0 - 14 + ((y / 6) % 2) * 5; x < x1 + 14; x += 10) { g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x, y); g.stroke(); }
      }
      g.restore();
      g.strokeStyle = tom(cor, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(x0 - 10 + rec, topo - alto); g.lineTo(x1 + 10 - rec, topo - alto); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0 - 10, topo + 2, x1 - x0 + 20, 4);
    }
    function parede(g, x0, x1, topo, base, cor) {
      g.fillStyle = degradeH(g, x0, x1, [[0, tom(cor, 1.06)], [0.6, tom(cor, 1)], [1, tom(cor, 0.86)]]); g.fillRect(x0, topo, x1 - x0, base - topo);
      g.fillStyle = tom(cor, 0.68); g.fillRect(x0, base - 9, x1 - x0, 9); // rodapé
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x0, topo, x1 - x0, 6);
    }
    function janela(g, x, y, w, h, ven = '#2f6b4a') {
      g.fillStyle = tom(ven, 0.9); g.fillRect(x - w / 2 - 7, y, 7, h); g.fillRect(x + w / 2, y, 7, h); // venezianas
      g.strokeStyle = tom(ven, 0.6); g.lineWidth = 0.6; for (let k = 3; k < h; k += 3) { g.beginPath(); g.moveTo(x - w / 2 - 7, y + k); g.lineTo(x - w / 2, y + k); g.moveTo(x + w / 2, y + k); g.lineTo(x + w / 2 + 7, y + k); g.stroke(); }
      g.fillStyle = '#f7f3ea'; g.fillRect(x - w / 2 - 1.5, y - 1.5, w + 3, h + 3);
      g.fillStyle = degradeV(g, y, y + h, [[0, '#bcd6e4'], [1, '#4f7590']]); g.fillRect(x - w / 2, y, w, h);
      g.strokeStyle = '#f7f3ea'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.moveTo(x - w / 2, y + h / 2); g.lineTo(x + w / 2, y + h / 2); g.stroke();
      g.fillStyle = '#e8e2d4'; g.fillRect(x - w / 2 - 4, y + h + 1, w + 8, 3);
    }
    function porta(g, x, base, w, h, cor = '#6b4423', arco = false) {
      g.fillStyle = '#f2ede2'; g.beginPath(); if (arco) { g.moveTo(x - w / 2 - 3, base); g.lineTo(x - w / 2 - 3, base - h + w / 2); g.arc(x, base - h + w / 2, w / 2 + 3, Math.PI, 0); g.lineTo(x + w / 2 + 3, base); } else g.rect(x - w / 2 - 3, base - h - 3, w + 6, h + 3); g.fill();
      g.fillStyle = degradeV(g, base - h, base, [[0, tom(cor, 1.2)], [1, tom(cor, 0.8)]]);
      g.beginPath(); if (arco) { g.moveTo(x - w / 2, base); g.lineTo(x - w / 2, base - h + w / 2); g.arc(x, base - h + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, base); } else g.rect(x - w / 2, base - h, w, h); g.fill();
      g.strokeStyle = tom(cor, 0.55); g.lineWidth = 1; g.beginPath(); g.moveTo(x, base - h + (arco ? w / 2 - w / 2 : 0)); g.lineTo(x, base); g.stroke();
      g.fillStyle = '#d6b45a'; g.fillRect(x - 4, base - h * 0.45, 2.5, 2.5); g.fillRect(x + 2, base - h * 0.45, 2.5, 2.5);
    }
    function placa(g, x, y, texto, fundo, cor = '#fff8e8', tam = 14) {
      g.font = `700 ${tam}px Georgia, 'Times New Roman', serif`; const w = g.measureText(texto).width + 18;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - w / 2 + 2, y - tam + 1, w, tam + 9);
      g.fillStyle = fundo; g.fillRect(x - w / 2, y - tam - 1, w, tam + 9);
      g.strokeStyle = tom(fundo, 0.6); g.lineWidth = 1; g.strokeRect(x - w / 2 + 2, y - tam + 1, w - 4, tam + 5);
      g.fillStyle = cor; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(texto, x, y + 4);
    }
    function toldo(g, x0, x1, y, cor) {
      const n = Math.round((x1 - x0) / 16), w = (x1 - x0) / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? '#f6f1e6' : cor; g.beginPath(); g.moveTo(x0 + i * w, y); g.lineTo(x0 + i * w - 4, y + 16); g.lineTo(x0 + (i + 1) * w - 4, y + 16); g.lineTo(x0 + (i + 1) * w, y); g.closePath(); g.fill();
        g.beginPath(); g.arc(x0 + (i + 0.5) * w - 4, y + 16, w / 2, 0, Math.PI); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0 - 4, y + 16 + w / 2, x1 - x0, 5);
    }
    function caixotes(g, x, base, r) {
      const frutas = ['#e2532e', '#f39a2e', '#e8c33a', '#7fb84a', '#c63b4a', '#8a3c8f'];
      for (let i = 0; i < 3; i++) {
        const cx = x + i * 22, cor = frutas[Math.floor(r() * frutas.length)];
        g.fillStyle = degradeV(g, base - 16, base, [[0, '#c9a46a'], [1, '#93703f']]); g.fillRect(cx, base - 16, 20, 16);
        g.strokeStyle = 'rgba(80,55,25,.7)'; g.lineWidth = 0.8; g.strokeRect(cx + 0.4, base - 15.6, 19.2, 15.2);
        for (let k = 0; k < 6; k++) { g.fillStyle = tom(cor, 0.85 + r() * 0.3); g.beginPath(); g.arc(cx + 4 + r() * 12, base - 17 + r() * 3, 3, 0, 7); g.fill(); }
      }
    }
    const PINTAR = {
      casa(g, p, r) {
        const x0 = p.x - p.w / 2, x1 = p.x + p.w / 2, topo = p.base - p.h, dois = p.andares === 2, ven = p.ven || '#2f6b4a';
        telhado(g, x0, x1, topo, dois ? 38 : 34, p.telha);
        if (p.chamine) { const cx = x1 - p.w * 0.25, cy = topo - 22; g.fillStyle = degradeH(g, cx, cx + 14, [[0, '#a5583b'], [1, '#6e3420']]); g.fillRect(cx, cy - 22, 14, 26); g.fillStyle = '#4a2a1a'; g.fillRect(cx - 2, cy - 25, 18, 5); for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(60,25,10,.4)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx, cy - 18 + k * 6); g.lineTo(cx + 14, cy - 18 + k * 6); g.stroke(); } }
        parede(g, x0, x1, topo, p.base, p.parede);
        const floreira = (x, y, w) => { g.fillStyle = '#7a4a2a'; g.fillRect(x - w / 2 - 3, y, w + 6, 5); for (let k = 0; k < 7; k++) { g.fillStyle = '#4f7f2c'; g.beginPath(); g.arc(x - w / 2 + r() * w, y - 1, 2.6, 0, 7); g.fill(); g.fillStyle = ['#e8506a', '#f4c542', '#ffffff', '#c467d6'][Math.floor(r() * 4)]; g.beginPath(); g.arc(x - w / 2 + r() * w, y - 2.5, 1.8, 0, 7); g.fill(); } };
        if (dois) { // andar de cima: janelas com sacadinha
          g.fillStyle = tom(p.parede, 0.8); g.fillRect(x0, topo + 50, p.w, 4);
          for (const fx of [0.25, 0.75]) { const jx = x0 + p.w * fx; janela(g, jx, topo + 12, 20, 26, ven); g.strokeStyle = '#f7f3ea'; g.lineWidth = 1.4; g.strokeRect(jx - 16, topo + 30, 32, 10); for (let k = -12; k <= 12; k += 4) { g.beginPath(); g.moveTo(jx + k, topo + 30); g.lineTo(jx + k, topo + 40); g.stroke(); } }
        }
        const t2 = dois ? topo + 56 : topo;
        if (p.varanda) { // varanda com pilares e telhadinho na frente
          g.fillStyle = '#b89a72'; g.fillRect(x0 + 6, p.base - 6, p.w - 12, 6);
          janela(g, x0 + p.w * 0.22, t2 + 20, 20, 22, ven); floreira(x0 + p.w * 0.22, t2 + 46, 22);
          janela(g, x1 - p.w * 0.22, t2 + 20, 20, 22, ven); floreira(x1 - p.w * 0.22, t2 + 46, 22);
          porta(g, p.x, p.base - 6, 22, 38, '#6b4423');
          g.fillStyle = degradeV(g, t2 + 8, t2 + 20, [[0, tom(p.telha, 1.2)], [1, tom(p.telha, 0.8)]]); g.beginPath(); g.moveTo(x0 + 2, t2 + 18); g.lineTo(x0 + 10, t2 + 8); g.lineTo(x1 - 10, t2 + 8); g.lineTo(x1 - 2, t2 + 18); g.closePath(); g.fill();
          for (const px of [x0 + 8, p.x - 22, p.x + 18, x1 - 12]) { g.fillStyle = '#f7f3ea'; g.fillRect(px, t2 + 18, 4, p.base - t2 - 24); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(px + 3, t2 + 18, 1, p.base - t2 - 24); }
        } else {
          porta(g, p.x, p.base - 2, 22, 40, '#6b4423');
          janela(g, x0 + p.w * 0.22, t2 + 18, 20, 22, ven); floreira(x0 + p.w * 0.22, t2 + 44, 22);
          janela(g, x1 - p.w * 0.22, t2 + 18, 20, 22, ven); floreira(x1 - p.w * 0.22, t2 + 44, 22);
        }
        g.fillStyle = '#7a5f45'; g.fillRect(p.x - 18, p.base - 2, 36, 4); // degrau
        // cerquinha branca na frente, com o portãozinho aberto no caminho
        const cy = p.base + 16;
        g.fillStyle = 'rgba(20,24,10,.25)'; g.fillRect(x0 - 6, cy + 1, p.w + 12, 3);
        for (let x = x0 - 6; x <= x1 + 6; x += 7) { if (Math.abs(x - p.x) < 20) continue; g.fillStyle = '#f3efe6'; g.beginPath(); g.moveTo(x, cy); g.lineTo(x, cy - 12); g.lineTo(x + 2, cy - 15); g.lineTo(x + 4, cy - 12); g.lineTo(x + 4, cy); g.fill(); }
        g.fillStyle = '#e4dfd2'; g.fillRect(x0 - 6, cy - 9, p.x - 20 - x0 + 6, 2.5); g.fillRect(p.x + 20, cy - 9, x1 + 6 - p.x - 20, 2.5);
        if (r() < 0.6) { g.fillStyle = '#3c5f8a'; g.fillRect(p.x + 24, cy - 26, 9, 7); g.fillStyle = '#6b4a2a'; g.fillRect(p.x + 27.5, cy - 19, 2, 19); } // caixa de correio
      },
      loja(g, p, r) { // fachada com platibanda (a frente esconde o telhado) e toldo
        const x0 = p.x - p.w / 2, x1 = p.x + p.w / 2, topo = p.base - p.h;
        g.fillStyle = tom(p.parede, 0.7); g.fillRect(x0 + 6, topo - 30, p.w - 12, 30); // telhado atrás da platibanda
        parede(g, x0, x1, topo - 26, p.base, p.parede);
        g.fillStyle = tom(p.parede, 1.12); g.fillRect(x0 - 4, topo - 30, p.w + 8, 6); g.fillRect(x0 - 2, topo + 2, p.w + 4, 4);
        placa(g, p.x, topo - 6, p.placa, p.tom, '#fff8e8', 15);
        toldo(g, x0 + 8, x1 - 8, topo + 22, p.tom);
        porta(g, p.x, p.base - 2, 30, 46, '#5a3a20');
        janela(g, x0 + p.w * 0.2, topo + 50, 30, 26, p.tom); janela(g, x1 - p.w * 0.2, topo + 50, 30, 26, p.tom);
        if (p.id === 'padaria') { g.fillStyle = '#d99a4a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x0 + p.w * 0.2 - 9 + k * 6, topo + 72, 4, 2.5, 0, 0, 7); g.fill(); } }
        if (p.id === 'correio') { g.fillStyle = '#e8c33a'; g.fillRect(x1 - 26, p.base - 32, 14, 30); g.fillStyle = '#2d5d9a'; g.fillRect(x1 - 26, p.base - 34, 14, 5); }
      },
      mercado(g, p, r) {
        const x0 = p.x - p.w / 2, x1 = p.x + p.w / 2, topo = p.base - p.h;
        g.fillStyle = tom(p.parede, 0.7); g.fillRect(x0 + 6, topo - 34, p.w - 12, 34);
        parede(g, x0, x1, topo - 30, p.base, p.parede);
        g.fillStyle = '#7a3a1e'; g.fillRect(x0 - 4, topo - 34, p.w + 8, 6);
        placa(g, p.x, topo - 8, 'MERCADO DA VILA', '#2f6b4a', '#fff8e8', 16);
        toldo(g, x0 + 6, x1 - 6, topo + 18, p.tom);
        // vitrines largas e porta dupla
        for (const vx of [x0 + p.w * 0.2, x1 - p.w * 0.2]) { g.fillStyle = '#f2ede2'; g.fillRect(vx - 32, topo + 44, 64, 34); g.fillStyle = degradeV(g, topo + 46, topo + 76, [[0, '#cfe3ec'], [1, '#5d8199']]); g.fillRect(vx - 30, topo + 46, 60, 30); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(vx - 26, topo + 48, 8, 26); }
        porta(g, p.x, p.base - 2, 36, 50, '#6b4423');
        caixotes(g, x0 + 8, p.base + 6, r); caixotes(g, x1 - 72, p.base + 6, r);
      },
      escola(g, p, r) {
        const x0 = p.x - p.w / 2, x1 = p.x + p.w / 2, topo = p.base - p.h;
        telhado(g, x0, x1, topo, 38, p.telha);
        parede(g, x0, x1, topo, p.base, p.parede);
        placa(g, p.x, topo + 22, 'ESCOLA', '#2d5d9a', '#fff8e8', 14);
        for (const fx of [0.13, 0.3, 0.7, 0.87]) janela(g, x0 + p.w * fx, topo + 36, 22, 26, '#2d5d9a');
        porta(g, p.x, p.base - 2, 30, 46, '#6b4423', true);
        // sino e mastro com bandeirinha
        g.fillStyle = '#d6b45a'; g.beginPath(); g.arc(p.x, topo - 30, 7, Math.PI, 0); g.lineTo(p.x + 8, topo - 26); g.lineTo(p.x - 8, topo - 26); g.fill();
        g.fillStyle = '#c9ced1'; g.fillRect(x1 + 18, p.base - 120, 3, 120); g.fillStyle = '#e2532e'; g.beginPath(); g.moveTo(x1 + 21, p.base - 118); g.lineTo(x1 + 50, p.base - 110); g.lineTo(x1 + 21, p.base - 102); g.fill();
      },
      igreja(g, p, r) {
        const x0 = p.x - p.w / 2, x1 = p.x + p.w / 2, topo = p.base - p.h, cor = p.parede;
        // nave: telhado de duas águas visto de frente (frontão) e torre no meio
        telhado(g, x0 + 10, x1 - 10, topo + 10, 30, '#9a4a30', false);
        parede(g, x0, x1, topo, p.base, cor);
        g.fillStyle = tom(cor, 1.04); g.beginPath(); g.moveTo(x0 - 4, topo + 2); g.lineTo(p.x, topo - 50); g.lineTo(x1 + 4, topo + 2); g.closePath(); g.fill();
        g.strokeStyle = tom(cor, 0.7); g.lineWidth = 2.5; g.stroke();
        g.fillStyle = '#d9b44a'; for (const fx of [x0 + 3, x1 - 9]) g.fillRect(fx, topo, 6, p.h - 10); // cunhais
        // torre
        const tw = 56, tx0 = p.x - tw / 2, tt = topo - 120;
        g.fillStyle = degradeH(g, tx0, tx0 + tw, [[0, tom(cor, 1.06)], [1, tom(cor, 0.84)]]); g.fillRect(tx0, tt, tw, 90);
        g.fillStyle = '#3b2a1c'; g.beginPath(); g.moveTo(p.x - 12, tt + 46); g.lineTo(p.x - 12, tt + 24); g.arc(p.x, tt + 24, 12, Math.PI, 0); g.lineTo(p.x + 12, tt + 46); g.fill();
        g.fillStyle = '#d6b45a'; g.beginPath(); g.arc(p.x, tt + 30, 8, Math.PI, 0); g.lineTo(p.x + 9, tt + 36); g.lineTo(p.x - 9, tt + 36); g.fill();
        g.fillStyle = degradeV(g, tt - 46, tt, [[0, '#4f6f8a'], [1, '#2d4256']]); g.beginPath(); g.moveTo(tx0 - 6, tt + 2); g.lineTo(p.x, tt - 46); g.lineTo(tx0 + tw + 6, tt + 2); g.closePath(); g.fill();
        g.fillStyle = '#d6b45a'; g.fillRect(p.x - 1.5, tt - 68, 3, 24); g.fillRect(p.x - 8, tt - 60, 16, 3);
        // relógio/rosácea, porta grande e janelas altas
        g.fillStyle = '#f7f3ea'; g.beginPath(); g.arc(p.x, topo - 12, 13, 0, 7); g.fill(); g.fillStyle = '#5e86a8'; g.beginPath(); g.arc(p.x, topo - 12, 10, 0, 7); g.fill();
        g.strokeStyle = '#f7f3ea'; g.lineWidth = 1.2; for (let a = 0; a < 6.28; a += 0.785) { g.beginPath(); g.moveTo(p.x, topo - 12); g.lineTo(p.x + Math.cos(a) * 10, topo - 12 + Math.sin(a) * 10); g.stroke(); }
        porta(g, p.x, p.base - 6, 40, 64, '#5a3a20', true);
        for (const fx of [x0 + 30, x1 - 30]) { g.fillStyle = '#f2ede2'; g.beginPath(); g.moveTo(fx - 11, topo + 76); g.lineTo(fx - 11, topo + 34); g.arc(fx, topo + 34, 11, Math.PI, 0); g.lineTo(fx + 11, topo + 76); g.fill(); g.fillStyle = degradeV(g, topo + 24, topo + 74, [[0, '#9fc3d8'], [1, '#3f6a86']]); g.beginPath(); g.moveTo(fx - 8, topo + 74); g.lineTo(fx - 8, topo + 34); g.arc(fx, topo + 34, 8, Math.PI, 0); g.lineTo(fx + 8, topo + 74); g.fill(); }
        // escadaria
        for (let k = 0; k < 3; k++) { g.fillStyle = tom('#cfc8b8', 1 - k * 0.07); g.fillRect(p.x - 40 - k * 6, p.base - 6 + k * 4, 80 + k * 12, 4); }
      },
    };
    const caixaPredio = p => [p.x - p.w / 2 - 30, p.base - p.h - (p.tipo === 'igreja' ? 200 : 80), p.x + p.w / 2 + (p.tipo === 'escola' ? 60 : 30), p.base + 26];
    function arvore(g, x, y, r) {
      g.fillStyle = 'rgba(20,24,10,.3)'; g.beginPath(); g.ellipse(x + 10, y - 2, 30, 10, 0, 0, 7); g.fill();
      g.fillStyle = degradeH(g, x - 5, x + 5, [[0, '#5a3d24'], [1, '#3a2716']]); g.fillRect(x - 4.5, y - 44, 9, 44);
      const folhas = [[0, -78, 30], [-20, -62, 22], [20, -60, 23], [-8, -94, 20], [12, -88, 19]];
      for (const [dx, dy, rr] of folhas) { g.fillStyle = '#2f5a20'; g.beginPath(); g.arc(x + dx + 2, y + dy + 3, rr, 0, 7); g.fill(); }
      for (const [dx, dy, rr] of folhas) { g.fillStyle = degradeV(g, y + dy - rr, y + dy + rr, [[0, '#7fb048'], [1, '#3f7a28']]); g.beginPath(); g.arc(x + dx, y + dy, rr * 0.92, 0, 7); g.fill(); }
      for (let k = 0; k < 40; k++) { const a = r() * 6.28, d = r() * 30; g.fillStyle = r() < 0.5 ? 'rgba(170,210,100,.45)' : 'rgba(30,60,20,.35)'; g.beginPath(); g.ellipse(x + Math.cos(a) * d, y - 76 + Math.sin(a) * d * 0.8, 3.5, 2.2, a, 0, 7); g.fill(); }
    }
    function banco(g, x, y) {
      const cor = '#8a5a30';
      g.fillStyle = 'rgba(20,24,10,.3)'; g.fillRect(x - 28, y - 3, 60, 6);
      g.fillStyle = tom(cor, 0.6); g.fillRect(x - 24, y - 16, 4, 16); g.fillRect(x + 20, y - 16, 4, 16);
      g.fillStyle = tom(cor, 1.1); g.fillRect(x - 28, y - 32, 56, 5); g.fillRect(x - 28, y - 25, 56, 5); g.fillStyle = tom(cor, 1.25); g.fillRect(x - 30, y - 18, 60, 6);
    }
    function poste(g, x, y) {
      g.fillStyle = 'rgba(20,24,10,.3)'; g.beginPath(); g.ellipse(x + 3, y - 1, 8, 3, 0, 0, 7); g.fill();
      g.fillStyle = '#2b2d30'; g.fillRect(x - 2, y - 78, 4, 78); g.fillRect(x - 5, y - 4, 10, 4);
      g.fillStyle = '#2b2d30'; g.beginPath(); g.moveTo(x - 8, y - 78); g.lineTo(x + 8, y - 78); g.lineTo(x + 5, y - 88); g.lineTo(x - 5, y - 88); g.closePath(); g.fill();
      g.fillStyle = '#ffe7a0'; g.fillRect(x - 5, y - 86, 10, 7);
    }
    /** fonte de três taças (parte fixa; a água anima por cima) */
    function chafariz(g, x, y) {
      const pedra = (y0, y1) => degradeV(g, y0, y1, [[0, '#ece6d8'], [0.5, '#c9c1ae'], [1, '#8f877a']]);
      g.fillStyle = 'rgba(20,24,10,.32)'; g.beginPath(); g.ellipse(x + 8, y + 22, 58, 18, 0, 0, 7); g.fill();
      // tanque grande: borda de pedra lavrada
      g.fillStyle = pedra(y - 4, y + 26); g.beginPath(); g.ellipse(x, y + 10, 54, 21, 0, 0, 7); g.fill();
      g.fillStyle = '#7d7568'; g.beginPath(); g.ellipse(x, y + 12, 54, 21, 0, 0, Math.PI); g.fill();
      g.fillStyle = pedra(y - 6, y + 20); g.beginPath(); g.ellipse(x, y + 4, 54, 20, 0, 0, 7); g.fill();
      for (let a = 0.15; a < Math.PI; a += 0.32) { g.fillStyle = 'rgba(80,72,60,.35)'; g.fillRect(x + Math.cos(a) * 52 - 1, y + 6 + Math.sin(a) * 19, 2, 9); }
      g.fillStyle = degradeV(g, y - 10, y + 14, [[0, '#2f6f86'], [1, '#1d4a5c']]); g.beginPath(); g.ellipse(x, y + 3, 46, 15, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(160,215,230,.25)'; g.beginPath(); g.ellipse(x - 14, y - 1, 20, 4, 0, 0, 7); g.fill();
      // coluna com folhas, taça do meio, coluna fina, taça de cima e pinha
      g.fillStyle = degradeH(g, x - 8, x + 8, [[0, '#e8e2d4'], [0.6, '#c4bca8'], [1, '#8f877a']]); g.fillRect(x - 7, y - 30, 14, 34);
      for (const k of [-1, 1]) { g.fillStyle = '#d5cdb9'; g.beginPath(); g.ellipse(x + k * 8, y - 2, 6, 3, k * 0.5, 0, 7); g.fill(); }
      g.fillStyle = pedra(y - 40, y - 26); g.beginPath(); g.ellipse(x, y - 30, 28, 9, 0, 0, Math.PI); g.lineTo(x - 28, y - 32); g.fill();
      g.beginPath(); g.ellipse(x, y - 32, 28, 9, 0, 0, 7); g.fill();
      g.fillStyle = '#2f7690'; g.beginPath(); g.ellipse(x, y - 33, 23, 6.5, 0, 0, 7); g.fill();
      g.fillStyle = degradeH(g, x - 5, x + 5, [[0, '#e8e2d4'], [1, '#8f877a']]); g.fillRect(x - 4, y - 56, 8, 24);
      g.fillStyle = pedra(y - 62, y - 54); g.beginPath(); g.ellipse(x, y - 56, 14, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#3a86a0'; g.beginPath(); g.ellipse(x, y - 57, 11, 3.5, 0, 0, 7); g.fill();
      g.fillStyle = pedra(y - 72, y - 58); g.beginPath(); g.ellipse(x, y - 64, 4, 7, 0, 0, 7); g.fill();
    }
    function coreto(g, x, y, R0) {
      const ry = R0 / 1.6;
      g.fillStyle = 'rgba(20,24,10,.3)'; g.beginPath(); g.ellipse(x + 10, y + 6, R0 + 4, ry + 3, 0, 0, 7); g.fill();
      g.fillStyle = degradeV(g, y - ry, y + ry + 10, [[0, '#ece6d8'], [1, '#a59c8a']]); g.beginPath(); g.ellipse(x, y + 4, R0, ry, 0, 0, 7); g.fill();
      g.fillStyle = '#8f877a'; g.fillRect(x - R0, y + 4, R0 * 2, 6); g.beginPath(); g.ellipse(x, y + 10, R0, ry, 0, 0, Math.PI); g.fill();
      g.fillStyle = degradeV(g, y - ry, y + ry, [[0, '#b98c5a'], [1, '#8a643c']]); g.beginPath(); g.ellipse(x, y, R0 - 6, ry - 4, 0, 0, 7); g.fill();
      // pilares (de trás primeiro), grade e telhado em cone
      const pil = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.39; pil.push([x + Math.cos(a) * (R0 - 10), y + Math.sin(a) * (ry - 6)]); }
      pil.sort((a, b) => a[1] - b[1]);
      const H = 62;
      for (const [px, py] of pil) { g.fillStyle = degradeH(g, px - 3, px + 3, [[0, '#ffffff'], [1, '#c9c1ae']]); g.fillRect(px - 3, py - H, 6, H); }
      g.strokeStyle = '#f3efe6'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x, y - 14, R0 - 10, ry - 6, 0, 0, Math.PI); g.stroke(); g.beginPath(); g.ellipse(x, y - 4, R0 - 10, ry - 6, 0, 0, Math.PI); g.stroke();
      for (let a = 0.2; a < Math.PI; a += 0.26) { g.beginPath(); g.moveTo(x + Math.cos(a) * (R0 - 10), y - 14 + Math.sin(a) * (ry - 6)); g.lineTo(x + Math.cos(a) * (R0 - 10), y - 4 + Math.sin(a) * (ry - 6)); g.stroke(); }
      const ty = y - H;
      g.fillStyle = '#f3efe6'; g.beginPath(); g.ellipse(x, ty, R0 - 2, ry - 2, 0, 0, 7); g.fill();
      g.fillStyle = degradeV(g, ty - 46, ty + 6, [[0, '#c4523a'], [1, '#7e2c1c']]); g.beginPath(); g.moveTo(x - R0 - 4, ty + 2); g.quadraticCurveTo(x - R0 * 0.4, ty - 18, x, ty - 48); g.quadraticCurveTo(x + R0 * 0.4, ty - 18, x + R0 + 4, ty + 2); g.ellipse(x, ty + 2, R0 + 4, ry * 0.5, 0, 0, Math.PI); g.fill();
      g.strokeStyle = 'rgba(70,20,10,.45)'; g.lineWidth = 0.9; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x, ty - 46); g.quadraticCurveTo(x + k * R0 * 0.18, ty - 16, x + k * R0 * 0.32, ty + 4 + Math.abs(k) * 0.5); g.stroke(); }
      g.fillStyle = '#d6b45a'; g.beginPath(); g.arc(x, ty - 50, 4, 0, 7); g.fill();
    }
    /** coisas da cidade que entram na ordem de profundidade (prédios, árvores, bancos, postes, chafariz) */
    const itens = [
      ...PREDIOS.map(p => ({ y: p.base, caixa: caixaPredio(p), pintar: (g, r) => PINTAR[p.tipo](g, p, r), predio: p })),
      ...ARVORES.map(([x, y]) => ({ y, caixa: [x - 44, y - 130, x + 50, y + 12], pintar: (g, r) => arvore(g, x, y, r) })),
      ...BANCOS.map(([x, y]) => ({ y, caixa: [x - 34, y - 40, x + 36, y + 6], pintar: g => banco(g, x, y) })),
      ...POSTES.map(([x, y]) => ({ y, caixa: [x - 12, y - 92, x + 14, y + 4], pintar: g => poste(g, x, y) })),
      { y: ROT.y + 26, caixa: [ROT.x - 66, ROT.y - 80, ROT.x + 70, ROT.y + 44], pintar: g => chafariz(g, ROT.x, ROT.y), chafariz: true },
      { y: CORETO.y + CORETO.r / 1.6, caixa: [CORETO.x - CORETO.r - 12, CORETO.y - 130, CORETO.x + CORETO.r + 18, CORETO.y + 50], pintar: g => coreto(g, CORETO.x, CORETO.y, CORETO.r) },
    ];
    function assar(q) {
      for (const it of itens) {
        const [x0, y0, x1, y1] = it.caixa, c = it.cv && it.cq === q ? it.cv : document.createElement('canvas');
        if (it.cq === q) continue;
        c.width = Math.ceil((x1 - x0) * q); c.height = Math.ceil((y1 - y0) * q);
        const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q);
        let s = Math.round(x0 * 7 + y0 * 3) % 2147483646 + 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
        it.pintar(g, r); it.cv = c; it.cq = q;
      }
    }
    /** água da fonte: jato no topo, véus caindo das taças, ondinhas no tanque e brilhos */
    function agua(ctx, t) {
      const x = ROT.x, y = ROT.y;
      ctx.save(); ctx.lineCap = 'round';
      // ondinhas no tanque
      for (let k = 0; k < 3; k++) { const f = (t * 0.5 + k / 3) % 1; ctx.strokeStyle = `rgba(200,235,245,${0.35 * (1 - f)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y + 3, 10 + f * 34, (10 + f * 34) * 0.33, 0, 0, 7); ctx.stroke(); }
      // véus: da taça do meio para o tanque e da de cima para a do meio
      for (const [rr, y0, y1, n] of [[25, -31, 2, 22], [11, -56, -34, 12]]) {
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI, ox = Math.cos(a) * rr, oy = Math.sin(a) * rr * 0.3, f = (t * 2.2 + k * 0.41) % 1;
          ctx.strokeStyle = `rgba(215,240,250,${0.45 + 0.25 * Math.sin(t * 6 + k)})`; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(x + ox, y + y0 + oy); ctx.quadraticCurveTo(x + ox * 1.25, y + y0 + oy + 3, x + ox * 1.3, y + y1 + oy); ctx.stroke();
          ctx.fillStyle = 'rgba(240,252,255,.8)'; ctx.beginPath(); ctx.arc(x + ox * (1.1 + f * 0.2), y + y0 + oy + (y1 - y0) * f, 1, 0, 7); ctx.fill();
        }
      }
      // jato de cima: sobe e se abre em gotas
      const h = 26 + Math.sin(t * 3) * 2;
      ctx.strokeStyle = 'rgba(225,245,252,.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x, y - 70 - h); ctx.stroke();
      for (let k = 0; k < 14; k++) {
        const f = (t * 1.4 + k / 14) % 1, lado = k % 2 ? 1 : -1, vx = lado * (3 + (k % 5) * 2.2);
        ctx.fillStyle = `rgba(230,248,255,${0.9 * (1 - f)})`; ctx.beginPath(); ctx.arc(x + vx * f * 2, y - 70 - h + f * f * 34 - f * 6, 1.3, 0, 7); ctx.fill();
      }
      // brilhos na água
      for (let k = 0; k < 6; k++) { const a = k * 1.7 + t * 0.4, b = Math.max(0, Math.sin(t * 4 + k * 2)); ctx.fillStyle = `rgba(255,255,255,${0.7 * b})`; ctx.fillRect(x + Math.cos(a) * 30, y + 3 + Math.sin(a) * 8, 3, 1); }
      ctx.restore();
    }
    /** extras visíveis (já assados) + jatos d'água do chafariz */
    function extras(ctx, cam, agora) {
      const out = [];
      if (cam.x > R.x1 + 200 || cam.x + cam.largura < R.x0 - 200 || cam.y > R.y1 + 100 || cam.y + cam.altura < R.y0 - 300) return out;
      for (const it of itens) {
        const [x0, y0, x1, y1] = it.caixa;
        if (!it.cv || x1 < cam.x || x0 > cam.x + cam.largura || y1 < cam.y || y0 > cam.y + cam.altura) continue;
        out.push({ y: it.y, desenhar: () => {
          ctx.drawImage(it.cv, x0, y0, x1 - x0, y1 - y0);
          if (it.chafariz) agua(ctx, agora);
        } });
      }
      return out;
    }
    const predioEm = (x, y) => PREDIOS.find(p => { const c = caixaPredio(p); return x > p.x - p.w / 2 && x < p.x + p.w / 2 && y > c[1] + 40 && y < p.base; });
    const luzes = () => [...POSTES.map(([x, y]) => [x, y - 84, 110]), [ROT.x, ROT.y - 20, 130], [CORETO.x, CORETO.y - 40, 120]];
    function mini(g) {
      g.fillStyle = '#7c8a5a'; g.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
      g.strokeStyle = '#9a958a'; g.lineWidth = PISTA + CAL * 2; g.lineCap = 'round';
      for (const r of RUAS) { tracar(g, r.pts); g.stroke(); }
      g.fillStyle = '#9a958a'; g.beginPath(); g.arc(ROT.x, ROT.y, ROT.r + CAL, 0, 7); g.fill();
      g.fillStyle = '#62822f'; g.beginPath(); g.arc(ROT.x, ROT.y, ROT.ilha, 0, 7); g.fill();
      for (const p of PREDIOS) { const [a, b, c, d] = pegada(p); g.fillStyle = p.tipo === 'igreja' ? '#f3efe6' : '#c4654a'; g.fillRect(a, b - 30, c - a, d - b + 30); }
    }
    return { capim, R, ROT, RUAS, PREDIOS, naRua, dentro, bloqueia, pintarChao, assar, extras, predioEm, luzes, mini };
  }
  raiz.Cidade = { criar, R, ROT, PREDIOS, RUAS, naRua: (x, y) => naRua(x, y), dentro, bloqueia, capim, PISTA, CAL };
})(typeof self !== 'undefined' ? self : globalThis);
