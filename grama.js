// Grama realista (motor da skill grama-realista, aprovado na Selva do Dead Zone) adaptado para mapa grande.
// Diferenças do grama.ts original:
// - as hastes de cada pedaço (150 × 16 px de raízes) nascem só quando o pedaço aparece na tela, sempre iguais
//   (sorteio pela posição), e ficam em Float32Array; pedaços longe da tela por ~10 s perdem desenho e dados
//   (se não foram aparados/arrancados), então a memória não cresce com o tamanho do mapa;
// - zoom: a câmera tem escala; a qualidade do desenho (q) pode mudar e os pedaços são refeitos aos poucos;
// - taboas: hastes altas e escuras na beira do rio, algumas com a espiga marrom.
(function (raiz) {
  'use strict';
  const TONS_PASTO = [
    ['#2a3a16', '#4f6e26', '#86a646'], ['#30421a', '#5a7a2c', '#94b452'], ['#36481c', '#648632', '#a2c05e'],
    ['#3c4e20', '#6e9038', '#b0ca6a'], ['#43561f', '#7a9a3e', '#bed478'], ['#4a5c22', '#86a444', '#cadc86'],
  ];
  const TONS_TABOA = [['#1d2d1c', '#36502f', '#5e7c47'], ['#223320', '#3f5a35', '#6a8851'], ['#283a23', '#47633b', '#76935a']];
  // pedaços de 300 px: metade das chamadas de desenho por quadro (e menos sobra transparente nas laterais)
  const FAIXA = 16, LARG = 300, MARGEM = 20, CEL_MOITA = 100, PLACA = 512;
  // campos de cada haste no Float32Array
  const X = 0, Y = 1, ALT = 2, INCL = 3, LRG = 4, TOM = 5, F = 6, ANG = 7, T0 = 8, DUR = 9, CAB = 10, NC = 11;

  function semear(a, b, c) {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    let s = (h >>> 0) % 2147483646 + 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  class Grama {
    constructor(op) {
      this.W = op.largura; this.H = op.altura;
      this.dens = op.densidade ?? 0.11;
      this.podeNascer = op.podeNascer ?? (() => 1);
      this.taboa = op.taboa ?? (() => 0);
      /** 0–1: multiplica a altura do capim (gramado aparado em volta da casa) */
      this.aparado = op.aparado ?? (() => 1);
      this.campo = op.campo ?? ((x, y) => Math.max(0, Math.min(1, 0.5 + 0.3 * Math.sin(x / 97 + Math.sin(y / 61)) + 0.24 * Math.sin(y / 73 + x / 151) + 0.12 * Math.sin((x + y) / 37))));
      this.nGrama = (op.tons ?? TONS_PASTO).length;
      this.tons = [...(op.tons ?? TONS_PASTO), ...TONS_TABOA];
      this.moitas = op.moitas ?? 70;
      this.semente = op.semente ?? 777;
      this.altMax = 36; this.altTaboa = 64;
      this.orcamentoMs = op.orcamentoMs ?? 9;
      this.porQuadro = op.porQuadro ?? 16;
      this.q = op.q ?? 1.5;
      this.vento = true;
      this.cols = Math.ceil(this.W / LARG); this.rows = Math.ceil((this.H + 8) / FAIXA);
      this.ped = new Array(this.cols * this.rows);
      this.fila = []; this.quadroN = 0;
      this.placas = new Map(); this.longe = false; // modo longe: o capim vira placas prontas de PLACA × PLACA
      this.estat = { pedacos: 0, desenhados: 0, comDados: 0 };
    }

    pedaco(c, l) {
      const i = c + l * this.cols;
      let p = this.ped[i];
      if (!p) {
        const r = semear(c, l, this.semente + 5);
        p = this.ped[i] = { c, l, x0: c * LARG, y0: l * FAIXA, d: null, n: 0, cv: null, cq: 0, topo: 0, mexido: false, fixo: false, ativoAte: 0, visto: 0, fase: r() * 7 };
      }
      return p;
    }

    /** hastes do pedaço (sempre as mesmas para a mesma posição) */
    gerar(p) {
      const { x0, y0 } = p, nT = this.nGrama, lista = [];
      const r = semear(p.c, p.l, this.semente), entre = (a, b) => a + r() * (b - a);
      const n = Math.round(LARG * FAIXA * this.dens);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * LARG, y = y0 + r() * FAIXA - 4;
        const a = r(), b = r(), c = r(), d = r();
        if (y > this.H + 6) continue;
        const k = this.podeNascer(x, y);
        if (k <= 0) continue;
        const cp = this.campo(x, y);
        const alt = (11 + cp * (this.altMax - 11)) * (0.45 + 0.55 * Math.min(1, k)) * (0.8 + a * 0.32) * this.aparado(x, y);
        const tom = Math.max(0, Math.min(nT - 1, Math.round(cp * (nT - 1) + (b - 0.5) * 2.4)));
        lista.push([x, y, alt, -5 + c * 10, 1.6 + d, tom, 0]);
      }
      // taboas na beira d'água
      const nt = Math.round(LARG * FAIXA * 0.09);
      for (let i = 0; i < nt; i++) {
        const x = x0 + r() * LARG, y = y0 + r() * FAIXA - 4, a = r(), b = r(), c = r(), d = r(), e = r(), f = r();
        const v = this.taboa(x, y);
        if (v <= 0 || a > v) continue;
        lista.push([x, y, 30 + b * 34, -8 + c * 16, 1.6 + d * 1.1, nT + Math.floor(e * 3), f < 0.1 ? 1 : 0]);
      }
      // moitas: touceiras mais altas e escuras; o centro é sorteado numa grade de 100 px, então atravessa pedaços
      const pc = this.moitas / 100;
      for (let my = Math.floor((y0 - 36) / CEL_MOITA); my <= Math.floor((y0 + FAIXA + 36) / CEL_MOITA); my++)
        for (let mx = Math.floor((x0 - 36) / CEL_MOITA); mx <= Math.floor((x0 + LARG + 36) / CEL_MOITA); mx++) {
          const m = semear(mx, my, this.semente + 99);
          if (m() > pc) continue;
          const cx = (mx + m()) * CEL_MOITA, cy = (my + m()) * CEL_MOITA, rr = 14 + m() * 16;
          if (cy + rr < y0 - 4 || cy - rr > y0 + FAIXA || cx + rr < x0 || cx - rr > x0 + LARG) continue;
          if (this.podeNascer(cx, cy) < 1 || this.aparado(cx, cy) < 1) continue;
          const tot = Math.round(rr * 5);
          for (let k = 0; k < tot; k++) {
            const ang = m() * 7, dd = Math.sqrt(m()) * rr, x = cx + Math.cos(ang) * dd, y = cy + Math.sin(ang) * dd * 0.7;
            const a = m(), b = m(), c = m(), e = m();
            if (x < x0 || x >= x0 + LARG || y < y0 - 4 || y >= y0 + FAIXA - 4) continue;
            if (this.podeNascer(x, y) <= 0) continue;
            const alt = (this.altMax - 2) * (1 - (dd / rr) * 0.45) * (0.85 + a * 0.2);
            const tom = Math.max(0, Math.min(nT - 1, Math.round(1 + ((cy - y) / rr) * 1.5 + (cx - x) / rr + (b - 0.5) * 1.6)));
            lista.push([x, y, alt, -6 + c * 12, 1.8 + e, tom, 0]);
          }
        }
      lista.sort((a, b) => a[1] - b[1]);
      const d = new Float32Array(lista.length * NC);
      let topo = 0;
      lista.forEach((h, i) => {
        const o = i * NC;
        d[o + X] = h[0]; d[o + Y] = h[1]; d[o + ALT] = h[2]; d[o + INCL] = h[3]; d[o + LRG] = h[4]; d[o + TOM] = h[5]; d[o + CAB] = h[6]; d[o + DUR] = 1;
        topo = Math.max(topo, h[2]);
      });
      p.d = d; p.n = lista.length; p.topo = Math.ceil(topo) + 2;
    }

    /** força do empurrão agora (volta ao lugar com uma molinha no fim) */
    forca(d, o, agora) {
      const f = d[o + F];
      if (!f) return 0;
      const t = (agora - d[o + T0]) / d[o + DUR];
      if (t >= 1) { d[o + F] = 0; return 0; }
      return f * (1 - t) ** 2 * (1 + Math.sin(t * 9) * 0.12 * t);
    }

    haste(g, x, y, alt, incl, larg, tom, cab) {
      const t = this.tons[tom];
      const tx = x + incl, ty = y - alt, mx = x + incl * 0.35, my = y - alt * 0.5;
      g.strokeStyle = t[0]; g.lineWidth = larg;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, tx, ty); g.stroke();
      g.strokeStyle = t[1]; g.lineWidth = larg * 0.75;
      g.beginPath(); g.moveTo(x + incl * 0.25, y - alt * 0.35); g.quadraticCurveTo(mx + incl * 0.15, my - alt * 0.1, tx, ty); g.stroke();
      g.strokeStyle = t[2]; g.lineWidth = larg * 0.5;
      g.beginPath(); g.moveTo(x + incl * 0.62, y - alt * 0.72); g.lineTo(tx, ty); g.stroke();
      if (cab) { // espiga da taboa
        const ex = x + incl * 0.8, ey = y - alt * 0.8;
        g.fillStyle = '#4e321d'; g.beginPath(); g.ellipse(ex, ey, 2.1, 6, incl * 0.03, 0, 7); g.fill();
        g.fillStyle = '#7a5434'; g.beginPath(); g.ellipse(ex - 0.6, ey - 1.5, 0.9, 3.6, incl * 0.03, 0, 7); g.fill();
      }
    }

    desenhar(p, agora) {
      const Q = this.q, w = LARG + MARGEM * 2, h = FAIXA + p.topo + 4;
      if (!p.cv || p.cq !== Q || p.cv.height !== Math.ceil(h * Q)) { p.cv = document.createElement('canvas'); p.cv.width = Math.ceil(w * Q); p.cv.height = Math.ceil(h * Q); p.cq = Q; }
      const g = p.cv.getContext('2d');
      g.setTransform(Q, 0, 0, Q, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round';
      g.translate(-(p.x0 - MARGEM), -(p.y0 - p.topo - 2));
      const d = p.d, maxTom = this.nGrama - 1;
      let ainda = false;
      p.mexido = false; p.sujo = false;
      if (this.placas.size) this.sujarPlacas(p);
      for (let i = 0, o = 0; i < p.n; i++, o += NC) {
        const f = this.forca(d, o, agora), x = d[o + X], y = d[o + Y], alt = d[o + ALT], incl = d[o + INCL], tom = d[o + TOM];
        if (f > 0.01) {
          ainda = true;
          // empurrada: inclina para o lado do empurrão, fica mais baixa e mostra o lado claro
          this.haste(g, x, y, alt * (1 - 0.62 * f), incl * (1 - f) + Math.sin(d[o + ANG]) * alt * 0.95 * f, d[o + LRG], tom >= this.nGrama ? tom : Math.min(maxTom, tom + Math.round(f * 2)), d[o + CAB]);
        } else this.haste(g, x, y, alt, incl, d[o + LRG], tom, d[o + CAB]);
      }
      if (ainda) this.marcar(p);
    }

    marcar(p) { if (!p.mexido) { p.mexido = true; this.fila.push(p); } }

    perto(x, y, r, cada) {
      for (let l = Math.max(0, Math.floor((y - r + 4) / FAIXA)); l <= Math.min(this.rows - 1, Math.floor((y + r + 4) / FAIXA)); l++)
        for (let c = Math.max(0, Math.floor((x - r) / LARG)); c <= Math.min(this.cols - 1, Math.floor((x + r) / LARG)); c++) {
          const p = this.ped[c + l * this.cols];
          if (!p || !p.d) continue;
          const d = p.d;
          for (let i = 0, o = 0; i < p.n; i++, o += NC) {
            const d2 = (d[o + X] - x) ** 2 + (d[o + Y] - y) ** 2;
            if (d2 < r * r) cada(p, o, d2);
          }
        }
    }

    /** empurra as hastes num raio: ang = para onde deitam (0 = norte, radianos), forca 0–1, dur em s */
    empurrar(x, y, r, ang, forca, dur, agora) {
      this.perto(x, y, r, (p, o, d2) => {
        const d = p.d, nf = forca * (1 - (Math.sqrt(d2) / r) * 0.5);
        if (this.forca(d, o, agora) >= nf) return;
        const du = dur * (0.85 + Math.random() * 0.3);
        d[o + F] = nf; d[o + ANG] = ang + (Math.random() - 0.5) * 0.5; d[o + T0] = agora; d[o + DUR] = du;
        p.ativoAte = Math.max(p.ativoAte, agora + du);
        if (p.cv) this.marcar(p);
      });
    }

    /** quem anda: chame a cada ~5 px andados, no pé do boneco. (dx, dy) = sentido do passo */
    pisar(x, y, dx, dy, agora, raio = 18, dur = 9) { this.empurrar(x, y, raio, Math.atan2(dx, -dy), 1, dur, agora); }

    /** a regra de nascer mudou num retângulo (construção cresceu ou diminuiu): as hastes dali nascem de novo */
    refazer(x0, y0, x1, y1) {
      for (let l = Math.max(0, Math.floor((y0 - 4) / FAIXA)); l <= Math.min(this.rows - 1, Math.floor((y1 + 4) / FAIXA)); l++)
        for (let c = Math.max(0, Math.floor((x0 - 40) / LARG)); c <= Math.min(this.cols - 1, Math.floor((x1 + 40) / LARG)); c++) {
          const p = this.ped[c + l * this.cols];
          if (p) { p.d = null; p.n = 0; p.fixo = false; p.sujo = true; }
        }
    }

    /** deixa a grama mais baixa de vez (cortador, enxada, colheita) */
    aparar(x, y, r, fator = 0.3, minimo = 3) {
      this.perto(x, y, r, (p, o) => {
        const d = p.d, nova = Math.max(minimo, d[o + ALT] * fator);
        if (nova >= d[o + ALT]) return;
        d[o + ALT] = nova; if (d[o + TOM] < this.nGrama) d[o + TOM] = Math.min(this.nGrama - 1, d[o + TOM] + 1);
        p.fixo = true; if (p.cv) this.marcar(p);
      });
    }

    /** arranca a grama de um lugar (canteiro, construção) */
    arrancar(x, y, r) {
      const tirar = new Map();
      this.perto(x, y, r, (p, o) => { if (!tirar.has(p)) tirar.set(p, new Set()); tirar.get(p).add(o); });
      for (const [p, os] of tirar) {
        const nova = new Float32Array((p.n - os.size) * NC);
        let j = 0;
        for (let i = 0, o = 0; i < p.n; i++, o += NC) if (!os.has(o)) { nova.set(p.d.subarray(o, o + NC), j); j += NC; }
        p.d = nova; p.n = j / NC; p.fixo = true;
        if (p.cv) this.marcar(p);
      }
    }

    /**
     * desenha a grama visível misturada com os seus desenhos pela altura do pé.
     * cam = { x, y, largura, altura (mundo), escala (pontos de tela por px do mundo) }. agora em segundos.
     * extras: [{ y, desenhar() }] em coordenadas do mundo (a câmera já está aplicada).
     */
    /** placas que mostram este pedaço precisam ser refeitas */
    sujarPlacas(p) {
      const x0 = p.x0 - MARGEM, x1 = p.x0 + LARG + MARGEM, y0 = p.y0 - p.topo - 2, y1 = p.y0 + FAIXA + 2;
      for (let ty = Math.floor(y0 / PLACA); ty <= Math.floor(y1 / PLACA); ty++)
        for (let tx = Math.floor(x0 / PLACA); tx <= Math.floor(x1 / PLACA); tx++) { const pl = this.placas.get(tx + ',' + ty); if (pl) pl.suja = true; }
    }
    /** monta uma placa juntando as faixas de capim que aparecem nela (todas precisam estar desenhadas) */
    montarPlaca(tx, ty, q, pl) {
      const X = tx * PLACA, Y = ty * PLACA, l0 = Math.max(0, Math.floor(Y / FAIXA) - 1), l1 = Math.min(this.rows - 1, Math.floor((Y + PLACA + this.altTaboa + 6) / FAIXA));
      const c0 = Math.max(0, Math.floor((X - MARGEM) / LARG)), c1 = Math.min(this.cols - 1, Math.floor((X + PLACA + MARGEM) / LARG));
      for (let l = l0; l <= l1; l++) for (let c = c0; c <= c1; c++) { const p = this.ped[c + l * this.cols]; if (!p || !p.d || (p.n && (!p.cv || p.sujo))) return null; }
      const px = Math.round(PLACA * q);
      if (!pl) pl = { cv: document.createElement('canvas') };
      if (pl.cv.width !== px) { pl.cv.width = px; pl.cv.height = px; }
      const g = pl.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, px, px);
      g.setTransform(q, 0, 0, q, -X * q, -Y * q);
      for (let l = l0; l <= l1; l++) for (let c = c0; c <= c1; c++) {
        const p = this.ped[c + l * this.cols]; if (!p.cv) continue;
        p.visto = this.quadroN;
        g.drawImage(p.cv, p.x0 - MARGEM, p.y0 - p.topo - 2, LARG + MARGEM * 2, FAIXA + p.topo + 4);
      }
      pl.q = q; pl.suja = false;
      return pl;
    }
    /** de longe: capim em placas prontas (poucas cópias por quadro, sem balanço) e os desenhos por cima, pela altura do pé */
    quadroLonge(ctx, cam, agora, extras) {
      const S = cam.escala, inicio = performance.now(), q = S <= 0.55 ? 0.5 : S <= 0.8 ? 0.75 : 1;
      this.quadroN++;
      let faltam = 0, refeitas = 0;
      const tx0 = Math.floor(cam.x / PLACA), tx1 = Math.floor((cam.x + cam.largura) / PLACA), ty0 = Math.floor(cam.y / PLACA), ty1 = Math.floor((cam.y + cam.altura + this.altTaboa) / PLACA);
      // faltando faixa: gera e desenha dentro do orçamento
      const l0 = Math.max(0, Math.floor(ty0 * PLACA / FAIXA) - 1), l1 = Math.min(this.rows - 1, Math.floor(((ty1 + 1) * PLACA + this.altTaboa + 6) / FAIXA));
      const c0 = Math.max(0, Math.floor((tx0 * PLACA - MARGEM) / LARG)), c1 = Math.min(this.cols - 1, Math.floor(((tx1 + 1) * PLACA + MARGEM) / LARG));
      for (let l = l0; l <= l1; l++) for (let c = c0; c <= c1; c++) {
        const p = this.pedaco(c, l); p.visto = this.quadroN;
        if (!p.d) { if (performance.now() - inicio > this.orcamentoMs) { faltam++; continue; } this.gerar(p); }
        if (p.n && (!p.cv || p.sujo || p.cq < q)) { if (performance.now() - inicio > this.orcamentoMs) { faltam++; continue; } this.desenhar(p, agora); }
      }
      const limite = performance.now() + 1.5;
      for (let n = 0; n < this.porQuadro && this.fila.length && (n < 2 || performance.now() < limite); n++) { const p = this.fila.shift(); if (p.cv && p.d) this.desenhar(p, agora); else p.mexido = false; }
      ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        if (tx < 0 || ty < 0 || tx * PLACA >= this.W || ty * PLACA >= this.H + 8) continue;
        const k = tx + ',' + ty;
        let pl = this.placas.get(k);
        if ((!pl || pl.suja || pl.q !== q) && (!pl || refeitas < 3) && performance.now() - inicio < this.orcamentoMs + 4) {
          const novo = this.montarPlaca(tx, ty, q, pl); if (novo) { pl = novo; this.placas.set(k, pl); refeitas++; } else if (!pl) faltam++;
        }
        if (pl) { pl.visto = this.quadroN; const e = 2 / S; ctx.drawImage(pl.cv, tx * PLACA, ty * PLACA, PLACA + e, PLACA + e); } // sobra de 2 pontos: sem linha entre as placas
      }
      if (this.quadroN % 60 === 0) for (const [k, pl] of this.placas) if (this.quadroN - pl.visto > 200) this.placas.delete(k);
      for (const e of [...extras].sort((a, b) => a.y - b.y)) { ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S); e.desenhar(); }
      ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
      return faltam;
    }

    quadro(ctx, cam, agora, extras = []) {
      if (this.longe) return this.quadroLonge(ctx, cam, agora, extras);
      if (this.placas.size) this.placas.clear();
      const S = cam.escala, inicio = performance.now();
      this.quadroN++;
      const l0 = Math.max(0, Math.floor(cam.y / FAIXA)), l1 = Math.min(this.rows - 1, Math.floor((cam.y + cam.altura + this.altTaboa + 6) / FAIXA));
      const c0 = Math.max(0, Math.floor((cam.x - MARGEM) / LARG)), c1 = Math.min(this.cols - 1, Math.floor((cam.x + cam.largura + MARGEM) / LARG));
      // 1) pedaços visíveis sem desenho (ou em outra qualidade), dentro do orçamento de tempo
      let faltam = 0;
      for (let passo = 0; passo < 2; passo++)
        for (let l = l0; l <= l1; l++) for (let c = c0; c <= c1; c++) {
          const p = this.pedaco(c, l);
          if (!p.d) { if (performance.now() - inicio > this.orcamentoMs) { faltam++; continue; } this.gerar(p); }
          if (!p.n) { p.cv = null; continue; }
          const precisa = passo === 0 ? !p.cv || p.sujo : p.cq !== this.q;
          if (!precisa) continue;
          if (performance.now() - inicio > this.orcamentoMs) { faltam++; continue; }
          this.desenhar(p, agora);
        }
      // 2) mexidos (pisões): redesenha os mais antigos
      // no máximo ~1,5 ms por quadro (pelo menos 2 pedaços); os pisados se revezam e voltam ao lugar a ~10 quadros/s
      const limite = performance.now() + 1.5;
      for (let n = 0; n < this.porQuadro && this.fila.length && (n < 2 || performance.now() < limite); n++) { const p = this.fila.shift(); if (p.cv && p.d) this.desenhar(p, agora); else p.mexido = false; }
      // 3) sobra de tempo: prepara uma faixa em volta da tela (andar com a câmera sem ver o capim nascer)
      if (!faltam) {
        const ml0 = Math.max(0, l0 - 10), ml1 = Math.min(this.rows - 1, l1 + 10), mc0 = Math.max(0, c0 - 2), mc1 = Math.min(this.cols - 1, c1 + 2);
        for (let l = ml0; l <= ml1 && performance.now() - inicio < this.orcamentoMs; l++)
          for (let c = mc0; c <= mc1 && performance.now() - inicio < this.orcamentoMs; c++) {
            if (l >= l0 && l <= l1 && c >= c0 && c <= c1) continue;
            const p = this.pedaco(c, l);
            if (!p.d) this.gerar(p);
            if (p.n && !p.cv) { this.desenhar(p, agora); p.visto = this.quadroN; }
          }
      }
      // 4) os que ficaram muito tempo fora da tela: joga fora o desenho (e os dados, se nada mudou neles)
      if (this.quadroN % 60 === 0) {
        let pedacos = 0, desenhados = 0, comDados = 0;
        for (const p of this.ped) {
          if (!p) continue;
          pedacos++;
          if (p.cv && this.quadroN - p.visto > 300) p.cv = null;
          if (!p.cv && p.d && !p.fixo && agora > p.ativoAte && this.quadroN - p.visto > 300) { p.d = null; p.n = 0; }
          if (p.cv) desenhados++;
          if (p.d) comDados++;
        }
        this.estat = { pedacos, desenhados, comDados };
      }

      const mundo = (k = 0, base = 0) => ctx.setTransform(S, 0, -k * S, S, (k * base - cam.x) * S, -cam.y * S);
      const ord = [...extras].sort((a, b) => a.y - b.y);
      let bi = 0;
      for (let l = l0; l <= l1; l++) {
        const base = (l + 1) * FAIXA - 4;
        while (bi < ord.length && ord[bi].y < base) { mundo(); ord[bi++].desenhar(); }
        for (let c = c0; c <= c1; c++) {
          const p = this.ped[c + l * this.cols];
          if (!p) continue;
          p.visto = this.quadroN;
          if (!p.cv) continue;
          // o vento entorta o pedaço a partir da raiz das hastes (o pé fica parado)
          const k = this.vento ? Math.sin(agora * 1.6 + p.fase + p.x0 * 0.004 + p.y0 * 0.015) * 0.06 + Math.sin(agora * 2.9 + p.y0 * 0.05) * 0.018 : 0;
          mundo(k, base);
          ctx.drawImage(p.cv, p.x0 - MARGEM, p.y0 - p.topo - 2, LARG + MARGEM * 2, FAIXA + p.topo + 4);
        }
      }
      while (bi < ord.length) { mundo(); ord[bi++].desenhar(); }
      mundo();
      return faltam;
    }
  }

  raiz.GramaRealista = { Grama, TONS_PASTO, TONS_TABOA };
})(typeof self !== 'undefined' ? self : globalThis);
