// Currais do mapa novo, no mesmo desenho vetorial da casa e do celeiro (nítido em qualquer zoom).
//   vacas: cerca de eucalipto com três tábuas, abrigo aberto com feno, cocho, bebedouro redondo e rolo de feno;
//   ovelhas: cerca branca, aprisco de madeira, cocho e bebedouro;
//   porcos: chiqueiro de tábuas, chão de terra, poça de lama, cabana e cocho de cimento;
//   galinhas: tela de arame, casinha suspensa com rampa e ninhos, terreiro com milho, comedouro e bebedouro.
// As cercas são desenhadas a cada quadro (vão por vão, na ordem de profundidade); os equipamentos são assados como
// a casa. Os animais ficam em animais.js.
(function (raiz) {
  'use strict';

  function hash(i, j, s) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function ruido(x, y, s = 0) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // vao: distância entre postes; alt: altura do poste; trilhos: [altura, espessura] das tábuas
  const CERCAS = {
    ripas: { vao: 64, alt: 46, poste: 8, cor: '#7f5d3c', trilhos: [[14, 6], [28, 6], [41, 6]], madeira: '#8f6c46' },
    branca: { vao: 54, alt: 36, poste: 7, cor: '#ece8de', trilhos: [[11, 5], [22, 5], [32, 5]], madeira: '#f1ede4', pintada: true },
    tabuas: { vao: 50, alt: 34, poste: 9, cor: '#6a4e33', madeira: '#7a5a3b' },
    tela: { vao: 44, alt: 42, poste: 5, cor: '#86735b', madeira: '#957f63' },
    estacas: { vao: 48, alt: 30, poste: 6, cor: '#8a7356', madeira: '#a08a6a' }, // horta: estacas de madeira pontudas
  };

  function criar(L, U) {
    const { sorteio, tom, caminho, degradeV, degradeH, chapa, fardo, corpoCeleiro } = U;
    const CONF = [
      { id: 'vacas', cerca: 'ripas', piso: 'pasto' },
      { id: 'ovelhas', cerca: 'branca', piso: 'pasto' },
      { id: 'porcos', cerca: 'tabuas', piso: 'lama' },
      { id: 'galinheiro', cerca: 'tela', piso: 'terreiro' },
      { id: 'horta', cerca: 'estacas', piso: 'horta' },
      { id: 'pomar', cerca: 'ripas', piso: 'pomar' },
    ];
    // pomar por nível: a porteira fica sempre no mesmo lugar (fim da trilha, x 620, y 1000) e o pomar cresce em volta
    const POMAR = { 1: { x: 440, y: 600, w: 360, h: 400 }, 2: { x: 180, y: 380, w: 800, h: 620 }, 3: { x: 80, y: 80, w: 1380, h: 920 } };
    const cheio = id => { const l = L.lotes.find(x => x.id === id); return { x: l.x, y: l.y, w: l.w, h: l.h }; };
    const LOTES = {
      pomar: POMAR,
      vacas: { 1: { x: 3460, y: 1310, w: 450, h: 360 }, 2: { x: 3460, y: 1240, w: 700, h: 500 }, 3: cheio('vacas') },
      ovelhas: { 1: { x: 2780, y: 2050, w: 360, h: 360 }, 2: { x: 2640, y: 2010, w: 500, h: 440 }, 3: cheio('ovelhas') },
      porcos: { 1: { x: 3460, y: 2070, w: 360, h: 360 }, 2: { x: 3460, y: 2040, w: 500, h: 420 }, 3: cheio('porcos') },
      galinheiro: { 1: { x: 4260, y: 520, w: 300, h: 260 }, 2: { x: 4200, y: 460, w: 420, h: 320 }, 3: cheio('galinheiro') },
      horta: { 1: { x: 2510, y: 1270, w: 340, h: 260 }, 2: { x: 2510, y: 1270, w: 640, h: 260 }, 3: cheio('horta') },
    };
    let qAtual = 0;
    const currais = CONF.map((c, i) => {
      const l = { id: c.id, ...LOTES[c.id][1] }, est = L.estradas.find(e => e.lote === c.id), [gx, gy] = est.linha[est.linha.length - 1];
      const dist = { oeste: Math.abs(gx - l.x), leste: Math.abs(gx - l.x - l.w), norte: Math.abs(gy - l.y), sul: Math.abs(gy - l.y - l.h) };
      const lado = Object.keys(dist).reduce((a, b) => (dist[a] < dist[b] ? a : b));
      const vertical = lado === 'oeste' || lado === 'leste';
      return { ...c, l, nivel: 1, semente: 300 + i * 17, porteira: { lado, pos: vertical ? gy : gx, x: vertical ? (lado === 'oeste' ? l.x : l.x + l.w) : gx, y: vertical ? gy : (lado === 'norte' ? l.y : l.y + l.h) }, objetos: [], pecas: [] };
    });

    // ---------- equipamentos ----------
    function cocho(x0, x1, base, recheio, cimento) {
      const dd = 22, hh = 18;
      return { tipo: 'cocho', base, pegada: [x0, base - dd, x1, base], caixa: [x0 - 8, base - dd - hh - 12, x1 + 8, base + 8], pintar(g, r) {
        g.fillStyle = 'rgba(25,20,10,.35)'; g.fillRect(x0 + 2, base - 2, x1 - x0, 7);
        if (!cimento) for (const px of [x0 + 6, x1 - 6]) { g.fillStyle = '#4b3523'; g.fillRect(px - 3, base - 8, 6, 8); }
        const yT = base - hh - (cimento ? 0 : 6), cor = cimento ? '#b3ada0' : '#8a6743';
        // borda de cima e o recheio (feno, ração ou lavagem)
        g.fillStyle = tom(cor, 0.8); g.fillRect(x0, yT - dd, x1 - x0, dd);
        g.fillStyle = tom(cor, 0.55); g.fillRect(x0 + 4, yT - dd + 4, x1 - x0 - 8, dd - 6);
        if (recheio === 'feno') {
          g.fillStyle = '#b89d4c'; g.fillRect(x0 + 4, yT - dd + 6, x1 - x0 - 8, dd - 8);
          g.strokeStyle = 'rgba(230,205,120,.9)'; g.lineWidth = 0.9;
          for (let i = 0; i < (x1 - x0) * 0.9; i++) { const sx = x0 + 6 + r() * (x1 - x0 - 12), sy = yT - dd + 6 + r() * (dd - 8); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 9, sy + (r() - 0.5) * 4); g.stroke(); }
        } else {
          g.fillStyle = recheio === 'lavagem' ? '#7a5d38' : '#c29a52'; g.fillRect(x0 + 4, yT - dd + 7, x1 - x0 - 8, dd - 9);
          for (let i = 0; i < (x1 - x0) * 0.8; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,230,150,.6)' : 'rgba(80,55,25,.5)'; g.beginPath(); g.arc(x0 + 6 + r() * (x1 - x0 - 12), yT - dd + 8 + r() * (dd - 11), 0.9 + r(), 0, 7); g.fill(); }
        }
        g.fillStyle = tom(cor, 1.25); g.fillRect(x0, yT - dd, x1 - x0, 2.5);
        // frente
        if (cimento) { g.fillStyle = degradeV(g, yT, base, [[0, '#c9c3b6'], [1, '#8f897d']]); g.fillRect(x0, yT, x1 - x0, base - yT); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(70,65,55,.18)'; g.fillRect(x0 + r() * (x1 - x0), yT + r() * (base - yT), 1.5, 1.5); } }
        else for (const [yy, hhh] of [[yT, 9], [yT + 9, 9]]) {
          g.fillStyle = degradeV(g, yy, yy + hhh, [[0, tom(cor, 1.1)], [1, tom(cor, 0.82)]]); g.fillRect(x0, yy, x1 - x0, hhh - 0.8);
          g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0, yy + hhh - 1, x1 - x0, 1);
          g.fillStyle = '#2b2622'; for (const nx of [x0 + 4, x1 - 5]) g.fillRect(nx, yy + 3.5, 1.6, 1.6);
        }
        g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x1 - 3, yT - dd, 3, base - yT + dd);
      } };
    }
    /** bebedouro baixo e comprido, do jeito do cocho, cheio d'água (cimento ou madeira) */
    function bebedouro(x0, x1, base, madeira = false) {
      const dd = 24, hh = 13, yT = base - hh;
      return { tipo: 'bebedouro', base, pegada: [x0, base - dd, x1, base], caixa: [x0 - 8, yT - dd - 10, x1 + 8, base + 8], pintar(g, r) {
        const cor = madeira ? '#8a6743' : '#b3ada0';
        g.fillStyle = 'rgba(25,20,10,.35)'; g.fillRect(x0 + 2, base - 2, x1 - x0, 7);
        g.fillStyle = 'rgba(60,70,40,.35)'; g.fillRect(x0 - 3, base - 1, x1 - x0 + 6, 4); // chão molhado
        // borda e água (vista de cima)
        g.fillStyle = tom(cor, 0.82); g.fillRect(x0, yT - dd, x1 - x0, dd);
        g.fillStyle = tom(cor, 1.22); g.fillRect(x0, yT - dd, x1 - x0, 2.5);
        const ax0 = x0 + 4, ax1 = x1 - 4, ay0 = yT - dd + 4, ay1 = yT - 3;
        g.fillStyle = degradeV(g, ay0, ay1, [[0, '#2f5559'], [0.5, '#3f6f72'], [1, '#55878a']]); g.fillRect(ax0, ay0, ax1 - ax0, ay1 - ay0);
        g.fillStyle = 'rgba(20,30,25,.35)'; g.fillRect(ax0, ay0, ax1 - ax0, 3); // sombra da borda na água
        g.fillStyle = degradeH(g, ax0, ax1, [[0, 'rgba(210,232,240,0)'], [0.3, 'rgba(210,232,240,.35)'], [0.42, 'rgba(210,232,240,0)'], [1, 'rgba(210,232,240,0)']]); g.fillRect(ax0, ay0 + 3, ax1 - ax0, ay1 - ay0 - 3); // reflexo do céu
        g.strokeStyle = 'rgba(235,245,248,.45)'; g.lineWidth = 0.8;
        for (let i = 0; i < (x1 - x0) / 18; i++) { const wx = ax0 + 6 + r() * (ax1 - ax0 - 12), wy = ay0 + 5 + r() * (ay1 - ay0 - 8); g.beginPath(); g.ellipse(wx, wy, 3 + r() * 4, 1, 0, 3.4, 6); g.stroke(); }
        g.fillStyle = '#6f8f3a'; g.beginPath(); g.ellipse(ax0 + (ax1 - ax0) * 0.7, ay0 + 9, 3, 1.5, 0.6, 0, 7); g.fill(); // folha boiando
        // frente
        if (madeira) for (const [yy, h] of [[yT, 7], [yT + 7, 6]]) {
          g.fillStyle = degradeV(g, yy, yy + h, [[0, tom(cor, 1.1)], [1, tom(cor, 0.8)]]); g.fillRect(x0, yy, x1 - x0, h - 0.8);
          g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0, yy + h - 1, x1 - x0, 1);
          g.fillStyle = '#2b2622'; for (const nx of [x0 + 4, x1 - 5]) g.fillRect(nx, yy + 2.5, 1.6, 1.6);
        } else {
          g.fillStyle = degradeV(g, yT, base, [[0, '#cbc5b8'], [1, '#8f897d']]); g.fillRect(x0, yT, x1 - x0, hh);
          for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(70,65,55,.18)'; g.fillRect(x0 + r() * (x1 - x0), yT + r() * hh, 1.5, 1.5); }
          g.fillStyle = 'rgba(60,85,45,.35)'; g.fillRect(x0, base - 4, x1 - x0, 4); // limo no pé
        }
        g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x1 - 3, yT - dd, 3, hh + dd);
      } };
    }
    function rolo(cx, base, rr, comp) { // rolo de feno deitado, com a ponta enrolada virada para a frente
      const yc = base - rr;
      return { tipo: 'rolo', base, pegada: [cx - rr, base - comp, cx + rr, base], caixa: [cx - rr - 6, yc - comp - rr - 6, cx + rr + 10, base + 8], pintar(g, r) {
        g.fillStyle = 'rgba(25,20,10,.35)'; g.beginPath(); g.ellipse(cx + 6, base - 4, rr + 4, 7, 0, 0, 7); g.fill();
        g.fillStyle = degradeH(g, cx - rr, cx + rr, [[0, '#a98a3e'], [0.3, '#e1c674'], [0.7, '#c4a656'], [1, '#86692c']]);
        g.beginPath(); g.rect(cx - rr, yc - comp, rr * 2, comp); g.arc(cx, yc - comp, rr, Math.PI, 0); g.fill();
        g.strokeStyle = 'rgba(120,90,30,.45)'; g.lineWidth = 0.8;
        for (let i = 0; i < 70; i++) { const sx = cx - rr + r() * rr * 2, sy = yc - comp - rr * 0.6 + r() * (comp + rr * 0.6); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 3, sy - 4 - r() * 5); g.stroke(); }
        for (const t of [0.3, 0.6]) { g.strokeStyle = 'rgba(240,235,220,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - rr, yc - comp * t); g.lineTo(cx + rr, yc - comp * t); g.stroke(); }
        g.fillStyle = '#d6b964'; g.beginPath(); g.arc(cx, yc, rr, 0, 7); g.fill();
        g.strokeStyle = 'rgba(130,95,35,.55)'; g.lineWidth = 1.1; g.beginPath();
        for (let a = 0; a < Math.PI * 9; a += 0.2) { const rad = rr * (a / (Math.PI * 9)); const px = cx + Math.cos(a) * rad, py = yc + Math.sin(a) * rad; a ? g.lineTo(px, py) : g.moveTo(px, py); }
        g.stroke();
        const brilho = g.createRadialGradient(cx - rr * 0.35, yc - rr * 0.35, 1, cx, yc, rr);
        brilho.addColorStop(0, 'rgba(255,245,200,.35)'); brilho.addColorStop(1, 'rgba(90,60,20,.25)'); g.fillStyle = brilho; g.beginPath(); g.arc(cx, yc, rr, 0, 7); g.fill();
      } };
    }
    function abrigo(x0, x1, base, d) { // galpão aberto de uma água, chão de palha
      const hF = 72;
      return { tipo: 'abrigo', base, pegada: [x0, base - d, x1, base], caixa: [x0 - 18, base - d - hF - 40, x1 + 18, base + 10], pintar(g, r) {
        g.fillStyle = degradeV(g, base - hF, base, [[0, '#120d0a'], [0.7, '#2c2118'], [1, '#3a2c1d']]); g.fillRect(x0, base - hF, x1 - x0, hF);
        g.strokeStyle = 'rgba(214,184,100,.9)'; g.lineWidth = 1;
        for (let i = 0; i < (x1 - x0) * 0.8; i++) { const sx = x0 + r() * (x1 - x0), sy = base - 1 - r() * 16; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 10, sy + (r() - 0.5) * 3); g.stroke(); }
        fardo(g, x0 + 14, base - 8, 34, 15, r); fardo(g, x0 + 50, base - 8, 34, 15, r); fardo(g, x0 + 30, base - 25, 34, 14, r);
        const n = Math.max(2, Math.round((x1 - x0) / 85));
        for (let i = 0; i <= n; i++) {
          const px = x0 + 6 + (x1 - x0 - 12) * i / n;
          g.fillStyle = 'rgba(20,15,8,.3)'; g.fillRect(px + 3, base - 3, 9, 5);
          g.fillStyle = degradeH(g, px - 4.5, px + 4.5, [[0, '#8d6a46'], [0.4, '#a98258'], [1, '#5a412a']]); g.fillRect(px - 4.5, base - hF, 9, hF);
        }
        chapa(g, [x0 - 12, base - hF], [x1 + 12, base - hF], d + 30, 0.96, r, '#a3aaab');
        g.fillStyle = '#5b4330'; g.fillRect(x0 - 12, base - hF - 2, x1 - x0 + 24, 7);
        g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x0 - 12, base - hF - 2, x1 - x0 + 24, 1.5);
        g.fillStyle = degradeV(g, base - hF + 5, base - hF + 22, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(x0, base - hF + 5, x1 - x0, 17);
      } };
    }
    function casinha(cx, base, o) { // aprisco, cabana dos porcos e casinha das galinhas (suspensa, com rampa e ninhos)
      const elev = o.elevada || 0, w = o.w, d = o.d, c = { cx, yW: base - elev, w, d, H: o.H, h1: o.h1, h2: 0, paiol: true, madeira: o.madeira, friso: o.friso, tabua: 10, portaL: o.portaL, portaA: o.portaA, semJanela: o.semJanela, semFeno: true };
      const topo = base - elev - o.H - o.h1 - d - 12;
      return { tipo: 'casinha', base, pegada: [cx - w / 2, base - d, cx + w / 2 + (o.ninhos ? 30 : 0), base + (elev ? 6 : 0)], caixa: [cx - w / 2 - 22, topo - 10, cx + w / 2 + 52, base + 48], pintar(g, r) {
        if (elev) {
          g.fillStyle = 'rgba(20,15,8,.4)'; g.fillRect(cx - w / 2 + 4, base - 6, w - 8, 9);
          for (const px of [cx - w / 2 + 8, cx + w / 2 - 8]) { g.fillStyle = degradeH(g, px - 3.5, px + 3.5, [[0, '#8c6a48'], [1, '#4f3a26']]); g.fillRect(px - 3.5, base - elev, 7, elev); }
        }
        corpoCeleiro(g, c, r);
        if (o.ninhos) { // caixa de ninhos encostada no lado leste, tampa de chapa
          const nx = cx + w / 2 - 2, ny = base - elev - 8, nh = 26, nw = 30;
          g.fillStyle = degradeV(g, ny - nh, ny, [[0, tom(o.madeira, 1.05)], [1, tom(o.madeira, 0.8)]]); g.fillRect(nx, ny - nh, nw, nh);
          for (let i = 0; i < 2; i++) { g.fillStyle = '#20170f'; g.fillRect(nx + 3 + i * 14, ny - nh + 8, 11, 12); g.fillStyle = '#d9bd6a'; g.fillRect(nx + 3 + i * 14, ny - nh + 16, 11, 4); }
          g.fillStyle = '#f2ead8'; g.beginPath(); g.ellipse(nx + 9, ny - nh + 15.5, 2.4, 1.8, 0, 0, 7); g.fill();
          chapa(g, [nx - 2, ny - nh], [nx + nw + 4, ny - nh + 4], 18, 0.8, r);
        }
        if (elev) { // rampa com travessas, da porta até o chão
          const y0 = base - elev, y1 = base + 34;
          g.fillStyle = 'rgba(20,15,8,.3)'; g.fillRect(cx - 7, y0 + 4, 16, y1 - y0);
          g.fillStyle = degradeH(g, cx - 8, cx + 8, [[0, '#a8835a'], [1, '#6e5233']]); g.fillRect(cx - 8, y0, 16, y1 - y0);
          for (let y = y0 + 5; y < y1 - 2; y += 7) { g.fillStyle = '#5a412a'; g.fillRect(cx - 8, y, 16, 2.2); g.fillStyle = 'rgba(255,240,210,.3)'; g.fillRect(cx - 8, y, 16, 0.8); }
        }
      } };
    }
    function comedouroTubo(cx, base) {
      return { tipo: 'comedouro', base, pegada: [cx - 14, base - 16, cx + 14, base], caixa: [cx - 18, base - 60, cx + 18, base + 6], pintar(g) {
        g.fillStyle = 'rgba(25,20,10,.35)'; g.beginPath(); g.ellipse(cx + 3, base - 4, 16, 6, 0, 0, 7); g.fill();
        g.fillStyle = '#b8bfc1'; g.beginPath(); g.ellipse(cx, base - 8, 14, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#d4a94d'; g.beginPath(); g.ellipse(cx, base - 9, 10.5, 5.5, 0, 0, 7); g.fill();
        g.fillStyle = degradeH(g, cx - 6, cx + 6, [[0, '#d7dcdd'], [1, '#7c8385']]); g.fillRect(cx - 6, base - 46, 12, 38);
        g.fillStyle = '#c0392b'; caminho(g, [[cx - 9, base - 46], [cx, base - 56], [cx + 9, base - 46]]); g.fill();
        g.fillStyle = 'rgba(255,255,255,.3)'; caminho(g, [[cx - 9, base - 46], [cx, base - 56], [cx - 2, base - 46]]); g.fill();
      } };
    }
    function bebedouroGalinha(cx, base) {
      return { tipo: 'bebedouro', base, pegada: [cx - 13, base - 14, cx + 13, base], caixa: [cx - 18, base - 44, cx + 18, base + 6], pintar(g) {
        g.fillStyle = 'rgba(25,20,10,.35)'; g.beginPath(); g.ellipse(cx + 3, base - 4, 15, 6, 0, 0, 7); g.fill();
        g.fillStyle = '#c3c9ca'; g.beginPath(); g.ellipse(cx, base - 8, 13, 7, 0, 0, 7); g.fill();
        g.fillStyle = '#4c7f84'; g.beginPath(); g.ellipse(cx, base - 9, 10, 4.6, 0, 0, 7); g.fill();
        g.fillStyle = degradeH(g, cx - 9, cx + 9, [[0, 'rgba(210,225,230,.9)'], [0.5, 'rgba(150,185,195,.75)'], [1, 'rgba(90,120,130,.85)']]);
        g.beginPath(); g.moveTo(cx - 8, base - 10); g.lineTo(cx - 8, base - 28); g.quadraticCurveTo(cx, base - 40, cx + 8, base - 28); g.lineTo(cx + 8, base - 10); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(cx - 5, base - 30, 2, 16);
      } };
    }

    /** árvores do pomar em grade fixa no mapa (cada lugar tem sempre a mesma árvore), com uma alameda livre na porteira */
    const ESPECIES = ['laranja', 'maca', 'manga', 'limao'];
    function montarPomar(cur) {
      const l = cur.l, o = (cur.objetos = []), meio = cur.porteira.pos, cols = [];
      for (let x = meio - 100; x >= l.x + 70; x -= 180) cols.push(x);
      for (let x = meio + 100; x <= l.x + l.w - 60; x += 180) cols.push(x);
      cols.sort((a, b) => a - b);
      for (let base = l.y + l.h - 120, j = 0; base >= l.y + 60; base -= 200, j++)
        for (const x of cols) o.push(P.arvore(x, base, ESPECIES[(Math.round((x - meio + 1000) / 180) + j) % 4]));
      o.push(P.cesto(meio + 70, l.y + l.h - 15), P.caixote(meio - 60, l.y + l.h - 25, '#f39c1f'));
      if (l.h > 400) { o.push(P.caixote(meio + 60, l.y + l.h - 230, '#c8312a')); o.push(P.escada(meio + 145, l.y + l.h - 316)); } // escada encostada na árvore à direita da alameda
    }
    // ---------- arrumação de cada curral por nível (posições relativas ao lote) ----------
    const P = raiz.Plantas.criar(U);
    function montarObjetos(cur) {
      if (cur.id === 'pomar') return montarPomar(cur);
      const l = cur.l, o = (cur.objetos = []), n = cur.nivel, w = l.w, h = l.h;
      if (cur.id === 'vacas') {
        if (n === 1) { o.push(cocho(l.x + 140, l.x + 300, l.y + 80, 'feno'), bebedouro(l.x + w - 170, l.x + w - 40, l.y + h - 34)); }
        else if (n === 2) { o.push(abrigo(l.x + w - 260, l.x + w - 30, l.y + 150, 100), cocho(l.x + 120, l.x + 300, l.y + 90, 'feno'), bebedouro(l.x + w - 250, l.x + w - 100, l.y + h - 40)); }
        else { o.push(abrigo(l.x + w - 300, l.x + w - 40, l.y + 182, 118), cocho(l.x + 120, l.x + 330, l.y + 118, 'feno'), bebedouro(l.x + w - 270, l.x + w - 110, l.y + h - 60), rolo(l.x + 560, l.y + h - 150, 24, 40)); }
      } else if (cur.id === 'ovelhas') {
        const aprisco = (x, b) => casinha(x, b, { w: 168, d: 92, H: 58, h1: 40, madeira: '#9a7a54', friso: '#5a4230' });
        if (n === 1) o.push(cocho(l.x + 40, l.x + 170, l.y + 70, 'feno'), bebedouro(l.x + 40, l.x + 150, l.y + h - 36, true));
        else if (n === 2) o.push(aprisco(l.x + 120, l.y + 150), cocho(l.x + 270, l.x + 400, l.y + 80, 'feno'), bebedouro(l.x + 60, l.x + 170, l.y + h - 40, true));
        else o.push(aprisco(l.x + 130, l.y + 156), cocho(l.x + 330, l.x + 460, l.y + 96, 'feno'), bebedouro(l.x + w - 160, l.x + w - 60, l.y + h - 56, true));
      } else if (cur.id === 'porcos') {
        const cabana = (x, b) => casinha(x, b, { w: 172, d: 94, H: 50, h1: 36, madeira: '#7d5d3e', friso: '#4a3422', semJanela: true });
        if (n === 1) { o.push(cocho(l.x + 130, l.x + 290, l.y + 70, 'lavagem', true), bebedouro(l.x + 170, l.x + 290, l.y + h - 36)); cur.lama = { cx: l.x + w * 0.5, cy: l.y + h * 0.58, rx: 80, ry: 50 }; }
        else if (n === 2) { o.push(cabana(l.x + w - 110, l.y + 130), cocho(l.x + 60, l.x + 220, l.y + 70, 'lavagem', true), bebedouro(l.x + 40, l.x + 150, l.y + h - 40)); cur.lama = { cx: l.x + w * 0.46, cy: l.y + h * 0.62, rx: 100, ry: 60 }; }
        else { o.push(cabana(l.x + w - 130, l.y + 140), cocho(l.x + 60, l.x + 230, l.y + 82, 'lavagem', true), bebedouro(l.x + 40, l.x + 150, l.y + h - 56)); cur.lama = { cx: l.x + w * 0.48, cy: l.y + h * 0.62, rx: 120, ry: 72 }; }
      } else if (cur.id === 'horta') { // canteiros dos dois lados do caminho de terra que sai da porteira
        cur.caminhoY = cur.porteira.pos;
        const cols = [[40, 210], [240, 410], [440, 610]];
        if (n === 1) { o.push(P.canteiro(l.x + 40, l.x + 300, l.y + 96, 'milho'), P.canteiro(l.x + 40, l.x + 300, l.y + 216, 'cenoura'), P.regador(l.x + 316, l.y + 146)); }
        else {
          const linhas = n === 2 ? [[96, ['milho', 'girassol', 'tomate']], [216, ['cenoura', 'morango', 'alface']]]
            : [[96, ['milho', 'girassol', 'tomate']], [178, ['abobora', 'couve', 'alface']], [316, ['cenoura', 'morango', 'alface']], [400, ['morango', 'cenoura', 'couve']]];
          for (const [b, culturas] of linhas) cols.forEach(([a, c], i) => o.push(P.canteiro(l.x + a, l.x + c, l.y + b, culturas[i])));
          o.push(P.espantalho(l.x + 600, l.y + (n === 2 ? 146 : 240)), P.regador(l.x + 60, l.y + (n === 2 ? 148 : 246)));
        }
      } else { // galinheiro
        if (n === 1) o.push(comedouroTubo(l.x + 70, l.y + 110), bebedouroGalinha(l.x + 230, l.y + 100));
        else if (n === 2) o.push(casinha(l.x + 105, l.y + 150, { w: 150, d: 82, H: 50, h1: 32, madeira: '#e7dfcf', friso: '#9b3022', portaL: 26, portaA: 32, elevada: 24, ninhos: true }), comedouroTubo(l.x + 280, l.y + 200), bebedouroGalinha(l.x + 350, l.y + 110));
        else o.push(casinha(l.x + 120, l.y + 176, { w: 150, d: 82, H: 50, h1: 32, madeira: '#e7dfcf', friso: '#9b3022', portaL: 26, portaA: 32, elevada: 24, ninhos: true }), comedouroTubo(l.x + 330, l.y + 214), bebedouroGalinha(l.x + 420, l.y + 160));
      }
    }
    for (const cur of currais) montarObjetos(cur);
    const objetos = currais.flatMap(c => c.objetos);

    // ---------- cercas: um pedaço por vão, para entrar na ordem de profundidade ----------
    for (const cur of currais) montarCerca(cur);
    function montarCerca(cur) {
      const { l } = cur, E = CERCAS[cur.cerca];
      cur.pecas = [];
      const lados = [['norte', l.x, l.y, l.x + l.w, l.y], ['sul', l.x, l.y + l.h, l.x + l.w, l.y + l.h], ['oeste', l.x, l.y, l.x, l.y + l.h], ['leste', l.x + l.w, l.y, l.x + l.w, l.y + l.h]];
      for (const [nome, ax, ay, bx, by] of lados) {
        const horiz = ay === by, comp = horiz ? bx - ax : by - ay;
        let vaoP = null;
        if (cur.porteira.lado === nome) { const p = cur.porteira.pos - (horiz ? ax : ay); vaoP = [p - 32, p + 32]; }
        const pts = [];
        for (const [s0, s1] of vaoP ? [[0, vaoP[0]], [vaoP[1], comp]] : [[0, comp]]) {
          const n = Math.max(1, Math.round((s1 - s0) / E.vao));
          for (let i = 0; i <= n; i++) pts.push(s0 + ((s1 - s0) * i) / n);
        }
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const porteira = !!vaoP && Math.abs(a - vaoP[0]) < 0.5 && Math.abs(b - vaoP[1]) < 0.5;
          cur.pecas.push({ cur, horiz, lado: nome, porteira, primeiro: i === 0, a: horiz ? [ax + a, ay] : [ax, ay + a], b: horiz ? [ax + b, ay] : [ax, ay + b] });
        }
      }
    }
    function poste(g, x, y, E, alto = 0, grosso = 1) {
      const L = E.poste * grosso, alt = E.alt + alto;
      g.fillStyle = 'rgba(20,18,8,.3)'; g.beginPath(); g.ellipse(x + 3, y, L * 0.9, 2.6, 0, 0, 7); g.fill();
      g.fillStyle = degradeH(g, x - L / 2, x + L / 2, [[0, tom(E.cor, 1.18)], [0.4, tom(E.cor, 1)], [1, tom(E.cor, 0.62)]]); g.fillRect(x - L / 2, y - alt, L, alt);
      if (E.pintada) { g.fillStyle = tom(E.cor, 1.05); caminho(g, [[x - L / 2, y - alt], [x, y - alt - L * 0.6], [x + L / 2, y - alt]]); g.fill(); }
      else {
        g.fillStyle = 'rgba(40,25,10,.25)'; g.fillRect(x - L * 0.15, y - alt + 4, 0.8, alt - 8);
        g.fillStyle = tom(E.cor, 1.35); g.beginPath(); g.ellipse(x, y - alt, L / 2, L * 0.3, 0, 0, 7); g.fill();
        g.strokeStyle = tom(E.cor, 0.8, 0.6); g.lineWidth = 0.6; g.beginPath(); g.ellipse(x, y - alt, L * 0.25, L * 0.15, 0, 0, 7); g.stroke();
      }
      g.fillStyle = 'rgba(60,45,20,.35)'; g.fillRect(x - L / 2, y - 5, L, 5); // terra no pé
    }
    function tabuaH(g, x1, x2, y, t, cor) {
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x1, y + t / 2, x2 - x1, 2);
      g.fillStyle = degradeV(g, y - t / 2, y + t / 2, [[0, tom(cor, 1.18)], [1, tom(cor, 0.78)]]); g.fillRect(x1 - 2, y - t / 2, x2 - x1 + 4, t);
      g.fillStyle = 'rgba(40,25,10,.15)'; g.fillRect(x1, y - 0.4, x2 - x1, 0.8);
      g.fillStyle = '#2b2622'; for (const nx of [x1 + 1, x2 - 2]) g.fillRect(nx, y - 1, 1.5, 1.5);
    }
    function tela(g, x1, x2, yTop, yBot) {
      g.save(); g.beginPath(); g.rect(x1, yTop, x2 - x1, yBot - yTop); g.clip();
      g.strokeStyle = 'rgba(205,208,200,.5)'; g.lineWidth = 0.7; g.beginPath();
      for (let k = x1 - (yBot - yTop); k < x2; k += 7) { g.moveTo(k, yBot); g.lineTo(k + (yBot - yTop), yTop); g.moveTo(k, yTop); g.lineTo(k + (yBot - yTop), yBot); }
      g.stroke(); g.restore();
    }
    function desenharPeca(g, p) {
      const E = CERCAS[p.cur.cerca], [x1, y1] = p.a, [x2, y2] = p.b, P = p.cur.porteira;
      // os dois postes da porteira são mais altos e grossos
      const daPorteira = s => P.lado === p.lado && (Math.abs(s - (P.pos - 32)) < 1 || Math.abs(s - (P.pos + 32)) < 1);
      const poste2 = (x, y, s) => poste(g, x, y, E, daPorteira(s) ? 8 : 0, daPorteira(s) ? 1.5 : 1);
      if (p.horiz) {
        const y = y1, frente = p.lado === 'sul';
        const tabuas = () => {
          if (p.porteira) return;
          if (E.trilhos) for (const [h, t] of E.trilhos) tabuaH(g, x1, x2, y - h, t, E.madeira);
          else if (p.cur.cerca === 'tabuas') {
            const r = sorteio(Math.round(x1 * 7 + y));
            for (let x = x1; x < x2; x += 8.4) { const j = r() * 4; g.fillStyle = degradeV(g, y - E.alt, y, [[0, tom(E.madeira, 1.1 - r() * 0.15)], [1, tom(E.madeira, 0.7)]]); g.fillRect(x, y - E.alt + 4 + j, 7.6, E.alt - 4 - j); }
            tabuaH(g, x1, x2, y - E.alt + 9, 6, E.cor);
            g.fillStyle = degradeV(g, y - 12, y, [[0, 'rgba(70,50,25,0)'], [1, 'rgba(70,50,25,.5)']]); g.fillRect(x1, y - 12, x2 - x1, 12);
          } else if (p.cur.cerca === 'estacas') { // estacas pontudas e duas travessas
            tabuaH(g, x1, x2, y - E.alt + 9, 3.5, E.madeira); tabuaH(g, x1, x2, y - 9, 3.5, E.madeira);
            const r = sorteio(Math.round(x1 * 5 + y));
            for (let x = x1 + 2; x < x2 - 1; x += 7) { const h = E.alt - 2 + (r() - 0.5) * 4; g.fillStyle = degradeH(g, x - 2.2, x + 2.2, [[0, tom(E.madeira, 1.15)], [1, tom(E.madeira, 0.72)]]); g.beginPath(); g.moveTo(x - 2.2, y); g.lineTo(x - 2.2, y - h + 3); g.lineTo(x, y - h); g.lineTo(x + 2.2, y - h + 3); g.lineTo(x + 2.2, y); g.closePath(); g.fill(); }
          } else { tela(g, x1, x2, y - E.alt + 3, y - 8); tabuaH(g, x1, x2, y - E.alt + 2, 4, E.madeira); tabuaH(g, x1, x2, y - 4, 8, E.madeira); }
        };
        if (!frente) tabuas();
        if (p.primeiro || daPorteira(x1)) poste2(x1, y, x1);
        poste2(x2, y, x2);
        if (frente) tabuas();
        return;
      }
      // lado oeste/leste: na vista de cima-frente o vão vira uma faixa vertical entre os postes
      const x = x1, larg = E.trilhos ? 3.6 : 4.6;
      if (p.porteira) { /* a folha da porteira é um desenho à parte (gira na dobradiça) */ }
      else if (E.trilhos) for (const [h, t] of E.trilhos) {
        g.fillStyle = degradeH(g, x - larg / 2, x + larg / 2, [[0, tom(E.madeira, 1.15)], [1, tom(E.madeira, 0.72)]]); g.fillRect(x - larg / 2, y1 - h - t / 2, larg, y2 - y1 + t);
      } else if (p.cur.cerca === 'tabuas') {
        g.fillStyle = degradeH(g, x - larg / 2, x + larg / 2, [[0, tom(E.madeira, 1.1)], [1, tom(E.madeira, 0.68)]]); g.fillRect(x - larg / 2, y1 - E.alt + 4, larg, y2 - y1 + E.alt - 4);
      } else if (p.cur.cerca === 'estacas') {
        g.fillStyle = degradeH(g, x - 2.2, x + 2.2, [[0, tom(E.madeira, 1.1)], [1, tom(E.madeira, 0.7)]]); g.fillRect(x - 2.2, y1 - E.alt, 4.4, y2 - y1 + E.alt);
      } else { g.fillStyle = 'rgba(205,208,200,.55)'; g.fillRect(x - 0.8, y1 - E.alt + 3, 1.6, y2 - y1 + E.alt - 10); g.fillStyle = tom(E.madeira, 0.9); g.fillRect(x - 2, y1 - 8, 4, y2 - y1 + 8); }
      if (p.primeiro) poste2(x, y1, y1);
      poste2(x, y2, y2);
    }
    // ---------- porteira que abre e fecha ----------
    // dobradiça no poste de cima (lados oeste/leste) ou no da esquerda (sul/norte); abre para fora do curral, até 90°
    const ABERTA = Math.PI / 2 * 0.96, VAO = 64;
    for (const cur of currais) cur.portao = { ang: 0, alvo: 0 };
    function folha(cur) {
      const P = cur.porteira, l = cur.l, s = Math.sin(cur.portao.ang), c = Math.cos(cur.portao.ang);
      const [H, v] = P.lado === 'oeste' ? [[l.x, P.pos - VAO / 2], [-VAO * s, VAO * c]] : P.lado === 'leste' ? [[l.x + l.w, P.pos - VAO / 2], [VAO * s, VAO * c]]
        : P.lado === 'sul' ? [[P.pos - VAO / 2, l.y + l.h], [VAO * c, VAO * s]] : [[P.pos - VAO / 2, l.y], [VAO * c, -VAO * s]];
      return { A: [H[0] + v[0] * 0.09, H[1] + v[1] * 0.09], B: [H[0] + v[0] * 0.93, H[1] + v[1] * 0.93], frente: Math.abs(v[0]) / VAO };
    }
    function desenharPorteira(g, cur) { // quadro, travessas, mão-francesa e trinco, em qualquer ângulo
      const E = CERCAS[cur.cerca], { A, B, frente } = folha(cur), bot = 6, top = E.alt - 5, cor = '#b58d5f', k = 0.78 + 0.32 * frente;
      const lin = (x0, y0, x1, y1, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      g.lineCap = 'round';
      g.fillStyle = 'rgba(20,18,8,.22)'; g.beginPath(); g.moveTo(A[0] + 2, A[1] + 1); g.lineTo(B[0] + 2, B[1] + 1); g.lineTo(B[0] + 4, B[1] + 4); g.lineTo(A[0] + 4, A[1] + 4); g.fill(); // sombra no chão
      if (E === CERCAS.tela) {
        g.save(); g.beginPath(); g.moveTo(A[0], A[1] - bot); g.lineTo(B[0], B[1] - bot); g.lineTo(B[0], B[1] - top); g.lineTo(A[0], A[1] - top); g.closePath(); g.clip();
        tela(g, Math.min(A[0], B[0]) - 2, Math.max(A[0], B[0]) + 2, Math.min(A[1], B[1]) - top, Math.max(A[1], B[1]) - bot); g.restore();
      }
      for (const h of [bot + 1, (bot + top) / 2, top]) { lin(A[0], A[1] - h, B[0], B[1] - h, 4.6, tom(cor, k * 0.92)); lin(A[0], A[1] - h - 1.4, B[0], B[1] - h - 1.4, 1.1, tom(cor, k * 1.25, 0.7)); }
      lin(A[0], A[1] - bot, B[0], B[1] - top, 4.2, tom(cor, k * 0.82)); // mão-francesa
      for (const P of [A, B]) lin(P[0], P[1] - bot + 1, P[0], P[1] - top - 2, 4.4, tom(cor, k));
      g.fillStyle = '#2b2622'; g.fillRect(B[0] - 3, B[1] - (bot + top) / 2 - 2, 6, 3.5);
    }
    /** porteira: abrir (1) ou fechar (0); devolve se já chegou */
    function portao(cur, abrir) { cur.portao.alvo = abrir ? ABERTA : 0; return Math.abs(cur.portao.ang - cur.portao.alvo) < 0.01; }
    function atualizar(dt) { for (const cur of currais) { const p = cur.portao, d = p.alvo - p.ang; p.ang += Math.sign(d) * Math.min(Math.abs(d), dt * 1.9); } }
    /** onde o trabalhador para do lado de fora e do lado de dentro da porteira */
    function pontosPorteira(cur) {
      const P = cur.porteira, l = cur.l;
      return P.lado === 'oeste' ? { fora: [l.x - 40, P.pos + 12], dentro: [l.x + 36, P.pos + 8], meio: [l.x, P.pos] }
        : P.lado === 'leste' ? { fora: [l.x + l.w + 40, P.pos + 12], dentro: [l.x + l.w - 36, P.pos + 8], meio: [l.x + l.w, P.pos] }
        : P.lado === 'sul' ? { fora: [P.pos + 12, l.y + l.h + 44], dentro: [P.pos + 8, l.y + l.h - 28], meio: [P.pos, l.y + l.h] }
        : { fora: [P.pos + 12, l.y - 30], dentro: [P.pos + 8, l.y + 44], meio: [P.pos, l.y] };
    }
    /** chão onde o trabalhador pode andar dentro do curral (longe da cerca e dos equipamentos) */
    function andavelDentro(cur, x, y) {
      const l = cur.l;
      if (x < l.x + 16 || x > l.x + l.w - 16 || y < l.y + 22 || y > l.y + l.h - 10) return false;
      return cur.objetos.every(o => perto(o, x, y) > 12);
    }

    // ---------- chão de cada curral (pintado nos ladrilhos do mapa) ----------
    const dentro = (cur, x, y, m = 0) => x > cur.l.x - m && x < cur.l.x + cur.l.w + m && y > cur.l.y - m && y < cur.l.y + cur.l.h + m;
    const perto = (o, x, y) => { const [a, b, c, d] = o.pegada, dx = Math.max(a - x, 0, x - c), dy = Math.max(b - y, 0, y - d); return Math.hypot(dx, dy); };
    function borrao(g, x, y, rx, ry, cor, s) { // mancha de contorno irregular
      g.fillStyle = cor; g.beginPath();
      for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, f = 0.82 + 0.3 * ruido(Math.cos(a) * 1.7 + s, Math.sin(a) * 1.7 + s, 41); const px = x + Math.cos(a) * rx * f, py = y + Math.sin(a) * ry * f; k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.fill();
    }
    for (const cur of currais) { // detalhes sorteados uma vez
      const r = sorteio(cur.semente), l = LOTES[cur.id][3], d = (cur.detalhes = []); // sobre o lote cheio: servem para todos os níveis
      const n = cur.piso === 'pasto' ? 0 : Math.round((l.w * l.h) / 260);
      for (let i = 0; i < n; i++) d.push([l.x + r() * l.w, l.y + r() * l.h, r(), r(), r()]);
    }
    function pintarChao(g, x0, y0, x1, y1) {
      for (const cur of currais) {
        const l = cur.l, r = sorteio(cur.semente + 1);
        if (l.x + l.w + 80 < x0 || l.x - 80 > x1 || l.y + l.h + 80 < y0 || l.y - 80 > y1) continue;
        if (cur.piso === 'lama' || cur.piso === 'terreiro') {
          const base = cur.piso === 'lama' ? '#5f4a31' : '#8d7454';
          g.fillStyle = 'rgba(55,45,25,.5)'; g.fillRect(l.x - 6, l.y - 6, l.w + 12, l.h + 12);
          g.fillStyle = base; g.fillRect(l.x, l.y, l.w, l.h);
          for (const [x, y, a, b, c] of cur.detalhes) {
            if (!dentro(cur, x, y, -2)) continue;
            if (x < x0 - 20 || x > x1 + 20 || y < y0 - 20 || y > y1 + 20) continue;
            if (cur.piso === 'lama') { g.fillStyle = a < 0.5 ? 'rgba(40,28,15,.25)' : 'rgba(150,120,80,.18)'; g.beginPath(); g.ellipse(x, y, 3 + b * 9, 2 + c * 5, a * 3, 0, 7); g.fill(); }
            else if (a < 0.55) { g.fillStyle = b < 0.5 ? 'rgba(60,45,25,.22)' : 'rgba(190,160,115,.25)'; g.beginPath(); g.ellipse(x, y, 2 + b * 7, 1.5 + c * 4, a * 3, 0, 7); g.fill(); }
            else if (a < 0.975) { g.fillStyle = b < 0.6 ? '#e2c255' : '#d98d2b'; g.beginPath(); g.ellipse(x, y, 1.3, 1, b * 3, 0, 7); g.fill(); } // milho espalhado
            else { // pena caída: palheta clara com o cálamo
              g.fillStyle = b < 0.5 ? 'rgba(246,242,234,.85)' : 'rgba(150,80,45,.8)'; g.beginPath(); g.ellipse(x, y, 3.2, 1.2, c * 3, 0, 7); g.fill();
              g.strokeStyle = 'rgba(90,70,50,.5)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x - Math.cos(c * 3) * 4, y - Math.sin(c * 3) * 4); g.lineTo(x + Math.cos(c * 3) * 3, y + Math.sin(c * 3) * 3); g.stroke();
            }
          }
          if (cur.lama) { // poça de lama: borda molhada, lama, brilhos e pegadas
            const { cx, cy, rx, ry } = cur.lama;
            borrao(g, cx, cy, rx + 18, ry + 12, '#4c3925', 1);
            borrao(g, cx, cy, rx, ry, '#3a2a1b', 2);
            borrao(g, cx - rx * 0.15, cy + ry * 0.1, rx * 0.55, ry * 0.42, 'rgba(70,80,72,.55)', 3);
            g.strokeStyle = 'rgba(220,230,235,.22)'; g.lineWidth = 2;
            for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = 0.2 + r() * 0.6; g.beginPath(); g.ellipse(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 6 + r() * 12, 1.5 + r() * 2, 0, 3.4, 5.8); g.stroke(); }
            for (let i = 0; i < 26; i++) { // pegadas de casco fendido na beira da lama
              const a = r() * 6.28, d = 1.02 + r() * 0.22, px = cx + Math.cos(a) * rx * d, py = cy + Math.sin(a) * ry * d, rot = r() * 3;
              g.fillStyle = 'rgba(35,25,14,.3)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(px + Math.cos(rot) * s * 1.1, py + Math.sin(rot) * s * 1.1, 0.9, 1.5, rot, 0, 7); g.fill(); }
            }
          }
        }
        if (cur.piso === 'horta') { // terra da horta, corredores cobertos de palha, caminho de terra da porteira ao espantalho
          g.fillStyle = 'rgba(60,48,26,.5)'; g.fillRect(l.x - 4, l.y - 4, l.w + 8, l.h + 8);
          g.fillStyle = '#6f5a3c'; g.fillRect(l.x + 2, l.y + 2, l.w - 4, l.h - 4);
          for (let i = 0; i < l.w * l.h / 120; i++) { g.fillStyle = r() < 0.5 ? 'rgba(45,32,18,.25)' : 'rgba(160,130,90,.22)'; g.beginPath(); g.ellipse(l.x + r() * l.w, l.y + r() * l.h, 1 + r() * 3, 0.8 + r() * 2, r() * 3, 0, 7); g.fill(); }
          g.lineWidth = 0.9;
          for (let i = 0; i < l.w * l.h / 70; i++) { // palha (fora do caminho)
            const sx = l.x + 6 + r() * (l.w - 12), sy = l.y + 6 + r() * (l.h - 12);
            if (Math.abs(sy - cur.caminhoY) < 22 && sx < l.x + l.w - 44) continue;
            g.strokeStyle = r() < 0.5 ? 'rgba(214,186,110,.8)' : 'rgba(180,150,80,.75)'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 9, sy + (r() - 0.5) * 3); g.stroke();
          }
          g.lineCap = 'round';
          for (const [w, c] of [[50, 'rgba(60,50,30,.5)'], [40, '#7a6443'], [30, '#8f7350']]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(l.x - 6, cur.caminhoY); g.lineTo(l.x + l.w - 50, cur.caminhoY + 6); g.stroke(); }
          for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,45,25,.3)' : 'rgba(190,160,115,.3)'; g.beginPath(); g.ellipse(l.x + r() * (l.w - 50), cur.caminhoY - 12 + r() * 24, 1 + r() * 2, 0.8 + r() * 1.4, r() * 3, 0, 7); g.fill(); }
        }
        if (cur.piso === 'pomar') for (const o of cur.objetos) if (o.tipo === 'arvore') { // coroa de terra no pé, frutas caídas (embaixo da copa)
          const x = (o.pegada[0] + o.pegada[2]) / 2, y = o.base - 3;
          borrao(g, x, y, 44, 20, 'rgba(70,55,30,.45)', x); borrao(g, x, y, 34, 14, '#6e5a3c', y);
          const F = { laranja: '#f39c1f', maca: '#c8312a', manga: '#f2b33d', limao: '#d8de3a' }[o.especie];
          for (let i = 0; i < 6; i++) { g.fillStyle = F; g.beginPath(); g.arc(x - 40 + r() * 80, y - 8 + r() * 18, 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(x - 30.6 + r() * 60, y - 7 + r() * 14, 0.6, 0, 7); g.fill(); }
        }
        for (const o of cur.objetos) { // terra pisada em volta dos equipamentos (no pasto)
          const [a, b, c, d] = o.pegada;
          if (cur.piso === 'pasto') { borrao(g, (a + c) / 2, d + 4, (c - a) / 2 + 30, (d - b) / 2 + 26, 'rgba(95,78,50,.55)', a); borrao(g, (a + c) / 2, d + 2, (c - a) / 2 + 16, (d - b) / 2 + 14, '#7a6443', b); }
          if (o.tipo === 'casinha' && cur.piso !== 'pasto') { g.strokeStyle = 'rgba(214,184,100,.8)'; g.lineWidth = 1; for (let i = 0; i < 50; i++) { const sx = a + r() * (c - a), sy = d + r() * 26; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 10, sy + (r() - 0.5) * 3); g.stroke(); } }
        }
        if (cur.piso === 'pasto') { const { x, y } = cur.porteira; borrao(g, x, y, 54, 40, 'rgba(95,78,50,.5)', 9); borrao(g, x, y, 36, 26, '#7a6443', 8); }
      }
    }
    /** multiplicador de nascer do capim (1 = normal) */
    function capim(x, y) {
      for (const cur of currais) {
        if (!dentro(cur, x, y, 2)) continue;
        if (cur.piso === 'lama') return 0;
        if (cur.piso === 'terreiro') return ruido(x / 34, y / 34, 31) > 0.64 ? 0.3 : 0;
        if (cur.piso === 'horta') {
          const l = cur.l, borda = Math.min(x - l.x, l.x + l.w - x, y - l.y, l.y + l.h - y);
          return borda < 12 + ruido(x / 18, y / 18, 39) * 12 && !cur.objetos.some(o => perto(o, x, y) < 8) ? 0.5 : 0; // só um pouco junto da cerca
        }
        if (cur.piso === 'pomar') { for (const o of cur.objetos) if (perto(o, x, y) < (o.tipo === 'arvore' ? 26 : 4) + ruido(x / 14, y / 14, 41) * 8) return 0; return 1; }
        let m = Math.hypot(x - cur.porteira.x, y - cur.porteira.y) - 30;
        for (const o of cur.objetos) m = Math.min(m, perto(o, x, y) - 10);
        const n = ruido(x / 23, y / 23, 33) * 16;
        return m < n ? 0 : m < 50 ? 0.35 + 0.65 * (m - n) / (50 - n) : 1;
      }
      return 1;
    }
    /** pasto pastejado: mais baixo dentro dos currais de vaca e ovelha */
    function aparado(x, y) {
      let k = 1;
      for (const cur of currais) {
        if (dentro(cur, x, y, -2) && cur.piso === 'horta') return 0.3;
        if (dentro(cur, x, y, -2) && cur.piso === 'pomar') return 0.42 + 0.12 * ruido(x / 60, y / 60, 43);
        if (dentro(cur, x, y, -2)) return cur.piso === 'pasto' ? (cur.id === 'vacas' || cur.id === 'ovelhas' ? 0.22 : 0.32) + 0.12 * ruido(x / 60, y / 60, 35) : 0.38; // vacas: pasto bem rapado (aparecem as pernas)
        // por fora, o capim é roçado junto da cerca (a cerca aparece inteira)
        const l = cur.l, dx = Math.max(l.x - x, 0, x - l.x - l.w), dy = Math.max(l.y - y, 0, y - l.y - l.h), d = Math.hypot(dx, dy) + (ruido(x / 30, y / 30, 37) - 0.5) * 20;
        if (d < 70) k = Math.min(k, d < 20 ? 0.38 : 0.38 + 0.62 * (d - 20) / 50);
      }
      return k;
    }
    const bloqueia = (x, y) => currais.some(cur => dentro(cur, x, y, 14));

    // ---------- desenho: equipamentos assados, cercas vetoriais ----------
    function assar(q, so) {
      qAtual = q;
      for (const o of so ? so.objetos : objetos) {
        const [x0, y0, x1, y1] = o.caixa, c = document.createElement('canvas');
        c.width = Math.ceil((x1 - x0) * q); c.height = Math.ceil((y1 - y0) * q);
        const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q); g.lineCap = 'butt'; g.lineJoin = 'round';
        o.pintar(g, sorteio(Math.round(o.caixa[0] * 3 + o.caixa[1]))); o.cv = c;
      }
      for (const cur of so ? [so] : currais) for (const p of cur.pecas) { // vãos de cerca: também prontos em imagem (só a folha da porteira se mexe)
        const E = CERCAS[cur.cerca], m = E.poste * 1.5 + 6;
        p.caixa = [Math.min(p.a[0], p.b[0]) - m, Math.min(p.a[1], p.b[1]) - E.alt - 16, Math.max(p.a[0], p.b[0]) + m, Math.max(p.a[1], p.b[1]) + 6];
        const [x0, y0, x1, y1] = p.caixa, c = document.createElement('canvas');
        c.width = Math.ceil((x1 - x0) * q); c.height = Math.ceil((y1 - y0) * q);
        const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q);
        desenharPeca(g, p); p.cv = c;
      }
    }
    /** pedaços de cerca e equipamentos visíveis, prontos para entrar na ordem de profundidade da grama */
    function extras(ctx, cam, agora = 0) {
      const out = [], x0 = cam.x - 80, x1 = cam.x + cam.largura + 80, y0 = cam.y - 20, y1 = cam.y + cam.altura + 260;
      for (const o of objetos) {
        const [a, b, c] = o.caixa;
        if (c < x0 || a > x1 || o.base < y0 || b > y1) continue;
        if (o.balanca) { // árvore: a copa balança a partir do pé (o tronco fica parado no chão); muda nova cresce até o tamanho todo
          const k = Math.sin(agora * 1.1 + o.caixa[0] * 0.013) * 0.022 + Math.sin(agora * 2.3 + o.base * 0.02) * 0.006;
          const t = o.nasce ? Math.min(1, Math.max(0, (agora - o.nasce) / 2.6)) : 1, s = 0.1 + 0.9 * (1 - (1 - t) ** 3), cx = (o.pegada[0] + o.pegada[2]) / 2;
          if (t >= 1) o.nasce = 0;
          out.push({ y: o.base, desenhar: () => { ctx.save(); ctx.transform(1, 0, k, 1, -k * o.base, 0); if (s < 1) { ctx.translate(cx, o.base); ctx.scale(s, s); ctx.translate(-cx, -o.base); } ctx.drawImage(o.cv, o.caixa[0], o.caixa[1], o.caixa[2] - o.caixa[0], o.caixa[3] - o.caixa[1]); ctx.restore(); } });
          continue;
        }
        out.push({ y: o.base, desenhar: () => ctx.drawImage(o.cv, o.caixa[0], o.caixa[1], o.caixa[2] - o.caixa[0], o.caixa[3] - o.caixa[1]) });
      }
      for (const cur of currais) {
        const l = cur.l;
        if (l.x + l.w + 20 < x0 || l.x - 20 > x1 || l.y + l.h < y0 || l.y - 60 > y1) continue;
        for (const p of cur.pecas) {
          const yb = Math.max(p.a[1], p.b[1]);
          if (Math.max(p.a[0], p.b[0]) < x0 || Math.min(p.a[0], p.b[0]) > x1 || yb < y0 || yb - 60 > y1) continue;
          out.push({ y: yb + 0.5, desenhar: () => (p.cv ? ctx.drawImage(p.cv, p.caixa[0], p.caixa[1], p.caixa[2] - p.caixa[0], p.caixa[3] - p.caixa[1]) : desenharPeca(ctx, p)) });
        }
        const { A, B } = folha(cur);
        out.push({ y: Math.max(A[1], B[1]) + 0.8, desenhar: () => desenharPorteira(ctx, cur) });
      }
      return out;
    }
    function mini(g) {
      for (const cur of currais) {
        const l = cur.l;
        g.fillStyle = { lama: '#6a5236', terreiro: '#9a805e', horta: '#7a5f3f', pomar: '#5f8a35' }[cur.piso] || '#6f9038';
        g.fillRect(l.x, l.y, l.w, l.h);
        g.strokeStyle = '#f0e6cf'; g.lineWidth = 14; g.strokeRect(l.x, l.y, l.w, l.h);
        for (const o of cur.objetos) { const [a, b, c, d] = o.pegada; g.fillStyle = '#8d7a62'; g.fillRect(a, b, c - a, d - b); }
      }
    }

    /** canteiro, árvore, espantalho ou cesto sob o ponto (para mostrar o nome) */
    function objetoEm(x, y) {
      let melhor = null, area = 1e12;
      for (const o of objetos) {
        if (!o.rotulo) continue;
        const [a, b, c] = o.caixa;
        if (x > a + 14 && x < c - 14 && y > b + 10 && y < o.base + 4 && (c - a) * (o.base - b) < area) { melhor = o; area = (c - a) * (o.base - b); }
      }
      return melhor;
    }
    /** muda o nível de um curral (ou da horta, ou do pomar): devolve [lote antes, lote depois]; sem n, devolve o nível.
     *  Árvores novas do pomar nascem como mudas no instante "agora". */
    function nivel(id, n, agora = 0) {
      const cur = currais.find(c => c.id === id);
      if (n === undefined) return cur.nivel;
      const antes = { ...cur.l }, tinha = new Set(cur.objetos.filter(o => o.tipo === 'arvore').map(o => o.pegada[0] + ',' + o.base));
      cur.nivel = n; Object.assign(cur.l, LOTES[id][n]);
      montarObjetos(cur); montarCerca(cur); cur.portao.ang = cur.portao.alvo = 0;
      for (const o of cur.objetos) if (o.tipo === 'arvore' && !tinha.has(o.pegada[0] + ',' + o.base)) o.nasce = agora;
      objetos.length = 0; for (const c of currais) objetos.push(...c.objetos);
      if (qAtual) assar(qAtual, cur);
      return [antes, { ...cur.l }];
    }
    const nivelPomar = (n, agora) => nivel('pomar', n, agora);
    return { currais, CERCAS, LOTES, nivel, nivelPomar, objetoEm, capim, aparado, bloqueia, pintarChao, assar, extras, mini, dentro, perto, portao, atualizar, pontosPorteira, andavelDentro };
  }

  raiz.Currais = { criar };
})(typeof self !== 'undefined' ? self : globalThis);
