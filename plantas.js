// Horta e pomar do mapa novo, no mesmo desenho vetorial da casa e dos currais (assado na resolução do zoom).
//   canteiro elevado de madeira com terra fofa e a cultura (milho, girassol, tomate no tutor, abóbora, couve, alface,
//   cenoura, morango), espantalho, árvores frutíferas (laranjeira, macieira, mangueira, limoeiro) com tronco, galhos,
//   copa de folhas em camadas e frutas, cesto de frutas. Cada peça devolve { tipo, base, pegada, caixa, pintar, rotulo }.
(function (raiz) {
  'use strict';
  const TAU = Math.PI * 2;

  function criar(U) {
    const { tom, degradeV, degradeH } = U;
    const folha = (g, x, y, rx, ry, rot, cor) => { g.fillStyle = cor; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };

    // ---------- culturas (desenhadas com o pé em (x, y)) ----------
    const CULTURAS = {
      milho: { nome: 'Milho', alto: 62, por: 6, fileiras: 2, pintar(g, x, y, r) {
        for (let i = 0; i < 7; i++) { // folhas compridas e curvas
          const lado = i % 2 ? 1 : -1, h = 10 + i * 7, comp = 16 + r() * 8;
          g.strokeStyle = tom('#5f8a32', 0.85 + r() * 0.3); g.lineWidth = 2.6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x, y - h); g.quadraticCurveTo(x + lado * comp * 0.6, y - h - 8, x + lado * comp, y - h + 4 + r() * 4); g.stroke();
        }
        g.strokeStyle = '#6f9a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 58); g.stroke(); // colmo
        g.strokeStyle = '#9ec25a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 0.8, y); g.lineTo(x, y - 56); g.stroke();
        folha(g, x + 4, y - 34, 3, 8, 0.25, '#9fb85a'); folha(g, x + 4.5, y - 36, 2.2, 6, 0.25, '#e4c64c'); // espiga com palha e grãos
        g.strokeStyle = '#a8794a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 5, y - 43); g.lineTo(x + 7, y - 47); g.moveTo(x + 4, y - 43); g.lineTo(x + 4, y - 48); g.stroke();
        g.strokeStyle = '#c9a85a'; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + 1, y - 58); g.lineTo(x + 1 + k * 2.5, y - 64 + Math.abs(k)); g.stroke(); } // pendão
      } },
      girassol: { nome: 'Girassol', alto: 70, por: 5, fileiras: 2, pintar(g, x, y, r) {
        g.strokeStyle = '#5f8a32'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2, y - 30, x + 1, y - 56); g.stroke();
        for (const [h, l] of [[16, -1], [26, 1], [38, -1], [46, 1]]) folha(g, x + l * 7, y - h, 7, 4.5, l * 0.5, tom('#5a8a2e', 0.9 + r() * 0.2));
        const cx = x + 2, cy = y - 60;
        for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; folha(g, cx + Math.cos(a) * 8, cy + Math.sin(a) * 6.5, 4.6, 1.9, a, k % 2 ? '#f4c430' : '#e8b31e'); }
        g.fillStyle = degradeV(g, cy - 6, cy + 6, [[0, '#6b4220'], [1, '#3b2412']]); g.beginPath(); g.ellipse(cx, cy, 6, 5, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,220,150,.35)'; for (let k = 0; k < 10; k++) { g.beginPath(); g.arc(cx - 3 + r() * 6, cy - 3 + r() * 6, 0.6, 0, TAU); g.fill(); }
      } },
      tomate: { nome: 'Tomate', alto: 46, por: 5, fileiras: 2, pintar(g, x, y, r) {
        g.fillStyle = '#9a7a52'; g.fillRect(x - 1, y - 46, 2.2, 46); // tutor de bambu
        g.fillStyle = '#c6a874'; g.fillRect(x - 1, y - 46, 0.8, 46);
        for (let i = 0; i < 14; i++) folha(g, x + (r() - 0.5) * 16, y - 8 - r() * 34, 4 + r() * 3, 2.8 + r() * 2, r() * 3, tom('#4f7a2c', 0.8 + r() * 0.4));
        for (let i = 0; i < 6; i++) { // tomates: verdes, mudando e maduros
          const tx = x + (r() - 0.5) * 12, ty = y - 10 - r() * 26, c = ['#d8352a', '#e2452e', '#f08a2a', '#8fb84a'][Math.floor(r() * 4)];
          g.fillStyle = c; g.beginPath(); g.arc(tx, ty, 2.8, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(tx - 0.9, ty - 0.9, 0.8, 0, TAU); g.fill();
          g.fillStyle = '#3f6a22'; g.fillRect(tx - 0.6, ty - 3.4, 1.2, 1.2);
        }
      } },
      abobora: { nome: 'Abóbora', alto: 16, por: 2, fileiras: 1, pintar(g, x, y, r) {
        g.strokeStyle = '#6a8a34'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 30, y - 4); g.bezierCurveTo(x - 10, y - 12, x + 10, y + 2, x + 32, y - 6); g.stroke(); // rama
        for (let i = 0; i < 9; i++) { const lx = x - 28 + i * 7 + (r() - 0.5) * 4, ly = y - 6 - r() * 8; folha(g, lx, ly, 6, 4.6, r(), tom('#5a8a30', 0.85 + r() * 0.3)); g.strokeStyle = 'rgba(30,50,15,.4)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(lx - 4, ly); g.lineTo(lx + 4, ly); g.stroke(); }
        const px = x + (r() - 0.5) * 10, py = y - 3; // abóbora com gomos
        for (const [dx, k] of [[-4, 0.82], [4, 0.82], [0, 1]]) { g.fillStyle = degradeV(g, py - 8, py + 2, [[0, tom('#f08a24', k * 1.15)], [1, tom('#c25e14', k)]]); g.beginPath(); g.ellipse(px + dx, py - 3, 5, 6, 0, 0, TAU); g.fill(); }
        g.fillStyle = '#5a6a2a'; g.fillRect(px - 0.8, py - 10.5, 1.6, 3);
      } },
      couve: { nome: 'Couve', alto: 20, por: 4, fileiras: 2, pintar(g, x, y, r) {
        g.strokeStyle = '#a8c08a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 8); g.stroke();
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45, lx = x + Math.cos(a) * 8, ly = y - 10 + Math.sin(a) * 7; folha(g, lx, ly, 7, 5, a + Math.PI / 2, tom('#4f7f5a', 0.85 + r() * 0.3)); g.strokeStyle = 'rgba(210,230,200,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(lx, ly); g.stroke(); }
      } },
      alface: { nome: 'Alface', alto: 12, por: 5, fileiras: 2, pintar(g, x, y, r) {
        for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, d = i < 6 ? 5 : 2; folha(g, x + Math.cos(a) * d, y - 5 + Math.sin(a) * d * 0.6, 5.5 - d * 0.3, 4, a, tom(i < 6 ? '#7cb342' : '#a5d65c', 0.9 + r() * 0.2)); }
        g.strokeStyle = 'rgba(230,250,200,.6)'; g.lineWidth = 0.6; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 5, y - 5 + Math.sin(a) * 3, 3, a, a + 2); g.stroke(); }
      } },
      cenoura: { nome: 'Cenoura', alto: 18, por: 7, fileiras: 2, pintar(g, x, y, r) {
        g.fillStyle = '#e8792a'; g.beginPath(); g.ellipse(x, y - 1, 2.6, 1.8, 0, 0, TAU); g.fill(); // ombro da raiz
        g.strokeStyle = '#4f8a2a'; g.lineWidth = 0.9;
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 1.3, h = 10 + r() * 8, ex = x + Math.cos(a) * h, ey = y - 2 + Math.sin(a) * h; g.beginPath(); g.moveTo(x, y - 2); g.quadraticCurveTo((x + ex) / 2 + (r() - 0.5) * 3, (y + ey) / 2, ex, ey); g.stroke(); for (let k = 0; k < 3; k++) folha(g, ex + (r() - 0.5) * 3, ey + (r() - 0.5) * 3, 1.6, 0.9, r() * 3, '#5f9a35'); }
      } },
      morango: { nome: 'Morango', alto: 10, por: 5, fileiras: 2, pintar(g, x, y, r) {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; for (let k = 0; k < 3; k++) folha(g, x + Math.cos(a) * 5 + (k - 1) * 1.6, y - 5 + Math.sin(a) * 3 - 1, 2.4, 1.8, a + k, tom('#3f7a2c', 0.85 + r() * 0.3)); }
        for (let i = 0; i < 3; i++) { const fx = x + (r() - 0.5) * 12, fy = y - 1 + r() * 2; g.fillStyle = r() < 0.75 ? '#d8282f' : '#f0f0d0'; g.beginPath(); g.moveTo(fx - 2, fy - 2); g.quadraticCurveTo(fx, fy + 3.5, fx + 2, fy - 2); g.closePath(); g.fill(); g.fillStyle = '#4f8a2a'; g.fillRect(fx - 1.4, fy - 2.6, 2.8, 1); g.fillStyle = 'rgba(255,240,150,.8)'; g.fillRect(fx - 0.5, fy - 0.8, 0.6, 0.6); }
      } },
    };

    /** canteiro elevado: moldura de tábuas, terra com sulcos, a cultura em fileiras (as de trás primeiro) */
    function canteiro(x0, x1, base, tipo) {
      const C = CULTURAS[tipo], dd = 46, hh = 9, yT = base - hh;
      return { tipo: 'canteiro', base, cultura: tipo, rotulo: `Canteiro de ${C.nome.toLowerCase()}`, pegada: [x0, base - dd, x1, base], caixa: [x0 - 18, yT - dd - C.alto - 14, x1 + 18, base + 8], pintar(g, r) {
        g.fillStyle = 'rgba(30,24,10,.35)'; g.fillRect(x0 + 2, base - 2, x1 - x0, 6);
        // terra fofa com sulcos (vista de cima)
        g.fillStyle = degradeV(g, yT - dd, yT, [[0, '#4a3524'], [1, '#5e4430']]); g.fillRect(x0 + 3, yT - dd + 3, x1 - x0 - 6, dd - 4);
        for (let i = 0; i < (x1 - x0) * dd / 30; i++) { g.fillStyle = r() < 0.5 ? 'rgba(25,15,8,.35)' : 'rgba(140,105,70,.3)'; g.fillRect(x0 + 4 + r() * (x1 - x0 - 8), yT - dd + 4 + r() * (dd - 6), 1.3, 1); }
        const fil = C.fileiras, lin = Array.from({ length: fil }, (_, k) => yT - dd + 10 + (k + 0.5) * ((dd - 12) / fil));
        for (const ly of lin) { g.fillStyle = 'rgba(25,15,8,.35)'; g.fillRect(x0 + 6, ly + 2, x1 - x0 - 12, 2); g.fillStyle = 'rgba(150,115,80,.3)'; g.fillRect(x0 + 6, ly - 1, x1 - x0 - 12, 1.2); }
        if (tipo === 'morango') { g.strokeStyle = 'rgba(214,184,100,.75)'; g.lineWidth = 0.8; for (let i = 0; i < 70; i++) { const sx = x0 + 6 + r() * (x1 - x0 - 12), sy = yT - dd + 6 + r() * (dd - 8); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (r() - 0.5) * 6, sy + (r() - 0.5) * 2); g.stroke(); } } // palha
        // moldura: borda de cima (clara) dos quatro lados
        const borda = '#9a7a54';
        g.fillStyle = tom(borda, 1.15); g.fillRect(x0, yT - dd, x1 - x0, 3.5); g.fillRect(x0, yT - dd, 3.5, dd); g.fillRect(x1 - 3.5, yT - dd, 3.5, dd);
        // plantas (de trás para a frente)
        const n = Math.max(1, Math.round(C.por * 1.6)); // pés por fileira
        for (const ly of lin) for (let i = 0; i < n; i++) C.pintar(g, x0 + 12 + (i + 0.5) * ((x1 - x0 - 24) / n) + (r() - 0.5) * 3, ly + 1, r);
        // frente da moldura (tábua), na frente das plantas baixas
        g.fillStyle = degradeV(g, yT, base, [[0, tom(borda, 1.05)], [1, tom(borda, 0.72)]]); g.fillRect(x0, yT, x1 - x0, hh);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0, yT, x1 - x0, 1);
        g.fillStyle = '#2b2622'; for (const nx of [x0 + 3, x1 - 5]) g.fillRect(nx, yT + 3, 1.6, 1.6);
        for (const px of [x0, x1 - 4]) { g.fillStyle = tom(borda, 0.8); g.fillRect(px, yT - dd, 4, dd + hh); } // estacas dos cantos
      } };
    }

    function espantalho(x, base) {
      return { tipo: 'espantalho', base, rotulo: 'Espantalho', pegada: [x - 8, base - 6, x + 8, base], caixa: [x - 30, base - 92, x + 30, base + 8], pintar(g, r) {
        g.fillStyle = 'rgba(30,24,10,.3)'; g.beginPath(); g.ellipse(x + 4, base, 12, 3.5, 0, 0, TAU); g.fill();
        g.fillStyle = '#7a5a38'; g.fillRect(x - 2, base - 74, 4, 74); g.fillRect(x - 24, base - 56, 48, 3.5); // cruz de madeira
        g.fillStyle = degradeH(g, x - 13, x + 13, [[0, '#4f6f9a'], [1, '#2f4a6e']]); // camisa xadrez
        g.beginPath(); g.moveTo(x - 13, base - 58); g.lineTo(x + 13, base - 58); g.lineTo(x + 11, base - 30); g.lineTo(x - 11, base - 30); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(200,60,50,.55)'; g.lineWidth = 1; for (let k = -10; k <= 10; k += 5) { g.beginPath(); g.moveTo(x + k, base - 58); g.lineTo(x + k * 0.85, base - 30); g.stroke(); } for (let k = 52; k > 30; k -= 5) { g.beginPath(); g.moveTo(x - 12, base - k); g.lineTo(x + 12, base - k); g.stroke(); }
        g.fillStyle = degradeV(g, base - 58, base - 50, [[0, '#4f6f9a'], [1, '#2f4a6e']]); g.fillRect(x - 25, base - 58, 12, 6); g.fillRect(x + 13, base - 58, 12, 6); // mangas
        g.strokeStyle = '#d9b860'; g.lineWidth = 1; for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + s * 25, base - 55); g.lineTo(x + s * (28 + r() * 3), base - 57 + k * 2); g.stroke(); } // palha nas mãos
        g.fillStyle = '#7a5a38'; g.fillRect(x - 11, base - 30, 22, 3); // cinto
        g.fillStyle = degradeV(g, base - 70, base - 58, [[0, '#e7d2a0'], [1, '#c4a974']]); g.beginPath(); g.ellipse(x, base - 64, 7, 7.5, 0, 0, TAU); g.fill(); // cabeça de saco
        g.fillStyle = '#2b2622'; g.beginPath(); g.arc(x - 2.5, base - 65, 1, 0, TAU); g.arc(x + 2.5, base - 65, 1, 0, TAU); g.fill();
        g.strokeStyle = '#2b2622'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, base - 62.5, 2.6, 0.2, Math.PI - 0.2); g.stroke();
        g.fillStyle = '#c69a4a'; g.beginPath(); g.ellipse(x, base - 70, 14, 3.4, 0, 0, TAU); g.fill(); // chapéu de palha
        g.fillStyle = degradeV(g, base - 80, base - 70, [[0, '#e0bb6a'], [1, '#b98a3e']]); g.beginPath(); g.ellipse(x, base - 73, 7.5, 6, 0, Math.PI, 0); g.fill();
        g.fillStyle = '#a8442e'; g.fillRect(x - 7.5, base - 73, 15, 2);
      } };
    }

    // ---------- árvores frutíferas ----------
    const ARVORES = {
      laranja: { nome: 'Laranjeira', folha: ['#2f5f24', '#3f7a2c', '#5a9a3a'], fruta: ['#f39c1f', '#f7b23a'], copa: [72, 62], tronco: '#6b5038' },
      maca: { nome: 'Macieira', folha: ['#3f6f2a', '#5a8a34', '#7aac48'], fruta: ['#c8312a', '#e0483a'], copa: [70, 58], tronco: '#5f4632' },
      manga: { nome: 'Mangueira', folha: ['#244f22', '#336a2a', '#4f8a38'], fruta: ['#f2b33d', '#e8752a'], copa: [80, 68], tronco: '#5a4430' },
      limao: { nome: 'Limoeiro', folha: ['#2f6a2a', '#43863a', '#62a84a'], fruta: ['#d8de3a', '#c4d630'], copa: [64, 54], tronco: '#6a5440' },
    };
    function arvore(x, base, tipo) {
      const A = ARVORES[tipo], [cr, cv] = A.copa, alt = 50, cy = base - alt - cv * 0.72; // árvore adulta: ~3 vezes a altura de uma pessoa
      return { tipo: 'arvore', base, especie: tipo, rotulo: A.nome, balanca: true, pegada: [x - 14, base - 10, x + 14, base], caixa: [x - cr - 22, cy - cv - 14, x + cr + 22, base + 12], pintar(g, r) {
        // sombra no chão (sol a oeste-noroeste)
        g.fillStyle = 'rgba(18,28,8,.28)'; g.beginPath(); g.ellipse(x + 26, base - 6, cr * 0.95, cr * 0.34, 0, 0, TAU); g.fill();
        // tronco com raízes, casca e galhos
        g.fillStyle = degradeH(g, x - 9, x + 9, [[0, tom(A.tronco, 1.25)], [0.45, A.tronco], [1, tom(A.tronco, 0.6)]]);
        g.beginPath(); g.moveTo(x - 13, base); g.quadraticCurveTo(x - 7, base - 5, x - 7, base - 16); g.lineTo(x - 5, base - alt); g.lineTo(x + 5, base - alt); g.lineTo(x + 7, base - 16); g.quadraticCurveTo(x + 7, base - 5, x + 14, base); g.closePath(); g.fill();
        g.strokeStyle = tom(A.tronco, 0.6, 0.6); g.lineWidth = 0.7; for (let i = 0; i < 9; i++) { const bx = x - 6 + r() * 12; g.beginPath(); g.moveTo(bx, base - 2); g.quadraticCurveTo(bx + (r() - 0.5) * 3, base - alt / 2, bx + (r() - 0.5) * 2, base - alt + 2); g.stroke(); }
        g.strokeStyle = A.tronco; g.lineCap = 'round';
        for (const [dx, dy, w] of [[-34, -40, 5], [30, -38, 4.6], [-8, -52, 4.2], [14, -48, 3.6], [-22, -30, 3], [24, -26, 2.8]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x, base - alt + 2); g.quadraticCurveTo(x + dx * 0.4, base - alt - 8, x + dx, base - alt + dy); g.stroke(); }
        // copa: tufos em camadas (de trás/cima para a frente/baixo), luz do noroeste
        const tufos = [];
        for (let i = 0; i < 44; i++) { const a = r() * TAU, d = Math.sqrt(r()); tufos.push([x + Math.cos(a) * cr * d * 0.82, cy + Math.sin(a) * cv * d * 0.78, 14 + r() * 12]); } // borda irregular, não uma bola
        tufos.sort((a, b) => a[1] - b[1]);
        g.fillStyle = tom(A.folha[0], 0.85); g.beginPath(); g.ellipse(x, cy + 4, cr * 0.92, cv * 0.85, 0, 0, TAU); g.fill(); // massa escura de fundo
        for (const [tx, ty, tr] of tufos) {
          const luz = 0.85 + 0.3 * ((x - tx) / cr * 0.5 + (cy - ty) / cv * 0.6 + 0.5);
          const gr = g.createRadialGradient(tx - tr * 0.35, ty - tr * 0.4, 1, tx, ty, tr);
          gr.addColorStop(0, tom(A.folha[2], luz)); gr.addColorStop(0.55, tom(A.folha[1], luz)); gr.addColorStop(1, tom(A.folha[0], luz * 0.9));
          g.fillStyle = gr; g.beginPath(); g.arc(tx, ty, tr, 0, TAU); g.fill();
          for (let k = 0; k < 14; k++) { const a = r() * TAU, d = r() * tr * 0.9; folha(g, tx + Math.cos(a) * d, ty + Math.sin(a) * d, 3, 1.5, r() * 3, tom(A.folha[r() < 0.6 ? 2 : 1], luz * (0.9 + r() * 0.25))); }
        }
        // frutas penduradas (mais na metade de baixo e nas bordas da copa)
        const nf = 26 + Math.floor(r() * 12);
        for (let i = 0; i < nf; i++) {
          const a = r() * TAU, d = 0.35 + r() * 0.6, fx = x + Math.cos(a) * cr * d * 0.85, fy = cy + Math.abs(Math.sin(a)) * cv * d * 0.7 + 2, rr = tipo === 'manga' ? 3.8 : 3.3;
          g.fillStyle = A.fruta[r() < 0.7 ? 0 : 1];
          if (tipo === 'manga') { g.beginPath(); g.ellipse(fx, fy, rr * 0.8, rr * 1.2, 0.4, 0, TAU); g.fill(); g.fillStyle = 'rgba(200,60,40,.45)'; g.beginPath(); g.ellipse(fx - 0.5, fy - 1, rr * 0.5, rr * 0.6, 0.4, 0, TAU); g.fill(); }
          else { g.beginPath(); g.arc(fx, fy, rr, 0, TAU); g.fill(); }
          g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(fx - 0.8, fy - 0.9, 0.8, 0, TAU); g.fill();
        }
      } };
    }
    function cesto(x, base) {
      return { tipo: 'cesto', base, rotulo: 'Cesto de frutas colhidas', pegada: [x - 14, base - 10, x + 14, base], caixa: [x - 20, base - 30, x + 20, base + 6], pintar(g, r) {
        g.fillStyle = 'rgba(30,24,10,.3)'; g.beginPath(); g.ellipse(x + 3, base - 1, 15, 4, 0, 0, TAU); g.fill();
        const F = ['#f39c1f', '#c8312a', '#f2b33d', '#d8de3a'];
        for (let i = 0; i < 14; i++) { g.fillStyle = F[i % 4]; g.beginPath(); g.arc(x - 10 + r() * 20, base - 17 - r() * 6, 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(x - 10.8 + r() * 20, base - 18.5 - r() * 6, 0.7, 0, TAU); g.fill(); }
        g.fillStyle = degradeV(g, base - 16, base, [[0, '#b98a4e'], [1, '#7a5a30']]); g.beginPath(); g.moveTo(x - 14, base - 16); g.lineTo(x + 14, base - 16); g.lineTo(x + 11, base); g.lineTo(x - 11, base); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(70,45,20,.5)'; g.lineWidth = 0.7; for (let k = base - 13; k < base; k += 3) { g.beginPath(); g.moveTo(x - 13, k); g.lineTo(x + 13, k); g.stroke(); } // trançado
        g.strokeStyle = '#8a6438'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x, base - 16, 14, 2.5, 0, 0, TAU); g.stroke();
      } };
    }
    return { CULTURAS, ARVORES, canteiro, espantalho, arvore, cesto };
  }

  raiz.Plantas = { criar };
})(typeof self !== 'undefined' ? self : globalThis);
