// Decorações da loja, desenhadas em vetor (HD) no estilo da casa e do celeiro: banco de madeira, canteiro de flores,
// lampião (acende à noite), carrinho de mão com abóboras, fardos de feno e poço de pedra. (x, y) = pé do objeto.
(function (raiz) {
  'use strict';
  function criar(U) {
    const { tom, degradeV, degradeH, fardo } = U;
    const sombra = (g, x, y, rx, ry) => { g.fillStyle = 'rgba(25,30,10,.32)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
    const tabua = (g, x, y, w, h, cor, r) => {
      g.fillStyle = degradeV(g, y, y + h, [[0, tom(cor, 1.18)], [1, tom(cor, 0.82)]]); g.fillRect(x, y, w, h);
      g.strokeStyle = tom(cor, 0.6, 0.6); g.lineWidth = 0.6; g.strokeRect(x + 0.3, y + 0.3, w - 0.6, h - 0.6);
      for (let i = 0; i < w / 9; i++) { g.strokeStyle = tom(cor, 0.72, 0.35); g.beginPath(); const sx = x + r() * w; g.moveTo(sx, y + 1); g.lineTo(sx + 6 + r() * 6, y + 1 + r() * (h - 2)); g.stroke(); }
    };
    const DECOR = {
      banco: { nome: 'Banco de madeira', icone: '🪑', preco: 60, pede: 1, w: 74, d: 20, alto: 44,
        pintar(g, x, y, r) {
          sombra(g, x + 4, y - 4, 40, 8);
          const cor = '#9a6b3c';
          for (const lx of [x - 30, x + 26]) { g.fillStyle = tom(cor, 0.6); g.fillRect(lx, y - 22, 5, 22); g.fillRect(lx, y - 40, 5, 18); }
          tabua(g, x - 36, y - 44, 72, 7, cor, r); tabua(g, x - 36, y - 35, 72, 6, cor, r); // encosto
          g.fillStyle = tom(cor, 1.25); g.fillRect(x - 38, y - 26, 76, 8); tabua(g, x - 38, y - 22, 76, 5, cor, r); // assento
          g.fillStyle = tom(cor, 0.55); for (const lx of [x - 33, x + 28]) g.fillRect(lx, y - 17, 5, 17);
        } },
      flores: { nome: 'Canteiro de flores', icone: '🌷', preco: 40, pede: 1, w: 66, d: 34, alto: 30,
        pintar(g, x, y, r) {
          sombra(g, x + 3, y - 14, 36, 17);
          g.fillStyle = degradeV(g, y - 34, y, [[0, '#5a4130'], [1, '#3e2b1d']]); g.beginPath(); g.ellipse(x, y - 16, 31, 15, 0, 0, 7); g.fill();
          for (let a = 0; a < 6.28; a += 0.36) { const px = x + Math.cos(a) * 32, py = y - 16 + Math.sin(a) * 16; g.fillStyle = tom('#9d9585', 0.8 + r() * 0.4); g.beginPath(); g.ellipse(px, py, 5, 3.6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(px - 1, py - 1.2, 2.6, 1.4, 0, 0, 7); g.fill(); }
          const cores = ['#e8506a', '#f4c542', '#f08a3c', '#c467d6', '#ffffff', '#ff7aa8'];
          const pes = [];
          for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.sqrt(r()); pes.push([x + Math.cos(a) * 25 * d, y - 16 + Math.sin(a) * 11 * d]); }
          pes.sort((a, b) => a[1] - b[1]);
          for (const [px, py] of pes) {
            g.strokeStyle = '#4f7f2c'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 9); g.stroke();
            g.fillStyle = '#5f9a34'; g.beginPath(); g.ellipse(px - 2.5, py - 4, 3, 1.3, -0.5, 0, 7); g.fill();
            const c = cores[Math.floor(r() * cores.length)];
            for (let k = 0; k < 5; k++) { const a = k * 1.256; g.fillStyle = tom(c, 0.9 + r() * 0.2); g.beginPath(); g.ellipse(px + Math.cos(a) * 2.2, py - 10 + Math.sin(a) * 1.6, 1.9, 1.5, a, 0, 7); g.fill(); }
            g.fillStyle = '#f7d24a'; g.beginPath(); g.arc(px, py - 10, 1, 0, 7); g.fill();
          }
        } },
      lampiao: { nome: 'Lampião', icone: '🏮', preco: 90, pede: 2, w: 16, d: 10, alto: 96, luz: [0, -80, 130],
        pintar(g, x, y) {
          sombra(g, x + 4, y - 2, 11, 4);
          g.fillStyle = degradeH(g, x - 3, x + 3, [[0, '#4a3220'], [0.4, '#7a5636'], [1, '#3a2616']]); g.fillRect(x - 3, y - 74, 6, 74);
          g.fillStyle = '#2e2b28'; g.fillRect(x - 6, y - 4, 12, 4); g.fillRect(x - 2, y - 78, 13, 3); g.fillRect(x + 8, y - 78, 2, 6);
          // lanterna pendurada
          const lx = x + 9, ly = y - 70;
          g.fillStyle = '#26231f'; g.beginPath(); g.moveTo(lx - 7, ly); g.lineTo(lx + 7, ly); g.lineTo(lx + 4, ly - 6); g.lineTo(lx - 4, ly - 6); g.closePath(); g.fill();
          g.fillStyle = degradeV(g, ly, ly + 16, [[0, '#ffe7a0'], [1, '#f2a944']]); g.fillRect(lx - 6, ly, 12, 15);
          g.strokeStyle = '#26231f'; g.lineWidth = 1.4; g.strokeRect(lx - 6, ly, 12, 15); g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly + 15); g.stroke();
          g.fillStyle = '#26231f'; g.fillRect(lx - 7, ly + 15, 14, 2.5);
        } },
      carrinho: { nome: 'Carrinho de mão', icone: '🛒', preco: 70, pede: 2, w: 66, d: 26, alto: 40,
        pintar(g, x, y, r) {
          sombra(g, x + 3, y - 4, 34, 7);
          g.strokeStyle = '#6b4a2a'; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x - 14, y - 16); g.lineTo(x - 34, y - 6); g.stroke(); g.beginPath(); g.moveTo(x - 6, y - 14); g.lineTo(x - 30, y - 2); g.stroke();
          g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 6, y - 12); g.lineTo(x - 8, y); g.stroke(); g.lineCap = 'butt';
          // caçamba de metal
          g.fillStyle = degradeV(g, y - 30, y - 10, [[0, '#5d8a9a'], [1, '#2f4f5c']]);
          g.beginPath(); g.moveTo(x - 20, y - 30); g.lineTo(x + 22, y - 30); g.lineTo(x + 14, y - 10); g.lineTo(x - 12, y - 10); g.closePath(); g.fill();
          g.fillStyle = '#7fa9b6'; g.fillRect(x - 21, y - 31, 44, 3);
          // abóboras
          for (const [px, k] of [[x - 8, 0.95], [x + 8, 1.05], [x, 1]]) {
            const py = px === x ? y - 38 : y - 33;
            g.fillStyle = degradeV(g, py - 8, py + 7, [[0, tom('#f39a2e', 1.15 * k)], [1, tom('#c4621a', k)]]); g.beginPath(); g.ellipse(px, py, 9, 7, 0, 0, 7); g.fill();
            g.strokeStyle = 'rgba(140,60,10,.55)'; g.lineWidth = 0.8; for (const dx of [-4, 0, 4]) { g.beginPath(); g.ellipse(px + dx * 0.6, py, 3, 6.5, 0, 0, 7); g.stroke(); }
            g.fillStyle = '#4c6a26'; g.fillRect(px - 1, py - 9, 2, 3);
          }
          // roda
          g.fillStyle = '#2b2622'; g.beginPath(); g.arc(x + 18, y - 8, 8, 0, 7); g.fill(); g.fillStyle = '#8c8f90'; g.beginPath(); g.arc(x + 18, y - 8, 3, 0, 7); g.fill();
        } },
      fardos: { nome: 'Fardos de feno', icone: '🌾', preco: 50, pede: 1, w: 80, d: 34, alto: 46,
        pintar(g, x, y, r) {
          sombra(g, x + 4, y - 4, 44, 9);
          fardo(g, x - 40, y - 2, 38, 18, r); fardo(g, x + 2, y - 2, 38, 18, r); fardo(g, x - 19, y - 30, 38, 18, r);
        } },
      poco: { nome: 'Poço de pedra', icone: '🪣', preco: 180, pede: 3, w: 64, d: 40, alto: 100,
        pintar(g, x, y, r) {
          sombra(g, x + 5, y - 12, 38, 16);
          // boca do poço (vista de cima) e parede de pedra
          g.fillStyle = '#7d766a'; g.beginPath(); g.ellipse(x, y - 34, 30, 13, 0, 0, 7); g.fill();
          g.fillStyle = '#10181c'; g.beginPath(); g.ellipse(x, y - 34, 22, 8.5, 0, 0, 7); g.fill();
          g.fillStyle = 'rgba(80,120,140,.5)'; g.beginPath(); g.ellipse(x, y - 32, 15, 5, 0, 0, 7); g.fill();
          for (let fila = 0; fila < 3; fila++) for (let i = 0; i < 7; i++) {
            const px = x - 30 + i * 9 + (fila % 2) * 4.5, py = y - 32 + fila * 9;
            if (px > x + 28) continue;
            g.fillStyle = degradeV(g, py, py + 9, [[0, tom('#a49c8c', 0.95 + r() * 0.2)], [1, tom('#6e675b', 0.95 + r() * 0.15)]]);
            g.beginPath(); g.roundRect(px, py, 8.5, 8.5, 2.5); g.fill();
          }
          // postes, telhadinho e balde
          const cor = '#6b4a2a';
          g.fillStyle = tom(cor, 0.9); g.fillRect(x - 27, y - 86, 5, 56); g.fillRect(x + 22, y - 86, 5, 56);
          g.strokeStyle = '#3a2a1a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 24, y - 70); g.lineTo(x + 24, y - 70); g.stroke();
          g.strokeStyle = '#c9b48a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 70); g.lineTo(x, y - 52); g.stroke();
          g.fillStyle = degradeH(g, x - 6, x + 6, [[0, '#7a7d80'], [0.5, '#c4c7ca'], [1, '#6a6d70']]); g.beginPath(); g.moveTo(x - 6, y - 52); g.lineTo(x + 6, y - 52); g.lineTo(x + 5, y - 42); g.lineTo(x - 5, y - 42); g.closePath(); g.fill();
          const tel = '#9a4a30';
          g.fillStyle = degradeV(g, y - 104, y - 84, [[0, tom(tel, 1.2)], [1, tom(tel, 0.8)]]);
          g.beginPath(); g.moveTo(x - 38, y - 84); g.lineTo(x, y - 104); g.lineTo(x + 38, y - 84); g.lineTo(x + 34, y - 81); g.lineTo(x, y - 99); g.lineTo(x - 34, y - 81); g.closePath(); g.fill();
          g.strokeStyle = tom(tel, 0.6); g.lineWidth = 0.8; for (let i = 1; i < 8; i++) { const t = i / 8; g.beginPath(); g.moveTo(x - 38 * (1 - t) - 2, y - 84 - 20 * t); g.lineTo(x - 34 * (1 - t), y - 81 - 18 * t); g.stroke(); g.beginPath(); g.moveTo(x + 38 * (1 - t) + 2, y - 84 - 20 * t); g.lineTo(x + 34 * (1 - t), y - 81 - 18 * t); g.stroke(); }
        } },
    };
    for (const k in DECOR) DECOR[k].id = k;
    /** caixa de desenho e pegada no chão */
    const caixa = (d, x, y) => [x - d.w / 2 - 16, y - d.alto - 12, x + d.w / 2 + 16, y + 6];
    const pegada = (d, x, y) => [x - d.w / 2, y - d.d, x + d.w / 2, y];
    function assar(d, x, y, q) {
      const [x0, y0, x1, y1] = caixa(d, x, y), c = document.createElement('canvas');
      c.width = Math.ceil((x1 - x0) * q); c.height = Math.ceil((y1 - y0) * q);
      const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q);
      let s = Math.round(x * 7 + y * 13) % 2147483646 + 1; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      d.pintar(g, x, y, r);
      return c;
    }
    return { DECOR, caixa, pegada, assar };
  }
  raiz.Decor = { criar };
})(typeof self !== 'undefined' ? self : globalThis);
