// Caminhão de carroceria (o do PixelLab redesenhado em vetor, HD): cabine azul-escura, carroceria de tábuas, rodas
// pretas. Três vistas para a estrada: de lado (indo para a direita; espelhado para a esquerda), de frente (vindo para
// baixo) e de trás (subindo). Carga: caixotes da colheita na carroceria. (0, 0) = chão, no meio do caminhão.
(function (raiz) {
  'use strict';
  function criar(U) {
    const { tom, degradeV, degradeH } = U;
    const AZUL = '#2f4f6e', MAD = '#8a6a44';
    const roda = (g, x, y, rr) => {
      g.fillStyle = '#1c1b1a'; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
      g.fillStyle = degradeV(g, y - rr * 0.5, y + rr * 0.5, [[0, '#9aa0a4'], [1, '#4c5054']]); g.beginPath(); g.arc(x, y, rr * 0.5, 0, 7); g.fill();
      g.fillStyle = '#2b2a28'; g.beginPath(); g.arc(x, y, rr * 0.18, 0, 7); g.fill();
    };
    function caixotes(g, x0, x1, yChao, alto, carga, r) {
      if (!carga) return;
      const n = Math.max(1, Math.round((x1 - x0) / 30 * carga)), w = (x1 - x0) / Math.max(n, 1);
      const frutas = ['#e2532e', '#f39a2e', '#e8c33a', '#7fb84a', '#c63b4a'];
      for (let i = 0; i < n; i++) {
        const cx = x0 + i * w + 1;
        g.fillStyle = degradeV(g, yChao - alto, yChao, [[0, '#c9a46a'], [1, '#93703f']]); g.fillRect(cx, yChao - alto, w - 2, alto);
        g.strokeStyle = 'rgba(80,55,25,.7)'; g.lineWidth = 0.8; g.strokeRect(cx + 0.4, yChao - alto + 0.4, w - 2.8, alto - 0.8);
        g.beginPath(); g.moveTo(cx, yChao - alto / 2); g.lineTo(cx + w - 2, yChao - alto / 2); g.stroke();
        const cor = frutas[Math.floor(r() * frutas.length)];
        for (let k = 0; k < 4; k++) { g.fillStyle = tom(cor, 0.85 + r() * 0.3); g.beginPath(); g.arc(cx + 4 + r() * (w - 10), yChao - alto - 1.5 + r() * 2, 3, 0, 7); g.fill(); }
      }
    }
    /** de lado, indo para a direita: carroceria atrás (esquerda), cabine na frente */
    function lado(g, carga, r) {
      g.fillStyle = 'rgba(20,24,10,.35)'; g.beginPath(); g.ellipse(4, -2, 92, 12, 0, 0, 7); g.fill();
      // chassi
      g.fillStyle = '#1f2326'; g.fillRect(-84, -26, 164, 8);
      // carroceria: assoalho visto de cima (faixa) e lateral de tábuas
      g.fillStyle = degradeV(g, -58, -44, [[0, tom(MAD, 1.25)], [1, tom(MAD, 1.0)]]); g.fillRect(-86, -58, 104, 16);
      for (let i = 0; i < 6; i++) { g.strokeStyle = tom(MAD, 0.75, 0.5); g.lineWidth = 0.6; g.beginPath(); g.moveTo(-86, -56 + i * 2.6); g.lineTo(18, -56 + i * 2.6); g.stroke(); }
      caixotes(g, -82, 14, -44, 18, carga, r);
      g.fillStyle = degradeV(g, -44, -24, [[0, tom(MAD, 1.1)], [1, tom(MAD, 0.75)]]); g.fillRect(-88, -44, 108, 20);
      g.strokeStyle = tom(MAD, 0.55); g.lineWidth = 0.8; for (const y of [-37, -30]) { g.beginPath(); g.moveTo(-88, y); g.lineTo(20, y); g.stroke(); }
      g.fillStyle = tom(MAD, 0.5); for (const x of [-88, -52, -16, 17]) g.fillRect(x, -46, 3, 22);
      // cabine
      g.fillStyle = degradeV(g, -78, -20, [[0, tom(AZUL, 1.35)], [0.5, tom(AZUL, 1.05)], [1, tom(AZUL, 0.7)]]);
      g.beginPath(); g.moveTo(22, -20); g.lineTo(22, -74); g.quadraticCurveTo(22, -80, 30, -80); g.lineTo(54, -80); g.quadraticCurveTo(60, -80, 62, -72);
      g.lineTo(68, -54); g.lineTo(90, -50); g.quadraticCurveTo(96, -48, 96, -40); g.lineTo(96, -20); g.closePath(); g.fill();
      g.fillStyle = tom(AZUL, 1.55, 0.9); g.fillRect(24, -80, 34, 3); // teto (brilho)
      // janela, porta, maçaneta, farol, para-choque
      g.fillStyle = degradeV(g, -74, -56, [[0, '#cfe4ee'], [1, '#6d8fa1']]); g.beginPath(); g.moveTo(30, -56); g.lineTo(30, -73); g.lineTo(53, -73); g.lineTo(60, -56); g.closePath(); g.fill();
      g.strokeStyle = tom(AZUL, 0.55); g.lineWidth = 1; g.strokeRect(28, -56, 34, 32); g.fillStyle = '#c9ced1'; g.fillRect(52, -48, 6, 2);
      g.fillStyle = '#ffeaa8'; g.fillRect(91, -46, 5, 6); g.fillStyle = '#d33c2a'; g.fillRect(-88, -30, 3, 5);
      g.fillStyle = '#8f9599'; g.fillRect(88, -24, 12, 5); g.fillRect(-90, -24, 6, 4);
      // para-lamas e rodas
      g.fillStyle = tom(AZUL, 0.6); g.beginPath(); g.arc(70, -18, 15, Math.PI, 0); g.fill(); g.fillStyle = '#1f2326'; g.beginPath(); g.arc(-52, -18, 15, Math.PI, 0); g.fill();
      roda(g, 70, -12, 12); roda(g, -52, -12, 12);
    }
    /** de frente (descendo a tela): cabine na frente, carroceria aparece por cima, atrás */
    function frente(g, carga, r) {
      g.fillStyle = 'rgba(20,24,10,.35)'; g.beginPath(); g.ellipse(2, -2, 46, 12, 0, 0, 7); g.fill();
      // carroceria atrás (mais acima na tela): assoalho visto de cima
      g.fillStyle = degradeV(g, -150, -80, [[0, tom(MAD, 1.25)], [1, tom(MAD, 0.95)]]); g.fillRect(-42, -150, 84, 72);
      g.strokeStyle = tom(MAD, 0.7, 0.6); g.lineWidth = 0.7; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-42 + i * 14, -150); g.lineTo(-42 + i * 14, -78); g.stroke(); }
      g.fillStyle = tom(MAD, 0.65); g.fillRect(-44, -152, 88, 5); g.fillRect(-44, -152, 4, 74); g.fillRect(40, -152, 4, 74);
      if (carga) for (let k = 0; k < 2; k++) caixotes(g, -36, 36, -118 + k * 30, 16, carga, r);
      // cabine de frente: teto, para-brisa, grade, faróis
      g.fillStyle = tom(AZUL, 1.45); g.fillRect(-36, -96, 72, 14);
      g.fillStyle = degradeV(g, -82, -20, [[0, tom(AZUL, 1.15)], [1, tom(AZUL, 0.7)]]); g.beginPath(); g.roundRect(-40, -84, 80, 64, 6); g.fill();
      g.fillStyle = degradeV(g, -80, -60, [[0, '#d6e8f0'], [1, '#6d8fa1']]); g.beginPath(); g.roundRect(-33, -80, 66, 20, 3); g.fill();
      g.strokeStyle = tom(AZUL, 0.55); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -80); g.lineTo(0, -60); g.stroke();
      g.fillStyle = '#2a2d30'; g.fillRect(-18, -54, 36, 18); g.strokeStyle = '#8f9599'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-16, -51 + i * 3.4); g.lineTo(16, -51 + i * 3.4); g.stroke(); }
      g.fillStyle = '#ffeaa8'; g.beginPath(); g.arc(-28, -46, 5, 0, 7); g.arc(28, -46, 5, 0, 7); g.fill();
      g.fillStyle = '#8f9599'; g.fillRect(-44, -28, 88, 7);
      roda(g, -38, -12, 10); roda(g, 38, -12, 10);
    }
    /** de trás (subindo a tela): tampa traseira com a carga, cabine aparece por cima */
    function tras(g, carga, r) {
      g.fillStyle = 'rgba(20,24,10,.35)'; g.beginPath(); g.ellipse(2, -2, 46, 12, 0, 0, 7); g.fill();
      g.fillStyle = tom(AZUL, 1.35); g.beginPath(); g.roundRect(-34, -150, 68, 34, 5); g.fill(); // teto da cabine (lá na frente)
      g.fillStyle = degradeV(g, -122, -40, [[0, tom(MAD, 1.25)], [1, tom(MAD, 0.95)]]); g.fillRect(-42, -122, 84, 82);
      g.strokeStyle = tom(MAD, 0.7, 0.6); g.lineWidth = 0.7; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(-42 + i * 14, -122); g.lineTo(-42 + i * 14, -40); g.stroke(); }
      if (carga) for (let k = 0; k < 2; k++) caixotes(g, -36, 36, -90 + k * 30, 16, carga, r);
      g.fillStyle = degradeV(g, -42, -20, [[0, tom(MAD, 1.1)], [1, tom(MAD, 0.72)]]); g.fillRect(-44, -42, 88, 22);
      g.strokeStyle = tom(MAD, 0.55); g.lineWidth = 0.8; for (const y of [-35, -28]) { g.beginPath(); g.moveTo(-44, y); g.lineTo(44, y); g.stroke(); }
      g.fillStyle = '#d33c2a'; g.fillRect(-42, -24, 8, 5); g.fillRect(34, -24, 8, 5);
      roda(g, -38, -12, 10); roda(g, 38, -12, 10);
    }
    const VISTAS = { lado: { f: lado, caixa: [-100, -96, 104, 8] }, frente: { f: frente, caixa: [-52, -160, 52, 8] }, tras: { f: tras, caixa: [-52, -160, 52, 8] } };
    /** imagem pronta de uma vista (com ou sem carga) na qualidade q */
    function assar(vista, carga, q) {
      const v = VISTAS[vista], [x0, y0, x1, y1] = v.caixa, c = document.createElement('canvas');
      c.width = Math.ceil((x1 - x0) * q); c.height = Math.ceil((y1 - y0) * q);
      const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, -x0 * q, -y0 * q);
      let s = 4242; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      v.f(g, carga, r);
      return { cv: c, caixa: v.caixa };
    }
    return { assar, VISTAS };
  }
  raiz.Caminhao = { criar };
})(typeof self !== 'undefined' ? self : globalThis);
