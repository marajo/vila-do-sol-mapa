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
      abobora: { nome: 'Abóbora', alto: 18, por: 2, fileiras: 2, pintar(g, x, y, r) {
        g.strokeStyle = '#6a8a34'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 30, y - 3); g.bezierCurveTo(x - 10, y - 11, x + 10, y + 3, x + 32, y - 5); g.stroke(); // rama
        g.lineWidth = 0.7; for (let i = 0; i < 3; i++) { const gx = x - 20 + i * 18; g.beginPath(); g.moveTo(gx, y - 6); g.bezierCurveTo(gx + 3, y - 12, gx + 7, y - 4, gx + 4, y - 9); g.stroke(); } // gavinhas
        for (let i = 0; i < 14; i++) { // folhas grandes, recortadas, com nervuras
          const lx = x - 30 + i * 4.6 + (r() - 0.5) * 4, ly = y - 5 - r() * 10, rr = 5 + r() * 2.5;
          folha(g, lx, ly, rr, rr * 0.78, r(), tom('#5a8a30', 0.82 + r() * 0.35));
          g.strokeStyle = 'rgba(25,45,12,.4)'; g.lineWidth = 0.5; g.beginPath(); for (const a of [-0.9, 0, 0.9]) { g.moveTo(lx, ly + rr * 0.4); g.lineTo(lx + Math.sin(a) * rr * 0.8, ly - Math.cos(a) * rr * 0.6); } g.stroke();
        }
        for (let n = r() < 0.6 ? 2 : 1, j = 0; j < n; j++) { // abóboras com gomos
          const px = x + (j ? 14 : -8) + (r() - 0.5) * 6, py = y - 2, k0 = 0.9 + r() * 0.2;
          g.fillStyle = 'rgba(30,25,10,.35)'; g.beginPath(); g.ellipse(px + 2, py + 1, 8, 2.5, 0, 0, TAU); g.fill();
          for (const [dx, k] of [[-4.5, 0.82], [4.5, 0.82], [0, 1]]) { g.fillStyle = degradeV(g, py - 9, py + 2, [[0, tom('#f39028', k * k0 * 1.15)], [1, tom('#c25e14', k * k0)]]); g.beginPath(); g.ellipse(px + dx, py - 3.5, 5.2, 6.2, 0, 0, TAU); g.fill(); }
          g.fillStyle = 'rgba(255,240,200,.4)'; g.beginPath(); g.ellipse(px - 1.5, py - 6.5, 1.6, 2.4, 0, 0, TAU); g.fill();
          g.fillStyle = '#5a6a2a'; g.fillRect(px - 0.9, py - 11.5, 1.8, 3.4);
        }
      } },
      couve: { nome: 'Couve', alto: 20, por: 4, fileiras: 2, pintar(g, x, y, r) {
        g.strokeStyle = '#a8c08a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 8); g.stroke();
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45, lx = x + Math.cos(a) * 8, ly = y - 10 + Math.sin(a) * 7; folha(g, lx, ly, 7, 5, a + Math.PI / 2, tom('#4f7f5a', 0.85 + r() * 0.3)); g.strokeStyle = 'rgba(210,230,200,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(lx, ly); g.stroke(); }
      } },
      alface: { nome: 'Alface', alto: 14, por: 5, fileiras: 2, pintar(g, x, y, r) {
        // pé de alface crespa: folhas de fora maiores e mais escuras, de dentro claras, bordas onduladas
        for (const [n, d, rx, cor] of [[8, 6, 5.2, '#5f9a34'], [7, 3.6, 4.4, '#7cb342'], [5, 1.6, 3.4, '#a5d65c']]) {
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + r() * 0.4, lx = x + Math.cos(a) * d, ly = y - 6 + Math.sin(a) * d * 0.62;
            folha(g, lx, ly, rx, rx * 0.72, a, tom(cor, 0.9 + r() * 0.2));
            g.strokeStyle = tom(cor, 1.25, 0.7); g.lineWidth = 0.55; g.beginPath();
            for (let k = 0; k < 4; k++) { const b = a - 1 + k * 0.6; g.moveTo(lx + Math.cos(b) * rx * 0.85, ly + Math.sin(b) * rx * 0.6); g.arc(lx + Math.cos(b) * rx * 0.85, ly + Math.sin(b) * rx * 0.6, 0.9, b, b + 2.4); }
            g.stroke();
          }
        }
        g.fillStyle = 'rgba(240,255,210,.5)'; g.beginPath(); g.ellipse(x - 1, y - 7.5, 1.8, 1.2, 0, 0, TAU); g.fill();
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
    // tempo (s) do plantio até a colheita, em ritmo de jogo
    const CICLO = { cenoura: 40, alface: 35, couve: 45, morango: 70, milho: 60, girassol: 80, tomate: 65, abobora: 70 };
    const ESTAGIOS = ['terra preparada', 'brotando', 'crescendo', 'pronto para colher'];
    /** canteiro elevado com a cultura num estágio: 0 terra preparada, 1 brotos, 2 crescendo, 3 pronto para colher */
    function canteiro(x0, x1, base, tipo, agora = 0, sorte = Math.random()) {
      const C = CULTURAS[tipo], dd = 46, hh = 9, yT = base - hh, dur = CICLO[tipo];
      // começa variado: uns prontos, uns vazios, outros no meio do caminho (o agricultor tem o que fazer)
      const plantado = sorte < 0.3 ? agora - dur * 1.3 : sorte < 0.5 ? null : agora - dur * (sorte - 0.5) * 1.6;
      return { tipo: 'canteiro', base, cultura: tipo, nomeCultura: C.nome, plantado, dur, estagios: true,
        rotulo: `Canteiro de ${C.nome.toLowerCase()}`,
        progresso(t) { return this.plantado == null ? 0 : Math.min(1, (t - this.plantado) / this.dur); },
        estagio(t) { if (this.plantado == null) return 0; const p = this.progresso(t); return p < 0.25 ? 1 : p < 0.7 ? 2 : 3; },
        rotuloAgora(t) { const e = this.estagio(t); return `Canteiro de ${C.nome.toLowerCase()} · ${e === 2 ? `crescendo (${Math.round(this.progresso(t) * 100)}%)` : ESTAGIOS[e]}`; },
        pegada: [x0, base - dd, x1, base], caixa: [x0 - 18, yT - dd - C.alto - 14, x1 + 18, base + 8], pintar(g, r, estagio = 3) {
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
        for (const ly of lin) for (let i = 0; i < n; i++) {
          const px = x0 + 12 + (i + 0.5) * ((x1 - x0 - 24) / n) + (r() - 0.5) * 3, py = ly + 1;
          if (estagio === 1) { // broto: duas folhinhas (cotilédones) saindo da terra
            g.strokeStyle = '#6f9a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 4); g.stroke();
            folha(g, px - 2, py - 4.5, 2.3, 1.2, -0.4, '#7fb84a'); folha(g, px + 2, py - 4.5, 2.3, 1.2, 0.4, '#8cc455');
          } else if (estagio === 2) { g.save(); g.translate(px, py); g.scale(0.55, 0.55); g.translate(-px, -py); C.pintar(g, px, py, r); g.restore(); } // metade do tamanho
          else if (estagio === 3) C.pintar(g, px, py, r);
        }
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

    // ---------- árvores frutíferas (folha por folha, como a grama) ----------
    // A copa é um volume 3D (elipsoide) cheio de tufos; cada tufo é um monte de folhinhas desenhadas uma a uma, com
    // três tons (sombra, meio, luz) conforme o lado do sol (noroeste) e se estão por dentro ou por fora da copa.
    // Projeção da câmera a 45° igual à dos bichos. Ordem: folhas de trás, galhos, frutas e folhas da frente misturadas
    // pela profundidade; o tronco com casca e raízes aparece embaixo da copa.
    const ARVORES = {
      laranja: { nome: 'Laranjeira', copa: [62, 54, 56], altura: 92, folha: [4.6, 2.5], n: 3000, tufos: 20, caida: 0.25,
        tons: ['#14361a', '#245a22', '#3f7f2e', '#76ad4e'], fruta: '#f39c1f', frutaR: 3.7, frutas: 42, tronco: '#6b5038', brilho: true },
      maca: { nome: 'Macieira', copa: [68, 58, 50], altura: 86, folha: [4.6, 2.9], n: 2500, tufos: 14, caida: 0.15,
        tons: ['#22461b', '#3a6b29', '#5a953f', '#97c466'], fruta: '#c8312a', frutaR: 3.6, frutas: 36, tronco: '#5f4632' },
      manga: { nome: 'Mangueira', copa: [80, 68, 64], altura: 100, folha: [7, 2.2], n: 3400, tufos: 22, caida: 0.65,
        tons: ['#0e2b17', '#1c4a20', '#33682a', '#679845'], fruta: '#f2b33d', frutaR: 4.4, frutas: 26, tronco: '#5a4430', manga: true },
      limao: { nome: 'Limoeiro', copa: [50, 44, 46], altura: 76, folha: [4.2, 2.3], n: 2100, tufos: 16, caida: 0.2,
        tons: ['#1a441b', '#2f6a28', '#4f9038', '#8fc35e'], fruta: '#d8de3a', frutaR: 3.1, frutas: 36, tronco: '#6a5440', brilho: true },
    };
    const FY = 0.66, FZ = 0.9;
    const nrm = v => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
    const SOL = nrm([-0.5, -0.55, 0.75]), VISTA = nrm([0, FZ, FY]);
    /** mistura de três tons pela luz (0 = sombra, 1 = sol) */
    function tomFolha(t, l) {
      const k = Math.max(0, Math.min(1, l)), [a, b] = k < 0.5 ? [t[0], t[1]] : [t[1], t[2]], u = k < 0.5 ? k * 2 : k * 2 - 1;
      const c1 = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)], c2 = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
      return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * u)},${Math.round(c1[1] + (c2[1] - c1[1]) * u)},${Math.round(c1[2] + (c2[2] - c1[2]) * u)})`;
    }
    function arvore(x, base, tipo) {
      const A = ARVORES[tipo], [rx, ry, rz] = A.copa, cz = A.altura;
      const tela = (px, py, pz) => [x + px, base + py * FY - pz * FZ];
      const topo = base - (cz + rz) * FZ - ry * FY;
      return { tipo: 'arvore', base, especie: tipo, rotulo: A.nome, balanca: true, pegada: [x - 14, base - 10, x + 14, base], caixa: [x - rx - 26, topo - 16, x + rx + 40, base + ry * FY + 18], pintar(g, r) {
        // sombra no chão (duas camadas, a leste/sudeste)
        for (const [k, a] of [[1.15, 0.12], [0.85, 0.16]]) { g.fillStyle = `rgba(18,28,8,${a})`; g.beginPath(); g.ellipse(x + 30, base + 2, rx * k, ry * FY * k * 0.9, 0, 0, TAU); g.fill(); }
        // tufos (montes de folhas) espalhados pela superfície da copa: borda irregular e vãos entre eles
        const tufos = [];
        for (let i = 0; i < A.tufos; i++) {
          let u; do { u = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]; } while (Math.hypot(...u) > 1 || u[2] < -0.55);
          const d = 0.55 + 0.4 * Math.sqrt(r()), n = nrm(u);
          tufos.push({ c: [n[0] * rx * d, n[1] * ry * d, cz + n[2] * rz * d], raio: 0.34 + r() * 0.16 });
        }
        // folhas: cada uma num tufo, mais por fora do que por dentro
        const itens = [];
        for (let i = 0; i < A.n; i++) {
          const t = tufos[Math.floor(r() * tufos.length)], s = Math.cbrt(r()) * t.raio;
          let u; do { u = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]; } while (Math.hypot(...u) > 1);
          const p = [t.c[0] + u[0] * rx * s, t.c[1] + u[1] * ry * s, t.c[2] + u[2] * rz * s];
          const q = [p[0] / rx, p[1] / ry, (p[2] - cz) / rz], fora = Math.hypot(...q), n = nrm(q);
          const luz = (0.32 + 0.68 * Math.max(0, n[0] * SOL[0] + n[1] * SOL[1] + n[2] * SOL[2])) * (0.55 + 0.45 * Math.min(1, fora)) + (r() - 0.5) * 0.12;
          itens.push({ prof: p[1] * VISTA[1] + p[2] * VISTA[2], folha: true, p, luz, ang: (r() - 0.5) * 2.6 + (r() < A.caida ? Math.PI / 2 : 0), tam: 0.75 + r() * 0.5 });
        }
        // frutas: perto da superfície, mais na metade de baixo e do lado de fora
        for (let i = 0; i < A.frutas; i++) {
          let u; do { u = [r() * 2 - 1, r() * 2 - 1, r() * 1.4 - 0.9]; } while (Math.hypot(...u) > 1);
          const n = nrm(u), d = 0.78 + r() * 0.2, p = [n[0] * rx * d, n[1] * ry * d, cz + n[2] * rz * d];
          itens.push({ prof: p[1] * VISTA[1] + p[2] * VISTA[2] + 0.5, fruta: true, p, luz: 0.5 + 0.5 * Math.max(0, n[0] * SOL[0] + n[1] * SOL[1] + n[2] * SOL[2]) });
        }
        itens.sort((a, b) => a.prof - b.prof);
        // tronco com raízes e casca
        const tt = cz - rz * 0.35, base2 = base;
        const [tx0, ty0] = tela(0, 0, tt);
        g.fillStyle = degradeH(g, x - 10, x + 10, [[0, tom(A.tronco, 1.25)], [0.45, A.tronco], [1, tom(A.tronco, 0.55)]]);
        g.beginPath(); g.moveTo(x - 15, base2); g.quadraticCurveTo(x - 8, base2 - 5, x - 8, base2 - 18); g.lineTo(x - 5.5, ty0); g.lineTo(x + 5.5, ty0); g.lineTo(x + 8, base2 - 18); g.quadraticCurveTo(x + 8, base2 - 5, x + 16, base2); g.closePath(); g.fill();
        g.strokeStyle = tom(A.tronco, 0.55, 0.55); g.lineWidth = 0.7;
        for (let i = 0; i < 12; i++) { const bx = x - 7 + r() * 14; g.beginPath(); g.moveTo(bx, base2 - 2); g.quadraticCurveTo(bx + (r() - 0.5) * 4, (base2 + ty0) / 2, bx + (r() - 0.5) * 3, ty0 + 2); g.stroke(); }
        for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(160,170,120,.35)'; g.beginPath(); g.ellipse(x - 6 + r() * 12, base2 - 6 - r() * (base2 - ty0 - 10), 1.6, 2.6, 0, 0, TAU); g.fill(); } // líquen
        const desenhaGalhos = () => { // galhos que saem da forquilha para os tufos (aparecem nos vãos)
          g.lineCap = 'round';
          tufos.forEach((t, i) => {
            if (i % 2) return;
            const m = [t.c[0] * 0.45, t.c[1] * 0.45, tt + (t.c[2] - tt) * 0.5], f = [t.c[0] * 0.8, t.c[1] * 0.8, tt + (t.c[2] - tt) * 0.85];
            const [ax, ay] = [tx0, ty0], [mx, my] = tela(...m), [fx, fy] = tela(...f);
            g.strokeStyle = tom(A.tronco, 0.85); g.lineWidth = 4.2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(mx, my); g.stroke();
            g.lineWidth = 2.2; g.beginPath(); g.moveTo(mx, my); g.lineTo(fx, fy); g.stroke();
            g.strokeStyle = tom(A.tronco, 1.3, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(ax - 1, ay); g.lineTo(mx - 1, my); g.stroke();
          });
        };
        // massa da copa: cada tufo como um volume escuro (a copa não fica transparente)
        for (const t of [...tufos].sort((a, b) => (a.c[1] * VISTA[1] + a.c[2] * VISTA[2]) - (b.c[1] * VISTA[1] + b.c[2] * VISTA[2]))) {
          const [sx, sy] = tela(...t.c), q = nrm([t.c[0] / rx, t.c[1] / ry, (t.c[2] - cz) / rz]), l = 0.25 + 0.4 * Math.max(0, q[0] * SOL[0] + q[1] * SOL[1] + q[2] * SOL[2]);
          g.fillStyle = tomFolha(A.tons, l * 0.6); g.beginPath(); g.ellipse(sx, sy, rx * t.raio * 0.92, (rz * FZ + ry * FY) * t.raio * 0.5, 0, 0, TAU); g.fill();
        }
        // copa: folhas de trás, galhos, depois o resto (frutas e folhas da frente) pela profundidade
        let galhos = false;
        const [L, W] = A.folha;
        for (const it of itens) {
          if (!galhos && it.prof > (cz) * VISTA[2] - ry * 0.2 * VISTA[1]) { desenhaGalhos(); galhos = true; }
          const [sx, sy] = tela(...it.p);
          if (it.fruta) {
            const fr = A.frutaR, gr = g.createRadialGradient(sx - fr * 0.35, sy - fr * 0.4, 0.3, sx, sy, fr);
            gr.addColorStop(0, tom(A.fruta, 1.35)); gr.addColorStop(0.55, tom(A.fruta, 0.8 + it.luz * 0.3)); gr.addColorStop(1, tom(A.fruta, 0.6));
            g.fillStyle = gr; g.beginPath();
            if (A.manga) g.ellipse(sx, sy, fr * 0.78, fr * 1.15, 0.35, 0, TAU); else g.arc(sx, sy, fr, 0, TAU);
            g.fill();
            if (A.manga) { g.fillStyle = 'rgba(205,70,40,.4)'; g.beginPath(); g.ellipse(sx - fr * 0.25, sy - fr * 0.3, fr * 0.45, fr * 0.55, 0.35, 0, TAU); g.fill(); }
            continue;
          }
          // folhinha: elipse pontuda na direção da folha; as do lado do sol ganham um brilho na metade de cima
          const len = L * it.tam, wl = W * it.tam * 0.5, c = Math.cos(it.ang), sn = Math.sin(it.ang);
          g.fillStyle = tomFolha(A.tons, it.luz);
          g.beginPath(); g.moveTo(sx - c * len * 0.5, sy - sn * len * 0.5); g.quadraticCurveTo(sx - sn * wl * 1.6, sy + c * wl * 1.6, sx + c * len * 0.5, sy + sn * len * 0.5); g.quadraticCurveTo(sx + sn * wl * 1.6, sy - c * wl * 1.6, sx - c * len * 0.5, sy - sn * len * 0.5); g.fill();
          if (it.luz > 0.8) { g.fillStyle = tomFolha([A.tons[2], A.tons[3], A.tons[3]], (it.luz - 0.8) * (A.brilho ? 5 : 3.5)); g.beginPath(); g.ellipse(sx - sn * wl * 0.3, sy + c * wl * 0.3 - 0.3, len * 0.28, wl * 0.45, it.ang, 0, TAU); g.fill(); }
        }
        if (!galhos) desenhaGalhos();
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
    function regador(x, base) {
      return { tipo: 'regador', base, rotulo: 'Regador', pegada: [x - 9, base - 8, x + 9, base], caixa: [x - 18, base - 24, x + 18, base + 6], pintar(g) {
        g.fillStyle = 'rgba(30,24,10,.3)'; g.beginPath(); g.ellipse(x + 2, base, 10, 3, 0, 0, TAU); g.fill();
        g.fillStyle = degradeH(g, x - 7, x + 7, [[0, '#b9c2c4'], [0.3, '#e3e8e9'], [1, '#7c8587']]); g.beginPath(); g.moveTo(x - 7, base); g.lineTo(x - 6, base - 13); g.lineTo(x + 6, base - 13); g.lineTo(x + 7, base); g.closePath(); g.fill();
        g.fillStyle = '#c3cacc'; g.beginPath(); g.ellipse(x, base - 13, 6, 1.8, 0, 0, TAU); g.fill();
        g.strokeStyle = '#8d9698'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 5, base - 4); g.lineTo(x + 14, base - 14); g.stroke(); // bico
        g.fillStyle = '#8d9698'; g.beginPath(); g.ellipse(x + 14.5, base - 14.5, 1.8, 2.4, -0.7, 0, TAU); g.fill();
        g.strokeStyle = '#7c8587'; g.lineWidth = 1.4; g.beginPath(); g.arc(x - 1, base - 14, 5, Math.PI, 0); g.stroke(); // alça
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 4, base - 2); g.lineTo(x - 3.5, base - 11); g.stroke();
      } };
    }
    /** escada de madeira encostada na copa (para colher), com o pé em (x, base) */
    function escada(x, base) {
      return { tipo: 'escada', base, rotulo: 'Escada de colheita', pegada: [x - 10, base - 6, x + 10, base], caixa: [x - 30, base - 104, x + 16, base + 6], pintar(g) {
        g.fillStyle = 'rgba(30,24,10,.3)'; g.beginPath(); g.ellipse(x - 2, base, 12, 3, 0, 0, TAU); g.fill();
        const topo = [x - 16, base - 96];
        for (const dx of [-6, 6]) { // montantes
          g.strokeStyle = '#6e5233'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + dx, base); g.lineTo(topo[0] + dx * 0.7, topo[1]); g.stroke();
          g.strokeStyle = 'rgba(230,200,150,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + dx - 0.8, base); g.lineTo(topo[0] + dx * 0.7 - 0.8, topo[1]); g.stroke();
        }
        g.strokeStyle = '#8a6a44'; g.lineWidth = 2.2;
        for (let t = 0.1; t < 0.98; t += 0.13) { const cx = x + (topo[0] - x) * t, cy = base + (topo[1] - base) * t, w = 6 - t * 1.8; g.beginPath(); g.moveTo(cx - w, cy); g.lineTo(cx + w, cy); g.stroke(); } // degraus
      } };
    }
    function caixote(x, base, fruta) {
      return { tipo: 'caixote', base, rotulo: 'Caixote de colheita', pegada: [x - 15, base - 12, x + 15, base], caixa: [x - 20, base - 34, x + 20, base + 6], pintar(g, r) {
        g.fillStyle = 'rgba(30,24,10,.3)'; g.fillRect(x - 14, base - 1, 32, 5);
        g.fillStyle = '#7a5a36'; g.fillRect(x - 15, base - 26, 30, 12); // fundo/borda de cima
        for (let i = 0; i < 12; i++) { g.fillStyle = fruta; g.beginPath(); g.arc(x - 11 + r() * 22, base - 22 + r() * 6, 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(x - 11.8 + r() * 22, base - 23.5 + r() * 6, 0.7, 0, TAU); g.fill(); }
        for (const yy of [base - 14, base - 7]) { g.fillStyle = degradeV(g, yy, yy + 6, [[0, '#c49a62'], [1, '#93703f']]); g.fillRect(x - 15, yy, 30, 6); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 15, yy + 5.4, 30, 0.8); } // ripas da frente
        for (const px of [x - 15, x + 12]) { g.fillStyle = '#6e5030'; g.fillRect(px, base - 16, 3, 16); }
      } };
    }
    return { CULTURAS, ARVORES, canteiro, espantalho, arvore, cesto, regador, escada, caixote };
  }

  raiz.Plantas = { criar };
})(typeof self !== 'undefined' ? self : globalThis);
