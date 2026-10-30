// Casa e celeiro do mapa novo, desenhados em vetor (Canvas 2D) e assados numa imagem na resolução do zoom: nada
// pixelado. Vista de cima e de frente, como a ponte: a parede da frente sobe a partir do chão e o telhado ocupa a
// planta da construção deslocada para cima. Sol a noroeste (luz da esquerda e de cima).
//
// Casa colonial de fazenda: paredes caiadas, barrado de cor, janelas com folhas de madeira abertas, telha colonial.
//   nível 1: casinha;  2: maior, chaminé, cobertura na porta, floreiras;  3: casa-sede com anexo, varanda, mansardas.
// Celeiro:
//   nível 1: paiol de tábuas;  2: celeiro vermelho de telhado quebrado (holandês);  3: maior, puxado com feno e silo.
(function (raiz) {
  'use strict';

  // ---------- utilidades ----------
  function sorteio(semente) { let s = semente % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  /** cor h clareada/escurecida por k (1 = igual), com transparência a */
  function tom(h, k = 1, a = 1) { const [r, g, b] = rgb(h); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; }
  function caminho(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
  function degradeV(g, y0, y1, paradas) { const d = g.createLinearGradient(0, y0, 0, y1); paradas.forEach(([t, c]) => d.addColorStop(t, c)); return d; }
  function degradeH(g, x0, x1, paradas) { const d = g.createLinearGradient(x0, 0, x1, 0); paradas.forEach(([t, c]) => d.addColorStop(t, c)); return d; }

  // ---------- telha colonial ----------
  const TELHAS = ['#b8582f', '#ad4f2a', '#c2643a', '#a1482a', '#b95e36', '#a9572f', '#c86d42', '#9c4f2f'];
  /** água do telhado vista de frente: colunas de capas, fiadas de baixo para cima (a de cima cobre a ponta da de baixo) */
  function telhado(g, x0, x1, yTop, yBot, r, luz = 1, tw = 13) {
    const alt = yBot - yTop, n = Math.max(2, Math.round(alt / 15)), th = alt / n, cols = Math.ceil((x1 - x0) / tw);
    g.save(); g.beginPath(); g.rect(x0, yTop - 3, x1 - x0, alt + 10); g.clip();
    g.fillStyle = degradeV(g, yTop, yBot, [[0, tom('#5f2611', luz)], [1, tom('#7a3318', luz)]]);
    g.fillRect(x0, yTop - 3, x1 - x0, alt + 10);
    for (let i = n - 1; i >= 0; i--) {
      const y0 = yTop + i * th;
      for (let c = 0; c < cols; c++) {
        const xc = x0 + c * tw + tw / 2 + (r() - 0.5) * 0.9, hw = tw * 0.41, base = TELHAS[Math.floor(r() * TELHAS.length)], k = luz * (0.9 + r() * 0.2);
        g.fillStyle = 'rgba(45,16,6,.42)'; g.beginPath(); g.ellipse(xc + 1.2, y0 + th + 2.6, hw * 1.06, 3.3, 0, 0, 7); g.fill();
        g.fillStyle = degradeH(g, xc - hw, xc + hw, [[0, tom(base, k * 1.2)], [0.33, tom(base, k * 1.07)], [0.72, tom(base, k * 0.82)], [1, tom(base, k * 0.6)]]);
        g.beginPath(); g.moveTo(xc - hw * 0.84, y0 - 2); g.lineTo(xc + hw * 0.84, y0 - 2); g.lineTo(xc + hw, y0 + th);
        g.quadraticCurveTo(xc, y0 + th + 4.6, xc - hw, y0 + th); g.closePath(); g.fill();
        g.strokeStyle = tom(base, k * 1.4, 0.55); g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(xc - hw * 0.36, y0); g.lineTo(xc - hw * 0.44, y0 + th); g.stroke();
        if (r() < 0.08) { g.fillStyle = `rgba(112,116,62,${0.22 + r() * 0.22})`; g.beginPath(); g.ellipse(xc + (r() - 0.5) * hw, y0 + th * (0.3 + r() * 0.5), 2 + r() * 3, 1.4 + r() * 2, 0, 0, 7); g.fill(); }
        if (r() < 0.05) { g.fillStyle = 'rgba(35,18,8,.2)'; g.beginPath(); g.ellipse(xc, y0 + th * 0.6, hw * 0.8, th * 0.4, 0, 0, 7); g.fill(); }
      }
    }
    // volume: mais claro no alto e à esquerda (sol), mais escuro perto do beiral e à direita
    g.fillStyle = degradeV(g, yTop, yBot, [[0, 'rgba(255,236,210,.13)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(40,14,4,.16)']]); g.fillRect(x0, yTop - 3, x1 - x0, alt + 10);
    g.fillStyle = degradeH(g, x0, x1, [[0, 'rgba(255,240,220,.08)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(30,10,0,.14)']]); g.fillRect(x0, yTop - 3, x1 - x0, alt + 10);
    g.restore();
  }
  /** a água de trás aparece estreita acima da cumeeira */
  function telhadoTras(g, x0, x1, yTop, yBot, r) {
    g.fillStyle = degradeV(g, yTop, yBot, [[0, '#7a3519'], [1, '#5a2410']]); g.fillRect(x0, yTop, x1 - x0, yBot - yTop);
    for (let x = x0; x < x1; x += 13) {
      const k = 0.75 + r() * 0.2;
      g.fillStyle = degradeH(g, x + 1, x + 12, [[0, tom('#b8582f', k * 1.05)], [1, tom('#b8582f', k * 0.6)]]);
      g.fillRect(x + 1.5, yTop, 10, yBot - yTop);
    }
    for (let y = yTop + 12; y < yBot; y += 13) { g.fillStyle = 'rgba(40,14,6,.3)'; g.fillRect(x0, y, x1 - x0, 1.6); }
  }
  /** cumeeira: capas deitadas assentadas com massa */
  function cumeeira(g, x0, x1, y, r) {
    g.fillStyle = 'rgba(222,210,188,.92)'; g.fillRect(x0, y - 6, x1 - x0, 11);
    for (let x = x0 - 4; x < x1; x += 17) {
      const base = TELHAS[Math.floor(r() * TELHAS.length)];
      g.fillStyle = 'rgba(40,14,6,.35)'; g.beginPath(); g.ellipse(x + 11, y + 2.5, 11, 5, 0, 0, 7); g.fill();
      g.fillStyle = degradeV(g, y - 6, y + 5, [[0, tom(base, 1.25)], [0.5, tom(base, 1)], [1, tom(base, 0.62)]]);
      g.beginPath(); g.ellipse(x + 10, y, 11.5, 5.6, 0, 0, 7); g.fill();
    }
  }
  /** beiral: bocas das telhas e a sombra que o beiral faz na parede */
  function beiral(g, x0, x1, xp0, xp1, y, r) {
    g.fillStyle = degradeV(g, y, y + 22, [[0, 'rgba(50,30,15,.5)'], [1, 'rgba(50,30,15,0)']]); g.fillRect(xp0, y, xp1 - xp0, 22);
    for (let x = x0 + 6.5; x < x1; x += 13) {
      g.fillStyle = 'rgba(232,222,204,.9)'; g.beginPath(); g.ellipse(x, y + 1.5, 5.6, 3.2, 0, 0, 7); g.fill();
      g.fillStyle = '#3a190b'; g.beginPath(); g.ellipse(x, y + 1.8, 3.9, 2.1, 0, 0, 7); g.fill();
    }
    void r;
  }
  /** argamassa clara nas bordas laterais do telhado */
  function bordasTelhado(g, x0, x1, yTop, yBot) {
    for (const x of [x0, x1]) {
      g.fillStyle = 'rgba(40,16,6,.55)'; g.fillRect(x - 1.5, yTop, 3, yBot - yTop + 3);
      g.fillStyle = 'rgba(224,212,190,.9)'; g.fillRect(x + (x === x0 ? 1.5 : -5.5), yTop, 4, yBot - yTop + 2);
    }
  }

  // ---------- paredes, janelas, portas ----------
  function parede(g, x0, y0, x1, y1, r, barra = '#b4653d') {
    g.fillStyle = degradeV(g, y0, y1, [[0, '#e6dcc6'], [0.25, '#efe7d4'], [1, '#ece2cd']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const n = Math.round(((x1 - x0) * (y1 - y0)) / 45);
    for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.55 ? 'rgba(140,118,86,.07)' : 'rgba(255,255,255,.18)'; g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 0.8 + r() * 1.8, 0.8 + r() * 1.8); }
    for (let i = 0; i < 5; i++) { // manchas de umidade perto do chão
      const x = x0 + r() * (x1 - x0), rr = 14 + r() * 26, d = g.createRadialGradient(x, y1 - 14, 0, x, y1 - 14, rr);
      d.addColorStop(0, 'rgba(150,122,82,.13)'); d.addColorStop(1, 'rgba(150,122,82,0)'); g.fillStyle = d; g.fillRect(x - rr, y1 - 14 - rr, rr * 2, rr * 2);
    }
    // barrado colorido com respingos de terra
    g.fillStyle = barra; g.fillRect(x0, y1 - 15, x1 - x0, 15);
    g.fillStyle = tom(barra, 0.75); g.fillRect(x0, y1 - 16, x1 - x0, 2);
    g.fillStyle = degradeV(g, y1 - 15, y1, [[0, 'rgba(255,240,220,.08)'], [1, 'rgba(70,45,25,.35)']]); g.fillRect(x0, y1 - 15, x1 - x0, 15);
    for (let i = 0; i < (x1 - x0) / 3; i++) { g.fillStyle = 'rgba(90,62,35,.25)'; g.fillRect(x0 + r() * (x1 - x0), y1 - r() * 9, 1 + r() * 1.5, 1 + r() * 1.5); }
    // cunhais (cantos)
    for (const [x, k] of [[x0, 1.02], [x1 - 9, 0.9]]) {
      g.fillStyle = tom('#e4d9c2', k); g.fillRect(x, y0, 9, y1 - y0 - 16);
      g.fillStyle = 'rgba(90,70,45,.18)'; g.fillRect(x === x0 ? x + 9 : x - 1.5, y0, 1.5, y1 - y0 - 16);
    }
  }
  function janela(g, x, yTop, ww, wh, cor, r, floreira) {
    const fw = ww * 0.42;
    // folhas abertas (sombra delas no reboco, depois a madeira)
    for (const s of [-1, 1]) {
      const fx = s < 0 ? x - 7 - fw : x + ww + 7;
      g.fillStyle = 'rgba(60,45,30,.2)'; g.fillRect(fx + 3, yTop + 2, fw, wh + 2);
      g.fillStyle = degradeH(g, fx, fx + fw, s < 0 ? [[0, tom(cor, 1.15)], [1, tom(cor, 0.95)]] : [[0, tom(cor, 1.02)], [1, tom(cor, 0.8)]]);
      g.fillRect(fx, yTop - 1, fw, wh + 2);
      g.strokeStyle = tom(cor, 0.6, 0.7); g.lineWidth = 1;
      g.strokeRect(fx + 0.5, yTop - 0.5, fw - 1, wh + 1);
      for (const t of [0.33, 0.66]) { g.beginPath(); g.moveTo(fx + fw * t, yTop + 2); g.lineTo(fx + fw * t, yTop + wh - 2); g.stroke(); }
      g.fillStyle = tom(cor, 1.25, 0.5); g.fillRect(fx + 2, yTop + wh * 0.18, fw - 4, 2); g.fillRect(fx + 2, yTop + wh * 0.72, fw - 4, 2);
      g.fillStyle = '#2b2622'; for (const t of [0.18, 0.78]) g.fillRect(s < 0 ? fx + fw - 2 : fx, yTop + wh * t, 3, 3);
    }
    // moldura de massa em relevo
    g.fillStyle = 'rgba(70,52,32,.22)'; g.fillRect(x - 5, yTop - 4, ww + 12, wh + 12);
    g.fillStyle = '#e2d7c0'; g.fillRect(x - 6, yTop - 6, ww + 12, wh + 12);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - 6, yTop - 6, ww + 12, 1.5);
    // vão: interior escuro, cortina, vidro com reflexo do céu
    g.fillStyle = degradeV(g, yTop, yTop + wh, [[0, '#1c2124'], [1, '#3b4247']]); g.fillRect(x, yTop, ww, wh);
    g.fillStyle = 'rgba(218,196,156,.55)'; g.fillRect(x + 2, yTop + 2, ww * 0.2, wh - 4); g.fillRect(x + ww - 2 - ww * 0.2, yTop + 2, ww * 0.2, wh - 4);
    const ref = g.createLinearGradient(x, yTop, x + ww, yTop + wh);
    ref.addColorStop(0, 'rgba(205,228,242,.6)'); ref.addColorStop(0.42, 'rgba(140,170,190,.22)'); ref.addColorStop(0.5, 'rgba(225,238,246,.45)');
    ref.addColorStop(0.58, 'rgba(120,150,170,.18)'); ref.addColorStop(1, 'rgba(90,110,120,.12)');
    g.fillStyle = ref; g.fillRect(x, yTop, ww, wh);
    g.strokeStyle = '#f3efe5'; g.lineWidth = 2.2; g.strokeRect(x + 1.1, yTop + 1.1, ww - 2.2, wh - 2.2);
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + ww / 2, yTop); g.lineTo(x + ww / 2, yTop + wh);
    for (const t of [1 / 3, 2 / 3]) { g.moveTo(x, yTop + wh * t); g.lineTo(x + ww, yTop + wh * t); }
    g.stroke();
    // peitoril
    g.fillStyle = 'rgba(60,40,20,.28)'; g.fillRect(x - 8, yTop + wh + 7, ww + 16, 4);
    g.fillStyle = '#d4c8ae'; g.fillRect(x - 9, yTop + wh + 2, ww + 18, 6);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x - 9, yTop + wh + 2, ww + 18, 1.4);
    if (floreira) flores(g, x - 4, yTop + wh + 8, ww + 8, r);
  }
  function flores(g, x, y, w, r) {
    g.fillStyle = 'rgba(50,35,20,.3)'; g.fillRect(x + 2, y + 2, w, 12);
    g.fillStyle = degradeV(g, y, y + 11, [[0, '#8a5b37'], [1, '#5f3c22']]); g.fillRect(x, y, w, 11);
    g.fillStyle = 'rgba(255,230,200,.25)'; g.fillRect(x, y, w, 1.5);
    const FL = ['#d8344a', '#f06a8c', '#f5c542', '#ffffff', '#c83a7a'];
    for (let i = 0; i < w * 0.9; i++) {
      const fx = x + 2 + r() * (w - 4), fy = y + 1 - r() * 9;
      g.fillStyle = r() < 0.5 ? '#3f6b2a' : '#57883a'; g.beginPath(); g.ellipse(fx, fy, 2.6, 1.8, r() * 3, 0, 7); g.fill();
    }
    for (let i = 0; i < w * 0.35; i++) {
      const fx = x + 3 + r() * (w - 6), fy = y - 2 - r() * 8, c = FL[Math.floor(r() * FL.length)];
      g.fillStyle = c; g.beginPath(); g.arc(fx, fy, 1.7 + r() * 0.9, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,240,150,.9)'; g.beginPath(); g.arc(fx, fy, 0.6, 0, 7); g.fill();
    }
  }
  function porta(g, cx, yChao, dw, dh, cor, bandeira) {
    const x = cx - dw / 2, yTop = yChao - dh, bh = bandeira ? 15 : 0;
    g.fillStyle = 'rgba(70,52,32,.22)'; g.fillRect(x - 5, yTop - bh - 4, dw + 12, dh + bh + 4);
    g.fillStyle = '#e2d7c0'; g.fillRect(x - 6, yTop - bh - 6, dw + 12, dh + bh + 6);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - 6, yTop - bh - 6, dw + 12, 1.5);
    if (bandeira) { // bandeira de vidro em leque sobre a porta
      g.fillStyle = degradeV(g, yTop - bh, yTop, [[0, '#9fbccc'], [1, '#43525a']]); g.fillRect(x, yTop - bh, dw, bh - 2);
      g.strokeStyle = '#f3efe5'; g.lineWidth = 1.4; g.beginPath();
      for (let i = 1; i < 6; i++) { g.moveTo(cx, yTop - 2); g.lineTo(x + (dw * i) / 6, yTop - bh); }
      g.stroke(); g.strokeRect(x + 0.7, yTop - bh + 0.7, dw - 1.4, bh - 3.4);
    }
    for (const [lx, k] of [[x, 1.08], [cx, 0.92]]) {
      g.fillStyle = degradeH(g, lx, lx + dw / 2, [[0, tom(cor, k * 1.1)], [1, tom(cor, k * 0.9)]]); g.fillRect(lx, yTop, dw / 2, dh);
      for (const [py, ph] of [[0.08, 0.38], [0.54, 0.38]]) { // almofadas
        const px = lx + 4, pw = dw / 2 - 8, yy = yTop + dh * py, hh = dh * ph;
        g.fillStyle = tom(cor, k * 0.92); g.fillRect(px, yy, pw, hh);
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(px, yy, pw, 1.5); g.fillRect(px, yy, 1.5, hh);
        g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(px, yy + hh - 1.5, pw, 1.5); g.fillRect(px + pw - 1.5, yy, 1.5, hh);
      }
    }
    g.fillStyle = 'rgba(20,10,5,.6)'; g.fillRect(cx - 0.8, yTop, 1.6, dh);
    g.fillStyle = '#d9b45a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 4, yTop + dh * 0.52, 1.6, 0, 7); g.fill(); }
    // soleira de pedra
    g.fillStyle = 'rgba(40,30,15,.35)'; g.fillRect(x - 6, yChao + 2, dw + 14, 8);
    g.fillStyle = degradeV(g, yChao - 1, yChao + 7, [[0, '#cfc6b3'], [1, '#9f9784']]); g.fillRect(x - 8, yChao - 1, dw + 16, 8);
  }
  function chamine(g, x, yBase, cw, ch, r) {
    const x0 = x - cw / 2, yTop = yBase - ch;
    g.fillStyle = 'rgba(45,16,6,.4)'; caminho(g, [[x0 + cw, yBase - 4], [x0 + cw + 14, yBase - 2], [x0 + cw + 10, yBase + 8], [x0, yBase + 6]]); g.fill();
    g.fillStyle = '#a65c3e'; g.fillRect(x0, yTop, cw, ch);
    for (let y = yTop, linha = 0; y < yBase; y += 6, linha++) {
      for (let bx = x0 - (linha % 2) * 6; bx < x0 + cw; bx += 12) {
        const k = 0.85 + r() * 0.3, a = Math.max(bx, x0), b = Math.min(bx + 11, x0 + cw);
        if (b > a) { g.fillStyle = tom('#a8573a', k); g.fillRect(a, y, b - a, 5); }
      }
      g.fillStyle = 'rgba(214,200,176,.8)'; g.fillRect(x0, y + 5, cw, 1);
    }
    g.fillStyle = degradeH(g, x0, x0 + cw, [[0, 'rgba(255,230,200,.18)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(30,10,0,.35)']]); g.fillRect(x0, yTop, cw, ch);
    g.fillStyle = '#7d736a'; g.fillRect(x0 - 3, yTop - 6, cw + 6, 7);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x0 - 3, yTop - 6, cw + 6, 1.5);
    g.fillStyle = '#1d1712'; g.beginPath(); g.ellipse(x, yTop - 6, cw * 0.32, 2.2, 0, 0, 7); g.fill();
    return [x, yTop - 8];
  }
  /** mansarda (janelinha no telhado) com frontão e duas águas que somem no telhado */
  function mansarda(g, x, yBase, dw, r) {
    const fh = 30, ap = 22, yF = yBase - fh, pr = 26;
    g.fillStyle = 'rgba(45,16,6,.38)'; caminho(g, [[x + dw / 2 + 4, yBase], [x + dw / 2 + 16, yBase - 4], [x + dw / 2 + 12, yF - pr], [x + dw / 2 + 2, yF - pr]]); g.fill();
    // águas do telhadinho (voltadas para trás)
    for (const s of [-1, 1]) {
      const A = [x, yF - ap], B = [x + s * (dw / 2 + 5), yF + 2];
      g.fillStyle = s < 0 ? '#b65a32' : '#8a3d1e';
      caminho(g, [A, B, [B[0], B[1] - pr], [A[0], A[1] - pr]]); g.fill();
      g.strokeStyle = 'rgba(50,18,6,.45)'; g.lineWidth = 1;
      for (let t = 4; t < pr; t += 5) { g.beginPath(); g.moveTo(A[0], A[1] - t); g.lineTo(B[0], B[1] - t); g.stroke(); }
    }
    g.fillStyle = 'rgba(222,210,188,.9)'; g.fillRect(x - 2.5, yF - ap - pr, 5, pr + 1);
    // frente: parede e frontão
    g.fillStyle = '#ece2cd'; caminho(g, [[x - dw / 2, yBase], [x - dw / 2, yF], [x, yF - ap + 3], [x + dw / 2, yF], [x + dw / 2, yBase]]); g.fill();
    g.strokeStyle = '#d8cbb0'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - dw / 2 - 3, yF + 1); g.lineTo(x, yF - ap); g.lineTo(x + dw / 2 + 3, yF + 1); g.stroke();
    const ww = dw - 14, wh = fh - 9;
    g.fillStyle = degradeV(g, yF + 4, yF + 4 + wh, [[0, '#1c2124'], [1, '#3b4247']]); g.fillRect(x - ww / 2, yF + 4, ww, wh);
    g.fillStyle = 'rgba(205,228,242,.4)'; g.fillRect(x - ww / 2, yF + 4, ww * 0.5, wh * 0.5);
    g.strokeStyle = '#f3efe5'; g.lineWidth = 1.6; g.strokeRect(x - ww / 2, yF + 4, ww, wh);
    g.beginPath(); g.moveTo(x, yF + 4); g.lineTo(x, yF + 4 + wh); g.stroke();
    g.fillStyle = degradeV(g, yBase - 4, yBase + 3, [[0, '#a65430'], [1, '#6e2f16']]); g.fillRect(x - dw / 2 - 3, yBase - 3, dw + 6, 6);
    void r;
  }

  // ---------- corpo de casa (parede da frente + telhado de duas águas, cumeeira de leste a oeste) ----------
  const OV = 14; // beiral
  function geoCorpo(c) {
    const xL = c.cx - c.w / 2, xR = c.cx + c.w / 2, R = (c.d / 2 + OV) * 0.58;
    return { xL, xR, yEave: c.yW + OV - (c.H - 4), yRidge: c.yW - c.d / 2 - c.H - R, yBack: c.yW - c.d - OV - (c.H - 4) };
  }
  function corpoCasa(g, c, r) {
    const k = geoCorpo(c), { xL, xR } = k;
    telhadoTras(g, xL - OV, xR + OV, k.yBack, k.yRidge + 2, r);
    parede(g, xL, c.yW - c.H, xR, c.yW, r);
    // janelas e porta distribuídas
    const n = c.el.length, passo = (c.w - 24) / n;
    c.el.forEach((e, i) => {
      const x = xL + 12 + passo * (i + 0.5);
      if (e === 'J') janela(g, x - c.janela / 2, c.yW - 34 - 47, c.janela, 47, c.cor, r, c.floreira);
      else porta(g, x, c.yW, 48, c.H >= 114 ? 82 : 78, c.cor, c.H >= 114);
    });
    telhado(g, xL - OV, xR + OV, k.yRidge, k.yEave, r);
    beiral(g, xL - OV, xR + OV, xL, xR, k.yEave, r);
    bordasTelhado(g, xL - OV, xR + OV, k.yRidge, k.yEave);
    cumeeira(g, xL - OV - 2, xR + OV + 2, k.yRidge, r);
    return k;
  }

  // ---------- celeiro: madeira, chapa de zinco ----------
  function tabuas(g, contorno, x0, x1, y0, y1, base, r, bw = 11) {
    g.save(); caminho(g, contorno); g.clip();
    for (let x = x0; x < x1; x += bw) {
      const k = 0.86 + r() * 0.24;
      g.fillStyle = tom(base, k); g.fillRect(x, y0, bw, y1 - y0);
      g.strokeStyle = tom(base, k * 0.78, 0.4); g.lineWidth = 0.6;
      for (let j = 0; j < 2; j++) {
        const vx = x + 2 + r() * (bw - 4);
        g.beginPath(); g.moveTo(vx, y0); g.bezierCurveTo(vx + (r() - 0.5) * 3, y0 + (y1 - y0) * 0.3, vx + (r() - 0.5) * 3, y0 + (y1 - y0) * 0.7, vx + (r() - 0.5) * 2, y1); g.stroke();
      }
      if (r() < 0.35) { g.fillStyle = tom(base, 0.55, 0.6); g.beginPath(); g.ellipse(x + bw / 2, y0 + r() * (y1 - y0), 1.6, 2.6, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(28,10,5,.6)'; g.fillRect(x + bw - 1, y0, 1.1, y1 - y0);
      g.fillStyle = tom(base, k * 1.25, 0.45); g.fillRect(x, y0, 1, y1 - y0);
    }
    g.fillStyle = degradeV(g, y0, y1, [[0, 'rgba(255,235,205,.12)'], [0.6, 'rgba(0,0,0,0)'], [0.9, 'rgba(60,38,20,.18)'], [1, 'rgba(60,38,20,.45)']]);
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.restore();
  }
  /** água de chapa: da aresta da frente A–B até a de trás (L px acima) */
  function chapa(g, A, B, L, luz, r, cor = '#9aa2a4') {
    const pts = [A, B, [B[0], B[1] - L], [A[0], A[1] - L]];
    g.save(); caminho(g, pts); g.clip();
    g.fillStyle = tom(cor, luz); g.fill();
    for (let t = 0, i = 0; t <= L + 4; t += 4.2, i++) {
      g.strokeStyle = i % 2 ? `rgba(255,255,255,${0.13 * luz})` : 'rgba(0,0,0,.13)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(A[0], A[1] - t); g.lineTo(B[0], B[1] - t); g.stroke();
    }
    const comp = Math.hypot(B[0] - A[0], B[1] - A[1]);
    for (let t = 58 + r() * 10; t < L; t += 62 + r() * 8) { // emendas com parafusos
      g.strokeStyle = 'rgba(30,30,30,.32)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(A[0], A[1] - t); g.lineTo(B[0], B[1] - t); g.stroke();
      for (let s = 0.1; s < 1; s += 16 / comp) { g.fillStyle = 'rgba(40,40,40,.5)'; g.beginPath(); g.arc(A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s - t + 2, 0.9, 0, 7); g.fill(); }
    }
    const ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    for (let i = 0; i < (L * comp) / 2600; i++) { // ferrugem escorrida
      const s = r(), t = r() * L, x = A[0] + (B[0] - A[0]) * s, y = A[1] + (B[1] - A[1]) * s - t;
      g.fillStyle = `rgba(${140 + r() * 30},${70 + r() * 20},${30},${0.12 + r() * 0.18})`;
      g.beginPath(); g.ellipse(x, y, 6 + r() * 16, 1.5 + r() * 2.5, ang, 0, 7); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(30,30,30,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
  }
  function fardo(g, x, y, w, h, r) { // fardo de feno visto de frente e de cima
    const topo = h * 0.55;
    g.fillStyle = 'rgba(40,30,10,.35)'; g.fillRect(x + 3, y - 2, w, 5);
    g.fillStyle = degradeV(g, y - h, y, [[0, '#d8b862'], [1, '#a98a3c']]); g.fillRect(x, y - h, w, h);
    g.fillStyle = '#e7cd7c'; g.fillRect(x, y - h - topo, w, topo);
    g.strokeStyle = 'rgba(120,90,30,.55)'; g.lineWidth = 0.7;
    for (let i = 0; i < w * 0.8; i++) { const sx = x + r() * w, sy = y - h - topo + r() * (h + topo); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 6, sy + (r() - 0.5) * 3); g.stroke(); }
    g.strokeStyle = '#6b4a2a'; g.lineWidth = 1.2;
    for (const t of [0.3, 0.7]) { g.beginPath(); g.moveTo(x + w * t, y - h - topo); g.lineTo(x + w * t, y); g.stroke(); }
  }
  function contornoCeleiro(cx, yW, w, H, h1, h2) {
    const xL = cx - w / 2, xR = cx + w / 2;
    if (!h2) return [[xL, yW], [xL, yW - H], [cx, yW - H - h1], [xR, yW - H], [xR, yW]];
    return [[xL, yW], [xL, yW - H], [cx - w * 0.3, yW - H - h1], [cx, yW - H - h1 - h2], [cx + w * 0.3, yW - H - h1], [xR, yW - H], [xR, yW]];
  }
  function corpoCeleiro(g, c, r) {
    const { cx, yW, w, H, h1, h2, d } = c, xL = cx - w / 2, xR = cx + w / 2, L = d + 8;
    const cont = contornoCeleiro(cx, yW, w, H, h1, h2), topo = cont.slice(1, -1);
    // beiral: as pontas de baixo do telhado passam um pouco da parede
    const ext = (a, b, e) => { const l = Math.hypot(a[0] - b[0], a[1] - b[1]); return [a[0] + ((a[0] - b[0]) / l) * e, a[1] + ((a[1] - b[1]) / l) * e]; };
    const linha = topo.slice(); linha[0] = ext(topo[0], topo[1], 11); linha[linha.length - 1] = ext(topo[topo.length - 1], topo[topo.length - 2], 11);
    const luzes = h2 ? [0.98, 1.1, 0.8, 0.7] : [1.05, 0.76];
    for (let i = 0; i < linha.length - 1; i++) chapa(g, linha[i], linha[i + 1], L, luzes[i], r);
    // cumeeira de chapa
    const ap = topo[Math.floor(topo.length / 2)];
    g.fillStyle = '#b9c0c1'; g.fillRect(ap[0] - 3.5, ap[1] - L, 7, L);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(ap[0] + 1.5, ap[1] - L, 2, L);
    // fachada de tábuas
    tabuas(g, cont, xL, xR, yW - H - h1 - (h2 || 0), yW, c.madeira, r, c.tabua);
    // porta grande de correr
    const dw = c.portaL ?? Math.round(w * (c.paiol ? 0.34 : 0.42)), dh = c.portaA ?? Math.min(H * 0.8, c.paiol ? 74 : 92), dx = cx - dw / 2, dy = yW - dh;
    g.fillStyle = degradeV(g, dy, yW, [[0, '#1e1611'], [1, '#33261c']]); g.fillRect(dx, dy, dw, dh);
    if (!c.paiol) { // trilho da porta
      g.fillStyle = '#3a3532'; g.fillRect(dx - 12, dy - 9, dw + 34, 5);
      g.fillStyle = '#6a6460'; for (const fx of [dx + 8, dx + dw / 2 - 8, dx + dw / 2 + 18, dx + dw + 4]) { g.beginPath(); g.arc(fx, dy - 6.5, 3, 0, 7); g.fill(); }
    }
    const folhas = c.paiol ? [[dx, dw]] : [[dx, dw / 2 - 1], [dx + dw / 2 + 12, dw / 2 - 1]]; // a da direita está meio aberta
    if (!c.paiol) { // feno saindo pela fresta
      g.strokeStyle = '#d7b763'; g.lineWidth = 1;
      for (let i = 0; i < 26; i++) { const sx = dx + dw / 2 + r() * 12, sy = yW - r() * 16; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.3) * 9, sy + 2 + r() * 3); g.stroke(); }
    }
    for (const [fx, fw] of folhas) {
      tabuas(g, [[fx, dy], [fx + fw, dy], [fx + fw, yW], [fx, yW]], fx, fx + fw, dy, yW, c.madeira, r, 9);
      g.strokeStyle = c.friso; g.lineWidth = 5; g.lineJoin = 'miter';
      g.strokeRect(fx + 2.5, dy + 2.5, fw - 5, dh - 5);
      g.beginPath(); g.moveTo(fx + 4, dy + 4); g.lineTo(fx + fw - 4, yW - 4); g.moveTo(fx + fw - 4, dy + 4); g.lineTo(fx + 4, yW - 4);
      if (c.paiol) { g.moveTo(fx + 4, dy + dh / 2); g.lineTo(fx + fw - 4, dy + dh / 2); }
      g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.strokeRect(fx + 0.5, dy + 0.5, fw - 1, dh - 1);
    }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(dx + dw / 2 + 12 + dw / 2 - 1, dy, 4, dh); // sombra da folha aberta
    // janela do sótão (aberta, com feno) e viga com roldana
    if (!c.paiol) {
      const lw = Math.round(w * 0.2), lh = 44, ly = yW - H - 6 - lh;
      g.fillStyle = degradeV(g, ly, ly + lh, [[0, '#120d09'], [1, '#2a1f17']]); g.fillRect(cx - lw / 2, ly, lw, lh);
      fardo(g, cx - lw / 2 + 4, ly + lh - 2, lw * 0.55, 13, r); fardo(g, cx + 2, ly + lh - 2, lw * 0.4, 11, r);
      g.strokeStyle = c.friso; g.lineWidth = 5; g.strokeRect(cx - lw / 2 - 2.5, ly - 2.5, lw + 5, lh + 5);
      const vy = ly - 18;
      g.fillStyle = '#3d2c1f'; g.fillRect(cx - 3, vy - 4, 6, 12);
      g.fillStyle = '#5a4330'; g.fillRect(cx - 3, vy - 4, 3, 12);
      g.strokeStyle = '#444'; g.lineWidth = 2; g.beginPath(); g.arc(cx, vy + 11, 4, 0, 7); g.stroke();
      g.strokeStyle = '#8a7a5a'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 4, vy + 11); g.lineTo(cx + 4, ly + 10); g.stroke();
    } else if (!c.semJanela) { // janelinha com grades
      const ly = yW - H - h1 * 0.55, lw = 26;
      g.fillStyle = '#1a130e'; g.fillRect(cx - lw / 2, ly, lw, 20);
      g.fillStyle = '#5d4128'; for (let i = 1; i < 4; i++) g.fillRect(cx - lw / 2 + (lw * i) / 4 - 1, ly, 2.5, 20);
      g.strokeStyle = c.friso; g.lineWidth = 3; g.strokeRect(cx - lw / 2, ly, lw, 20);
    }
    // frisos: cantos e beirada do telhado (sombra embaixo do beiral)
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(30,12,6,.35)'; g.lineWidth = 9; g.beginPath(); linha.forEach(([x, y], i) => (i ? g.lineTo(x, y + 6) : g.moveTo(x, y + 6))); g.stroke();
    g.strokeStyle = c.friso; g.lineWidth = 7; g.beginPath(); linha.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); linha.forEach(([x, y], i) => (i ? g.lineTo(x, y - 2.5) : g.moveTo(x, y - 2.5))); g.stroke();
    for (const x of [xL, xR - 8]) { g.fillStyle = c.friso; g.fillRect(x, yW - H, 8, H); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x === xL ? x + 8 : x - 1.5, yW - H, 1.5, H); }
    if (!c.paiol) { // lampião ao lado da porta
      const lx = dx - 18, ly = dy + 6;
      g.fillStyle = '#2b2b2b'; g.fillRect(lx - 1, ly - 6, 2, 8); g.fillRect(lx - 4, ly + 2, 8, 3);
      g.fillStyle = 'rgba(255,214,120,.95)'; g.fillRect(lx - 3, ly + 5, 6, 8);
      g.fillStyle = '#2b2b2b'; g.fillRect(lx - 4, ly + 13, 8, 2);
    }
    // feno espalhado na frente
    g.strokeStyle = 'rgba(214,184,100,.85)'; g.lineWidth = 0.9;
    for (let i = 0; i < (c.semFeno ? 0 : 40); i++) { const sx = dx - 10 + r() * (dw + 20), sy = yW + 2 + r() * 12; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 10, sy + (r() - 0.5) * 3); g.stroke(); }
    return { cont, topo: Math.min(...linha.map(p => p[1])) - L };
  }
  /** puxado de uma água encostado no lado leste do celeiro, aberto na frente, com feno guardado */
  function puxado(g, x0, yW, w, d, hAlto, hBaixo, c, r) {
    const A = [x0 - 2, yW - hAlto], B = [x0 + w + 10, yW - hBaixo + 6];
    chapa(g, A, B, d + 8, 0.74, r);
    g.fillStyle = degradeV(g, yW - hAlto, yW, [[0, '#120d0a'], [1, '#2c2119']]); caminho(g, [[x0, yW], [x0, yW - hAlto], [x0 + w, yW - hBaixo], [x0 + w, yW]]); g.fill();
    fardo(g, x0 + 8, yW - 2, 34, 16, r); fardo(g, x0 + 44, yW - 2, 34, 16, r); fardo(g, x0 + 22, yW - 18 - 9, 34, 15, r);
    for (const px of [x0 + w - 6]) { g.fillStyle = '#4a3624'; g.fillRect(px - 3.5, yW - hBaixo, 7, hBaixo); g.fillStyle = '#6e5139'; g.fillRect(px - 3.5, yW - hBaixo, 2.5, hBaixo); }
    g.strokeStyle = c.friso; g.lineWidth = 5; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
  }
  function silo(g, cx, yChao, rs, hs, r) {
    const yc = yChao - rs, yTopo = yc - hs;
    g.save(); g.beginPath(); g.rect(cx - rs, yTopo, rs * 2, hs); g.arc(cx, yc, rs, 0, Math.PI); g.closePath(); g.clip();
    g.fillStyle = degradeH(g, cx - rs, cx + rs, [[0, '#a7aeb0'], [0.22, '#d9dfe0'], [0.45, '#bcc3c4'], [0.8, '#868d8f'], [1, '#5f6668']]);
    g.fillRect(cx - rs, yTopo, rs * 2, hs + rs);
    for (let x = cx - rs + 3; x < cx + rs; x += 4) { g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(x, yTopo, 1.2, hs + rs); }
    for (let z = 20; z < hs; z += 24) { // anéis (arco da frente do círculo)
      g.strokeStyle = 'rgba(40,44,46,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, yc - z, rs, 0.05, Math.PI - 0.05); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, yc - z - 2, rs, 0.15, Math.PI - 0.15); g.stroke();
    }
    for (let i = 0; i < 9; i++) { const x = cx - rs + r() * rs * 2, y = yTopo + r() * hs; g.fillStyle = `rgba(150,80,35,${0.12 + r() * 0.15})`; g.beginPath(); g.ellipse(x, y + 10, 2 + r() * 2, 8 + r() * 18, 0, 0, 7); g.fill(); }
    g.restore();
    // escada de marinheiro
    g.strokeStyle = '#4c4f50'; g.lineWidth = 1.6;
    const ex = cx + rs * 0.45;
    g.beginPath(); g.moveTo(ex - 5, yc + rs * 0.85); g.lineTo(ex - 5, yTopo + 4); g.moveTo(ex + 5, yc + rs * 0.8); g.lineTo(ex + 5, yTopo + 4);
    for (let y = yc + rs * 0.7; y > yTopo + 6; y -= 9) { g.moveTo(ex - 5, y); g.lineTo(ex + 5, y); }
    g.stroke();
    // cúpula
    const cup = g.createRadialGradient(cx - rs * 0.4, yTopo - rs * 0.35, 2, cx, yTopo, rs * 1.1);
    cup.addColorStop(0, '#f1f4f4'); cup.addColorStop(0.5, '#b3babc'); cup.addColorStop(1, '#6d7476');
    g.fillStyle = cup; g.beginPath(); g.arc(cx, yTopo, rs, 0, 7); g.fill();
    g.strokeStyle = 'rgba(40,44,46,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, yTopo, rs, 0.05, Math.PI - 0.05); g.stroke();
    for (let a = 0; a < 6; a++) { g.strokeStyle = 'rgba(60,64,66,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, yTopo - 2); g.lineTo(cx + Math.cos(a + 0.3) * rs, yTopo + Math.sin(a + 0.3) * rs); g.stroke(); }
    g.fillStyle = '#7d8486'; g.beginPath(); g.arc(cx, yTopo - 3, 5, 0, 7); g.fill();
    g.fillStyle = '#c9cfd0'; g.beginPath(); g.arc(cx - 1.5, yTopo - 4.5, 2, 0, 7); g.fill();
  }

  // ---------- especificação de cada nível (posição dentro do lote) ----------
  const AZUL = '#2f6a8c', VERDE = '#3f6e4a';
  function especCasa(nivel, lote) {
    const base = lote.y + lote.h - 18, cx = lote.x + lote.w / 2;
    let corpos, extra = {};
    if (nivel === 1) corpos = [{ cx, w: 250, d: 140, H: 108, el: ['J', 'P', 'J'], janela: 34, cor: AZUL, floreira: false }];
    else if (nivel === 2) { corpos = [{ cx, w: 330, d: 168, H: 112, el: ['J', 'P', 'J'], janela: 38, cor: AZUL, floreira: true }]; extra = { chamine: 0.3, marquise: true }; }
    else {
      const x0 = lote.x + (lote.w - 405) / 2;
      corpos = [
        { cx: x0 + 55, w: 110, d: 128, H: 102, el: ['J'], janela: 34, cor: VERDE, floreira: true, recuo: 10 },
        { cx: x0 + 110 + 147, w: 294, d: 186, H: 118, el: ['J', 'P', 'J'], janela: 40, cor: VERDE, floreira: true },
      ];
      extra = { chamine: 0.3, varanda: { w: 128, d: 46 }, mansardas: [-0.33, 0.33] };
    }
    const prin = corpos[corpos.length - 1], pd = extra.varanda ? extra.varanda.d : 0;
    for (const c of corpos) c.yW = base - pd - (c.recuo || 0);
    let topo = Infinity, x0 = Infinity, x1 = -Infinity, fundo = Infinity;
    const pegadas = [];
    for (const c of corpos) {
      const k = geoCorpo(c); topo = Math.min(topo, k.yBack); x0 = Math.min(x0, k.xL - OV); x1 = Math.max(x1, k.xR + OV); fundo = Math.min(fundo, c.yW - c.d);
      pegadas.push([k.xL - 4, c.yW - c.d, k.xR + 4, c.yW + 8]);
    }
    if (extra.varanda) pegadas.push([prin.cx - extra.varanda.w / 2 - 4, prin.yW, prin.cx + extra.varanda.w / 2 + 4, base + 12]);
    return {
      tipo: 'casa', nivel, base, corpos, prin, ...extra, semente: 900 + nivel, pegadas,
      caixa: [x0 - 24, topo - 70, x1 + 24, base + 16],
      pegada: [x0 + OV - 4, fundo, x1 - OV + 4, base + 4],
      altura: prin.H + 60, porta: [prin.cx, base + 14],
    };
  }
  function especCeleiro(nivel, lote) {
    const base = lote.y + lote.h - 18, cx = lote.x + lote.w / 2, VERM = '#9b3022', BRANCO = '#efe9dc';
    // nível 0: terreno vazio (o celeiro ainda não foi construído)
    if (nivel === 0) return { tipo: 'celeiro', nivel: 0, vazio: true, base, semente: 700, pegadas: [], pegada: [cx - 1, base - 1, cx + 1, base], caixa: [cx - 1, base - 1, cx + 1, base], porta: [cx, base + 16], altura: 0 };
    let e;
    if (nivel === 1) e = { corpo: { cx, w: 180, d: 118, H: 92, h1: 62, h2: 0, paiol: true, madeira: '#7b5737', friso: '#4a3422', tabua: 12 } };
    else if (nivel === 2) e = { corpo: { cx, w: 252, d: 148, H: 110, h1: 56, h2: 38, madeira: VERM, friso: BRANCO, tabua: 11 } };
    else {
      const x0 = lote.x + (lote.w - 460) / 2, rs = 32;
      e = { corpo: { cx: x0 + rs * 2 + 14 + 148, w: 296, d: 170, H: 120, h1: 62, h2: 42, madeira: VERM, friso: BRANCO, tabua: 11 },
        silo: { cx: x0 + rs, rs, hs: 176 }, puxado: { w: 86, d: 130, hAlto: 104, hBaixo: 80 } };
    }
    const c = e.corpo; c.yW = base;
    const xL = c.cx - c.w / 2, xR = c.cx + c.w / 2, topo = base - c.H - c.h1 - c.h2 - c.d - 30;
    const x0 = e.silo ? e.silo.cx - e.silo.rs : xL - 14, x1 = e.puxado ? xR + e.puxado.w + 12 : xR + 14;
    return {
      tipo: 'celeiro', nivel, base, ...e, semente: 700 + nivel,
      caixa: [x0 - 24, Math.min(topo, e.silo ? base - e.silo.rs * 3 - e.silo.hs : topo) - 16, x1 + 24, base + 22],
      pegada: [x0 - 2, base - c.d, x1 - 10, base + 4], pegadas: [[x0 - 2, base - c.d, x1 - 10, base + 4]],
      altura: c.H + c.h1 + c.h2, porta: [c.cx, base + 16],
    };
  }

  // ---------- pintura (coordenadas do mundo) ----------
  function pintar(g, e) {
    const r = sorteio(e.semente);
    g.lineCap = 'butt'; g.lineJoin = 'round';
    // sombra de contato no chão, junto da base
    for (const [px0, , px1, py] of e.pegadas) {
      const yb = py - (e.tipo === 'casa' ? 8 : 4);
      g.fillStyle = degradeV(g, yb - 6, yb + 12, [[0, 'rgba(25,22,10,.45)'], [1, 'rgba(25,22,10,0)']]); g.fillRect(px0 - 2, yb - 6, px1 - px0 + 4, 18);
    }
    const fumaca = [];
    if (e.tipo === 'casa') {
      if (e.varanda) { // piso de tábuas da varanda (no chão, na frente da parede)
        const v = e.varanda, vx = e.prin.cx - v.w / 2, vy = e.prin.yW;
        g.fillStyle = '#5c4026'; g.fillRect(vx - 2, vy - 2, v.w + 4, v.d + 6);
        for (let y = vy; y < vy + v.d; y += 7) { g.fillStyle = tom('#a07a52', 0.88 + r() * 0.22); g.fillRect(vx, y, v.w, 6); g.fillStyle = 'rgba(255,240,210,.18)'; g.fillRect(vx, y, v.w, 1); }
        g.fillStyle = 'rgba(40,25,10,.35)'; g.fillRect(vx, vy, v.w, 8);
        g.fillStyle = degradeV(g, vy + v.d, vy + v.d + 9, [[0, '#9a7b55'], [1, '#6e5538']]); g.fillRect(e.prin.cx - 26, vy + v.d, 52, 9); // degrau
      }
      let kPrin;
      for (const c of e.corpos) { const k = corpoCasa(g, c, r); if (c === e.prin) kPrin = k; }
      const c = e.prin, { xL, xR, yEave, yRidge } = kPrin;
      if (e.marquise) { // cobertura de telhas sobre a porta, em mãos-francesas
        const x0 = c.cx - 44, x1 = c.cx + 44, yb = c.yW - 82 - 4, yt = yb - 30;
        g.fillStyle = degradeV(g, yb, yb + 16, [[0, 'rgba(40,25,12,.45)'], [1, 'rgba(40,25,12,0)']]); g.fillRect(x0 + 8, yb, x1 - x0 - 16, 16);
        for (const s of [-1, 1]) { g.strokeStyle = '#5a3b22'; g.lineWidth = 4; g.beginPath(); g.moveTo(c.cx + s * 36, yb + 20); g.lineTo(c.cx + s * 40, yb); g.lineTo(c.cx + s * 36, yb); g.stroke(); }
        telhado(g, x0, x1, yt, yb, r, 1.02, 12);
        beiral(g, x0, x1, x0, x0, yb, r); bordasTelhado(g, x0, x1, yt, yb);
      }
      if (e.varanda) { // sombra da varanda, esteios, guarda-corpo e telhado da varanda
        const v = e.varanda, vx0 = c.cx - v.w / 2, vx1 = c.cx + v.w / 2, yF = c.yW + v.d, hp = 104, ytv = yF - hp + 6;
        g.fillStyle = 'rgba(40,28,16,.3)'; g.fillRect(vx0, yEave, v.w, c.yW - yEave);
        for (const px of [vx0 + 6, vx1 - 6]) {
          g.fillStyle = 'rgba(30,20,10,.3)'; g.fillRect(px + 2, yF - 2, 10, 5);
          g.fillStyle = degradeH(g, px - 4.5, px + 4.5, [[0, '#8f6a45'], [0.4, '#b48a5f'], [1, '#5e4329']]); g.fillRect(px - 4.5, yF - hp, 9, hp);
          g.fillStyle = '#4c3522'; g.fillRect(px - 6, yF - 6, 12, 6); g.fillRect(px - 6, yF - hp, 12, 5);
        }
        for (const [a, b] of [[vx0 + 6, c.cx - 30], [c.cx + 30, vx1 - 6]]) { // guarda-corpo, com a passagem da escada no meio
          g.fillStyle = '#7a5a3b'; g.fillRect(a, yF - 34, b - a, 5); g.fillStyle = 'rgba(255,240,210,.3)'; g.fillRect(a, yF - 34, b - a, 1.2);
          for (let x = a + 7; x < b - 3; x += 8) { g.fillStyle = '#8a6847'; g.fillRect(x - 1.5, yF - 30, 3, 28); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 0.8, yF - 30, 0.8, 28); }
          g.fillStyle = '#6a4d32'; g.fillRect(a, yF - 6, b - a, 4);
        }
        for (const [vx, s] of [[vx0 + 18, 1], [vx1 - 26, -1]]) { // vasos com plantas
          g.fillStyle = degradeV(g, yF - 16, yF, [[0, '#c0673d'], [1, '#86401f']]); caminho(g, [[vx - 7, yF - 16], [vx + 7, yF - 16], [vx + 5, yF], [vx - 5, yF]]); g.fill();
          for (let i = 0; i < 14; i++) { g.fillStyle = i % 3 ? '#4a7a33' : '#62963f'; g.beginPath(); g.ellipse(vx + (r() - 0.5) * 16, yF - 18 - r() * 14, 3.5, 2.2, r() * 3, 0, 7); g.fill(); }
          void s;
        }
        telhado(g, vx0 - 8, vx1 + 8, yEave - 2, ytv, r, 1.04, 12);
        beiral(g, vx0 - 8, vx1 + 8, vx0, vx0, ytv, r); bordasTelhado(g, vx0 - 8, vx1 + 8, yEave - 2, ytv);
        g.fillStyle = '#2d241c'; g.fillRect(c.cx - 1, ytv + 2, 2, 10); // lampião pendurado
        g.fillStyle = 'rgba(255,214,120,.95)'; g.fillRect(c.cx - 4, ytv + 12, 8, 9);
        g.fillStyle = '#2d241c'; g.fillRect(c.cx - 5, ytv + 11, 10, 2); g.fillRect(c.cx - 4, ytv + 21, 8, 2);
      }
      for (const t of e.mansardas || []) { const mx = c.cx + t * c.w; mansarda(g, mx, yRidge + (yEave - yRidge) * 0.62, 40, r); }
      if (e.chamine) fumaca.push(chamine(g, c.cx + e.chamine * c.w * 1.1, yRidge + (yEave - yRidge) * 0.28, 22, 44, r));
      void xL; void xR;
    } else {
      const c = e.corpo;
      if (e.puxado) { const p = e.puxado; puxado(g, c.cx + c.w / 2, c.yW, p.w, p.d, p.hAlto, p.hBaixo, c, r); }
      corpoCeleiro(g, c, r);
      if (e.silo) silo(g, e.silo.cx, e.base, e.silo.rs, e.silo.hs, r);
      if (e.nivel >= 2) fardo(g, c.cx + c.w / 2 - 46, e.base + 3, 30, 15, r);
    }
    return { fumaca };
  }

  raiz.Construcoes = { especCasa, especCeleiro, pintar, util: { sorteio, tom, caminho, degradeV, degradeH, chapa, tabuas, fardo, corpoCeleiro, telhado, beiral, bordasTelhado } };
})(typeof self !== 'undefined' ? self : globalThis);
