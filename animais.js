// Animais do mapa novo: vacas, ovelhas, porcos e galinhas desenhados em vetor a cada quadro (nítidos em qualquer
// zoom), de lado com um pouco de cima, virando para o lado em que andam. Pernas articuladas (passo em quatro tempos),
// cabeça que abaixa para pastar e mastiga, rabo que balança, deitar e levantar devagar, galinha ciscando e bicando.
// Cada animal tem nome e pelagem própria e anda só dentro do seu curral, desviando dos equipamentos e dos outros.
(function (raiz) {
  'use strict';
  const TAU = Math.PI * 2;
  const angulo = a => ((a % TAU) + TAU * 1.5) % TAU - Math.PI; // entre -π e π
  function sorteio(semente) { let s = semente % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function tom(h, k = 1, a = 1) { const [r, g, b] = rgb(h); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; }
  function degradeV(g, y0, y1, p) { const d = g.createLinearGradient(0, y0, 0, y1); p.forEach(([t, c]) => d.addColorStop(t, c)); return d; }

  // ---------- espécies ----------
  const ESP = {
    vaca: { vel: 16, virar: 1.4, giro: 1.1, modelo3d: true, raio: 34, passo: 62, alt: 56, larg: 44, pisa: 15, nomes: ['Mimosa', 'Estrela', 'Malhada', 'Boneca'], vars: ['malhada', 'caramelo', 'malhada', 'marrom'],
      estados: [['pastando', 0.45, 6, 14], ['andando', 0.3], ['parado', 0.13, 2, 6], ['deitado', 0.12, 14, 30]] },
    ovelha: { vel: 19, virar: 0.9, giro: 1.6, modelo3d: true, raio: 22, passo: 34, alt: 38, larg: 28, pisa: 0, rapa: true, nomes: ['Nuvem', 'Algodão', 'Fofinha', 'Dolly', 'Branquinha', 'Lã'], vars: ['cara-preta', 'branca', 'cara-preta', 'branca', 'parda', 'cara-preta'],
      estados: [['pastando', 0.5, 4, 10], ['andando', 0.3], ['parado', 0.12, 2, 5], ['deitado', 0.08, 10, 22]] },
    porco: { vel: 18, virar: 0.9, giro: 1.5, modelo3d: true, raio: 22, passo: 30, alt: 34, larg: 30, pisa: 0, nomes: ['Toicinho', 'Rosinha', 'Bolota', 'Torresmo', 'Chiquinho'], vars: ['rosa', 'malhado', 'rosa', 'rosa', 'malhado'],
      estados: [['pastando', 0.35, 3, 8], ['andando', 0.35], ['parado', 0.1, 2, 4], ['deitado', 0.2, 12, 26]] },
    galinha: { vel: 34, virar: 0.3, raio: 9, passo: 12, alt: 30, larg: 12, pisa: 0, nomes: ['Galo Chico', 'Carijó', 'Ruiva', 'Nevada', 'Pretinha', 'Pintadinha', 'Cocó', 'Dona Filó'], vars: ['galo', 'carijo', 'caipira', 'branca', 'preta', 'carijo', 'caipira', 'branca'],
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

  // ---------- vaca em 3D (vira 360°) ----------
  // Montada com elipsoides num espaço 3D (x para a frente do bicho, y para o lado, z para cima) e projetada como uma
  // câmera a 45°: profundidade e altura encurtadas (FY, FZ), do pé da vaca para cima. Corpo, peito, anca, pescoço e
  // coxas são pintados como uma peça só (uma luz, sem emendas); cabeça, focinho, orelhas, chifres, canelas, cascos e
  // úbere à parte, do fundo para a frente. As manchas ficam presas na superfície: giram com o corpo e somem do lado de lá.
  const VACA = {
    malhada: { pele: '#f1eee7', mancha: '#1d1b1b', focinho: '#e2a49b', chifre: '#e8dcc0', casco: '#2c2523', canela: '#ebe7df' },
    caramelo: { pele: '#b9773f', mancha: null, focinho: '#3a2c26', chifre: '#e2d3b2', casco: '#2c2523', canela: '#9c6233' },
    marrom: { pele: '#f0ebe2', mancha: '#6b3c22', focinho: '#e2a49b', chifre: '#e8dcc0', casco: '#2c2523', canela: '#ebe7df' },
  };
  const FY = 0.66, FZ = 0.9; // encurtamento da câmera (profundidade e altura)
  const norm = a => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const LUZ = norm([-0.45, -0.5, 0.8]), VISTA = norm([0, FZ, FY]);
  const rotZ = (t, v) => { const c = Math.cos(t), s = Math.sin(t); return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]]; };
  const rotY = (p, v) => { const c = Math.cos(p), s = Math.sin(p); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; };
  const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const tela = v => [v[0], v[1] * FY - v[2] * FZ]; // vetor 3D → tela
  function elipseDe(eixos) { // elipse que semi-eixos 3D viram na tela
    let s11 = 0, s12 = 0, s22 = 0;
    for (const e of eixos) { const [px, py] = tela(e); s11 += px * px; s12 += px * py; s22 += py * py; }
    const m = (s11 + s22) / 2, d = Math.hypot((s11 - s22) / 2, s12);
    return { rx: Math.sqrt(m + d), ry: Math.sqrt(Math.max(0.01, m - d)), ang: 0.5 * Math.atan2(2 * s12, s11 - s22) };
  }
  /** peça: centro c e raios r no espaço do bicho, inclinada (pitch) em torno do eixo lateral */
  function peca(b, c, r, pitch, cor, extra = {}) {
    const eixos = [[r[0], 0, 0], [0, r[1], 0], [0, 0, r[2]]].map(v => rotZ(b.rumo, rotY(pitch, v))), w = rotZ(b.rumo, c), [tx, ty] = tela(w);
    return { w, eixos, cor, sx: b.x + tx, sy: b.y + ty, prof: dot(w, VISTA), ...elipseDe(eixos), ...extra };
  }
  const contornar = (g, p) => g.ellipse(p.sx, p.sy, p.rx, p.ry, p.ang, 0, TAU);
  function manchasDe(g, p) {
    for (const [u, raio, cor] of p.manchas || []) {
      const e = p.eixos, ponto = soma(soma(mul(e[0], u[0]), mul(e[1], u[1])), mul(e[2], u[2]));
      const n = norm(soma(soma(mul(e[0], u[0] / dot(e[0], e[0])), mul(e[1], u[1] / dot(e[1], e[1]))), mul(e[2], u[2] / dot(e[2], e[2]))));
      if (dot(n, VISTA) < 0.08) continue;
      const t1 = norm(cross(n, Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), t2 = cross(n, t1), el = elipseDe([mul(t1, raio), mul(t2, raio)]), [tx, ty] = tela(ponto);
      g.fillStyle = cor; g.beginPath(); g.ellipse(p.sx + tx, p.sy + ty, el.rx, el.ry, el.ang, 0, TAU); g.fill();
    }
  }
  /** luz e sombra sobre um contorno já traçado: claro do lado do sol, escuro embaixo e do lado de lá */
  function sombrear(g, cx, cy, raio, eixos, forca = 1) {
    const u = norm(eixos.map(e => dot(e, LUZ)));
    let hx = 0, hy = 0; eixos.forEach((e, i) => { const [a, c] = tela(e); hx += a * u[i] * 0.55; hy += c * u[i] * 0.55; });
    const gr = g.createRadialGradient(cx + hx, cy + hy, 0, cx + hx * 0.2, cy + hy * 0.2, raio);
    gr.addColorStop(0, `rgba(255,250,240,${0.3 * forca})`); gr.addColorStop(0.42, 'rgba(255,250,240,0)'); gr.addColorStop(0.8, `rgba(20,12,6,${0.2 * forca})`); gr.addColorStop(1, `rgba(20,12,6,${0.45 * forca})`);
    g.fillStyle = gr;
  }
  function pintarPeca(g, p) {
    g.beginPath(); contornar(g, p); g.fillStyle = p.cor; g.fill();
    if (p.manchas) { g.save(); g.clip(); manchasDe(g, p); g.restore(); }
    g.beginPath(); contornar(g, p); sombrear(g, p.sx, p.sy, Math.max(p.rx, p.ry) * 1.1, p.eixos, p.forca ?? 1); g.fill();
    if (p.contorno) { g.strokeStyle = 'rgba(30,20,14,.3)'; g.lineWidth = 0.8; g.stroke(); }
  }
  /** corpo inteiro numa peça só: mesma cor, manchas, uma luz e um contorno fino em volta */
  function pintarCorpo(g, pecas, cor, base) {
    const caminho = () => { g.beginPath(); for (const p of pecas) { g.moveTo(p.sx + p.rx * Math.cos(p.ang), p.sy + p.rx * Math.sin(p.ang)); contornar(g, p); } };
    caminho(); g.strokeStyle = 'rgba(28,18,12,.45)'; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = cor; g.fill();
    g.save(); caminho(); g.clip();
    for (const p of pecas) manchasDe(g, p);
    sombrear(g, base.sx, base.sy, Math.max(base.rx, base.ry) * 1.25, base.eixos);
    g.fillRect(base.sx - 90, base.sy - 90, 180, 180);
    g.restore();
  }
  function vaca(g, b, agora) {
    const v = VACA[b.var], dz = b.deit * 20, pele = v.pele, r = sorteio(b.sem);
    if (!b.manchas) { // manchas sorteadas uma vez por vaca, em cada parte do corpo
      const sorteia = n => Array.from({ length: n }, () => [norm([r() * 2 - 1, r() * 2 - 1, r() * 1.6 - 0.4]), 8 + r() * 9, v.mancha]);
      b.manchas = v.mancha ? { barril: sorteia(6), peito: sorteia(2), anca: sorteia(3), pescoco: sorteia(1), cabeca: r() < 0.6 ? sorteia(1) : [], coxa: sorteia(1) } : {};
    }
    const M = k => b.manchas[k] || null;
    const corpo = [], soltas = [];
    // tronco de vaca: caixa comprida (barril + barriga caída), linha das costas reta (cernelha e lombo),
    // anca quadrada com os ossos do quadril marcados
    const barril = peca(b, [-3, 0, 41 - dz], [33, 18.5, 14.5], 0, pele, { manchas: M('barril') });
    corpo.push(barril,
      peca(b, [-5, 0, 33 - dz], [25, 18, 9.5], 0, pele),                                  // barriga
      peca(b, [-3, 0, 52 - dz], [35, 12.5, 5.5], 0, pele),                                    // lombo reto
      peca(b, [19, 0, 41 - dz], [15, 16, 16.5], -0.12, pele, { manchas: M('peito') }),      // peito
      peca(b, [16, 0, 53 - dz], [11, 9.5, 6], 0, pele),                                     // cernelha
      peca(b, [-26, 0, 44 - dz], [14, 17.5, 14], 0.08, pele, { manchas: M('anca') }));        // anca
    for (const lado of [-1, 1]) corpo.push(peca(b, [-24, lado * 13, 52 - dz], [6.5, 5, 5], 0, pele)); // ossos do quadril
    // pescoço (abaixa para pastar) com barbela pendurada embaixo
    const np = -0.32 + b.cab * 1.2 + Math.sin(agora * 0.7 + b.sem) * 0.04 * (1 - b.cab), nb = [26, 0, 46 - dz];
    corpo.push(peca(b, soma(nb, rotY(np, [11, 0, 0])), [14.5, 8.5, 11.5], np, pele, { manchas: M('pescoco') }));
    corpo.push(peca(b, soma(nb, rotY(np, [9, 0, -11])), [11, 4, 7.5], np + 0.25, pele));
    if (b.deit < 0.5 && b.var !== 'caramelo') { // úbere com quatro tetas
      soltas.push(peca(b, [-13, 0, 25 - dz], [8.5, 7.5, 5.5], 0, '#eaa5a0', { forca: 0.6, contorno: true }));
      for (const [tx, ty] of [[-9, 3], [-9, -3], [-16, 3], [-16, -3]]) soltas.push(peca(b, [tx, ty, 19.5 - dz], [1.2, 1.2, 2.4], 0, '#e08f8a', { forca: 0.3 }));
    }
    // pernas grossas: coxa entra no corpo; jarrete/joelho, canela e casco à parte
    for (const [hx, hy, off, frente] of [[-25, 10, 0, false], [19, 9.5, 0.25, true], [-25, -10, 0.5, false], [19, -9.5, 0.75, true]]) {
      const s = b.fase + off * TAU;
      let a = Math.sin(s) * 0.45 * b.andar, k = Math.max(0, -Math.cos(s)) * 0.7 * b.andar;
      a = a * (1 - b.deit) + b.deit * (frente ? -1.35 : 1.25); k = k * (1 - b.deit) + b.deit * (frente ? 2.2 : -2.2);
      if (!frente) a += 0.12 * (1 - b.deit); // a perna de trás desce inclinada até o jarrete
      const enc = 1 - b.deit * 0.35, quadril = [hx, hy, 37 - dz], joelho = soma(quadril, rotY(a, [0, 0, -20 * enc]));
      corpo.push(peca(b, soma(quadril, rotY(a, [0, 0, -8 * enc])), frente ? [7, 6, 13 * enc] : [8.5, 6.5, 13.5 * enc], a, pele, { manchas: hx < 0 ? M('coxa') : null }));
      const ac = a + k - (frente ? 0 : 0.24 * (1 - b.deit)); // canela de trás volta a ficar em pé
      soltas.push(peca(b, joelho, [4.4, 4.2, 4.2], a, v.canela, { forca: 0.7 }));
      soltas.push(peca(b, soma(joelho, rotY(ac, [0, 0, -7 * enc])), [3.9, 3.7, 8 * enc], ac, v.canela, { contorno: true, forca: 0.8 }));
      soltas.push(peca(b, soma(joelho, rotY(ac, [0, 0, -14.5 * enc])), [4.2, 4.2, 2.6], ac, v.casco, { forca: 0.4 }));
    }
    // cabeça comprida: testa, cara afinando, focinho largo e úmido, orelhas na horizontal, chifres curtos
    const hb = soma(nb, rotY(np, [23, 0, 0])), hp = np + 0.66, mast = b.cab > 0.5 || b.deit > 0.6 ? Math.sin(agora * 7 + b.sem) * 0.8 : 0;
    const cabeca = (c, rr, cor, extra) => soltas.push(peca(b, soma(hb, rotY(hp, c)), rr, hp, cor, extra));
    const corCara = b.var === 'malhada' && b.sem % 2 ? v.mancha : pele;
    cabeca([3, 0, 1.5], [9, 8, 8.5], corCara, { manchas: M('cabeca'), contorno: true });   // testa
    cabeca([12, 0, -0.5], [10, 6.4, 6.6], corCara, { contorno: true });                     // cara
    cabeca([20, 0, -2 + mast * 0.3], [5, 6.8, 5.2], v.focinho, { forca: 0.7, contorno: true });
    cabeca([-1, 0, 8], [3.5, 4, 2.6], tom(corCara, 0.92), { forca: 0.6 });                  // topete
    for (const lado of [-1, 1]) {
      cabeca([-2, lado * 10.5, 3.5], [3.4, 6.6, 1.6], tom(pele, 0.9), { contorno: true });
      cabeca([-1.6, lado * 11, 3.9], [2, 4.5, 0.6], '#e7a7a0', { forca: 0.3 });             // dentro da orelha
      cabeca([-1, lado * 5.4, 8.5], [1.7, 1.7, 4.8], v.chifre, { forca: 0.6 });
      cabeca([5.5, lado * 7.6, 2.8], [2, 1.4, 2], '#16100e', { forca: 0, brilho: true });
      cabeca([24.5, lado * 2.6, -1.2], [1.1, 1, 1.3], '#4a2a24', { forca: 0 });
    }
    // rabo comprido até o jarrete, com tufo, balançando
    const sw = Math.sin(agora * 2.1 + b.sem) * 5 + Math.sin(agora * 5.3 + b.sem) * 1.5;
    const P = c => { const w = rotZ(b.rumo, c), [tx, ty] = tela(w); return [b.x + tx, b.y + ty, dot(w, VISTA)]; };
    const raiz = P([-39, 0, 51 - dz]), meio = P([-44, sw * 0.4, 32 - dz]), ponta = P([-42, sw, 12 - dz * 0.3]);
    soltas.push({ prof: raiz[2] - 5, rabo: [raiz, meio, ponta] });
    // sombra no chão
    const cr = Math.cos(b.rumo), sr = Math.sin(b.rumo);
    g.fillStyle = `rgba(18,24,8,${0.3 + b.deit * 0.08})`; g.beginPath(); g.ellipse(b.x, b.y + 1, 41 * Math.abs(cr) + 18 * Math.abs(sr), (18 * Math.abs(cr) + 41 * Math.abs(sr)) * FY * 0.6, 0, 0, TAU); g.fill();
    // do fundo para a frente; o corpo entra na ordem pela profundidade do barril
    const itens = [...soltas, { prof: barril.prof, corpo: true }].sort((a, c) => a.prof - c.prof);
    for (const p of itens) {
      if (p.corpo) pintarCorpo(g, corpo, pele, barril);
      else if (p.rabo) {
        const [a, m, c] = p.rabo;
        g.strokeStyle = tom(pele, 0.78); g.lineWidth = 1.9; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(m[0], m[1], c[0], c[1]); g.stroke();
        g.fillStyle = v.mancha || '#3a2418'; g.beginPath(); g.ellipse(c[0], c[1] + 2, 2.4, 5, 0, 0, TAU); g.fill();
      } else {
        pintarPeca(g, p);
        if (p.brilho === true) { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(p.sx - p.rx * 0.3, p.sy - p.ry * 0.35, Math.max(0.5, p.rx * 0.32), 0, TAU); g.fill(); } // brilho do olho
      }
    }
  }

  /** pernas 3D em dois gomos com casco; a coxa entra no corpo (mesma cor) e a canela fica à parte */
  function pernas3d(b, corpo, soltas, quadris, o) {
    for (const [hx, hy, off, frente] of quadris) {
      const s = b.fase + off * TAU;
      let a = Math.sin(s) * o.amp * b.andar, k = Math.max(0, -Math.cos(s)) * o.amp * 1.5 * b.andar;
      a = a * (1 - b.deit) + b.deit * (frente ? -1.35 : 1.25); k = k * (1 - b.deit) + b.deit * (frente ? 2.2 : -2.2);
      const enc = 1 - b.deit * 0.4, quadril = [hx, hy, o.alt - o.dz], joelho = soma(quadril, rotY(a, [0, 0, -o.coxa * enc]));
      (o.coxaNoCorpo ? corpo : soltas).push(peca(b, soma(quadril, rotY(a, [0, 0, -o.coxa * 0.45 * enc])), [o.rc, o.rc * 0.9, o.coxa * 0.6 * enc], a, o.corCoxa, { contorno: !o.coxaNoCorpo, forca: 0.8 }));
      soltas.push(peca(b, soma(joelho, rotY(a + k, [0, 0, -o.canela * 0.5 * enc])), [o.rk, o.rk, o.canela * 0.55 * enc], a + k, o.corCanela, { contorno: true, forca: 0.7 }));
      soltas.push(peca(b, soma(joelho, rotY(a + k, [0, 0, -o.canela * enc])), [o.rk * 1.05, o.rk * 1.05, o.rk * 0.6], a + k, o.casco, { forca: 0.3 }));
    }
  }
  function sombraChao(g, b, comp, larg, a) {
    const cr = Math.abs(Math.cos(b.rumo)), sr = Math.abs(Math.sin(b.rumo));
    g.fillStyle = `rgba(18,24,8,${a})`; g.beginPath(); g.ellipse(b.x, b.y + 1, comp * cr + larg * sr, (larg * cr + comp * sr) * FY * 0.6, 0, 0, TAU); g.fill();
  }
  function desenharItens(g, itens, corpo, cor, base, extra) {
    itens.sort((a, c) => a.prof - c.prof);
    for (const p of itens) {
      if (p.corpo) pintarCorpo(g, corpo, cor, base);
      else if (p.fn) p.fn();
      else {
        pintarPeca(g, p);
        if (p.brilho === true) { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(p.sx - p.rx * 0.3, p.sy - p.ry * 0.35, Math.max(0.45, p.rx * 0.32), 0, TAU); g.fill(); }
      }
    }
    void extra;
  }
  const ponto3d = (b, c) => { const w = rotZ(b.rumo, c), [tx, ty] = tela(w); return [b.x + tx, b.y + ty, dot(w, VISTA)]; };

  // ---------- ovelha em 3D ----------
  // corpo de lã em nuvem (uma elipse grande cercada de tufos, pintados como uma peça só, com cachos presos na
  // superfície), pernas finas escuras, cara preta/branca/parda com topete de lã, orelhas na horizontal
  const OVELHA = { 'cara-preta': ['#f3eee2', '#2a2421'], branca: ['#f6f2e8', '#e2d3c0'], parda: ['#d6c4a8', '#4a3a2e'] };
  function ovelha(g, b, agora) {
    const [la, cara] = OVELHA[b.var], dz = b.deit * 12, r = sorteio(b.sem);
    if (!b.tufos) { // tufos e cachos sorteados uma vez
      b.tufos = Array.from({ length: 14 }, () => { const u = norm([r() * 2 - 1, r() * 2 - 1, r() * 1.4 - 0.3]); return [u, 5.5 + r() * 2.5]; });
      b.cachos = Array.from({ length: 30 }, () => [norm([r() * 2 - 1, r() * 2 - 1, r() * 1.6 - 0.4]), 1.5 + r() * 1.1, tom(la, 0.95)]); // cachinhos discretos
    }
    const corpo = [], soltas = [], C = [-2, 0, 27 - dz], R = [19, 12.5, 11];
    const base = peca(b, C, R, 0, la, { manchas: b.cachos });
    corpo.push(base);
    for (const [u, rr] of b.tufos) corpo.push(peca(b, [C[0] + u[0] * R[0] * 0.92, u[1] * R[1] * 0.92, C[2] + u[2] * R[2] * 0.92], [rr, rr, rr * 0.9], 0, la));
    corpo.push(peca(b, [-21, 0, 28 - dz], [4.5, 4.5, 4.5], 0, la)); // rabinho
    pernas3d(b, corpo, soltas, [[-11, 6, 0, false], [10, 6, 0.25, true], [-11, -6, 0.5, false], [10, -6, 0.75, true]],
      { amp: 0.5, alt: 18, dz, coxa: 9, canela: 8, rc: 2.8, rk: 1.9, corCoxa: cara, corCanela: cara, casco: '#1d1916', coxaNoCorpo: false });
    // pescoço curto de lã e cabeça
    const np = -0.3 + b.cab * 1.25 + Math.sin(agora * 0.9 + b.sem) * 0.05 * (1 - b.cab), nb = [14, 0, 29 - dz];
    corpo.push(peca(b, soma(nb, rotY(np, [5, 0, 0])), [8, 7.5, 8.5], np, la));
    const hb = soma(nb, rotY(np, [12, 0, 0])), hp = np + 0.55, mast = b.cab > 0.5 ? Math.sin(agora * 8 + b.sem) * 0.5 : 0;
    const cabeca = (c, rr, cor, extra) => soltas.push(peca(b, soma(hb, rotY(hp, c)), rr, hp, cor, extra));
    cabeca([4, 0, 0], [8, 5, 5.6], cara, { contorno: true });
    cabeca([10.5, 0, -1.2 + mast * 0.2], [3.4, 3.7, 3.4], tom(cara, 0.9), { contorno: true, forca: 0.7 });
    cabeca([-0.5, 0, 4], [5, 5.5, 3.6], la, { forca: 0.8 }); // topete de lã
    for (const lado of [-1, 1]) {
      cabeca([0, lado * 6.5, 1.5], [2, 4.4, 1.2], tom(cara, 0.88), { contorno: true });
      cabeca([4.5, lado * 4.6, 1.8], [1.4, 1.1, 1.4], b.var === 'branca' ? '#2a2421' : '#d9cfc2', { forca: 0, brilho: b.var === 'branca' });
    }
    sombraChao(g, b, 25, 14, 0.28);
    desenharItens(g, [...soltas, { prof: base.prof, corpo: true }], corpo, la, base);
  }

  // ---------- porco em 3D ----------
  // corpo roliço (barril, paleta e pernil), cabeça que continua o corpo, focinho em disco com narinas, orelhas caídas
  // para a frente, rabinho enrolado; malhados com manchas pretas e os sujos com lama na barriga (presas na pele)
  const PORCO = { rosa: ['#f1b0a6', null], malhado: ['#f0b7ab', '#2b2525'] };
  function porco(g, b, agora) {
    const [pele, mancha] = PORCO[b.var], dz = b.deit * 7, r = sorteio(b.sem);
    if (!b.pintas) {
      b.pintas = mancha ? Array.from({ length: 4 }, () => [norm([r() * 2 - 1, r() * 2 - 1, r() * 1.4 - 0.2]), 6 + r() * 6, mancha]) : [];
      b.lama = Array.from({ length: 7 }, () => [norm([r() * 2 - 1, r() * 2 - 1, -0.4 - r() * 0.6]), 4 + r() * 4, 'rgba(84,58,34,.75)']);
    }
    const sujo = b.sujo || b.deit > 0.3, pintas = sujo ? [...b.pintas, ...b.lama] : b.pintas;
    const corpo = [], soltas = [];
    const base = peca(b, [-1, 0, 19 - dz], [23, 13, 11.5], 0, pele, { manchas: pintas });
    corpo.push(base, peca(b, [-16, 0, 19.5 - dz], [10, 12.5, 11], 0.05, pele, { manchas: sujo ? b.lama.slice(0, 3) : null }), peca(b, [13, 0, 19.5 - dz], [10, 12, 11], -0.05, pele));
    pernas3d(b, corpo, soltas, [[-15, 7, 0, false], [13, 7, 0.25, true], [-15, -7, 0.5, false], [13, -7, 0.75, true]],
      { amp: 0.5, alt: 12, dz, coxa: 6, canela: 6, rc: 4, rk: 2.7, corCoxa: pele, corCanela: tom(pele, 0.9), casco: '#5a4a44', coxaNoCorpo: true });
    // cabeça: desce para fuçar, girando no pescoço
    const ca = b.cab * 0.45, nb = [18, 0, 20 - dz];
    const H = c => soma(nb, rotY(ca, c));
    corpo.push(peca(b, H([8, 0, -1]), [9, 9, 8.6], ca, pele));
    soltas.push(peca(b, H([17, 0, -3]), [2.6, 4.6, 4.1], ca + 0.05, '#e48d86', { contorno: true, forca: 0.6 }));
    for (const lado of [-1, 1]) {
      soltas.push(peca(b, H([19.3, lado * 1.8, -3]), [0.6, 1, 1.3], ca, '#9b4e4a', { forca: 0 }));
      soltas.push(peca(b, H([11, lado * 5.6, 2.5]), [1.3, 1, 1.3], ca, '#1b1414', { forca: 0, brilho: true }));
      soltas.push(peca(b, H([9, lado * 5.5, 8]), [5.4, 3.4, 1.4], ca + 0.75 + Math.sin(agora * 2 + b.sem + lado) * 0.08, tom(pele, 0.92), { contorno: true, forca: 0.7 }));
    }
    // rabinho enrolado
    const raiz = ponto3d(b, [-24, 0, 24 - dz]), tw = Math.sin(agora * 4 + b.sem) * 0.8;
    soltas.push({ prof: raiz[2] - 2, fn: () => { g.strokeStyle = tom(pele, 0.82); g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(raiz[0], raiz[1]); g.bezierCurveTo(raiz[0] - 5, raiz[1] - 3 + tw, raiz[0] - 6, raiz[1] + 3, raiz[0] - 2, raiz[1] + 3); g.bezierCurveTo(raiz[0] + 1, raiz[1] + 2, raiz[0], raiz[1] - 1, raiz[0] - 3, raiz[1]); g.stroke(); } });
    sombraChao(g, b, 27, 14, 0.3);
    desenharItens(g, [...soltas, { prof: base.prof, corpo: true }], corpo, pele, base);
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
        bichos.push({ tipo, e, cur, nome, var: e.vars[i], sem: 101 + bichos.length * 37, x: p[0], y: p[1], lado: i % 2 ? -1 : 1, vis: i % 2 ? -1 : 1, incl: 0, rumo: Math.random() * TAU, olhar: null,
          estado: 'parado', t: Math.random() * 3, alvo: null, fase: Math.random() * TAU, andar: 0, cab: 0, deit: 0, rastro: 0, sujo: tipo === 'porco' && i % 2 === 1 });
      });
    }
    function escolher(b) {
      const e = b.e, cur = b.cur;
      if (b.comer) { b.comer = false; b.estado = 'pastando'; b.alvo = null; b.t = 6 + Math.random() * 6; return; } // chegou ao cocho: come
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
        else if (b.tipo === 'galinha') for (let k = 0; k < 6; k++) { alvo = sortearPonto(cur, e, { x: b.x, y: b.y, r: 70 }); if (alvo && Math.abs(alvo[1] - b.y) < Math.abs(alvo[0] - b.x) + 6) break; }
        else for (let k = 0; k < 6; k++) { // passeio: mais para os lados do que para cima/baixo (anda de frente, não de lado)
          alvo = sortearPonto(cur, e, { x: b.x, y: b.y, r: 220 });
          if (alvo && Math.abs(alvo[1] - b.y) < Math.abs(alvo[0] - b.x) * 0.8 + 10) break;
        }
        if (alvo && caminhoLivre(cur, e, b.x, b.y, alvo[0], alvo[1])) { b.alvo = alvo; return; }
        b.estado = 'parado'; b.t = 0.6 + Math.random(); return;
      }
      b.t = est[2] + Math.random() * (est[3] - est[2]);
      if (b.estado === 'deitado' && cur.lama) b.sujo = true;
    }
    let gente = [];
    /** tem gente (trabalhador) logo à frente? */
    const perto = (b, x, y) => gente.some(p => Math.hypot(x - p.x, (y - p.y) * 2) < b.e.raio + 14 && Math.hypot(b.x - p.x, (b.y - p.y) * 2) > Math.hypot(x - p.x, (y - p.y) * 2));
    function atualizar(dt, agora, grama, pessoas = []) {
      gente = pessoas;
      for (const b of bichos) {
        const e = b.e, k = Math.min(1, dt * 3);
        // cabeça e corpo mudam devagar (sem pulos)
        const querCab = b.estado === 'pastando' ? (b.tipo === 'galinha' ? (Math.sin(agora * 9 + b.sem) > 0.25 ? 1 : 0) : 1) : 0;
        b.cab += (querCab - b.cab) * Math.min(1, dt * (b.tipo === 'galinha' ? 14 : 2.5));
        b.deit += ((b.estado === 'deitado' ? 1 : 0) - b.deit) * Math.min(1, dt * 1.2);
        const anda = b.estado === 'andando' && b.deit < 0.08;
        b.andar += ((anda ? 1 : 0) - b.andar) * k * 2;
        // o corpo gira devagar para o lado em que vai (vis passa de 1 a -1: o bicho vira de frente no meio da volta)
        const girar = Math.min(Math.abs(b.lado - b.vis), (dt * 2) / e.virar);
        b.vis += Math.sign(b.lado - b.vis) * girar;
        if (e.modelo3d && b.olhar != null && b.estado !== 'andando') { // parada, vira o corpo devagar para onde chamaram
          const dif = angulo(b.olhar - b.rumo); b.rumo += Math.sign(dif) * Math.min(Math.abs(dif), e.giro * dt); if (Math.abs(dif) < 0.02) b.olhar = null;
        }
        if (b.estado === 'andando' && e.modelo3d) {
          // em 3D anda para qualquer lado, sempre para onde a cabeça aponta: vira devagar e só acelera alinhada
          if (!anda || b.reservado) continue;
          const [tx, ty] = b.alvo, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
          if (d < 6) { escolher(b); continue; }
          const dif = angulo(Math.atan2(dy, dx) - b.rumo);
          b.rumo += Math.sign(dif) * Math.min(Math.abs(dif), e.giro * dt);
          const ux = Math.cos(b.rumo), uy = Math.sin(b.rumo), s = Math.min(d, e.vel * Math.max(0.22, Math.cos(dif)) * dt), nx = b.x + ux * s, ny = b.y + uy * s;
          if (!livre(b.cur, e, nx, ny) || perto(b, nx, ny)) { escolher(b); continue; }
          b.x = nx; b.y = ny; b.fase += (s / e.passo) * TAU; b.rastro += s;
          if (e.pisa && b.rastro > 7 && grama) { b.rastro = 0; grama.pisar(b.x, b.y + 2, ux, uy, agora, e.pisa, 4); }
        } else if (b.estado === 'andando') {
          if (!anda || b.reservado) continue; // levantando antes de sair
          const [tx, ty] = b.alvo, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
          if (d < 5) { escolher(b); continue; }
          // anda sempre para a frente: se o destino ficou para trás, faz a volta; subir ou descer na tela é em diagonal
          if (Math.sign(dx) !== b.lado && Math.abs(dx) > 14) b.lado = -b.lado;
          const virando = Math.abs(b.vis - b.lado) > 0.08;
          const inclAlvo = Math.max(-0.6, Math.min(0.6, Math.atan2(dy, Math.max(1, Math.abs(dx)))));
          b.incl += (inclAlvo - b.incl) * Math.min(1, dt * 2.2);
          const ux = b.vis * Math.cos(b.incl), uy = Math.sin(b.incl), un = Math.hypot(ux, uy) || 1;
          const s = Math.min(d, e.vel * (virando ? 0.4 : 1) * dt), nx = b.x + (ux / un) * s, ny = b.y + (uy / un) * s;
          if (!livre(b.cur, e, nx, ny) || perto(b, nx, ny)) { escolher(b); continue; }
          b.x = nx; b.y = ny; b.fase += (s / e.passo) * TAU; b.rastro += s;
          if (e.pisa && b.rastro > 7 && grama) { b.rastro = 0; grama.pisar(b.x, b.y + 2, ux, uy, agora, e.pisa, 4); }
        } else {
          b.incl += (0 - b.incl) * Math.min(1, dt * 2);
          if (!b.reservado) { b.t -= dt; if (b.t <= 0) escolher(b); }
          if (b.estado === 'pastando' && grama && (e.pisa || e.rapa) && Math.random() < dt * 0.15) grama.aparar(b.x + (e.modelo3d ? Math.cos(b.rumo) * e.larg * 1.1 : b.lado * e.larg * 0.9), b.y + (e.modelo3d ? Math.sin(b.rumo) * e.larg * 1.1 : 0), 9, 0.75, 4); // o pasto vai ficando rapado onde comem
        }
        if (b.reservado) continue; // quem está sendo ordenhado/tosquiado não é empurrado
        // não se sobrepor: quem anda desvia (muda de rumo) de quem está na frente; quem está parado dá uns passinhos
        for (const o of bichos) {
          if (o === b || o.cur !== b.cur) continue;
          // distância em elipse: de lado o corpo é comprido, na frente/atrás (profundidade) bastam alguns px
          let dx = b.x - o.x, dy = (b.y - o.y) * 2.4, d = Math.hypot(dx, dy) || 0.01, min = (e.raio + o.e.raio) * 1.05;
          if (e.modelo3d) { // vaca em 3D: corpo comprido na direção do rumo
            const rx = b.x - o.x, ry = b.y - o.y, ao = Math.cos(b.rumo) * rx + Math.sin(b.rumo) * ry, tr = -Math.sin(b.rumo) * rx + Math.cos(b.rumo) * ry;
            d = Math.hypot(ao, tr * 2) || 0.01; dx = rx; dy = ry * 2.4; min = e.raio + o.e.raio * 0.8;
          }
          const naFrente = e.modelo3d ? (o.x - b.x) * Math.cos(b.rumo) + (o.y - b.y) * Math.sin(b.rumo) > 0 : (o.x - b.x) * b.vis > 0;
          if (b.estado === 'andando') { if (d < min && naFrente) escolher(b); continue; }
          if (d < min) {
            const p = Math.min(1, (min - d) / d) * Math.min(1, dt * 4), nx = b.x + dx * p, ny = b.y + (dy * p) / 2.4;
            if (livre(b.cur, e, nx, ny)) { b.x = nx; b.y = ny; }
            if (b.estado === 'andando' && b.alvo && Math.hypot(b.alvo[0] - o.x, (b.alvo[1] - o.y) * 2.4) < min) escolher(b); // destino ocupado: escolhe outro
          }
        }
        // abre caminho para o trabalhador (dá uns passinhos para longe)
        if (b.estado !== 'andando') for (const p of gente) {
          const dx = b.x - p.x, dy = (b.y - p.y) * 2, d = Math.hypot(dx, dy) || 0.01, min = e.raio + 16;
          if (d < min) { const q = Math.min(1, (min - d) / d) * Math.min(1, dt * 3), nx = b.x + dx * q, ny = b.y + (dy * q) / 2; if (livre(b.cur, e, nx, ny)) { b.x = nx; b.y = ny; } }
        }
      }
    }
    // cada bicho é desenhado numa imagem própria (na resolução da tela) e a imagem vai para o mapa; a pose é refeita em
    // revezamento (metade dos bichos por quadro = 15 poses/s), o lugar acompanha todo quadro: o mesmo visual, metade do custo
    const CAIXA = { vaca: [-82, -116, 82, 54], ovelha: [-54, -72, 54, 36], porco: [-56, -64, 56, 38], galinha: [-36, -58, 36, 12] };
    let quadroN = 0;
    function posar(g, b, agora) { // desenha o bicho com o pé em (b.x, b.y) do mundo
      if (b.e.modelo3d) { DESENHO[b.tipo](g, b, agora); return; }
      const sx = Math.sign(b.vis || b.lado) * (0.4 + 0.6 * Math.abs(b.vis)); // no meio da volta: encurtado, como visto em diagonal
      g.save(); g.translate(b.x, b.y); g.scale(sx, 1); g.rotate(b.incl * 0.22); DESENHO[b.tipo](g, b, agora); g.restore();
    }
    function extras(ctx, cam, agora) {
      const out = [], Q = Math.min(3, cam.escala ?? 1);
      quadroN++;
      bichos.forEach((b, i) => {
        if (b.x < cam.x - 80 || b.x > cam.x + cam.largura + 80 || b.y < cam.y - 10 || b.y > cam.y + cam.altura + 100) return;
        const [x0, y0, x1, y1] = CAIXA[b.tipo];
        let c = b.foto;
        if (!c || c.q !== Q || (quadroN + i) % 2 === 0) {
          if (!c) { c = b.foto = document.createElement('canvas'); c.q = 0; }
          if (c.q !== Q) { c.width = Math.ceil((x1 - x0) * Q); c.height = Math.ceil((y1 - y0) * Q); c.q = Q; }
          const g = c.getContext('2d');
          g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
          g.setTransform(Q, 0, 0, Q, (-x0 - b.x) * Q, (-y0 - b.y) * Q);
          posar(g, b, agora);
        }
        out.push({ y: b.y, desenhar: () => ctx.drawImage(c, b.x + x0, b.y + y0, x1 - x0, y1 - y0) });
      });
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
    function chamar(b, x) { b.lado = x > b.x ? 1 : -1; b.olhar = x > b.x ? 0 : Math.PI; if (b.estado === 'deitado') return; b.estado = 'parado'; b.t = 2.5; b.alvo = null; }
    /** segura o animal parado (ordenha, tosquia) ou solta de novo */
    function reservar(b, sim) { b.reservado = sim; if (sim) { b.estado = 'parado'; b.alvo = null; b.t = 999; } else escolher(b); }
    /** comida servida: os bichos do curral vão até o cocho (cada um num lugar) e comem */
    function chamarPara(cur, o) {
      for (const b of bichos) {
        if (b.cur !== cur || b.reservado || Math.random() < 0.25) continue;
        const alvo = sortearPonto(cur, b.e, { x: (o.pegada[0] + o.pegada[2]) / 2, y: o.pegada[3] + b.e.raio * 0.5 + 12, r: (o.pegada[2] - o.pegada[0]) / 2 + 16 });
        if (alvo) { b.estado = 'andando'; b.alvo = alvo; b.comer = true; }
      }
    }
    return { bichos, atualizar, extras, bichoEm, chamar, reservar, chamarPara, rotulo: b => `${b.nome} · ${b.var === 'galo' ? 'galo' : ROTULO[b.tipo]}` };
  }

  raiz.Animais = { criar, ESP };
})(typeof self !== 'undefined' ? self : globalThis);
