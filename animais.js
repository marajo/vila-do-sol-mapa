// Animais do mapa novo: vacas, ovelhas, porcos e galinhas desenhados em vetor a cada quadro (nítidos em qualquer
// zoom), de lado com um pouco de cima, virando para o lado em que andam. Pernas articuladas (passo em quatro tempos),
// cabeça que abaixa para pastar e mastiga, rabo que balança, deitar e levantar devagar, galinha ciscando e bicando.
// Cada animal tem nome e pelagem própria e anda só dentro do seu curral, desviando dos equipamentos e dos outros.
(function (raiz) {
  'use strict';
  const TAU = Math.PI * 2;
  function sorteio(semente) { let s = semente % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function tom(h, k = 1, a = 1) { const [r, g, b] = rgb(h); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; }
  function degradeV(g, y0, y1, p) { const d = g.createLinearGradient(0, y0, 0, y1); p.forEach(([t, c]) => d.addColorStop(t, c)); return d; }

  // ---------- espécies ----------
  const ESP = {
    vaca: { vel: 16, raio: 34, passo: 62, alt: 56, larg: 44, pisa: 15, nomes: ['Mimosa', 'Estrela', 'Malhada', 'Boneca'], vars: ['malhada', 'caramelo', 'malhada', 'marrom'],
      estados: [['pastando', 0.45, 6, 14], ['andando', 0.3], ['parado', 0.13, 2, 6], ['deitado', 0.12, 14, 30]] },
    ovelha: { vel: 19, raio: 22, passo: 34, alt: 38, larg: 28, pisa: 10, nomes: ['Nuvem', 'Algodão', 'Fofinha', 'Dolly', 'Branquinha', 'Lã'], vars: ['cara-preta', 'branca', 'cara-preta', 'branca', 'parda', 'cara-preta'],
      estados: [['pastando', 0.5, 4, 10], ['andando', 0.3], ['parado', 0.12, 2, 5], ['deitado', 0.08, 10, 22]] },
    porco: { vel: 18, raio: 22, passo: 30, alt: 34, larg: 30, pisa: 0, nomes: ['Toicinho', 'Rosinha', 'Bolota', 'Torresmo', 'Chiquinho'], vars: ['rosa', 'malhado', 'rosa', 'rosa', 'malhado'],
      estados: [['pastando', 0.35, 3, 8], ['andando', 0.35], ['parado', 0.1, 2, 4], ['deitado', 0.2, 12, 26]] },
    galinha: { vel: 34, raio: 9, passo: 12, alt: 30, larg: 12, pisa: 0, nomes: ['Galo Chico', 'Carijó', 'Ruiva', 'Nevada', 'Pretinha', 'Pintadinha', 'Cocó', 'Dona Filó'], vars: ['galo', 'carijo', 'caipira', 'branca', 'preta', 'carijo', 'caipira', 'branca'],
      estados: [['pastando', 0.55, 0.8, 2.6], ['andando', 0.4], ['parado', 0.05, 1, 3]] },
  };
  const ROTULO = { vaca: 'vaca', ovelha: 'ovelha', porco: 'porco', galinha: 'galinha' };
  const QUAL = { vacas: 'vaca', ovelhas: 'ovelha', porcos: 'porco', galinheiro: 'galinha' };

  // ---------- partes ----------
  /** perna em dois segmentos a partir do quadril (x, y): ang > 0 leva o pé para a frente; dobra recolhe a canela */
  function perna(g, x, y, comp, larg, ang, dobra, cor, casco) {
    const kx = x + Math.sin(ang) * comp * 0.52, ky = y + Math.cos(ang) * comp * 0.52, a2 = ang - dobra;
    const fx = kx + Math.sin(a2) * comp * 0.48, fy = ky + Math.cos(a2) * comp * 0.48;
    g.lineCap = 'round'; g.strokeStyle = cor;
    g.lineWidth = larg; g.beginPath(); g.moveTo(x, y); g.lineTo(kx, ky); g.stroke();
    g.lineWidth = larg * 0.7; g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy); g.stroke();
    if (casco) { g.fillStyle = casco; g.beginPath(); g.ellipse(fx + 0.6, fy - larg * 0.1, larg * 0.42, larg * 0.32, 0, 0, TAU); g.fill(); }
  }
  /** quatro pernas: passo em quatro tempos (trás perto, frente perto, trás longe, frente longe) */
  function pernas(g, b, hips, comp, larg, cor, casco, amp = 0.42) {
    const anda = b.andar, dei = b.deit;
    hips.forEach(([hx, hy, off, longe]) => {
      const s = b.fase + off * TAU, ang = Math.sin(s) * amp * anda, dobra = Math.max(0, Math.cos(s)) * amp * 1.3 * anda;
      const c = comp * (1 - dei * 0.62), angD = ang * (1 - dei) + dei * (hx > 0 ? 1.35 : -1.1);
      perna(g, hx + (longe ? 3 : 0), hy - (longe ? 2.5 : 0), c, larg, angD, dobra + dei * 0.9, longe ? tom(cor, 0.72) : cor, casco && dei < 0.8 ? casco : null);
    });
  }
  function sombra(g, rx, ry, a = 0.3) { g.fillStyle = `rgba(18,24,8,${a})`; g.beginPath(); g.ellipse(0, 1, rx, ry, 0, 0, TAU); g.fill(); }
  /** luz de cima e da esquerda sobre um caminho já traçado (clip) */
  function volume(g, y0, y1, costas) {
    g.fillStyle = degradeV(g, y0, y1, [[0, 'rgba(255,255,255,.2)'], [0.45, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.3)']]); g.fillRect(-60, y0, 120, y1 - y0);
    if (costas) { g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.ellipse(costas[0], costas[1], costas[2], costas[3], 0, 0, TAU); g.fill(); }
  }

  // ---------- vaca (virada para a direita; o pé no 0,0) ----------
  const VACA = {
    malhada: { pele: '#f2efe8', mancha: '#1d1b1b', focinho: '#e2a49b', pernas: '#ece8e0' },
    caramelo: { pele: '#b9773f', mancha: null, focinho: '#3a2c26', pernas: '#9c6233' },
    marrom: { pele: '#f0ebe2', mancha: '#6b3c22', focinho: '#e2a49b', pernas: '#e8e2d8' },
  };
  function vaca(g, b, agora) {
    const v = VACA[b.var], oy = b.deit * 22, r = sorteio(b.sem);
    sombra(g, 40, 8 + b.deit * 2, 0.28 + b.deit * 0.08);
    // rabo
    const sw = Math.sin(agora * 2.1 + b.sem) * 5 + Math.sin(agora * 5.3 + b.sem) * 1.5;
    g.strokeStyle = tom(v.pele, 0.85); g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-38, -44 + oy); g.quadraticCurveTo(-47, -30 + oy, -44 + sw, -12 + oy * 0.6); g.stroke();
    g.fillStyle = v.mancha || '#3a2418'; g.beginPath(); g.ellipse(-44 + sw, -11 + oy * 0.6, 2.6, 4.5, sw * 0.04, 0, TAU); g.fill();
    pernas(g, b, [[-26, -30 + oy, 0.5, true], [21, -30 + oy, 0.75, true], [-28, -29 + oy, 0, false], [18, -29 + oy, 0.25, false]], 30, 7.5, v.pernas, '#2c2523');
    // corpo
    g.save();
    g.beginPath();
    g.moveTo(-40, -36 + oy);
    g.bezierCurveTo(-42, -46 + oy, -36, -51 + oy, -26, -49 + oy);
    g.bezierCurveTo(-8, -46 + oy, 8, -47 + oy, 22, -51 + oy);
    g.bezierCurveTo(32, -52 + oy, 37, -44 + oy, 36, -34 + oy);
    g.bezierCurveTo(35, -24 + oy, 28, -20 + oy, 20, -21 + oy);
    g.bezierCurveTo(6, -17 + oy, -12, -17 + oy, -24, -21 + oy);
    g.bezierCurveTo(-34, -23 + oy, -40, -28 + oy, -40, -36 + oy);
    g.closePath();
    g.fillStyle = v.pele; g.fill();
    g.strokeStyle = 'rgba(40,28,18,.4)'; g.lineWidth = 1; g.stroke();
    g.clip();
    if (v.mancha) for (let i = 0; i < 5; i++) { // manchas próprias de cada vaca
      const mx = -38 + r() * 72, my = -52 + r() * 30 + oy;
      g.fillStyle = v.mancha; g.beginPath();
      for (let k = 0; k < 3; k++) { g.ellipse(mx + (r() - 0.5) * 10, my + (r() - 0.5) * 7, 5 + r() * 9, 4 + r() * 6, r() * 3, 0, TAU); }
      g.fill();
    }
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.2; // costelas e anca
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-2 + k * 7, -26 + oy, 9, 3.6, 4.6); g.stroke(); }
    g.beginPath(); g.arc(-28, -42 + oy, 7, 3.4, 5.6); g.stroke();
    volume(g, -54 + oy, -16 + oy, [-6, -47 + oy, 30, 3.5]);
    g.restore();
    if (b.deit < 0.5 && b.var !== 'caramelo') { // úbere
      g.fillStyle = '#eaa5a0'; g.beginPath(); g.ellipse(-12, -18 + oy, 7, 4.5, 0, 0, TAU); g.fill();
      g.strokeStyle = '#d98a86'; g.lineWidth = 1.6; g.beginPath(); for (const tx of [-15, -9]) { g.moveTo(tx, -15); g.lineTo(tx, -12.5); } g.stroke();
    }
    // pescoço e cabeça (gira para baixo para pastar; mastiga)
    const ca = -0.12 + b.cab * 1.2 + Math.sin(agora * 0.7 + b.sem) * 0.04 * (1 - b.cab), px = 29, py = -41 + oy;
    const rot = (x, y) => [px + x * Math.cos(ca) - y * Math.sin(ca), py + x * Math.sin(ca) + y * Math.cos(ca)];
    const [t1x, t1y] = rot(11, -8), [t2x, t2y] = rot(13, 7);
    g.fillStyle = v.pele; g.beginPath(); g.moveTo(20, -51 + oy); g.lineTo(t1x, t1y); g.lineTo(t2x, t2y); g.lineTo(31, -26 + oy); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.moveTo(26, -30 + oy); g.lineTo(t2x, t2y); g.lineTo(31, -26 + oy); g.fill();
    g.save(); g.translate(px, py); g.rotate(ca);
    const mast = b.cab > 0.5 || b.deit > 0.6 ? Math.sin(agora * 7 + b.sem) * 0.9 : 0;
    g.fillStyle = tom(v.pele, 0.92); g.beginPath(); g.ellipse(9, -12, 7, 2.8, -0.7, 0, TAU); g.fill(); // orelha de trás
    g.fillStyle = v.var === 'malhada' && b.sem % 2 ? v.mancha : v.pele;
    g.beginPath(); g.moveTo(8, -9); g.bezierCurveTo(22, -11, 32, -8, 38, -3); g.bezierCurveTo(41, 1, 40, 6 + mast, 36, 8 + mast); g.bezierCurveTo(26, 9, 14, 9, 9, 7); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,28,18,.35)'; g.lineWidth = 0.9; g.stroke();
    if (v.mancha && b.sem % 2 === 0) { g.fillStyle = v.mancha; g.beginPath(); g.ellipse(18, -4, 7, 5, 0.2, 0, TAU); g.fill(); }
    g.fillStyle = v.focinho; g.beginPath(); g.ellipse(36, 2 + mast * 0.5, 6, 6, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(30,15,10,.7)'; g.beginPath(); g.ellipse(39.5, 0.5, 1.2, 1.8, 0.3, 0, TAU); g.fill();
    g.fillStyle = '#1b1414'; g.beginPath(); g.ellipse(22, -4, 2.4, 2, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(22.6, -4.6, 0.7, 0, TAU); g.fill();
    g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(12, -9); g.quadraticCurveTo(13, -16, 18, -18); g.quadraticCurveTo(15, -14, 15, -9); g.fill(); // chifre
    g.fillStyle = v.pele; g.beginPath(); g.ellipse(12, -10, 7.5, 3, -0.4 + Math.sin(agora * 3 + b.sem) * 0.08, 0, TAU); g.fill(); // orelha
    g.fillStyle = '#e8a9a2'; g.beginPath(); g.ellipse(13, -10, 4.2, 1.4, -0.4, 0, TAU); g.fill();
    g.fillStyle = degradeV(g, -12, 9, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(0,0,0,.18)']]); g.beginPath(); g.ellipse(22, -1, 16, 9, 0, 0, TAU); g.fill();
    g.restore();
  }

  // ---------- ovelha ----------
  const OVELHA = { 'cara-preta': ['#f3eee2', '#2a2421'], branca: ['#f6f2e8', '#e5d6c3'], parda: ['#d6c4a8', '#4a3a2e'] };
  function ovelha(g, b, agora) {
    const [la, cara] = OVELHA[b.var], oy = b.deit * 12, r = sorteio(b.sem);
    sombra(g, 26, 6, 0.28);
    pernas(g, b, [[-13, -14 + oy, 0.5, true], [11, -14 + oy, 0.75, true], [-15, -13 + oy, 0, false], [9, -13 + oy, 0.25, false]], 15, 3.4, cara, '#1d1916', 0.5);
    // lã: elipse cercada de cachos
    const cx = -2, cy = -25 + oy;
    g.save(); g.beginPath(); g.ellipse(cx, cy, 24, 13, 0, 0, TAU);
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; g.moveTo(cx + Math.cos(a) * 23 + 6.5, cy + Math.sin(a) * 12.5); g.arc(cx + Math.cos(a) * 23, cy + Math.sin(a) * 12.5, 6 + ((k * 7) % 3), 0, TAU); }
    g.fillStyle = la; g.fill(); g.clip();
    g.strokeStyle = tom(la, 0.82, 0.55); g.lineWidth = 0.9;
    for (let i = 0; i < 26; i++) { const x = cx - 26 + r() * 52, y = cy - 16 + r() * 28; g.beginPath(); g.arc(x, y, 2.2 + r() * 1.5, r() * 3, r() * 3 + 3.5); g.stroke(); }
    volume(g, cy - 20, cy + 16, [cx - 2, cy - 11, 18, 3]);
    g.restore();
    // cabeça
    const ca = -0.25 + b.cab * 1.25 + Math.sin(agora * 0.9 + b.sem) * 0.05 * (1 - b.cab), px = 18, py = -26 + oy;
    g.save(); g.translate(px, py); g.rotate(ca);
    const mast = b.cab > 0.5 ? Math.sin(agora * 8 + b.sem) * 0.6 : 0;
    g.fillStyle = cara; g.beginPath(); g.ellipse(9, 1, 10, 6.4 + mast * 0.3, 0.15, 0, TAU); g.fill();
    g.fillStyle = tom(cara, 0.85); g.beginPath(); g.ellipse(2, -2, 7, 2.4, -0.5 + Math.sin(agora * 2.5 + b.sem) * 0.1, 0, TAU); g.fill(); // orelha
    g.fillStyle = la; g.beginPath(); g.arc(2, -4, 5.5, 0, TAU); g.fill(); // topete de lã
    g.fillStyle = b.var === 'branca' ? '#2a2421' : '#d9cfc2'; g.beginPath(); g.arc(11, -1.5, 1.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(20,10,5,.5)'; g.beginPath(); g.arc(18, 2, 0.9, 0, TAU); g.fill();
    g.restore();
    g.fillStyle = la; g.beginPath(); g.arc(-26, -26 + oy, 4.5, 0, TAU); g.fill(); // rabinho
  }

  // ---------- porco ----------
  const PORCO = { rosa: ['#f1b0a6', null], malhado: ['#f0b7ab', '#2b2525'] };
  function porco(g, b, agora) {
    const [pele, mancha] = PORCO[b.var], oy = b.deit * 8, r = sorteio(b.sem);
    sombra(g, 28, 6, 0.3);
    pernas(g, b, [[-15, -11 + oy, 0.5, true], [14, -11 + oy, 0.75, true], [-17, -10 + oy, 0, false], [12, -10 + oy, 0.25, false]], 11, 5, tom(pele, 0.88), '#5a4a44', 0.5);
    // rabo enrolado
    g.strokeStyle = tom(pele, 0.85); g.lineWidth = 1.6; g.beginPath();
    const tw = Math.sin(agora * 4 + b.sem) * 0.6;
    g.moveTo(-27, -22 + oy); g.bezierCurveTo(-33, -24 + oy + tw, -34, -18 + oy, -30, -18 + oy); g.bezierCurveTo(-27, -18 + oy, -28, -22 + oy, -31, -22 + oy); g.stroke();
    const fo = b.cab * 4; // focinho desce para fuçar
    g.save(); g.beginPath();
    g.moveTo(-27, -19 + oy);
    g.bezierCurveTo(-29, -29 + oy, -18, -32 + oy, 0, -31 + oy);
    g.bezierCurveTo(14, -31 + oy, 24, -30 + oy, 28, -24 + oy + fo * 0.5);
    g.bezierCurveTo(31, -20 + oy + fo, 32, -14 + oy + fo, 28, -11 + oy + fo * 0.6);
    g.bezierCurveTo(18, -7 + oy, -6, -6 + oy, -20, -8 + oy);
    g.bezierCurveTo(-26, -9 + oy, -28, -14 + oy, -27, -19 + oy);
    g.closePath();
    g.fillStyle = pele; g.fill(); g.strokeStyle = 'rgba(120,60,50,.35)'; g.lineWidth = 0.9; g.stroke(); g.clip();
    if (mancha) for (let i = 0; i < 3; i++) { g.fillStyle = mancha; g.beginPath(); g.ellipse(-20 + r() * 34, -28 + r() * 16 + oy, 5 + r() * 6, 4 + r() * 4, r() * 3, 0, TAU); g.fill(); }
    if (b.sujo || b.deit > 0.3) { g.fillStyle = 'rgba(70,48,28,.55)'; g.fillRect(-30, -14 + oy, 64, 10); for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(-24 + r() * 46, -15 + oy, 2 + r() * 3, 2 + r() * 3, 0, 0, TAU); g.fill(); } }
    volume(g, -33 + oy, -6 + oy, [-4, -28 + oy, 20, 2.6]);
    g.restore();
    g.fillStyle = '#e48d86'; g.beginPath(); g.ellipse(32, -17.5 + oy + fo, 3.6, 4.6, 0, 0, TAU); g.fill(); // focinho
    g.fillStyle = '#9b4e4a'; for (const ny of [-19.2, -15.8]) { g.beginPath(); g.ellipse(33.4, ny + oy + fo, 0.9, 1.1, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#1b1414'; g.beginPath(); g.arc(23.5, -23 + oy + fo * 0.4, 1.4, 0, TAU); g.fill();
    g.fillStyle = tom(pele, 0.9); g.beginPath(); g.moveTo(16, -29 + oy); g.quadraticCurveTo(23, -38 + oy + Math.sin(agora * 2 + b.sem), 27, -27 + oy + fo * 0.3); g.closePath(); g.fill(); // orelha caída para a frente
    g.fillStyle = 'rgba(200,110,105,.5)'; g.beginPath(); g.moveTo(18, -29 + oy); g.quadraticCurveTo(22, -34 + oy, 24, -28 + oy); g.closePath(); g.fill();
  }

  // ---------- galinha e galo ----------
  const GALINHA = { branca: ['#f6f2e9', '#e9e2d2'], caipira: ['#a9552f', '#2e2019'], carijo: ['#7b7873', '#3a3836'], preta: ['#2a2725', '#151a22'], galo: ['#b3532a', '#1f3b2a'] };
  function galinha(g, b, agora) {
    const [pena, cauda] = GALINHA[b.var], galo = b.var === 'galo', s = galo ? 1.25 : 1, r = sorteio(b.sem);
    g.scale(s, s);
    sombra(g, 9, 3, 0.3);
    // pernas amarelas
    for (const [lx, off] of [[-1.5, 0], [2, 0.5]]) {
      const a = Math.sin(b.fase + off * TAU) * 0.6 * b.andar, kx = lx + Math.sin(a) * 7, ky = -Math.cos(a) * 0.4;
      g.strokeStyle = '#d99a2b'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(lx, -8); g.lineTo(kx, ky); g.stroke();
      g.lineWidth = 0.9; g.beginPath(); g.moveTo(kx - 2, ky); g.lineTo(kx + 2.8, ky); g.stroke();
    }
    // cauda
    if (galo) {
      g.lineWidth = 2.2; for (let i = 0; i < 4; i++) { g.strokeStyle = i % 2 ? '#2c5a3a' : '#16261c'; g.beginPath(); g.moveTo(-6, -14); g.quadraticCurveTo(-14 - i * 2, -32 + i * 3, -20 - i, -14 + i * 2); g.stroke(); }
    } else { g.fillStyle = cauda; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-8 - i, -19 + i * 2, 2.6, 6.5, -0.5 - i * 0.25, 0, TAU); g.fill(); } }
    // corpo
    g.save(); g.beginPath();
    g.moveTo(8, -12); g.bezierCurveTo(9, -19, 2, -20, -4, -18); g.bezierCurveTo(-9, -17, -11, -12, -8, -8); g.bezierCurveTo(-4, -5, 5, -5, 8, -12); g.closePath();
    g.fillStyle = pena; g.fill(); g.clip();
    if (b.var === 'carijo') for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(240,238,232,.75)'; g.fillRect(-11 + r() * 20, -20 + r() * 15, 1.1, 0.8); }
    g.fillStyle = tom(pena, 0.82); g.beginPath(); g.ellipse(-1, -12, 6.5, 4, 0.2, 0, TAU); g.fill(); // asa
    g.strokeStyle = tom(pena, 0.65, 0.7); g.lineWidth = 0.6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-6 + i * 2, -11 + i * 0.5); g.lineTo(2 + i, -10 + i * 0.5); g.stroke(); }
    volume(g, -21, -5, null);
    g.restore();
    // pescoço e cabeça (bica o chão)
    const hx = 7 + b.cab * 5, hy = -19 + b.cab * 14;
    g.fillStyle = galo ? '#d9822b' : pena; g.beginPath(); g.moveTo(3, -17); g.quadraticCurveTo(hx - 1, hy - 3, hx + 1, hy + 1); g.lineTo(8, -11); g.closePath(); g.fill();
    g.fillStyle = galo ? '#e0902f' : pena; g.beginPath(); g.arc(hx, hy, 3.4, 0, TAU); g.fill();
    g.fillStyle = '#d6262b'; for (const [dx, rr] of galo ? [[-2, 2], [0, 2.4], [2, 2]] : [[-1.2, 1.3], [0.2, 1.5], [1.6, 1.3]]) { g.beginPath(); g.arc(hx + dx, hy - 3.6 - rr * 0.3, rr, 0, TAU); g.fill(); }
    g.beginPath(); g.ellipse(hx + 2.6, hy + 2.6, galo ? 1.6 : 1.1, galo ? 2.4 : 1.7, 0, 0, TAU); g.fill();
    g.fillStyle = '#e8b13a'; g.beginPath(); g.moveTo(hx + 2.8, hy - 1); g.lineTo(hx + 6, hy + 0.2); g.lineTo(hx + 2.8, hy + 1); g.fill();
    g.fillStyle = '#1b1414'; g.beginPath(); g.arc(hx + 1, hy - 0.6, 0.75, 0, TAU); g.fill();
  }
  const DESENHO = { vaca, ovelha, porco, galinha };

  // ---------- comportamento ----------
  function criar(C) {
    const bichos = [];
    const espDe = cur => QUAL[cur.id];
    const limites = (cur, e) => { const l = cur.l; return [l.x + e.raio + 10, l.y + 16 + e.alt * 0.25, l.x + l.w - e.raio - 10, l.y + l.h - 10]; };
    function livre(cur, e, x, y) {
      const [a, b, c, d] = limites(cur, e);
      if (x < a || x > c || y < b || y > d) return false;
      for (const o of cur.objetos) { const [p0, p1, p2, p3] = o.pegada; if (x > p0 - e.raio && x < p2 + e.raio && y > p1 - 6 && y < p3 + 12) return false; }
      return true;
    }
    function caminhoLivre(cur, e, ax, ay, bx, by) {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 10);
      for (let i = 1; i <= n; i++) if (!livre(cur, e, ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
      return true;
    }
    function sortearPonto(cur, e, perto) {
      for (let k = 0; k < 40; k++) {
        const [a, b, c, d] = limites(cur, e);
        const x = perto ? perto.x + (Math.random() - 0.5) * perto.r * 2 : a + Math.random() * (c - a), y = perto ? perto.y + (Math.random() - 0.5) * perto.r * 2 : b + Math.random() * (d - b);
        if (livre(cur, e, x, y)) return [x, y];
      }
      return null;
    }
    for (const cur of C.currais) {
      const tipo = espDe(cur), e = ESP[tipo];
      e.nomes.forEach((nome, i) => {
        const p = sortearPonto(cur, e) || [cur.l.x + cur.l.w / 2, cur.l.y + cur.l.h / 2];
        bichos.push({ tipo, e, cur, nome, var: e.vars[i], sem: 101 + bichos.length * 37, x: p[0], y: p[1], f: Math.random() < 0.5 ? -1 : 1,
          estado: 'parado', t: Math.random() * 3, alvo: null, fase: Math.random() * TAU, andar: 0, cab: 0, deit: 0, rastro: 0, sujo: tipo === 'porco' && i % 2 === 1 });
      });
    }
    function escolher(b) {
      const e = b.e, cur = b.cur;
      let soma = 0; for (const s of e.estados) soma += s[1];
      let q = Math.random() * soma, est = e.estados[0];
      for (const s of e.estados) { if ((q -= s[1]) <= 0) { est = s; break; } }
      b.estado = est[0]; b.alvo = null;
      if (b.estado === 'andando') {
        let alvo = null;
        // às vezes vai ao cocho ou ao bebedouro; porco gosta da lama; ovelha anda perto das outras; galinha dá corridinhas
        const r = Math.random(), comedor = cur.objetos.filter(o => o.tipo === 'cocho' || o.tipo === 'bebedouro' || o.tipo === 'comedouro');
        if (r < 0.25 && comedor.length) { const o = comedor[Math.floor(Math.random() * comedor.length)]; alvo = sortearPonto(cur, e, { x: (o.pegada[0] + o.pegada[2]) / 2, y: o.pegada[3] + e.raio * 0.6 + 10, r: (o.pegada[2] - o.pegada[0]) / 2 + 10 }); }
        else if (cur.lama && r < 0.55) alvo = sortearPonto(cur, e, { x: cur.lama.cx, y: cur.lama.cy, r: cur.lama.rx * 0.6 });
        else if (b.tipo === 'ovelha' && r < 0.6) { const o = bichos.filter(x => x.cur === cur && x !== b); const m = o.reduce((s, x) => [s[0] + x.x / o.length, s[1] + x.y / o.length], [0, 0]); alvo = sortearPonto(cur, e, { x: m[0], y: m[1], r: 70 }); }
        else if (b.tipo === 'galinha') alvo = sortearPonto(cur, e, { x: b.x, y: b.y, r: 70 });
        else alvo = sortearPonto(cur, e, { x: b.x, y: b.y, r: 220 });
        if (alvo && caminhoLivre(cur, e, b.x, b.y, alvo[0], alvo[1])) { b.alvo = alvo; return; }
        b.estado = 'parado'; b.t = 0.6 + Math.random(); return;
      }
      b.t = est[2] + Math.random() * (est[3] - est[2]);
      if (b.estado === 'deitado' && cur.lama) b.sujo = true;
    }
    function atualizar(dt, agora, grama) {
      for (const b of bichos) {
        const e = b.e, k = Math.min(1, dt * 3);
        // cabeça e corpo mudam devagar (sem pulos)
        const querCab = b.estado === 'pastando' ? (b.tipo === 'galinha' ? (Math.sin(agora * 9 + b.sem) > 0.25 ? 1 : 0) : 1) : 0;
        b.cab += (querCab - b.cab) * Math.min(1, dt * (b.tipo === 'galinha' ? 14 : 2.5));
        b.deit += ((b.estado === 'deitado' ? 1 : 0) - b.deit) * Math.min(1, dt * 1.2);
        const anda = b.estado === 'andando' && b.deit < 0.08;
        b.andar += ((anda ? 1 : 0) - b.andar) * k * 2;
        if (b.estado === 'andando') {
          if (!anda) continue; // levantando antes de sair
          const [tx, ty] = b.alvo, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
          if (d < 2) { escolher(b); continue; }
          const s = Math.min(d, e.vel * dt);
          b.x += (dx / d) * s; b.y += (dy / d) * s; b.fase += (s / e.passo) * TAU; b.rastro += s;
          if (Math.abs(dx) > d * 0.25) b.f = dx > 0 ? 1 : -1;
          if (e.pisa && b.rastro > 7 && grama) { b.rastro = 0; grama.pisar(b.x, b.y + 2, dx, dy, agora, e.pisa, 6); }
        } else {
          b.t -= dt;
          if (b.t <= 0) escolher(b);
          if (b.estado === 'pastando' && grama && e.pisa && Math.random() < dt * 0.15) grama.aparar(b.x + b.f * e.larg * 0.9, b.y, 9, 0.75, 4); // o pasto vai ficando rapado onde comem
        }
        // não se sobrepor: empurra devagar quem está perto demais
        for (const o of bichos) {
          if (o === b || o.cur !== b.cur) continue;
          // distância em elipse: de lado o corpo é comprido, na frente/atrás (profundidade) bastam alguns px
          const dx = b.x - o.x, dy = (b.y - o.y) * 2.4, d = Math.hypot(dx, dy) || 0.01, min = (e.raio + o.e.raio) * 1.05;
          if (d < min) {
            const p = Math.min(1, (min - d) / d) * Math.min(1, dt * 4), nx = b.x + dx * p, ny = b.y + (dy * p) / 2.4;
            if (livre(b.cur, e, nx, ny)) { b.x = nx; b.y = ny; }
            if (b.estado === 'andando' && b.alvo && Math.hypot(b.alvo[0] - o.x, (b.alvo[1] - o.y) * 2.4) < min) escolher(b); // destino ocupado: escolhe outro
          }
        }
      }
    }
    function extras(ctx, cam, agora) {
      const out = [];
      for (const b of bichos) {
        if (b.x < cam.x - 60 || b.x > cam.x + cam.largura + 60 || b.y < cam.y - 10 || b.y > cam.y + cam.altura + 80) continue;
        out.push({ y: b.y, desenhar: () => { ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.f, 1); DESENHO[b.tipo](ctx, b, agora); ctx.restore(); } });
      }
      return out;
    }
    function bichoEm(x, y) {
      let melhor = null, md = 1e9;
      for (const b of bichos) {
        const s = b.var === 'galo' ? 1.25 : 1, dx = Math.abs(x - b.x), alto = b.e.alt * s;
        if (dx < b.e.larg * s && y < b.y + 6 && y > b.y - alto) { const d = dx + Math.abs(y - (b.y - alto / 2)); if (d < md) { md = d; melhor = b; } }
      }
      return melhor;
    }
    /** reação ao clique: olha para quem chamou e muda de estado */
    function chamar(b, x) { b.f = x > b.x ? 1 : -1; if (b.estado === 'deitado') return; b.estado = 'parado'; b.t = 2.5; b.alvo = null; }
    return { bichos, atualizar, extras, bichoEm, chamar, rotulo: b => `${b.nome} · ${b.var === 'galo' ? 'galo' : ROTULO[b.tipo]}` };
  }

  raiz.Animais = { criar, ESP };
})(typeof self !== 'undefined' ? self : globalThis);
