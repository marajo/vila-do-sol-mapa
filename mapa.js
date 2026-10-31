// Protótipo do mapa novo da Vila do Sol: chão, rio com correnteza, ponte rural, estradas de terra, capim realista,
// câmera com zoom, mapa pequeno, construções, currais, horta, pomar, animais e a equipe trabalhando.
(function () {
  'use strict';
  const L = MapaLayout, { W, H, rio, ponte: P, estradas, noPatio, patio, lotes, estrada, naPonte } = L;
  const { Grama } = GramaRealista;

  // ---------- sorteio e ruído ----------
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
  function sorteio(semente) { let s = semente % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  // ---------- casa e celeiro (nível 1 a 3) ----------
  const loteDe = id => lotes.find(l => l.id === id);
  const jogo = Jogo.criar(); // moedas, XP, níveis e armazém (salvo à parte do jogo atual)
  const predios = [
    { id: 'casa', nome: 'Casa', nivel: jogo.nivel('casa'), espec: n => Construcoes.especCasa(n, loteDe('casa')) },
    { id: 'celeiro', nome: 'Celeiro', nivel: jogo.nivel('celeiro'), espec: n => Construcoes.especCeleiro(n, loteDe('celeiro')) },
  ];
  for (const p of predios) p.e = p.espec(p.nivel);
  // ---------- currais e animais ----------
  const C = Currais.criar(L, Construcoes.util), bichos = Animais.criar(C);
  bichos.definirQuantos(id => jogo.estado.animais[id] || 0); // quantos bichos o jogador comprou
  // decorações compradas na loja: { d (catálogo), x, y, cv }
  const DEC = Decor.criar(Construcoes.util), decoracoes = [];
  const decorEm = (x, y, folga = 0) => decoracoes.some(o => { const [a, b, c, d] = DEC.pegada(o.d, o.x, o.y); return x > a - folga && x < c + folga && y > b - folga && y < d + folga; });
  /** distância até a construção mais perto (negativa dentro) */
  function noPredio(x, y) {
    let m = 999;
    for (const { e } of predios) for (const [x0, y0, x1, y1] of e.pegadas) {
      const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
      m = Math.min(m, dx || dy ? Math.hypot(dx, dy) : -Math.min(x - x0, x1 - x, y - y0, y1 - y));
    }
    return m;
  }
  /** calçada de pedras da casa e rampa de terra do celeiro, da porta até o pátio */
  function naEntrada(x, y) {
    for (const { e } of predios) {
      if (e.vazio) continue;
      const [px, py] = e.porta, meia = e.tipo === 'casa' ? 20 : 34 + (y - py) * 0.5;
      if (y > py - 12 && y < patio.y0 + 40 && Math.abs(x - px) < meia) return true;
    }
    return false;
  }

  // ---------- onde o capim nasce ----------
  function podeNascer(x, y) {
    const nb = ruido(x / 31, y / 31, 3);
    const m = rio.margem(x, y);
    if (m < 16 + nb * 16) return 0;                      // água e barranco de terra da beira
    if (naPonte(x, y, 12)) return 0;
    const pr = noPredio(x, y), kc = C.capim(x, y);
    if (pr < 10 + nb * 8 || naEntrada(x, y) || kc <= 0) return 0;
    let k = kc;
    if (m < 90) k = Math.min(k, 0.25 + 0.75 * (m - 16 - nb * 16) / (74 - nb * 16));
    const e = estrada.borda(x, y) + (ruido(x / 90, y / 90, 7) - 0.5) * 14;
    if (e < 28) {
      if (e < 0) {
        // estrada de duas trilhas: tufos baixos e falhados no meio, entre os rastros das rodas
        if (estrada.duasTrilhas(x, y) && estrada.meio(x, y) < 0.16 && ruido(x / 9, y / 9, 5) > 0.52) return 0.06;
        if (e > -10 && nb * 12 > -e) return 0.28;            // capim invadindo a borda
        return 0;
      }
      k = Math.min(k, 0.28 + 0.72 * e / 28);
    }
    const pt = noPatio(x, y);
    if (pt < 26) { if (pt < -6 + nb * 12) return 0; k = Math.min(k, 0.25 + 0.75 * Math.max(0, pt) / 26); }
    return k;
  }
  /** gramado aparado em volta da casa e do celeiro (bem baixo junto da parede, vai subindo até o pasto) */
  function aparado(x, y) {
    const pr = noPredio(x, y) + (ruido(x / 40, y / 40, 23) - 0.5) * 24;
    return (pr < 40 ? 0.18 : pr < 115 ? 0.18 + 0.82 * (pr - 40) / 75 : 1) * C.aparado(x, y);
  }
  function taboa(x, y) {
    const m = rio.margem(x, y);
    if (m < -16 || m > 18 || naPonte(x, y, 60) || estrada.borda(x, y) < 16) return 0;
    const g = ruido(x / 70, y / 70, 9);
    return g < 0.58 ? 0 : Math.min(1, (g - 0.58) * 5) * (1 - Math.abs(m - 1) / 18);
  }

  const DPR0 = Math.min(2, devicePixelRatio || 1); let dpr = DPR0; // acima de 2 o capim pesa no celular sem diferença visível
  // tom e altura do capim: ondas suaves (como na Selva) misturadas com ruído largo, para não aparecer listra de longe
  const campo = (x, y) => Math.max(0, Math.min(1, 0.5 + 0.17 * Math.sin(x / 97 + Math.sin(y / 61)) + 0.13 * Math.sin(y / 73 + x / 151) + 0.09 * Math.sin((x + y) / 37)
    + 0.6 * (ruido(x / 240, y / 240, 17) - 0.5) + 0.3 * (ruido(x / 85, y / 85, 19) - 0.5)));
  const grama = new Grama({ largura: W, altura: H, podeNascer, taboa, campo, aparado, moitas: 55, semente: 2026, orcamentoMs: 120 });

  // ---------- texturas (padrões) ----------
  function textura(lado, pintar) { const c = document.createElement('canvas'); c.width = c.height = lado; pintar(c.getContext('2d'), lado); return c; }
  const texSolo = textura(256, (g, n) => {
    const r = sorteio(11);
    g.fillStyle = '#36401e'; g.fillRect(0, 0, n, n);
    const cores = ['#2b3417', '#44502a', '#4a4326', '#30301a', '#3c4a22'];
    for (let i = 0; i < 900; i++) {
      const x = r() * n, y = r() * n, rx = 1 + r() * 4, ry = rx * (0.4 + r() * 0.6);
      g.fillStyle = cores[i % cores.length]; g.globalAlpha = 0.35 + r() * 0.4;
      for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) { g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, r() * 3, 0, 7); g.fill(); }
    }
  });
  // brilho do céu nas ondinhas: arcos curtos atravessados à corrente (a água desce para o sul)
  const ondinhas = (cor, n, semente) => textura(256, (g, lado) => {
    const r = sorteio(semente);
    g.strokeStyle = cor; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = r() * lado, y = r() * lado, w = 7 + r() * 22, c = (r() - 0.5) * 7;
      g.lineWidth = 0.8 + r() * 1.6;
      for (const dx of [-lado, 0, lado]) for (const dy of [-lado, 0, lado]) {
        g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + w / 2, y + dy + c, x + dx + w, y + dy); g.stroke();
      }
    }
  });
  const texBrilho = ondinhas('rgba(235,242,228,1)', 170, 21), texSombra = ondinhas('rgba(6,26,28,1)', 120, 33);

  // ---------- detalhes fixos sorteados uma vez ----------
  const rs = sorteio(77);
  const PEDRISCOS = ['#b39c78', '#7d664a', '#c2ad8a', '#6a5640', '#a48b66'];
  const pedriscos = []; // estradas e pátio
  for (const e of estradas) {
    const Lh = e.linha;
    for (let i = 1; i < Lh.length; i++) {
      const [ax, ay] = Lh[i - 1], [bx, by] = Lh[i], l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l;
      for (let k = 0; k < 2; k++) {
        const t = rs(), o = (rs() - 0.5) * e.larg * 0.92;
        pedriscos.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o, 0.9 + rs() * 2.4, PEDRISCOS[Math.floor(rs() * 5)], rs() * 3]);
      }
    }
  }
  for (let i = 0; i < 900; i++) {
    const x = patio.x0 + rs() * (patio.x1 - patio.x0), y = patio.y0 + rs() * (patio.y1 - patio.y0);
    if (noPatio(x, y) < -8) pedriscos.push([x, y, 0.9 + rs() * 2.6, PEDRISCOS[Math.floor(rs() * 5)], rs() * 3]);
  }
  const FUNDO = ['#7d7258', '#5f5843', '#8b8468', '#4e4a39', '#6e6650'];
  const fundo = [], seixos = []; // pedrinhas no leito raso (vistas por baixo d'água) e na margem seca
  for (let y = -120; y < H + 120; y += 4) for (const s of [-1, 1]) {
    const hw = rio.hwLado(y, s);
    if (rs() < 0.8) { const [x, yy] = rio.ponto(y, s * hw * (0.6 + rs() * 0.4)); fundo.push([x + (rs() - 0.5) * 6, yy, 1.5 + rs() * 4.5, FUNDO[Math.floor(rs() * 5)], rs() * 3]); }
    if (rs() < 0.45) { const [x, yy] = rio.ponto(y, s * (hw + 2 + rs() * 30)); seixos.push([x, yy, 1 + rs() * 3, PEDRISCOS[Math.floor(rs() * 5)], rs() * 3]); }
  }
  // pedras grandes: algumas no rio (a água faz espuma nelas) e algumas na margem
  const pedras = [];
  for (let k = 0; k < 16; k++) {
    const y = 90 + k * 175 + rs() * 90;
    if (Math.abs(y - P.y) < 200 || y > H - 40) continue;
    const s = rs() < 0.5 ? -1 : 1, naAgua = rs() < 0.55, hw = rio.hwLado(y, s);
    const o = s * (naAgua ? hw * (0.5 + rs() * 0.32) : hw + 12 + rs() * 22);
    const [x, yy] = rio.ponto(y, o);
    pedras.push({ x, y: yy, r: naAgua ? 8 + rs() * 10 : 11 + rs() * 15, naAgua, sem: Math.floor(rs() * 1e6) });
  }
  // estacas da ponte dentro d'água
  const estacas = [];
  { const n = Math.max(2, Math.round((P.aguaX1 - P.aguaX0 - 40) / 64) + 1);
    for (let i = 0; i < n; i++) estacas.push(P.aguaX0 + 20 + (P.aguaX1 - P.aguaX0 - 40) * (n === 1 ? 0.5 : i / (n - 1))); }

  // ---------- desenhos de apoio ----------
  function pedra(g, x, y, r, semente, naAgua) {
    const s = sorteio(semente), pts = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, k = 0.82 + s() * 0.26; pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.68]); }
    const forma = (dx, dy, e) => { g.beginPath(); pts.forEach(([px, py], i) => { const X = x + (px - x) * e + dx, Y = y + (py - y) * e + dy; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
    g.fillStyle = naAgua ? 'rgba(6,22,22,.35)' : 'rgba(18,22,10,.38)'; forma(r * 0.32, r * 0.3, 1.05); g.fill();
    g.fillStyle = '#56544a'; forma(0, 0, 1); g.fill();
    g.fillStyle = '#76736a'; forma(-r * 0.12, -r * 0.16, 0.78); g.fill();
    g.fillStyle = '#99958a'; forma(-r * 0.28, -r * 0.3, 0.36); g.fill();
    g.strokeStyle = 'rgba(28,28,22,.45)'; g.lineWidth = 1.2; forma(0, 0, 1); g.stroke();
    if (naAgua) { g.strokeStyle = 'rgba(30,48,40,.55)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.95, r * 0.36, 0, 0.1, Math.PI - 0.1); g.stroke(); }
  }
  function pontos(g, lista, x0, y0, x1, y1, alfa) {
    for (const [x, y, r, cor, a] of lista) {
      if (x < x0 - 6 || x > x1 + 6 || y < y0 - 6 || y > y1 + 6) continue;
      g.globalAlpha = alfa; g.fillStyle = cor; g.beginPath(); g.ellipse(x, y, r, r * 0.7, a, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }
  function tracar(g, linha) { g.beginPath(); linha.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); }
  function poligono(g, pts) { tracar(g, pts); g.closePath(); }
  function deslocada(linha, o) {
    return linha.map(([x, y], i) => {
      const [ax, ay] = linha[Math.max(0, i - 1)], [bx, by] = linha[Math.min(linha.length - 1, i + 1)], l = Math.hypot(bx - ax, by - ay) || 1;
      return [x - ((by - ay) / l) * o, y + ((bx - ax) / l) * o];
    });
  }
  for (const e of estradas) if (e.duasTrilhas) e.trilhas = [deslocada(e.linha, -e.larg * 0.29), deslocada(e.linha, e.larg * 0.29)];
  function retArred(g, x0, y0, x1, y1, r) { g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, Math.max(0, r)); }
  /** faixa do rio: de off(y, -1) a oeste até off(y, 1) a leste da linha do meio */
  function faixaRio(g, ya, yz, off) {
    g.beginPath();
    for (let y = ya; y <= yz; y += 6) { const [x, yy] = rio.ponto(y, -off(y, -1)); y === ya ? g.moveTo(x, yy) : g.lineTo(x, yy); }
    for (let y = yz; y >= ya; y -= 6) { const [x, yy] = rio.ponto(y, off(y, 1)); g.lineTo(x, yy); }
    g.closePath();
  }
  function beira(g, ya, yz, lado, off) {
    g.beginPath();
    for (let y = ya; y <= yz; y += 6) { const [x, yy] = rio.ponto(y, lado * off(y, lado)); y === ya ? g.moveTo(x, yy) : g.lineTo(x, yy); }
  }
  const tremor = (y, s) => (ruido(y / 46, s, 13) - 0.5) * 10;

  // ---------- chão em ladrilhos de 512 px (pintados quando aparecem) ----------
  const T = 512, ladrilhos = new Map();
  const CAMADAS_ESTRADA = [[34, 0, 'rgba(52,48,26,0.5)'], [12, 0, '#6b5a3b'], [0, 0, '#8f7350'], [0, -0.18, '#9b7d57']];
  const AGUA = [[1.0, '#62603f'], [0.95, '#58603f'], [0.87, '#4c5d42'], [0.77, '#405a45'], [0.65, '#365447'], [0.52, '#2f4d45'], [0.38, '#2a4742'], [0.24, '#264240']];
  const BARRANCO = [[50, 'rgba(70,62,36,0.5)'], [38, '#6a5c3d'], [27, '#806d4d'], [17, '#8a7654'], [9, '#6a5739'], [3, '#4b3e2c']];
  // manchas grandes na água: poços mais escuros e partes rasas mais claras
  const manchas = [];
  for (let y = -100; y < H + 100; y += 70) manchas.push([y + rs() * 40, (rs() - 0.5) * 0.9, 30 + rs() * 50, 60 + rs() * 90, rs() < 0.6]);

  /** chão em volta da construção: terra batida, calçada de pedras (casa) ou rampa de terra (celeiro) até o pátio */
  function chaoDoPredio(g, e, x0, y0, x1, y1) {
    if (e.vazio) return;
    const [a, b, c, d] = e.pegada, [px, py] = e.porta;
    if (c + 60 < x0 || a - 60 > x1 || d + 120 < y0 || b - 60 > y1) return;
    const casa = e.tipo === 'casa';
    for (const [k, cor] of casa ? [[12, 'rgba(56,48,28,.45)'], [7, '#9d9380'], [4, '#bdb39e']] : [[14, 'rgba(56,48,28,.5)'], [7, '#6b5a3b']])
      for (const [p0, p1, p2, p3] of e.pegadas) { g.fillStyle = cor; retArred(g, p0 - k, p1 - k, p2 + k, p3 + k, k + 4); g.fill(); } // calçada de cimento / terra batida
    const fim = patio.y0 + 30, r = sorteio(e.semente * 7);
    if (e.tipo === 'casa') {
      for (let y = py - 4, i = 0; y < fim; y += 19, i++) { // lajes irregulares, alternando de lado
        const x = px + (i % 2 ? 5 : -5) + (r() - 0.5) * 4, rx = 13 + r() * 4, ry = 7.5 + r() * 2;
        g.fillStyle = 'rgba(40,32,18,.45)'; g.beginPath(); g.ellipse(x + 1.5, y + 2, rx, ry, (r() - 0.5) * 0.4, 0, 7); g.fill();
        g.fillStyle = degradeLaje(g, x, y, rx); g.beginPath(); g.ellipse(x, y, rx, ry, (r() - 0.5) * 0.4, 0, 7); g.fill();
      }
    } else {
      const meia = y => 34 + (y - py) * 0.5;
      for (const [k, cor] of [[1.25, 'rgba(60,50,30,.5)'], [1.08, '#6b5a3b'], [1, '#8f7350'], [0.7, '#9b7d57']]) {
        g.fillStyle = cor; caminhoRampa(g, px, py - 10, fim, y => meia(y) * k); g.fill();
      }
      for (const s of [-1, 1]) { // marcas das rodas da carroça
        g.strokeStyle = 'rgba(110,84,56,.6)'; g.lineWidth = 7; g.beginPath(); g.moveTo(px + s * 20, py); g.lineTo(px + s * 30, fim); g.stroke();
      }
    }
  }
  function degradeLaje(g, x, y, rx) {
    const d = g.createLinearGradient(x - rx, y - rx, x + rx, y + rx);
    d.addColorStop(0, '#cbc3b0'); d.addColorStop(0.6, '#a9a18e'); d.addColorStop(1, '#878070'); return d;
  }
  function caminhoRampa(g, px, ya, yz, meia) {
    g.beginPath(); g.moveTo(px - meia(ya), ya); g.lineTo(px + meia(ya), ya); g.lineTo(px + meia(yz), yz); g.lineTo(px - meia(yz), yz); g.closePath();
  }

  function pintarLadrilho(lad) {
    const q = lad.cq, x0 = lad.tx * T, y0 = lad.ty * T, x1 = x0 + T, y1 = y0 + T;
    const g = lad.cv.getContext('2d');
    g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q);
    g.fillStyle = g.createPattern(texSolo, 'repeat'); g.fillRect(x0, y0, T, T);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // estradas: cada camada em todas as estradas, para os cruzamentos se fundirem
    const perto = estradas.filter(e => e.caixa[0] < x1 && e.caixa[2] > x0 && e.caixa[1] < y1 && e.caixa[3] > y0);
    const pPerto = patio.x0 - 60 < x1 && patio.x1 + 60 > x0 && patio.y0 - 60 < y1 && patio.y1 + 60 > y0;
    for (const [extra, fator, cor] of CAMADAS_ESTRADA) {
      g.strokeStyle = cor; g.fillStyle = cor;
      for (const e of perto) { g.lineWidth = e.larg * (1 + fator) + extra; tracar(g, e.linha); g.stroke(); }
      if (pPerto) { poligono(g, patio.contorno(extra / 2 + fator * 70)); g.fill(); }
    }
    for (const e of perto) {
      if (e.trilhas) {
        g.globalAlpha = 0.5; g.strokeStyle = '#6d6b3e'; g.lineWidth = e.larg * 0.17; tracar(g, e.linha); g.stroke(); g.globalAlpha = 1;
        for (const t of e.trilhas) {
          g.strokeStyle = '#7a5f41'; g.lineWidth = e.larg * 0.19; tracar(g, t); g.stroke();
          g.strokeStyle = '#86694a'; g.lineWidth = e.larg * 0.09; tracar(g, t); g.stroke();
        }
      } else { g.globalAlpha = 0.55; g.strokeStyle = '#a88b63'; g.lineWidth = e.larg * 0.45; tracar(g, e.linha); g.stroke(); g.globalAlpha = 1; }
    }
    if (pPerto) { g.globalAlpha = 0.5; g.fillStyle = '#a5875f'; poligono(g, patio.contorno(-60)); g.fill(); g.globalAlpha = 1; }
    pontos(g, pedriscos, x0, y0, x1, y1, 0.8);
    for (const { e } of predios) chaoDoPredio(g, e, x0, y0, x1, y1);
    C.pintarChao(g, x0, y0, x1, y1);

    // rio (só se passa por aqui)
    const ya = Math.max(-200, y0 - 320), yz = Math.min(H + 200, y1 + 320);
    let passa = false;
    for (let y = ya; y <= yz; y += 40) { const cx = rio.rx(y), m = rio.hw(y) * 1.8 + 60; if (cx + m > x0 && cx - m < x1) { passa = true; break; } }
    if (passa) {
      // cabeceiras da ponte: terra batida
      g.fillStyle = '#6b5a3b';
      retArred(g, P.x0 - 24, P.y - P.meia - 16, P.aguaX0 + 10, P.y + P.meia + 18, 14); g.fill();
      retArred(g, P.aguaX1 - 10, P.y - P.meia - 16, P.x1 + 24, P.y + P.meia + 18, 14); g.fill();
      for (const [o, cor] of BARRANCO) { g.fillStyle = cor; faixaRio(g, ya, yz, (y, s) => rio.hwLado(y, s) + o + tremor(y, o + s * 5)); g.fill(); }
      pontos(g, seixos, x0, y0, x1, y1, 0.85);
      for (const [f, cor] of AGUA) { g.fillStyle = cor; faixaRio(g, ya, yz, (y, s) => rio.hwLado(y, s) * f); g.fill(); }
      g.save(); faixaRio(g, ya, yz, (y, s) => rio.hwLado(y, s)); g.clip();
      for (const [my, t, rx, ry, escura] of manchas) {
        if (my < y0 - 200 || my > y1 + 200) continue;
        const [mx, myy] = rio.ponto(my, t * rio.hw(my));
        g.fillStyle = escura ? 'rgba(10,26,24,.13)' : 'rgba(130,140,95,.06)';
        g.beginPath(); g.ellipse(mx, myy, rx, ry, -Math.atan(rio.inc(my)), 0, 7); g.fill();
      }
      g.restore();
      pontos(g, fundo, x0, y0, x1, y1, 0.22);
      // sombra do barranco oeste na água (sol a noroeste) e brilho fino na linha d'água
      g.strokeStyle = 'rgba(10,24,22,.25)'; g.lineWidth = 16; beira(g, ya, yz, -1, (y, s) => rio.hwLado(y, s) - 8); g.stroke();
      g.strokeStyle = 'rgba(10,24,22,.2)'; g.lineWidth = 6; beira(g, ya, yz, -1, (y, s) => rio.hwLado(y, s) - 3); g.stroke();
      g.strokeStyle = 'rgba(210,215,180,.22)'; g.lineWidth = 1.8; beira(g, ya, yz, 1, (y, s) => rio.hwLado(y, s) - 2); g.stroke();
      g.strokeStyle = 'rgba(210,215,180,.14)'; g.lineWidth = 1.4; beira(g, ya, yz, -1, (y, s) => rio.hwLado(y, s) - 1); g.stroke();
      for (const p of pedras) if (p.x > x0 - 40 && p.x < x1 + 40 && p.y > y0 - 40 && p.y < y1 + 40) pedra(g, p.x, p.y, p.r, p.sem, p.naAgua);
      // sombra da ponte na água e pedras de arrimo nas cabeceiras
      g.fillStyle = 'rgba(4,16,16,.14)'; g.fillRect(P.aguaX0 - 10, P.y - P.meia + 12, P.aguaX1 - P.aguaX0 + 20, P.meia * 2 + 30);
      g.fillStyle = 'rgba(4,16,16,.22)'; g.fillRect(P.aguaX0 - 4, P.y - P.meia + 18, P.aguaX1 - P.aguaX0 + 8, P.meia * 2 + 20);
      const ra = sorteio(5);
      for (const bx of [P.aguaX0, P.aguaX1]) for (let y = P.y - P.meia - 22; y <= P.y + P.meia + 26; y += 11) pedra(g, bx + (ra() - 0.5) * 12, y, 6 + ra() * 5, Math.floor(ra() * 1e6), true);
    }
  }
  function ladrilho(tx, ty, q) {
    const k = tx + ',' + ty;
    let lad = ladrilhos.get(k);
    if (lad && lad.cq === q) return lad;
    const novo = { tx, ty, cq: q, cv: document.createElement('canvas'), visto: 0 };
    novo.cv.width = novo.cv.height = Math.ceil(T * q);
    pintarLadrilho(novo);
    ladrilhos.set(k, novo);
    return novo;
  }

  // ---------- ponte de madeira (duas camadas: tabuleiro + guarda-corpo norte; guarda-corpo sul na frente) ----------
  const PQ = 2.5, PX0 = P.x0 - 8, PY0 = P.y - P.meia - 44, PW = P.x1 - P.x0 + 16, PH = P.meia * 2 + 60;
  function telaPonte(pintar) {
    const c = document.createElement('canvas'); c.width = Math.ceil(PW * PQ); c.height = Math.ceil(PH * PQ);
    const g = c.getContext('2d'); g.setTransform(PQ, 0, 0, PQ, -PX0 * PQ, -PY0 * PQ); g.lineCap = 'round'; pintar(g); return c;
  }
  function tora(g, xa, ya, xb, yb, larg) {
    g.strokeStyle = '#3a2a1c'; g.lineWidth = larg + 2; g.beginPath(); g.moveTo(xa, ya + 1); g.lineTo(xb, yb + 1); g.stroke();
    g.strokeStyle = '#5c4430'; g.lineWidth = larg; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
    g.strokeStyle = '#8a6a4a'; g.lineWidth = Math.max(1, larg * 0.3); g.beginPath(); g.moveTo(xa, ya - larg * 0.22); g.lineTo(xb, yb - larg * 0.22); g.stroke();
  }
  function poste(g, x, yBase, alt, larg) {
    g.fillStyle = '#3a2a1c'; g.fillRect(x - larg / 2 - 1, yBase - alt - 1, larg + 2, alt + 2);
    g.fillStyle = '#5a4330'; g.fillRect(x - larg / 2, yBase - alt, larg, alt);
    g.fillStyle = '#7f6246'; g.fillRect(x - larg / 2, yBase - alt, larg * 0.32, alt);
    g.fillStyle = '#6b513a'; g.beginPath(); g.ellipse(x, yBase - alt, larg / 2, larg * 0.28, 0, 0, 7); g.fill();
  }
  const posX = []; { const n = Math.round((P.x1 - P.x0 - 20) / 70); for (let i = 0; i <= n; i++) posX.push(P.x0 + 10 + (P.x1 - P.x0 - 20) * i / n); }
  function guardaCorpo(g, yBase, sombra) {
    if (sombra) { g.fillStyle = 'rgba(20,14,8,.25)'; g.fillRect(P.x0 + 8, yBase + 2, P.x1 - P.x0 - 16, 6); }
    for (let i = 0; i < posX.length - 1; i++) { // mão-francesa em cada vão
      const a = posX[i], b = posX[i + 1], ida = i % 2 === 0;
      tora(g, ida ? a + 4 : b - 4, yBase - 2, ida ? b - 6 : a + 6, yBase - 24, 3.5);
    }
    posX.forEach((x, i) => poste(g, x, yBase + 1, i === 0 || i === posX.length - 1 ? 36 : 31, i === 0 || i === posX.length - 1 ? 10 : 8));
    tora(g, P.x0 + 6, yBase - 26, P.x1 - 6, yBase - 26, 6.5);
  }
  const ponteTabuleiro = telaPonte(g => {
    const yN = P.y - P.meia, yS = P.y + P.meia, r = sorteio(808);
    // longarinas embaixo (face sul do tabuleiro) e fundo escuro das frestas
    g.fillStyle = '#2e2318'; g.fillRect(P.x0 + 2, yS - 2, P.x1 - P.x0 - 4, 12);
    g.fillStyle = '#4a3826'; g.fillRect(P.x0 + 4, yS, P.x1 - P.x0 - 8, 7);
    g.fillStyle = '#5d4630'; g.fillRect(P.x0 + 4, yS, P.x1 - P.x0 - 8, 2);
    g.fillStyle = '#1f1912'; g.fillRect(P.x0, yN - 1, P.x1 - P.x0, yS - yN + 2);
    const CORES = ['#8a7356', '#7b6449', '#96805f', '#6f5a41', '#8f8574', '#83694c'];
    for (let x = P.x0; x < P.x1 - 4;) {
      const w = Math.min(P.x1 - x, 11 + r() * 5), j1 = (r() - 0.5) * 3, j2 = (r() - 0.5) * 3, cor = CORES[Math.floor(r() * CORES.length)];
      g.fillStyle = cor; g.fillRect(x, yN + j1, w - 1.7, yS - yN - j1 + j2);
      g.globalAlpha = 0.28; g.fillStyle = '#3e3020';
      for (let k = 0; k < 3; k++) g.fillRect(x + 1.5 + r() * (w - 5), yN + 4, 0.8, yS - yN - 8);
      g.fillStyle = '#d2c3a2'; g.globalAlpha = 0.18; g.fillRect(x + 0.6, yN + j1, 1.3, yS - yN - j1 + j2);
      g.globalAlpha = 1; g.fillStyle = '#2a241c';
      for (const yy of [yN + 9, P.y, yS - 9]) { g.beginPath(); g.arc(x + w / 2 - 0.8, yy, 0.9, 0, 7); g.fill(); }
      x += w;
    }
    // sombra do guarda-corpo norte caindo sobre as tábuas
    g.fillStyle = 'rgba(25,16,8,.28)'; g.fillRect(P.x0 + 6, yN + 2, P.x1 - P.x0 - 12, 7);
    guardaCorpo(g, yN + 3, false);
  });
  const ponteFrente = telaPonte(g => guardaCorpo(g, P.y + P.meia + 1, false));
  const extraPonte = [
    { y: P.y - P.meia + 2, desenhar: () => ctx.drawImage(ponteTabuleiro, PX0, PY0, PW, PH) },
    { y: P.y + P.meia + 9, desenhar: () => ctx.drawImage(ponteFrente, PX0, PY0, PW, PH) },
  ];

  // ---------- água que corre ----------
  const correnteza = [], brilhos = [], espuma = [];
  function novaGota(ya, yz, comecando) {
    const claro = Math.random() < 0.55;
    return { y: ya + Math.random() * (yz - ya), t: (Math.random() * 2 - 1) * 0.92, vida: comecando ? Math.random() * 3 : 0, dura: 1.8 + Math.random() * 2.8,
      len: claro ? 8 + Math.random() * 12 : 30 + Math.random() * 40, w: claro ? 0.8 + Math.random() * 0.7 : 2.5 + Math.random() * 2.5, claro,
      a: claro ? 0.04 + Math.random() * 0.06 : 0.05 + Math.random() * 0.07 };
  }
  function naCorrente(y, t) { return rio.ponto(y, t * rio.hwLado(y, t < 0 ? -1 : 1)); }
  function desenharAgua(cam, agora, dt) {
    const ya = cam.y - 140, yz = cam.y + cam.altura + 140;
    let bx0 = 1e9, bx1 = -1e9;
    for (let y = ya; y <= yz; y += 24) { const c = rio.rx(y), m = rio.hw(y) * 1.6; bx0 = Math.min(bx0, c - m); bx1 = Math.max(bx1, c + m); }
    if (bx1 < cam.x || bx0 > cam.x + cam.largura) { correnteza.length = 0; return; }
    ctx.save();
    faixaRio(ctx, ya, yz, (y, s) => rio.hwLado(y, s) - 1); ctx.clip();
    // ondinhas que descem com a água (duas velocidades = profundidade)
    const pB = ctx.createPattern(texBrilho, 'repeat'), pS = ctx.createPattern(texSombra, 'repeat');
    pS.setTransform(new DOMMatrix().translate(11, (agora * 10) % 256).scale(1.3));
    ctx.globalAlpha = 0.1; ctx.fillStyle = pS; ctx.fillRect(bx0, ya, bx1 - bx0, yz - ya);
    pB.setTransform(new DOMMatrix().translate(0, (agora * 17) % 256));
    ctx.globalAlpha = 0.085; ctx.fillStyle = pB; ctx.fillRect(bx0, ya, bx1 - bx0, yz - ya);
    pB.setTransform(new DOMMatrix().translate(83, (agora * 27) % 384).scale(1.5));
    ctx.globalAlpha = 0.06; ctx.fillRect(bx0, ya, bx1 - bx0, yz - ya);
    ctx.globalAlpha = 1;
    // fios da correnteza: mais rápidos no meio, lentos na beira, seguindo a curva do rio
    const alvo = Math.min(900, Math.round((yz - ya) * 0.42));
    while (correnteza.length < alvo) correnteza.push(novaGota(ya, yz, true));
    if (correnteza.length > alvo) correnteza.length = alvo;
    ctx.lineCap = 'round';
    for (let i = 0; i < correnteza.length; i++) {
      let p = correnteza[i];
      p.y += 34 * (0.3 + 0.7 * (1 - p.t * p.t)) * dt * rio.inv(p.y); p.vida += dt;
      if (p.vida > p.dura || p.y < ya || p.y > yz) { p = correnteza[i] = novaGota(ya, yz, false); continue; }
      const al = p.a * Math.sin(Math.PI * p.vida / p.dura), meio = (p.len / 2) * rio.inv(p.y);
      const [ax, ay] = naCorrente(p.y - meio, p.t), [mx, my] = naCorrente(p.y, p.t), [bx, by] = naCorrente(p.y + meio, p.t);
      ctx.strokeStyle = p.claro ? `rgba(222,232,214,${al.toFixed(3)})` : `rgba(8,30,32,${al.toFixed(3)})`;
      ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(2 * mx - (ax + bx) / 2, 2 * my - (ay + by) / 2, bx, by); ctx.stroke();
    }
    // reflexos do sol: pontinhos achatados que acendem e apagam
    const novoBrilho = v => ({ y: ya + Math.random() * (yz - ya), t: (Math.random() * 2 - 1) * 0.75, vida: v, dura: 0.5 + Math.random() * 1, r: 1.2 + Math.random() * 1.8 });
    while (brilhos.length < 26) brilhos.push(novoBrilho(Math.random()));
    ctx.fillStyle = '#fffbe8';
    for (let i = 0; i < brilhos.length; i++) {
      const b = brilhos[i];
      b.vida += dt; b.y += 30 * dt;
      if (b.vida > b.dura || b.y < ya || b.y > yz) { brilhos[i] = novoBrilho(0); continue; }
      const [x, y] = naCorrente(b.y, b.t), k = Math.sin(Math.PI * b.vida / b.dura);
      ctx.globalAlpha = 0.35 * k; ctx.beginPath(); ctx.ellipse(x, y, b.r * 1.6, b.r * 0.45, 0, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // espuma: bolhinhas que nascem nas estacas e nas pedras e descem abrindo com a correnteza
    const yAgua = P.y + P.meia + 22;
    const fontes = [];
    if (yAgua > ya - 100 && yAgua < yz) for (const x of estacas) fontes.push([x, yAgua, 6, 1]);
    for (const p of pedras) if (p.naAgua && p.y > ya - 100 && p.y < yz) fontes.push([p.x, p.y + p.r * 0.4, p.r * 0.8, 0.6]);
    for (const [x, y, abre, taxa] of fontes) {
      for (let n = Math.round(taxa * dt * 14 + Math.random() * 0.5); n > 0 && espuma.length < 500; n--)
        espuma.push({ x: x + (Math.random() - 0.5) * abre * 2, y: y + Math.random() * 3, vx: (Math.random() - 0.5) * 9, vy: 24 + Math.random() * 14, vida: 0, dura: 1.6 + Math.random() * 1.8, r: 0.9 + Math.random() * 1.5 });
      ctx.fillStyle = 'rgba(236,240,230,.32)'; ctx.beginPath(); ctx.ellipse(x, y, abre + 3, 2.6, 0, 0, 7); ctx.fill();
    }
    for (let i = espuma.length - 1; i >= 0; i--) {
      const e = espuma[i];
      e.vida += dt; e.x += e.vx * dt; e.y += e.vy * dt * rio.inv(e.y); e.vx *= 0.99;
      if (e.vida > e.dura) { espuma.splice(i, 1); continue; }
      const k = 1 - e.vida / e.dura;
      ctx.globalAlpha = 0.5 * k; ctx.fillStyle = '#eef0e6';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * (1 + e.vida * 0.6), e.r * 0.6 * (1 + e.vida * 0.4), 0, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // estacas (por cima da água, por baixo do tabuleiro)
    if (yAgua > ya && yAgua < yz) for (const x of estacas) {
      ctx.fillStyle = '#2b2017'; ctx.fillRect(x - 6, P.y + P.meia - 2, 12, 28);
      ctx.fillStyle = '#4a3726'; ctx.fillRect(x - 5, P.y + P.meia - 2, 10, 25);
      ctx.fillStyle = '#6b5139'; ctx.fillRect(x - 5, P.y + P.meia - 2, 3, 25);
      ctx.fillStyle = 'rgba(20,30,25,.6)'; ctx.fillRect(x - 5, P.y + P.meia + 17, 10, 6);
    }
  }

  // grade de caminhar de 16 px: anda em terra e na ponte, prefere estradas; não entra nas construções
  const GC = 16, GX = Math.ceil(W / GC), GY = Math.ceil(H / GC), custo = new Float32Array(GX * GY);
  function recalcularCusto(x0 = 0, y0 = 0, x1 = W, y1 = H) {
    for (let j = Math.max(0, Math.floor(y0 / GC)); j <= Math.min(GY - 1, Math.floor(y1 / GC)); j++)
      for (let i = Math.max(0, Math.floor(x0 / GC)); i <= Math.min(GX - 1, Math.floor(x1 / GC)); i++) {
        const x = i * GC + GC / 2, y = j * GC + GC / 2;
        const ponte = naPonte(x, y, -8), seco = rio.margem(x, y) > 10;
        custo[i + j * GX] = !(ponte || seco) || noPredio(x, y) < 6 || C.bloqueia(x, y) || decorEm(x, y, 4) || x < 20 || y < 30 || x > W - 20 || y > H - 10 ? 0
          : (ponte || estrada.borda(x, y) < 0 || noPatio(x, y) < 0 || naEntrada(x, y)) ? 0.55 : 1;
      }
  }
  recalcularCusto();
  // a equipe também anda dentro dos currais (fora da cerca e dos equipamentos); a porteira é atravessada em linha reta
  const custoDentro = new Float32Array(GX * GY);
  function montarCustoDentro() {
    custoDentro.set(custo);
    for (const cur of C.currais) {
      const l = cur.l;
      for (let j = Math.floor(l.y / GC); j <= Math.floor((l.y + l.h) / GC); j++)
        for (let i = Math.floor(l.x / GC); i <= Math.floor((l.x + l.w) / GC); i++) {
          const x = i * GC + GC / 2, y = j * GC + GC / 2;
          if (C.andavelDentro(cur, x, y)) custoDentro[i + j * GX] = 1;
        }
    }
  }
  montarCustoDentro();
  /** o ponto andável mais perto (procura em anéis) */
  function pontoLivre(grade, x, y) {
    const ci = Math.floor(x / GC), cj = Math.floor(y / GC);
    if (grade[ci + cj * GX]) return [x, y];
    for (let r = 1; r < 10; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = ci + di, j = cj + dj;
      if (i >= 0 && j >= 0 && i < GX && j < GY && grade[i + j * GX]) return [i * GC + GC / 2, j * GC + GC / 2];
    }
    return [x, y];
  }
  function rota(ax, ay, bx, by, grade = custo) {
    const ini = Math.floor(ax / GC) + Math.floor(ay / GC) * GX;
    let fim = Math.floor(bx / GC) + Math.floor(by / GC) * GX;
    if (!grade[fim]) return null;
    const g = new Float32Array(GX * GY).fill(Infinity), de = new Int32Array(GX * GY).fill(-1), fechado = new Uint8Array(GX * GY);
    const fila = [[0, ini]], h = k => { const dx = Math.abs(k % GX - fim % GX), dy = Math.abs(((k / GX) | 0) - ((fim / GX) | 0)); return 0.55 * (Math.max(dx, dy) + 0.414 * Math.min(dx, dy)); };
    const sobe = () => { let i = fila.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (fila[p][0] <= fila[i][0]) break; [fila[p], fila[i]] = [fila[i], fila[p]]; i = p; } };
    const desce = () => { let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < fila.length && fila[a][0] < fila[m][0]) m = a; if (b < fila.length && fila[b][0] < fila[m][0]) m = b; if (m === i) break; [fila[m], fila[i]] = [fila[i], fila[m]]; i = m; } };
    g[ini] = 0;
    while (fila.length) {
      const [, k] = fila[0]; const ult = fila.pop(); if (fila.length) { fila[0] = ult; desce(); }
      if (fechado[k]) continue; fechado[k] = 1;
      if (k === fim) break;
      const i = k % GX, j = (k / GX) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const ni = i + dx, nj = j + dy; if (ni < 0 || nj < 0 || ni >= GX || nj >= GY) continue;
        const n = ni + nj * GX; if (!grade[n] || fechado[n]) continue;
        if (dx && dy && (!grade[i + dx + j * GX] || !grade[i + (j + dy) * GX])) continue;
        const ng = g[k] + grade[n] * (dx && dy ? 1.414 : 1);
        if (ng < g[n]) { g[n] = ng; de[n] = k; fila.push([ng + h(n), n]); sobe(); }
      }
    }
    if (de[fim] < 0 && fim !== ini) return null;
    let pts = [[bx, by]];
    for (let k = de[fim]; k >= 0 && k !== ini; k = de[k]) pts.push([(k % GX) * GC + GC / 2, ((k / GX) | 0) * GC + GC / 2]);
    pts.push([ax, ay]); pts.reverse();
    for (let it = 0; it < 2; it++) { // Chaikin: curvas suaves no lugar dos degraus da grade
      const s = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; s.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]); }
      s.push(pts[pts.length - 1]); pts = s;
    }
    return pts;
  }
  const casaDaEquipe = () => { const e = predios.find(p => p.id === 'casa').e; return [e.porta[0], e.porta[1] + 20]; };
  const equipe = Trabalhadores.criar({ C, bichos, rota, gradeFora: () => custo, gradeDentro: () => custoDentro, livre: pontoLivre, casa: casaDaEquipe, grama, agora: () => ultimo / 1000,
    colheu: c => colheu(c),
    semente: () => { const e = jogo.estado; if (e.sementes[e.plantio] > 0) return e.plantio; const outra = Object.keys(e.sementes).find(k => e.sementes[k] > 0); if (!outra) semSemente(); return outra || null; },
    nomeSemente: k => Jogo.PRODUTOS[k].nome.toLowerCase(),
    plantar: (c, tipo) => { if (jogo.usarSemente(tipo)) { C.replantar(c, tipo, ultimo / 1000); atualizarHud(); if (!lojaDlg.hidden) montarLoja(); } else semSemente(); },
    imagem: pasta => { const i = new Image(); i.src = `equipe/${pasta}/sheet.png?v=46`; return i; } });
  const agricultor = equipe.agricultor; // o agricultor da equipe: cuida da horta e atende o clique no chão

  // ---------- tela, câmera e controles ----------
  const tela = document.getElementById('tela'), ctx = tela.getContext('2d');
  const cam = { x: 0, y: 0, zoom: 1, largura: 0, altura: 0, escala: 1 };
  let cssW = 0, cssH = 0, zMin = 0.5;
  const zMax = 2.4;
  function medir() {
    cssW = innerWidth; cssH = innerHeight;
    tela.width = Math.round(cssW * dpr); tela.height = Math.round(cssH * dpr);
    zMin = Math.max(cssW / W, cssH / H, 0.35); // dá para ver a fazenda inteira
    ajustarZoom(cam.zoom, cssW / 2, cssH / 2);
  }
  function limitar() {
    cam.largura = cssW / cam.zoom; cam.altura = cssH / cam.zoom; cam.escala = cam.zoom * dpr;
    cam.x = cam.largura >= W ? (W - cam.largura) / 2 : Math.max(0, Math.min(W - cam.largura, cam.x));
    cam.y = cam.altura >= H ? (H - cam.altura) / 2 : Math.max(0, Math.min(H - cam.altura, cam.y));
  }
  let zoomMudou = 0;
  function ajustarZoom(z, sx, sy) {
    const wx = cam.x + sx / cam.zoom, wy = cam.y + sy / cam.zoom;
    cam.zoom = Math.max(zMin, Math.min(zMax, z));
    cam.x = wx - sx / cam.zoom; cam.y = wy - sy / cam.zoom;
    limitar(); zoomMudou = performance.now();
  }
  function centrar(x, y) { cam.x = x - cam.largura / 2; cam.y = y - cam.altura / 2; limitar(); }
  addEventListener('resize', medir);
  medir();
  cam.zoom = Math.max(zMin, 1); limitar();
  ajustarZoom(Math.min(0.75, cssW / 2000), cssW / 2, cssH / 2);
  centrar(3330, 860); // começa no terreiro: casa, celeiro, galinheiro e curral das vacas

  tela.addEventListener('wheel', e => { e.preventDefault(); ajustarZoom(cam.zoom * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
  const dedos = new Map();
  let gesto = null;
  tela.addEventListener('pointerdown', e => {
    tela.setPointerCapture(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 1) gesto = { tipo: 'arrasto', x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y, moveu: false };
    else if (dedos.size === 2) { const [a, b] = [...dedos.values()]; gesto = { tipo: 'pinca', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.zoom, moveu: true }; }
  });
  tela.addEventListener('pointermove', e => {
    if (!dedos.has(e.pointerId) || !gesto) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesto.tipo === 'arrasto' && dedos.size === 1) {
      const dx = e.clientX - gesto.x0, dy = e.clientY - gesto.y0;
      if (Math.hypot(dx, dy) > 6) { gesto.moveu = true; tela.classList.add('arrastando'); }
      if (gesto.moveu) { cam.x = gesto.cx - dx / cam.zoom; cam.y = gesto.cy - dy / cam.zoom; limitar(); }
    } else if (gesto.tipo === 'pinca' && dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      ajustarZoom(gesto.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gesto.d0, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  });
  const soltar = e => {
    if (!dedos.has(e.pointerId)) return;
    dedos.delete(e.pointerId); tela.classList.remove('arrastando');
    if (gesto && gesto.tipo === 'arrasto' && !gesto.moveu && e.type === 'pointerup') {
      const wx = cam.x + e.clientX / cam.zoom, wy = cam.y + e.clientY / cam.zoom, pr = predioEm(wx, wy), bi = bichos.bichoEm(wx, wy), tb = equipe.em(wx, wy);
      if (colocando) { colocarDecor(wx, wy); return; }
      const dc = decoracoes.find(o => { const c = DEC.caixa(o.d, o.x, o.y); return wx > c[0] + 12 && wx < c[2] - 12 && wy > c[1] + 8 && wy < c[3]; });
      if (dc && !tb && !bi) { avisar(dc.d.nome); return; }
      const ob = !tb && !bi ? C.objetoEm(wx, wy) : null;
      if (tb) avisar(equipe.descricao(tb));
      else if (ob) avisar(ob.rotuloAgora ? ob.rotuloAgora(ultimo / 1000) : ob.rotulo);
      else if (bi) { bichos.chamar(bi, agricultor.x); avisar(bichos.rotulo(bi)); }
      else if (pr) { if (pr.id === 'celeiro' && pr.nivel > 0) abrirCeleiro(); else { selEvoluir.value = pr.id; atualizarBotoes(); const px = jogo.proximo(pr.id); avisar(px.max ? `${pr.nome}: nível 3 (máximo)` : `${pr.nome} nível ${pr.nivel} · evoluir por ${px.custo} moedas no painel`); } }
      else {
        const [ax, ay] = agricultor.visivel ? [agricultor.x, agricultor.y] : casaDaEquipe();
        if (!rota(ax, ay, wx, wy)) avisar('Ali não dá para andar.');
        else if (!equipe.mandar(agricultor, wx, wy)) avisar('O agricultor está trabalhando na horta; chame de novo quando ele sair');
        else avisar('');
      }
    }
    if (dedos.size === 1) { const [d] = [...dedos.values()]; gesto = { tipo: 'arrasto', x0: d.x, y0: d.y, cx: cam.x, cy: cam.y, moveu: true }; }
    else if (!dedos.size) gesto = null;
  };
  tela.addEventListener('pointerup', soltar); tela.addEventListener('pointercancel', soltar);

  let mostrarLotes = false;
  const bLotes = document.getElementById('bLotes'), bVento = document.getElementById('bVento'), bLonge = document.getElementById('bLonge');
  bLotes.onclick = () => { mostrarLotes = !mostrarLotes; bLotes.setAttribute('aria-pressed', mostrarLotes); bLotes.textContent = mostrarLotes ? 'Esconder lotes' : 'Mostrar lotes'; };
  bVento.onclick = () => { grama.vento = !grama.vento; bVento.setAttribute('aria-pressed', grama.vento); };
  bLonge.onclick = () => { const longe = cam.zoom > zMin + 0.01; ajustarZoom(longe ? zMin : 0.75, cssW / 2, cssH / 2); bLonge.setAttribute('aria-pressed', longe); };
  document.getElementById('bAgricultor').onclick = () => { if (agricultor.visivel) centrar(agricultor.x, agricultor.y - 30); else { const [x, y] = casaDaEquipe(); centrar(x, y - 60); avisar('O agricultor está descansando em casa'); } };
  document.getElementById('bEquipe').onclick = () => { equipe.chamar(); avisar('A equipe está saindo de casa para cuidar dos animais'); };
  let aviso = '', avisoAte = 0;
  function avisar(t) { aviso = t; avisoAte = performance.now() + 2500; }

  // ---------- som, dia/noite e chuva ----------
  const som = Som.criar();
  const clima = Clima.criar({
    trovejar: (perto, atraso) => som.trovejar(perto, atraso),
    luzes: () => [...predios.filter(p => !p.e.vazio).map(p => [p.e.porta[0], p.e.porta[1] - 30, p.id === 'casa' ? 170 : 120]),
      ...decoracoes.filter(o => o.d.luz).map(o => [o.x + o.d.luz[0] + 9, o.y + o.d.luz[1], o.d.luz[2]])],
  });
  addEventListener('pointerdown', () => som.ativar(), true); addEventListener('keydown', () => som.ativar(), true); // o navegador só libera o áudio depois de um toque
  document.addEventListener('click', e => { if (e.target.closest('button, select')) som.menu('clique'); }, true);
  /** sons do que está acontecendo: bichos chamando de vez em quando, galo cantando, trabalhadores na lida */
  const SOM_TAREFA = [[/^Colhendo/, 'colher'], [/^Plantando/, 'enxada'], [/^Regando/, 'regar'], [/^(Enchendo|Pondo feno|Servindo)/, 'racao'], [/^Recolhendo/, 'ovos'],
    [/(bebedouro|água)/, 'agua'], [/^Ordenhando/, 'ordenha'], [/^Tosquiando/, 'tosquia']];
  let horaAntes = clima.estado.hora;
  function ouvir(dt) {
    const noite = clima.noite, h = clima.estado.hora;
    const amanheceu = horaAntes < 5.4 && h >= 5.4; horaAntes = h;
    for (const b of bichos.bichos) {
      if (!b.ativo) continue;
      const galo = b.var === 'galo';
      if (galo) {
        if (amanheceu && !(b.canta > 0)) { b.canta = 1.8; b.cantoEm = 20; } // o galo canta quando o dia clareia
        if (b.canta > 0 && !b.cantou) { b.cantou = true; som.animal('galo', b.x, b.y); } else if (!(b.canta > 0)) b.cantou = false;
        continue;
      }
      if (b.vozEm === undefined) b.vozEm = 3 + Math.random() * 25;
      b.vozEm -= dt * (noite > 0.5 ? 0.35 : 1) * (clima.chuva > 0.5 ? 0.6 : 1); // à noite e na chuva quase não fazem barulho
      if (b.vozEm <= 0) { b.vozEm = (b.tipo === 'galinha' ? 9 : 16) + Math.random() * 30; som.animal(b.tipo, b.x, b.y); }
    }
    for (const t of equipe.equipe) {
      const p = t.atual;
      if (p !== t.somDe) {
        t.somDe = p;
        if (p && p.tipo === 'portao') som.trabalho('porteira', t.x, t.y, p.abrir);
        else if (p && p.tipo === 'tarefa') { const m = SOM_TAREFA.find(([r]) => r.test(p.texto)); if (m) som.trabalho(m[1], t.x, t.y, p.dur); }
      }
      if (t.visivel && t.pose === 'andando') { t.passoSom = (t.passoSom || 0) - dt; if (t.passoSom <= 0) { t.passoSom = 0.42; som.trabalho('passo', t.x, t.y); } }
    }
    const cx = cam.x + cam.largura / 2, cy = cam.y + cam.altura / 2;
    som.quadro(cam, noite, clima.chuva, Math.max(0, rio.margem(cx, Math.max(0, Math.min(H, cy)))), dt);
  }

  // ---------- opções: volumes e clima (guardado à parte, não mexe no progresso do jogo) ----------
  const CHAVE_OPCOES = 'vila-do-sol-prototipo-opcoes';
  const opcoes = document.getElementById('opcoes'), bOpcoes = document.getElementById('bOpcoes');
  function guardarOpcoes() {
    try { localStorage.setItem(CHAVE_OPCOES, JSON.stringify({ som: som.vol, hora: clima.estado.modoHora, chuva: clima.estado.modoChuva })); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
  }
  try {
    const o = JSON.parse(localStorage.getItem(CHAVE_OPCOES) || 'null');
    if (o) { for (const k in Som.PADRAO) if (o.som && typeof o.som[k] === typeof Som.PADRAO[k]) som.vol[k] = o.som[k]; if (o.hora) clima.estado.modoHora = o.hora; if (o.chuva) clima.estado.modoChuva = o.chuva; }
  } catch (e) { /* opções estragadas ou bloqueadas: fica o padrão */ }
  for (const el of opcoes.querySelectorAll('[data-vol]')) {
    const k = el.dataset.vol, saida = el.parentElement.querySelector('output');
    el.value = Math.round(som.vol[k] * 100); saida.textContent = el.value + '%';
    el.oninput = () => { som.definir(k, el.value / 100); saida.textContent = el.value + '%'; };
    el.onchange = () => { guardarOpcoes(); if (k !== 'ambiente') som.menu('clique'); };
  }
  const somLigado = document.getElementById('somLigado'), selHora = document.getElementById('selHora'), selChuva = document.getElementById('selChuva');
  somLigado.checked = som.vol.ligado; somLigado.onchange = () => { som.definir('ligado', somLigado.checked); guardarOpcoes(); };
  selHora.value = clima.estado.modoHora; selChuva.value = clima.estado.modoChuva;
  selHora.onchange = () => { clima.estado.modoHora = selHora.value; guardarOpcoes(); };
  selChuva.onchange = () => { clima.estado.modoChuva = selChuva.value; guardarOpcoes(); };
  function abrirOpcoes(abrir) {
    opcoes.hidden = !abrir; bOpcoes.setAttribute('aria-expanded', String(abrir));
    setTimeout(() => som.menu(abrir ? 'abrir' : 'fechar'), 0);
  }
  bOpcoes.onclick = e => { e.stopPropagation(); abrirOpcoes(opcoes.hidden); };
  document.getElementById('bFecharOpcoes').onclick = () => abrirOpcoes(false);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !opcoes.hidden) abrirOpcoes(false); });
  const relogio = document.getElementById('relogio');

  // ---------- mapa pequeno ----------
  const mini = document.getElementById('mini'), mctx = mini.getContext('2d');
  let miniBase = null, miniW = 0, miniH = 0;
  function pintarMini() {
    const r = mini.getBoundingClientRect(); miniW = r.width; miniH = r.height;
    mini.width = Math.round(miniW * dpr); mini.height = Math.round(miniH * dpr);
    miniBase = document.createElement('canvas'); miniBase.width = mini.width; miniBase.height = mini.height;
    const g = miniBase.getContext('2d'), s = (miniW / W) * dpr;
    g.setTransform(s, 0, 0, s * (miniH / miniW) / (H / W), 0, 0);
    g.fillStyle = '#5b7b30'; g.fillRect(0, 0, W, H);
    const rr = sorteio(4);
    for (let i = 0; i < 260; i++) { g.fillStyle = rr() < 0.5 ? 'rgba(40,60,20,.25)' : 'rgba(150,180,80,.14)'; g.beginPath(); g.ellipse(rr() * W, rr() * H, 60 + rr() * 160, 40 + rr() * 90, rr() * 3, 0, 7); g.fill(); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#a98d63'; for (const e of estradas) { g.lineWidth = Math.max(e.larg, 40); tracar(g, e.linha); g.stroke(); }
    g.fillStyle = '#a98d63'; poligono(g, patio.contorno(0)); g.fill();
    g.fillStyle = '#7a6a48'; faixaRio(g, -60, H + 60, (y, s) => rio.hwLado(y, s) + 30); g.fill();
    g.fillStyle = '#3d5d4c'; faixaRio(g, -60, H + 60, (y, s) => rio.hwLado(y, s)); g.fill();
    g.fillStyle = '#6b5038'; g.fillRect(P.x0, P.y - P.meia, P.x1 - P.x0, P.meia * 2);
    g.setLineDash([60, 40]); g.lineWidth = 16; g.strokeStyle = 'rgba(255,248,220,.85)'; g.fillStyle = 'rgba(255,248,220,.12)';
    const livres = lotes.filter(l => !predios.some(p => p.id === l.id) && !C.currais.some(c => c.id === l.id));
    C.mini(g);
    for (const l of livres) { g.fillRect(l.x, l.y, l.w, l.h); g.strokeRect(l.x, l.y, l.w, l.h); }
    g.setLineDash([]);
    for (const { e } of predios) { if (e.vazio) continue; const [x0, y0, x1, y1] = e.pegada; g.fillStyle = e.tipo === 'casa' ? '#b5562f' : '#9b3022'; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
    g.fillStyle = '#fff8e0'; g.font = 'bold 120px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (miniW > 200) for (const l of lotes) g.fillText(l.nome.replace('Curral das ', ''), l.x + l.w / 2, l.y + l.h / 2);
  }
  function desenharMini() {
    if (!miniBase) return;
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.drawImage(miniBase, 0, 0);
    const sx = mini.width / W, sy = mini.height / H;
    mctx.strokeStyle = '#ffffff'; mctx.lineWidth = 1.5 * dpr; mctx.strokeRect(cam.x * sx, cam.y * sy, cam.largura * sx, cam.altura * sy);
    for (const t of equipe.equipe) if (t.visivel) { mctx.fillStyle = t === agricultor ? '#ffd35a' : '#7fd0ff'; mctx.beginPath(); mctx.arc(t.x * sx, t.y * sy, (t === agricultor ? 3 : 2.4) * dpr, 0, 7); mctx.fill(); }
  }
  let miniArrasto = false;
  const miniIr = e => { const r = mini.getBoundingClientRect(); centrar(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H); };
  mini.addEventListener('pointerdown', e => { miniArrasto = true; mini.setPointerCapture(e.pointerId); miniIr(e); });
  mini.addEventListener('pointermove', e => { if (miniArrasto) miniIr(e); });
  mini.addEventListener('pointerup', () => (miniArrasto = false));
  addEventListener('resize', pintarMini);
  pintarMini();

  // ---------- lotes planejados (por cima de tudo, só quando ligado) ----------
  function desenharLotes() {
    const z = cam.zoom;
    ctx.save();
    for (const l of lotes) {
      ctx.fillStyle = 'rgba(255,250,230,.08)'; ctx.fillRect(l.x, l.y, l.w, l.h);
      ctx.setLineDash([16 / z, 10 / z]); ctx.lineWidth = 2.5 / z; ctx.strokeStyle = 'rgba(255,248,220,.9)'; ctx.strokeRect(l.x, l.y, l.w, l.h);
      ctx.setLineDash([]);
      ctx.font = `600 ${15 / z}px system-ui, sans-serif`; ctx.textBaseline = 'middle';
      const txt = `${l.nome} · ${l.w}×${l.h}`, tw = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(28,34,18,.8)'; ctx.beginPath(); ctx.roundRect(l.x + 10 / z, l.y + 10 / z, tw + 16 / z, 26 / z, 13 / z); ctx.fill();
      ctx.fillStyle = '#fff8e0'; ctx.fillText(txt, l.x + 18 / z, l.y + 23 / z);
    }
    ctx.restore();
  }

  // ---------- casa e celeiro: imagem na resolução do zoom, crescimento, sombra, fumaça e poeira ----------
  const qPredio = () => (cam.escala <= 1.2 ? 2 : cam.escala <= 2.2 ? 3 : 4); // sempre acima da tela: nada pixelado
  function assar(p, q) {
    if (p.e.vazio) { p.cv = null; p.cq = q; p.fumaca = []; return; }
    const [x0, y0, x1, y1] = p.e.caixa, c = document.createElement('canvas');
    c.width = Math.ceil((x1 - x0) * q); c.height = Math.ceil((y1 - y0) * q);
    const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q);
    p.fumaca = Construcoes.pintar(g, p.e).fumaca; p.cv = c; p.cq = q;
  }
  for (const p of predios) assar(p, qPredio());
  let qCurrais = qPredio();
  C.assar(qCurrais);
  const fumaca = [], poeira = [];
  const voltaSuave = t => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; }; // passa um pouco e assenta
  function desenharPredio(p, agora) {
    const [x0, y0, x1, y1] = p.e.caixa, a = p.anim;
    if (a) {
      const t = (agora - a.t0) / 1.4;
      if (t >= 1) p.anim = null;
      else {
        if (t < 0.4 && a.cv) { const [o0, o1, o2, o3] = a.e.caixa; ctx.globalAlpha = 1 - t / 0.4; ctx.drawImage(a.cv, o0, o1, o2 - o0, o3 - o1); }
        if (!p.cv) { ctx.globalAlpha = 1; return; }
        const s = a.s0 + (1 - a.s0) * voltaSuave(t), cx = (p.e.pegada[0] + p.e.pegada[2]) / 2, by = p.e.base;
        ctx.globalAlpha = Math.min(1, t * 3.5);
        ctx.save(); ctx.translate(cx, by); ctx.scale(s, s); ctx.translate(-cx, -by);
        ctx.drawImage(p.cv, x0, y0, x1 - x0, y1 - y0); ctx.restore(); ctx.globalAlpha = 1;
        return;
      }
    }
    if (p.cv) ctx.drawImage(p.cv, x0, y0, x1 - x0, y1 - y0);
  }
  const extrasPredios = predios.map(p => ({ get y() { return p.e.base; }, desenhar: () => desenharPredio(p, ultimo / 1000) }));
  /** sombra no chão, a leste (sol a oeste-noroeste); escurece também o capim e quem passar por ela */
  function sombras() {
    for (const p of predios) {
      if (p.anim || p.e.vazio) continue;
      const [x0, y0, x1, y1] = p.e.pegada, h = p.e.altura, dx = h * 0.45, [c0, c1, c2] = p.e.caixa;
      if (x1 + dx < cam.x || x0 > cam.x + cam.largura) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(cam.x - 50, cam.y - 50, cam.largura + 100, cam.altura + 100); ctx.rect(c0 + 24, c1, c2 - c0 - 48, p.e.base - c1); ctx.clip('evenodd');
      for (const [k, a] of [[1, 0.13], [0.8, 0.1], [0.55, 0.08]]) {
        ctx.fillStyle = `rgba(14,22,8,${a})`;
        ctx.beginPath(); ctx.moveTo(x1, y0 + 6); ctx.lineTo(x1 + dx * k, y0 + 18); ctx.lineTo(x1 + dx * k, y1 - 4); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }
  function particulas(dt, agora) {
    for (const p of predios) for (const [x, y] of p.anim ? [] : p.fumaca || [])
      if (Math.random() < dt * 5) fumaca.push({ x: x + (Math.random() - 0.5) * 4, y, vida: 0, dura: 3 + Math.random() * 2, r: 3 + Math.random() * 2 });
    for (let i = fumaca.length - 1; i >= 0; i--) {
      const f = fumaca[i]; f.vida += dt;
      if (f.vida > f.dura) { fumaca.splice(i, 1); continue; }
      const t = f.vida / f.dura, x = f.x + f.vida * 11 + Math.sin(agora * 1.3 + f.dura * 5) * 3 * t, y = f.y - f.vida * 19, r = f.r + t * 16;
      const d = ctx.createRadialGradient(x, y, 0, x, y, r);
      d.addColorStop(0, `rgba(232,228,220,${0.32 * (1 - t)})`); d.addColorStop(1, 'rgba(232,228,220,0)');
      ctx.fillStyle = d; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = poeira.length - 1; i >= 0; i--) {
      const f = poeira[i]; f.vida += dt;
      if (f.vida > f.dura) { poeira.splice(i, 1); continue; }
      const t = f.vida / f.dura, x = f.x + f.vx * f.vida, y = f.y + f.vy * f.vida + 12 * f.vida * f.vida, r = f.r * (1 + t * 1.6);
      const d = ctx.createRadialGradient(x, y, 0, x, y, r);
      d.addColorStop(0, `rgba(196,174,132,${0.5 * (1 - t)})`); d.addColorStop(1, 'rgba(196,174,132,0)');
      ctx.fillStyle = d; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  function mudarNivel(p, n) {
    if (n === p.nivel || n < (p.id === 'casa' ? 1 : 0) || n > 3) { if (p.id === 'casa' && n === 0) avisar('A casa já começa construída (nível 1)'); return; }
    const velho = { e: p.e, cv: p.cv }, agora = ultimo / 1000;
    p.nivel = n; p.e = p.espec(n); assar(p, qPredio());
    const a = velho.e.pegada, b = p.e.pegada;
    p.anim = { t0: agora, e: velho.e, cv: velho.cv, s0: (a[2] - a[0]) / (b[2] - b[0]) };
    // o chão, o capim e a grade de caminhar mudam onde a construção estava e onde ela está agora
    const x0 = Math.min(a[0], b[0]) - 140, y0 = Math.min(a[1], b[1]) - 140, x1 = Math.max(a[2], b[2]) + 140, y1 = Math.max(a[3], b[3]) + 140;
    grama.refazer(x0, y0, x1, y1);
    for (const [k, lad] of ladrilhos) if (lad.tx * T < x1 && lad.tx * T + T > x0 && lad.ty * T < y1 && lad.ty * T + T > y0) ladrilhos.delete(k);
    recalcularCusto(x0, y0, x1, y1); montarCustoDentro();
    for (const t of equipe.equipe) if (t.visivel && noPredio(t.x, t.y) < 8) { t.x = p.e.porta[0] + 40; t.y = p.e.porta[1] + 20; t.caminho = null; }
    const z = b[2] - b[0] >= a[2] - a[0] ? b : a; // poeira onde a obra é maior (construindo ou desmanchando)
    for (let i = 0; i < 70; i++) {
      const x = z[0] + Math.random() * (z[2] - z[0]);
      poeira.push({ x, y: z[3] - 4 - Math.random() * 20, vx: (x - (z[0] + z[2]) / 2) * 0.25 + (Math.random() - 0.5) * 30, vy: -14 - Math.random() * 26, vida: -Math.random() * 0.5, dura: 1.4 + Math.random() * 1.2, r: 9 + Math.random() * 14 });
    }
    som.menu(n > velho.e.nivel ? 'obra' : 'fechar'); if (n > velho.e.nivel) setTimeout(() => som.menu('nivel'), 600);
    pintarMini(); atualizarBotoes();
    avisar(n === 0 ? `${p.nome}: terreno vazio (nível 0)` : `${p.nome} ${n > velho.e.nivel ? (velho.e.vazio ? 'construído:' : 'evoluiu para') : 'voltou para'} nível ${n}`);
  }
  /** curral, horta ou pomar muda de nível: cerca, chão, capim e grade de caminhar se refazem; bichos novos entram pela
   *  porteira; árvores novas do pomar nascem como mudas */
  const NOMES = { vacas: 'Curral das vacas', ovelhas: 'Curral das ovelhas', porcos: 'Chiqueiro', galinheiro: 'Galinheiro', horta: 'Horta', pomar: 'Pomar' };
  function mudarCurral(id, n, silencio = false) {
    const de = C.nivel(id);
    if (n === de) return;
    const [a, b] = C.nivel(id, n, ultimo / 1000), cur = C.currais.find(c => c.id === id);
    bichos.ajustar(cur, true);
    const x0 = Math.min(a.x, b.x) - 120, y0 = Math.min(a.y, b.y) - 200, x1 = Math.max(a.x + a.w, b.x + b.w) + 120, y1 = Math.max(a.y + a.h, b.y + b.h) + 80;
    grama.refazer(x0, y0, x1, y1);
    for (const [k, lad] of ladrilhos) if (lad.tx * T < x1 && lad.tx * T + T > x0 && lad.ty * T < y1 && lad.ty * T + T > y0) ladrilhos.delete(k);
    recalcularCusto(x0, y0, x1, y1); montarCustoDentro();
    for (const t of equipe.equipe) if (t.visivel && t.cur !== cur && C.bloqueia(t.x, t.y)) { const f = C.pontosPorteira(cur).fora; t.x = f[0]; t.y = f[1]; t.caminho = null; }
    if (silencio) { pintarMini(); return; }
    som.menu(n > de ? 'nivel' : 'fechar');
    pintarMini(); atualizarBotoes();
    const qtd = bichos.bichos.filter(x => x.cur === cur && x.ativo).length, itens = cur.objetos.filter(o => o.tipo === 'arvore' || o.tipo === 'canteiro').length;
    const conta = qtd ? `${qtd} animais` : id === 'horta' ? `${itens} canteiros` : `${itens} árvores`;
    avisar(n === 0 ? `${NOMES[id]}: terreno vazio (nível 0)` : de === 0 ? `${NOMES[id]} construído (nível ${n}): ${conta}` : `${NOMES[id]} ${n > de ? 'cresceu para' : 'voltou para'} o nível ${n}: ${conta}`);
  }
  // ---------- jogo: evoluir pagando, colheita, celeiro ----------
  const selEvoluir = document.getElementById('selEvoluir'), bEvoluir = document.getElementById('bEvoluir'), infoEvoluir = document.getElementById('infoEvoluir');
  for (const op of selEvoluir.options) op.dataset.nome = op.textContent;
  function atualizarBotoes() {
    for (const op of selEvoluir.options) { const n = jogo.nivel(op.value); op.textContent = `${op.dataset.nome} · ${n ? 'nível ' + n : 'não construído'}`; }
    const id = selEvoluir.value, px = jogo.proximo(id), n = jogo.nivel(id);
    bEvoluir.disabled = !px.ok;
    bEvoluir.textContent = px.max ? 'Nível máximo' : `${n ? 'Evoluir' : 'Construir'} · ${px.custo} 🪙`;
    infoEvoluir.textContent = px.max ? '' : px.ok ? `Vai para o nível ${px.n}` : px.motivo;
    atualizarHud();
  }
  bEvoluir.onclick = () => {
    const id = selEvoluir.value, r = jogo.evoluir(id);
    if (!r) { avisar(jogo.proximo(id).motivo); return; }
    const pr = predios.find(p => p.id === id);
    if (pr) mudarNivel(pr, r.n); else mudarCurral(id, r.n);
    if (r.subiu) subiuNivel();
    atualizarBotoes();
  };
  selEvoluir.onchange = atualizarBotoes;
  // o que estava construído no jogo salvo aparece pronto
  queueMicrotask(() => { for (const id of ['horta', 'galinheiro', 'pomar', 'porcos', 'ovelhas', 'vacas']) if (jogo.nivel(id)) mudarCurral(id, jogo.nivel(id), true); }); // depois que o resto do mapa existe

  const hudMoedas = document.getElementById('hudMoedas'), hudNivel = document.getElementById('hudNivel'), hudXp = document.getElementById('hudXp');
  function atualizarHud() {
    const e = jogo.estado;
    hudMoedas.textContent = e.moedas.toLocaleString('pt-BR');
    hudNivel.textContent = jogo.nivelJogador();
    hudXp.style.width = jogo.xpNoNivel() + '%'; hudXp.parentElement.title = `${jogo.xpNoNivel()}/100 XP para o nível ${jogo.nivelJogador() + 1}`;
  }
  function subiuNivel() { setTimeout(() => som.menu('nivel'), 300); avisar(`Você chegou ao nível ${jogo.nivelJogador()}!`); }
  /** o agricultor colheu um canteiro: 2 unidades vão para o armazém */
  function colheu(c) {
    const pr = Jogo.PRODUTOS[c.cultura]; if (!pr) return;
    const subiu = jogo.guardar(c.cultura, 2);
    flutuar(c.pegada ? (c.pegada[0] + c.pegada[2]) / 2 : agricultor.x, c.pegada ? c.pegada[1] : agricultor.y - 60, `+2 ${pr.icone}`);
    if (subiu) subiuNivel();
    atualizarBotoes(); if (!celeiroDlg.hidden) montarCeleiro();
  }
  // textos que sobem do mapa (+2 🌽, +120 🪙)
  const flutuantes = [];
  function flutuar(x, y, texto) { flutuantes.push({ x, y, texto, t: 0 }); }
  function desenharFlutuantes(dt) {
    for (let i = flutuantes.length - 1; i >= 0; i--) {
      const f = flutuantes[i]; f.t += dt; if (f.t > 1.8) { flutuantes.splice(i, 1); continue; }
      const a = Math.min(1, (1.8 - f.t) * 2), sx = (f.x - cam.x) * cam.zoom, sy = (f.y - cam.y) * cam.zoom - f.t * 30;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = '700 16px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = `rgba(28,34,18,${0.8 * a})`; ctx.strokeText(f.texto, sx, sy);
      ctx.fillStyle = `rgba(255,248,224,${a})`; ctx.fillText(f.texto, sx, sy); ctx.textAlign = 'start';
    }
  }
  // celeiro: armazém e venda
  const celeiroDlg = document.getElementById('celeiroDlg'), celeiroLista = document.getElementById('celeiroLista'), celeiroInfo = document.getElementById('celeiroInfo'), bVenderTudo = document.getElementById('bVenderTudo');
  function montarCeleiro() {
    const e = jogo.estado, itens = Object.keys(e.armazem).filter(k => e.armazem[k] > 0 && Jogo.PRODUTOS[k]), aberto = jogo.nivel('celeiro') > 0;
    celeiroInfo.textContent = !aberto ? 'Construa o celeiro (painel Evoluir) para vender. A colheita fica guardada até lá.'
      : `Celeiro nível ${jogo.nivel('celeiro')}${jogo.bonusVenda() > 1 ? ` · vende ${Math.round((jogo.bonusVenda() - 1) * 100)}% mais caro` : ''}`;
    celeiroLista.replaceChildren(...(itens.length ? itens.map(k => {
      const pr = Jogo.PRODUTOS[k], n = e.armazem[k], li = document.createElement('li');
      li.innerHTML = `<span class="ic">${pr.icone}</span><span class="nm">${pr.nome}<small>${jogo.precoVenda(k)} 🪙 cada</small></span><b>× ${n}</b>`;
      const b = document.createElement('button'); b.textContent = `Vender · ${n * jogo.precoVenda(k)} 🪙`; b.disabled = !aberto;
      b.onclick = () => vender(k); li.append(b); return li;
    }) : [Object.assign(document.createElement('li'), { className: 'vazio', textContent: 'Armazém vazio. A colheita da horta vem para cá.' })]));
    const total = itens.reduce((t, k) => t + e.armazem[k] * jogo.precoVenda(k), 0);
    bVenderTudo.textContent = `Vender tudo · ${total} 🪙`; bVenderTudo.disabled = !aberto || !total;
  }
  function vender(k) {
    const g = jogo.vender(k); if (!g) return;
    som.menu('clique'); avisar(`Vendido por ${g} moedas: o caminhão vem buscar`);
    chamarCaminhao(g);
    montarCeleiro(); atualizarBotoes();
  }
  bVenderTudo.onclick = () => vender(null);
  function abrirCeleiro(abrir = true) { celeiroDlg.hidden = !abrir; if (abrir) montarCeleiro(); setTimeout(() => som.menu(abrir ? 'abrir' : 'fechar'), 0); }
  document.getElementById('bCeleiro').onclick = () => abrirCeleiro(celeiroDlg.hidden);
  document.getElementById('bFecharCeleiro').onclick = () => abrirCeleiro(false);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !celeiroDlg.hidden) abrirCeleiro(false); });
  setInterval(() => jogo.salvar(), 15000);
  const salvarAoSair = () => jogo.salvar();
  addEventListener('pagehide', salvarAoSair);
  atualizarBotoes();
  // ---------- loja: sementes, animais e decorações ----------
  const lojaDlg = document.getElementById('lojaDlg'), lojaCorpo = document.getElementById('lojaCorpo'), abas = [...document.querySelectorAll('#lojaDlg [data-aba]')];
  let aba = 'sementes', avisoSemente = 0;
  function semSemente() { const t = performance.now(); if (t - avisoSemente > 30000) { avisoSemente = t; avisar('O agricultor está sem sementes: compre na Loja'); } }
  const el = (tag, props = {}, ...filhos) => { const n = Object.assign(document.createElement(tag), props); n.append(...filhos); return n; };
  function linha(icone, nome, sub, direita) { return el('li', {}, el('span', { className: 'ic', textContent: icone }), el('span', { className: 'nm', textContent: nome }, el('small', { textContent: sub })), ...direita); }
  function botao(texto, ok, acao, classe = '') { const b = el('button', { textContent: texto, disabled: !ok, className: classe }); b.onclick = acao; return b; }
  function montarLoja() {
    for (const a of abas) a.setAttribute('aria-selected', String(a.dataset.aba === aba));
    const e = jogo.estado, nj = jogo.nivelJogador(), lista = el('ul', { className: 'lista' });
    if (aba === 'sementes') {
      const horta = jogo.nivel('horta') > 0;
      lojaCorpo.replaceChildren(el('small', { className: 'dica', textContent: horta ? 'Cada pacote planta um canteiro. Escolha o que o agricultor planta na horta.' : 'Construa a horta (painel Construir) para o agricultor plantar.' }), lista);
      for (const [k, sm] of Object.entries(Jogo.SEMENTES)) {
        const pr = Jogo.PRODUTOS[k], tem = e.sementes[k] || 0, travada = nj < sm.pede;
        const escolhida = e.plantio === k;
        const b1 = botao(`+1 · ${sm.preco} 🪙`, !travada && e.moedas >= sm.preco, () => comprar(() => jogo.comprarSemente(k, 1)));
        const b5 = botao(`+5 · ${sm.preco * 5} 🪙`, !travada && e.moedas >= sm.preco * 5, () => comprar(() => jogo.comprarSemente(k, 5)));
        const bp = botao(escolhida ? 'Plantando' : 'Plantar', !travada && !escolhida, () => { e.plantio = k; jogo.salvar(); montarLoja(); avisar(`O agricultor vai plantar ${pr.nome.toLowerCase()}`); }, escolhida ? 'marcado' : 'leve');
        lista.append(linha(pr.icone, pr.nome, travada ? `Libera no nível ${sm.pede}` : `você tem ${tem} · colheita vale ${2 * jogo.precoVenda(k)} 🪙`, travada ? [] : [b1, b5, bp]));
      }
    } else if (aba === 'animais') {
      lojaCorpo.replaceChildren(el('small', { className: 'dica', textContent: 'Os animais entram pela porteira. Evolua o curral para caber mais.' }), lista);
      for (const [id, a] of Object.entries(Jogo.ANIMAIS)) {
        const n = jogo.nivel(id), cap = n ? bichos.QTD[id][n - 1] : 0, tem = Math.min(cap, e.animais[id] || 0);
        const sub = !n ? `Construa o ${Jogo.NOMES[id].toLowerCase()} primeiro` : `${tem}/${cap} no ${Jogo.NOMES[id].toLowerCase()}`;
        lista.append(linha(a.icone, a.nome, sub, n ? [botao(tem >= cap ? 'Cheio' : `Comprar · ${a.preco} 🪙`, tem < cap && e.moedas >= a.preco, () => comprar(() => {
          const m = jogo.comprarAnimal(id, cap); if (m) return m;
          bichos.ajustar(C.currais.find(c => c.id === id), true); som.animal(a.nome === 'Galinha' ? 'galinha' : { Porco: 'porco', Ovelha: 'ovelha', Vaca: 'vaca' }[a.nome], ...C.pontosPorteira(C.currais.find(c => c.id === id)).dentro);
          return '';
        }))] : []));
      }
    } else {
      lojaCorpo.replaceChildren(el('small', { className: 'dica', textContent: 'Compre e clique no gramado para colocar (fora das estradas e dos lotes).' }), lista);
      for (const d of Object.values(DEC.DECOR)) {
        const travada = nj < d.pede;
        lista.append(linha(d.icone, d.nome, travada ? `Libera no nível ${d.pede}` : `${decoracoes.filter(o => o.d === d).length} colocados`, travada ? [] : [botao(`Colocar · ${d.preco} 🪙`, !jogo.podeDecor(d), () => { abrirLoja(false); iniciarColocar(d); })]));
      }
    }
  }
  function comprar(f) { const m = f(); if (m) avisar(m); else som.menu('moedas'); montarLoja(); atualizarBotoes(); }
  function abrirLoja(abrir = true) { lojaDlg.hidden = !abrir; if (abrir) montarLoja(); setTimeout(() => som.menu(abrir ? 'abrir' : 'fechar'), 0); }
  for (const a of abas) a.onclick = () => { aba = a.dataset.aba; montarLoja(); };
  document.getElementById('bLoja').onclick = () => abrirLoja(lojaDlg.hidden);
  document.getElementById('bFecharLoja').onclick = () => abrirLoja(false);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lojaDlg.hidden) abrirLoja(false); });

  // ---------- decorações no mapa ----------
  let colocando = null, fantasma = null;
  const faixaColocar = document.getElementById('colocando');
  function iniciarColocar(d) { colocando = d; fantasma = null; faixaColocar.hidden = false; faixaColocar.firstChild.textContent = `Clique no gramado para colocar: ${d.nome} · ${d.preco} 🪙 `; }
  function pararColocar() { colocando = null; fantasma = null; faixaColocar.hidden = true; }
  document.getElementById('bCancelarColocar').onclick = pararColocar;
  addEventListener('keydown', e => { if (e.key === 'Escape' && colocando) pararColocar(); });
  /** cabe ali? só no gramado: fora de estrada, rio, lotes, construções e outras decorações */
  function lugarLivre(d, x, y) {
    const [a, b, c, e] = DEC.pegada(d, x, y);
    if (a < 40 || b < 60 || c > W - 40 || e > H - 30) return false;
    for (const l of lotes) if (c > l.x - 16 && a < l.x + l.w + 16 && e > l.y - 16 && b < l.y + l.h + 16) return false;
    for (let yy = b; yy <= e; yy += 8) for (let xx = a; xx <= c; xx += 8) {
      if (custo[Math.floor(xx / GC) + Math.floor(yy / GC) * GX] !== 1 || estrada.borda(xx, yy) < 14 || decorEm(xx, yy, 14)) return false;
    }
    return true;
  }
  function montarDecor(o) { o.cv = DEC.assar(o.d, o.x, o.y, qPredio()); o.cq = qPredio(); }
  function porDecor(k, x, y) {
    const d = DEC.DECOR[k]; if (!d) return;
    const o = { d, x, y }; montarDecor(o); decoracoes.push(o);
    grama.aparar(x, y - d.d * 0.4, d.w * 0.42, 0.6); // só baixa um pouco o capim no pé (sem buraco em volta)
    recalcularCusto(x - d.w, y - d.d - 20, x + d.w, y + 20); montarCustoDentro();
  }
  function colocarDecor(x, y) {
    const d = colocando;
    if (!lugarLivre(d, x, y)) { avisar('Aí não dá: escolha um pedaço de gramado livre'); return; }
    const m = jogo.comprarDecor(d, x, y); if (m) { avisar(m); pararColocar(); return; }
    porDecor(d.id, Math.round(x), Math.round(y)); som.menu('obra'); avisar(`${d.nome} colocado`);
    for (let i = 0; i < 18; i++) poeira.push({ x: x + (Math.random() - 0.5) * d.w, y: y - Math.random() * 10, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 16, vida: -Math.random() * 0.3, dura: 1 + Math.random() * 0.6, r: 6 + Math.random() * 8 });
    pararColocar(); atualizarBotoes();
  }
  tela.addEventListener('pointermove', e => { if (colocando && e.pointerType === 'mouse') fantasma = [cam.x + e.clientX / cam.zoom, cam.y + e.clientY / cam.zoom]; });
  function extrasDecor() {
    const out = [], qp = qPredio();
    for (const o of decoracoes) {
      const c = DEC.caixa(o.d, o.x, o.y);
      if (c[2] < cam.x || c[0] > cam.x + cam.largura || c[3] < cam.y || c[1] > cam.y + cam.altura) continue;
      if (o.cq !== qp && performance.now() - zoomMudou > 300) montarDecor(o);
      out.push({ y: o.y, desenhar: () => ctx.drawImage(o.cv, c[0], c[1], c[2] - c[0], c[3] - c[1]) });
    }
    if (colocando && fantasma) {
      const [x, y] = fantasma, d = colocando, ok = lugarLivre(d, x, y);
      if (!fantasma.cv || fantasma.d !== d) { fantasma.cv = DEC.assar(d, 0, 0, 1.5); fantasma.d = d; }
      const c = DEC.caixa(d, x, y), cv = fantasma.cv;
      out.push({ y: 1e9, desenhar: () => {
        const [a, b, cc, dd] = DEC.pegada(d, x, y);
        ctx.fillStyle = ok ? 'rgba(160,230,110,.35)' : 'rgba(230,80,60,.4)'; ctx.beginPath(); ctx.ellipse((a + cc) / 2, (b + dd) / 2, (cc - a) / 2 + 8, (dd - b) / 2 + 6, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.7; ctx.drawImage(cv, c[0], c[1], c[2] - c[0], c[3] - c[1]); ctx.globalAlpha = 1;
      } });
    }
    return out;
  }
  for (const o of jogo.estado.decor) porDecor(o.k, o.x, o.y);

  // ---------- caminhão: vem buscar a venda no celeiro ----------
  const CAM = Caminhao.criar(Construcoes.util), imgsCam = {};
  let caminhao = null, gradeEstrada = null;
  const imgCam = (vista, carga) => { const k = vista + carga + qPredio(); return imgsCam[k] || (imgsCam[k] = CAM.assar(vista, carga, qPredio())); };
  function rotaCaminhao() {
    if (!gradeEstrada) { gradeEstrada = new Float32Array(custo.length); for (let i = 0; i < custo.length; i++) gradeEstrada[i] = custo[i] > 0 && custo[i] < 1 ? 1 : 0; }
    const cel = predios.find(p => p.id === 'celeiro').e, [fx, fy] = pontoLivre(gradeEstrada, cel.porta[0], cel.porta[1] + 60), [ix, iy] = pontoLivre(gradeEstrada, 40, P.y + 50);
    const pts = rota(ix, iy, fx, fy, gradeEstrada); if (!pts || pts.length < 2) return null;
    let q = [[0, iy], ...pts]; // entra pela beirada do mapa
    for (let k = 0; k < 3; k++) { const n = [q[0]]; for (let i = 0; i < q.length - 1; i++) { const [a, b] = [q[i], q[i + 1]]; n.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } n.push(q[q.length - 1]); q = n; } // curvas suaves
    const dist = [0]; for (let i = 1; i < q.length; i++) dist.push(dist[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
    return { pts: q, dist, total: dist[dist.length - 1] };
  }
  function pontoNa(r, s) {
    let i = 1; while (i < r.dist.length - 1 && r.dist[i] < s) i++;
    const a = r.pts[i - 1], b = r.pts[i], t = Math.max(0, Math.min(1, (s - r.dist[i - 1]) / ((r.dist[i] - r.dist[i - 1]) || 1)));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, b[0] - a[0], b[1] - a[1]];
  }
  const foraDaTela = (x, y) => x < cam.x - 220 || x > cam.x + cam.largura + 220 || y < cam.y - 220 || y > cam.y + cam.altura + 220;
  function chamarCaminhao(valor) {
    if (caminhao && caminhao.fase !== 'voltando') { caminhao.valor += valor; return; }
    const r = rotaCaminhao(); if (!r) { flutuarCeleiro(valor); return; }
    // começa logo fora da tela (pela estrada), para chegar rápido
    let s = r.total - 40; while (s > 0) { const [x, y] = pontoNa(r, s); if (foraDaTela(x, y)) break; s -= 40; }
    if (s < 0) s = 0;
    caminhao = { r, s, fase: 'indo', valor, t: 0, vista: 'lado', vira: 1, vel: 0, motor: som.motor() };
    avisar('O caminhão está vindo buscar a carga');
  }
  function flutuarCeleiro(v) { const pr = predios.find(p => p.id === 'celeiro'); flutuar(pr.e.porta[0], pr.e.porta[1] - 70, `+${v} 🪙`); }
  function atualizarCaminhao(dt) {
    const k = caminhao; if (!k) return;
    if (k.fase === 'carregando') {
      k.t += dt; k.vel = 0;
      if (k.t > 3.2) { k.fase = 'voltando'; k.carga = 1; flutuarCeleiro(k.valor); som.menu('moedas'); }
    } else {
      const ida = k.fase === 'indo', falta = ida ? k.r.total - k.s : k.s;
      const alvo = ida ? Math.min(330, 40 + falta * 1.4) : Math.min(330, 60 + (k.r.total - k.s) * 1.2 + 30);
      k.vel += (alvo - k.vel) * Math.min(1, dt * 2.2);
      k.s += (ida ? 1 : -1) * k.vel * dt;
      if (ida && k.s >= k.r.total - 2) { k.s = k.r.total; k.fase = 'carregando'; k.t = 0; som.trabalho('buzina', ...pontoNa(k.r, k.s)); }
      if (!ida && (k.s <= 0 || (foraDaTela(...pontoNa(k.r, k.s)) && k.r.total - k.s > 600))) { if (k.motor) k.motor.parar(); caminhao = null; return; }
    }
    const [x, y, dx0, dy0] = pontoNa(k.r, k.s), dx = k.fase === 'voltando' ? -dx0 : dx0, dy = k.fase === 'voltando' ? -dy0 : dy0;
    if (k.fase !== 'carregando' && Math.hypot(dx, dy) > 0.1) { // vista pela direção (com folga, para não ficar trocando)
      const lado = Math.abs(dx) > Math.abs(dy) * (k.vista === 'lado' ? 0.6 : 1.4);
      k.vista = lado ? 'lado' : dy > 0 ? 'frente' : 'tras'; if (lado) k.vira = dx >= 0 ? 1 : -1;
    }
    k.x = x; k.y = y;
    if (k.motor) k.motor.mover(x, y, k.vel);
    if (quadros % 3 === 0) grama.pisar(x, y, dx, dy, ultimo / 1000, 40, 4);
  }
  function extrasCaminhao() {
    const k = caminhao; if (!k || k.x == null) return [];
    const im = imgCam(k.vista, k.carga ? 1 : 0), [a, b, c, d] = im.caixa, sac = k.fase === 'carregando' ? 0 : Math.sin(ultimo / 70) * 0.5;
    return [{ y: k.y, desenhar: () => { ctx.save(); ctx.translate(k.x, k.y + sac); if (k.vista === 'lado' && k.vira < 0) ctx.scale(-1, 1); ctx.drawImage(im.cv, a, b, c - a, d - b); ctx.restore(); } }];
  }

  // ---------- testes (Opções): moedas, nível e sementes de graça para experimentar o jogo ----------
  function presente(f, texto) { f(jogo.estado); jogo.salvar(); som.menu('moedas'); avisar(texto); atualizarBotoes(); if (!lojaDlg.hidden) montarLoja(); }
  document.getElementById('tMoedas').onclick = () => presente(e => { e.moedas += 1000; }, '+1.000 moedas para testar');
  document.getElementById('tMoedas10').onclick = () => presente(e => { e.moedas += 10000; }, '+10.000 moedas para testar');
  document.getElementById('tNivel').onclick = () => presente(e => { e.xp = (Math.floor(e.xp / 100) + 1) * 100; }, `Agora você está no nível ${jogo.nivelJogador() + 1}`);
  document.getElementById('tSementes').onclick = () => presente(e => { for (const k in Jogo.SEMENTES) e.sementes[k] = (e.sementes[k] || 0) + 10; }, '+10 pacotes de cada semente');
  document.getElementById('tZerar').onclick = () => {
    if (!confirm('Apagar o progresso do mapa novo e começar do zero? (o jogo antigo não é afetado)')) return;
    try { localStorage.setItem(Jogo.CHAVE, JSON.stringify({ versao: 1, niveis: { casa: 1 }, moedas: 150, xp: 0, armazem: {}, importado: true })); } catch (x) { /* sem armazenamento */ }
    removeEventListener('pagehide', salvarAoSair); location.reload();
  };

  if (jogo.origem === 'importado') setTimeout(() => avisar(`Trouxemos do jogo atual: ${jogo.estado.moedas} moedas e o seu nível`), 1500);
  /** construção sob o ponto (tela tocada), pelo desenho e não só pela planta */
  function predioEm(wx, wy) {
    return predios.find(({ e }) => wx > e.caixa[0] + 24 && wx < e.caixa[2] - 24 && wy > e.caixa[1] + 40 && wy < e.base);
  }

  // ---------- quadro ----------
  const medidor = document.getElementById('medidor'), carregando = document.getElementById('carregando');
  let ultimo = 0, gasto = 0, quadros = 0, pronto = false;
  function qualidade() {
    const S = cam.escala;
    return S <= 1.05 ? 1 : S <= 1.3 ? 1.25 : S <= 1.6 ? 1.5 : S <= 2.1 ? 2 : 2.5;
  }
  // resolução automática: se o PC não aguenta 30 quadros/s, a tela é desenhada com menos pontos (e volta quando sobra)
  let mediaQ = 33, ultimoReal = 0, lentoDesde = 0, rapidoDesde = 0, escalaRes = 1;
  function ajustarResolucao(t) {
    if (!pronto) return;
    const muda = d => { escalaRes = Math.max(0.45, Math.min(1, escalaRes + d)); dpr = Math.max(0.6, DPR0 * escalaRes); medir(); mediaQ = 33; lentoDesde = rapidoDesde = 0; };
    if (mediaQ > 44) { rapidoDesde = 0; if (!lentoDesde) lentoDesde = t; else if (t - lentoDesde > 1500 && escalaRes > 0.45) muda(-0.15); }
    else if (mediaQ < 35 && escalaRes < 1) { lentoDesde = 0; if (!rapidoDesde) rapidoDesde = t; else if (t - rapidoDesde > 6000) muda(0.15); }
    else lentoDesde = rapidoDesde = 0;
  }
  function quadro(t) {
    requestAnimationFrame(quadro);
    if (t - ultimo < 1000 / 30 - 2) return;
    if (ultimoReal && document.visibilityState === 'visible') mediaQ = mediaQ * 0.9 + Math.min(120, t - ultimoReal) * 0.1; // um engasgo sozinho não derruba a resolução
    ultimoReal = t;
    ajustarResolucao(t);
    desenharQuadro(t);
  }
  function desenharQuadro(t) {
    const dt = Math.min(0.1, (t - ultimo) / 1000), agora = t / 1000, ini = performance.now();
    ultimo = t; quadros++;
    // qualidade do desenho acompanha o zoom (depois que o zoom para de mudar)
    if (performance.now() - zoomMudou > 300) {
      grama.q = qualidade();
      const qp = qPredio();
      for (const p of predios) if (p.cq !== qp && !p.anim) assar(p, qp);
      if (qCurrais !== qp) { C.assar(qp); qCurrais = qp; }
    }
    grama.longe = cam.zoom < 0.72; // de longe o capim vira placas prontas (bem mais leve)
    grama.orcamentoMs = !pronto ? 120 : predios.some(p => p.anim) ? 26 : 9; // na obra, o gramado em volta se refaz debaixo da poeira
    C.atualizar(dt);
    equipe.atualizar(dt, agora);
    bichos.atualizar(dt, agora, grama, equipe.gente());
    clima.atualizar(dt); ouvir(dt); atualizarCaminhao(dt);

    const S = cam.escala;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#36401e'; ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    // chão
    let faltaChao = 0;
    const qc = Math.min(grama.q, 2);
    for (let ty = Math.floor(cam.y / T); ty <= Math.floor((cam.y + cam.altura) / T); ty++)
      for (let tx = Math.floor(cam.x / T); tx <= Math.floor((cam.x + cam.largura) / T); tx++) {
        let lad = ladrilhos.get(tx + ',' + ty);
        if (!lad || lad.cq !== qc) {
          if (performance.now() - ini < (pronto ? 14 : 400) || !lad) lad = ladrilho(tx, ty, qc); else faltaChao++;
        }
        lad.visto = quadros;
        ctx.drawImage(lad.cv, tx * T, ty * T, T + 1.5 / S, T + 1.5 / S); // sobra de 1,5 ponto: sem emenda entre ladrilhos
      }
    if (quadros % 90 === 0) for (const [k, lad] of ladrilhos) if (quadros - lad.visto > 300) ladrilhos.delete(k);
    desenharAgua(cam, agora, dt);
    const faltaCapim = grama.quadro(ctx, cam, agora, [...extraPonte, ...extrasPredios, ...C.extras(ctx, cam, agora), ...bichos.extras(ctx, cam, agora), ...equipe.extras(ctx, cam, agora), ...extrasDecor(), ...extrasCaminhao()]);
    ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    sombras();
    particulas(dt, agora);
    clima.desenhar(ctx, cam, S, dpr, cssW, cssH, dt, agora); ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    equipe.rotulos(ctx, cam.zoom);
    desenharFlutuantes(dt);
    if (mostrarLotes) desenharLotes();
    if (aviso && performance.now() < avisoAte) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = '600 15px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(28,34,18,.85)'; const tw = ctx.measureText(aviso).width;
      ctx.beginPath(); ctx.roundRect(cssW / 2 - tw / 2 - 14, 18, tw + 28, 32, 16); ctx.fill();
      ctx.fillStyle = '#fff8e0'; ctx.fillText(aviso, cssW / 2, 39); ctx.textAlign = 'start';
    }
    desenharMini();

    if (!pronto && !faltaCapim && !faltaChao) { pronto = true; carregando.hidden = true; }
    gasto = gasto * 0.9 + (performance.now() - ini) * 0.1;
    if (quadros % 15 === 0) {
      const e = grama.estat;
      const ce = clima.estado; relogio.textContent = `${clima.noite > 0.5 ? '🌙' : ce.hora > 17 || ce.hora < 7.2 ? '🌅' : '☀️'} ${clima.relogio()}${clima.chuva > 0.15 ? ' · chovendo' : ''}`;
      medidor.textContent = `${Math.round(1000 / mediaQ)} quadros/s${escalaRes < 1 ? ` (resolução ${Math.round(escalaRes * 100)}%)` : ''} · ${gasto.toFixed(1)} ms/quadro · zoom ${cam.zoom.toFixed(2)} · capim ${e.desenhados}/${e.comDados} pedaços · chão ${ladrilhos.size}`;
    }
  }
  requestAnimationFrame(quadro);

  // para conferir no console / testes
  window.prototipoMapa = {
    cam, grama, agricultor, rota, centrar, ajustarZoom, ladrilhos, equipe, bichos, currais: C, som, clima, jogo, get caminhao() { return caminhao; }, chamarCaminhao, lugarLivre, decoracoes, get pronto() { return pronto; }, get gasto() { return gasto; },
    /** desenha n quadros seguidos e espera a placa de vídeo terminar (getImageData): ms por quadro de verdade */
    medir(n = 20) { const i = performance.now(); for (let k = 0; k < n; k++) { desenharQuadro(ultimo + 33.4); ctx.getImageData(0, 0, 1, 1); } return (performance.now() - i) / n; },
  };
})();
