// Dia, noite e chuva do mapa novo. Um dia inteiro passa em 6 minutos: amanhecer e entardecer alaranjados, noite
// azulada com as janelas acesas e vaga-lumes no capim. A chuva chega sozinha de vez em quando (pingos riscando a
// tela, respingos no chão, céu acinzentado e, quando aperta, relâmpago com trovão). Nas Opções dá para fixar dia,
// noite ou chuva. Tudo é uma camada por cima do quadro: uma pintura de cor (multiply) e alguns traços — leve.
(function (raiz) {
  'use strict';
  const DIA = 360; // segundos para 24 h
  const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mistura = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  function criar({ luzes = () => [], trovejar = () => {} } = {}) {
    const c = { hora: 7.5, modoHora: 'auto', modoChuva: 'auto', chuva: 0, alvoChuva: 0, proxChuva: 70 + Math.random() * 60, fimChuva: 0,
      noiteVis: 0, ouroVis: 0, clarao: 0, proxTrovao: 15 };
    const gotas = [], respingos = [], vagalumes = [];

    /** noite 0–1 pela hora */
    const noiteDe = h => h < 12 ? 1 - suave(4.5, 6.5, h) : suave(18, 20, h);
    const ouroDe = h => Math.max(0, 1 - Math.abs(h - 6.6) / 1.3, 1 - Math.abs(h - 17.6) / 1.4);

    function atualizar(dt) {
      if (c.modoHora === 'auto') c.hora = (c.hora + dt * 24 / DIA) % 24;
      else { const alvo = c.modoHora === 'dia' ? 12 : 23; c.hora = alvo; }
      c.noiteVis += (noiteDe(c.hora) - c.noiteVis) * Math.min(1, dt * 1.5);
      c.ouroVis += (ouroDe(c.hora) - c.ouroVis) * Math.min(1, dt * 1.5);
      // chuva automática: chega, fica um tempo e passa
      if (c.modoChuva === 'auto') {
        if (c.alvoChuva === 0 && (c.proxChuva -= dt) <= 0) { c.alvoChuva = 0.55 + Math.random() * 0.45; c.fimChuva = 45 + Math.random() * 45; }
        if (c.alvoChuva > 0 && (c.fimChuva -= dt) <= 0) { c.alvoChuva = 0; c.proxChuva = 90 + Math.random() * 120; }
      } else c.alvoChuva = c.modoChuva === 'sim' ? 1 : 0;
      c.chuva += Math.sign(c.alvoChuva - c.chuva) * Math.min(Math.abs(c.alvoChuva - c.chuva), dt / 6);
      // trovoada quando a chuva aperta: o clarão vem antes e o trovão atrás (mais longe = mais demorado)
      c.clarao = Math.max(0, c.clarao - dt * 3);
      if (c.chuva > 0.6 && (c.proxTrovao -= dt) <= 0) { c.proxTrovao = 22 + Math.random() * 35; const perto = Math.random() < 0.35; c.clarao = perto ? 1 : 0.55; trovejar(perto, perto ? 0.15 : 1.3); }
    }

    function desenhar(ctx, cam, S, dpr, cssW, cssH, dt, agora) {
      const n = c.noiteVis, ch = c.chuva;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // cor do céu: dia branco (não muda nada), ouro no amanhecer/entardecer, azul-escuro à noite, cinza na chuva
      let cor = mistura([255, 255, 255], [255, 196, 140], c.ouroVis * (1 - n * 0.6) * 0.8);
      cor = mistura(cor, [86, 102, 152], n * 0.9);
      cor = mistura(cor, [150, 158, 168], ch * 0.55 * (1 - n * 0.5));
      if (cor.some(v => v < 254.5)) {
        ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgb(${cor.map(Math.round).join(',')})`; ctx.fillRect(0, 0, cssW, cssH);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (n > 0.05) { // depois de escurecer: janelas acesas e vaga-lumes brilham por cima
        ctx.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
        ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, r] of luzes()) { // janelas e lampião: brilho quente em volta
          if (x + r < cam.x || x - r > cam.x + cam.largura || y + r < cam.y || y - r > cam.y + cam.altura) continue;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(255,190,90,${0.42 * n})`); g.addColorStop(0.35, `rgba(255,150,60,${0.16 * n})`); g.addColorStop(1, 'rgba(255,120,40,0)');
          ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        // vaga-lumes: piscam devagar e flutuam sobre o capim (somem com a chuva)
        const nv = Math.round(28 * n * (1 - ch));
        while (vagalumes.length < nv) vagalumes.push({ x: cam.x + Math.random() * cam.largura, y: cam.y + Math.random() * cam.altura, f: Math.random() * 6, v: 0.6 + Math.random() * 0.8 });
        vagalumes.length = Math.min(vagalumes.length, nv);
        for (const v of vagalumes) {
          v.x += Math.sin(agora * 0.7 + v.f) * 9 * dt; v.y += Math.cos(agora * 0.5 + v.f * 1.3) * 6 * dt - 2 * dt;
          if (v.x < cam.x || v.x > cam.x + cam.largura || v.y < cam.y || v.y > cam.y + cam.altura) { v.x = cam.x + Math.random() * cam.largura; v.y = cam.y + Math.random() * cam.altura; }
          const a = Math.max(0, Math.sin(agora * v.v + v.f)) ** 3 * n;
          if (a < 0.03) continue;
          const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 7);
          g.addColorStop(0, `rgba(230,255,140,${a})`); g.addColorStop(0.3, `rgba(190,240,90,${a * 0.45})`); g.addColorStop(1, 'rgba(160,220,60,0)');
          ctx.fillStyle = g; ctx.fillRect(v.x - 7, v.y - 7, 14, 14);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      // chuva: riscos inclinados pelo vento e respingos no chão (na tela, em pixels)
      if (ch > 0.02) {
        const ng = Math.round(260 * ch * Math.min(1.6, cssW * cssH / 1.2e6)), vento = -0.22;
        while (gotas.length < ng) gotas.push({ x: Math.random() * (cssW + 200), y: Math.random() * cssH, l: 14 + Math.random() * 16, v: 700 + Math.random() * 400 });
        gotas.length = ng;
        ctx.strokeStyle = `rgba(205,218,232,${0.22 + 0.18 * ch})`; ctx.lineWidth = 1.1; ctx.beginPath();
        for (const g of gotas) {
          g.y += g.v * dt; g.x += g.v * vento * dt;
          if (g.y > cssH + 20 || g.x < -40) { g.y = -20 - Math.random() * 60; g.x = Math.random() * (cssW + 200); if (Math.random() < 0.6) respingos.push({ x: Math.random() * cssW, y: Math.random() * cssH, t: 0 }); }
          ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - g.l * vento, g.y - g.l);
        }
        ctx.stroke();
        ctx.strokeStyle = `rgba(215,228,240,${0.35 * ch})`; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = respingos.length - 1; i >= 0; i--) {
          const r = respingos[i]; r.t += dt; if (r.t > 0.28) { respingos.splice(i, 1); continue; }
          const k = r.t / 0.28, rx = 2 + k * 6; ctx.moveTo(r.x + rx, r.y); ctx.ellipse(r.x, r.y, rx, rx * 0.4, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
      } else { gotas.length = 0; respingos.length = 0; }
      if (c.clarao > 0.01) { ctx.fillStyle = `rgba(235,240,255,${c.clarao * 0.5})`; ctx.fillRect(0, 0, cssW, cssH); }
    }
    const relogio = () => { const h = Math.floor(c.hora), m = Math.floor((c.hora - h) * 60 / 10) * 10; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
    return { estado: c, atualizar, desenhar, relogio, get noite() { return c.noiteVis; }, get chuva() { return c.chuva; } };
  }
  raiz.Clima = { criar, DIA };
})(typeof self !== 'undefined' ? self : globalThis);
