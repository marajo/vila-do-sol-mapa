// Sons do mapa novo, sintetizados na hora com Web Audio (nenhum arquivo de áudio, nada baixado): cada som sai um
// pouco diferente a cada vez. Cinco volumes ajustáveis nas Opções: geral, ambiente (vento, pássaros, rio, grilos,
// chuva, trovão), animais, trabalhadores e menu. Sons de bichos e de trabalho saem do lugar onde acontecem: mais
// baixos longe da câmera e do lado certo (esquerda/direita).
(function (raiz) {
  'use strict';
  const GRUPOS = ['ambiente', 'animais', 'trabalho', 'menu'];
  const PADRAO = { ligado: true, geral: 0.8, ambiente: 0.6, animais: 0.8, trabalho: 0.7, menu: 0.6 };

  function criar() {
    let ac = null, mestre = null, ruido = null;
    const grupo = {}, vol = { ...PADRAO }, amb = {};
    let ouvinte = { x: 0, y: 0, largura: 1000, altura: 800 };
    const rnd = (a, b) => a + Math.random() * (b - a);

    /** liga o áudio (o navegador só deixa depois de um clique ou toque) */
    function ativar() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = raiz.AudioContext || raiz.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      mestre = ac.createGain(); mestre.connect(ac.destination);
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(mestre);
      for (const g of GRUPOS) { grupo[g] = ac.createGain(); grupo[g].connect(comp); }
      ruido = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      aplicarVolumes();
      montarAmbiente();
    }
    function aplicarVolumes() {
      if (!ac) return;
      mestre.gain.setTargetAtTime(vol.ligado ? vol.geral : 0, ac.currentTime, 0.05);
      for (const g of GRUPOS) grupo[g].gain.setTargetAtTime(vol[g], ac.currentTime, 0.05);
    }
    function definir(chave, valor) { vol[chave] = valor; aplicarVolumes(); }

    // ---------- peças ----------
    const fonteRuido = (loop = false) => { const s = ac.createBufferSource(); s.buffer = ruido; s.loop = loop; if (!loop) s.loopStart = 0; return s; };
    function filtro(tipo, f, q = 1) { const b = ac.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; return b; }
    function envelope(g, t, ataque, segura, solta, pico = 1) {
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pico, t + ataque);
      g.gain.setValueAtTime(pico, t + ataque + segura); g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + segura + solta);
    }
    /** saída para um som num lugar do mapa: volume pela distância à câmera e lado pelo x (null = fora do alcance) */
    function noLugar(gr, x, y, alcance = 1.1) {
      if (!ac || ac.state !== 'running') return null;
      const cx = ouvinte.x + ouvinte.largura / 2, cy = ouvinte.y + ouvinte.altura / 2, raio = Math.max(ouvinte.largura, ouvinte.altura) * 0.5 * alcance;
      const d = x == null ? 0 : Math.hypot(x - cx, (y - cy) * 1.2);
      const v = x == null ? 1 : Math.max(0, 1 - d / (raio * 1.6)) ** 1.5;
      if (v < 0.03) return null;
      const g = ac.createGain(); g.gain.value = v;
      const p = ac.createStereoPanner(); p.pan.value = x == null ? 0 : Math.max(-0.85, Math.min(0.85, (x - cx) / (ouvinte.largura / 2)));
      g.connect(p); p.connect(grupo[gr]);
      return g;
    }
    function oscila(tipo, t, freqs, saida, dur) { // freqs: [[tempo relativo, Hz], ...]
      const o = ac.createOscillator(); o.type = tipo;
      o.frequency.setValueAtTime(freqs[0][1], t); for (const [dt, f] of freqs.slice(1)) o.frequency.linearRampToValueAtTime(f, t + dt);
      o.connect(saida); o.start(t); o.stop(t + dur + 0.05); return o;
    }
    function rajada(t, dur, saida, { tipo = 'bandpass', f = 1000, q = 1, pico = 0.5, ataque = 0.005 } = {}) {
      const s = fonteRuido(); const b = filtro(tipo, f, q); const g = ac.createGain();
      envelope(g, t, ataque, 0, Math.max(0.01, dur - ataque), pico);
      s.connect(b); b.connect(g); g.connect(saida); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    }

    // ---------- animais ----------
    const ANIMAL = {
      vaca(saida, t) { // mugido: serra grave que sobe e desce, com formantes de "múúú" e um tremor
        const f0 = rnd(95, 125), dur = rnd(1.1, 1.6), g = ac.createGain(); envelope(g, t, 0.18, dur - 0.5, 0.32, 0.55);
        const f1 = filtro('bandpass', 420, 4), f2 = filtro('bandpass', 950, 6), lp = filtro('lowpass', 1800);
        f1.frequency.setValueAtTime(320, t); f1.frequency.linearRampToValueAtTime(720, t + 0.35); f1.frequency.linearRampToValueAtTime(480, t + dur);
        const o = oscila('sawtooth', t, [[0, f0 * 0.85], [0.3, f0 * 1.12], [dur * 0.7, f0], [dur, f0 * 0.8]], f1, dur);
        const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.5; vg.gain.value = 2.5; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur);
        o.connect(f2); const m = ac.createGain(); m.gain.value = 0.35; f2.connect(m); m.connect(lp); f1.connect(lp); lp.connect(g); g.connect(saida);
      },
      ovelha(saida, t) { // bééé: tremido (modulação rápida no volume)
        const f0 = rnd(330, 430), dur = rnd(0.55, 0.85), g = ac.createGain(); envelope(g, t, 0.05, dur - 0.25, 0.2, 0.4);
        const trem = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = rnd(18, 26); lg.gain.value = 0.45; trem.gain.value = 0.55; lfo.connect(lg); lg.connect(trem.gain); lfo.start(t); lfo.stop(t + dur);
        const f1 = filtro('bandpass', 850, 3), f2 = filtro('bandpass', 2300, 5), lp = filtro('lowpass', 3500);
        const o = oscila('sawtooth', t, [[0, f0], [0.12, f0 * 1.1], [dur, f0 * 0.92]], trem, dur);
        trem.connect(f1); trem.connect(f2); f1.connect(lp); f2.connect(lp); lp.connect(g); g.connect(saida); void o;
      },
      porco(saida, t) { // roncos curtos (e às vezes um guincho)
        const n = Math.random() < 0.8 ? 2 + Math.floor(Math.random() * 2) : 0;
        for (let i = 0; i < n; i++) {
          const ti = t + i * rnd(0.16, 0.24), g = ac.createGain(); envelope(g, ti, 0.01, 0.06, 0.09, 0.5);
          const b = filtro('bandpass', rnd(380, 520), 2.5); oscila('sawtooth', ti, [[0, rnd(85, 110)], [0.15, rnd(70, 90)]], b, 0.2);
          rajada(ti, 0.14, b, { f: 600, q: 1, pico: 0.25 }); b.connect(g); g.connect(saida);
        }
        if (!n) { const g = ac.createGain(); envelope(g, t, 0.02, 0.15, 0.12, 0.3); const b = filtro('bandpass', 1300, 3); oscila('sawtooth', t, [[0, 520], [0.1, 760], [0.3, 430]], b, 0.32); b.connect(g); g.connect(saida); }
      },
      galinha(saida, t) { // có-có-có: pulsos curtos e anasalados
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const ti = t + i * rnd(0.11, 0.16), g = ac.createGain(); envelope(g, ti, 0.004, 0.025, 0.05, i === n - 1 ? 0.35 : 0.25);
          const b = filtro('bandpass', rnd(1300, 1700), 4); oscila('square', ti, [[0, rnd(560, 680)], [0.07, rnd(420, 500)]], b, 0.09); b.connect(g); g.connect(saida);
        }
      },
      galo(saida, t) { // cocoricó: sobe, segura e cai
        const g = ac.createGain(), dur = 1.45; envelope(g, t, 0.05, 1.15, 0.25, 0.42);
        const f1 = filtro('bandpass', 1100, 3), f2 = filtro('bandpass', 2600, 4), lp = filtro('lowpass', 4200);
        const o = oscila('sawtooth', t, [[0, 430], [0.12, 680], [0.22, 560], [0.38, 820], [0.95, 770], [1.3, 520]], f1, dur);
        const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 9; vg.gain.value = 12; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur);
        o.connect(f2); f1.connect(lp); f2.connect(lp); lp.connect(g); g.connect(saida);
      },
    };
    function animal(tipo, x, y) { const s = noLugar('animais', x, y); if (s) ANIMAL[tipo](s, ac.currentTime + 0.02); }

    // ---------- trabalho ----------
    const TRABALHO = {
      porteira(saida, t, abrir) { // rangido da dobradiça e o trinco
        const g = ac.createGain(); envelope(g, t, 0.05, 0.45, 0.25, 0.25); const b = filtro('bandpass', 900, 9);
        const pts = [[0, rnd(160, 200)]]; for (let k = 1; k <= 8; k++) pts.push([k * 0.09, rnd(140, 260)]);
        oscila('sawtooth', t, pts, b, 0.8); b.connect(g); g.connect(saida);
        rajada(t + (abrir ? 0.02 : 0.78), 0.05, saida, { tipo: 'highpass', f: 2500, pico: 0.5 });
      },
      enxada(saida, t, dur) { for (let k = 0; k < dur / 0.55; k++) { const ti = t + k * 0.55; rajada(ti, 0.12, saida, { tipo: 'lowpass', f: 900, pico: 0.6 }); const g = ac.createGain(); envelope(g, ti, 0.004, 0.02, 0.12, 0.5); oscila('sine', ti, [[0, 110], [0.1, 60]], g, 0.15); g.connect(saida); } },
      regar(saida, t, dur) { const s = fonteRuido(); const b = filtro('bandpass', 2600, 0.8); const g = ac.createGain(); envelope(g, t, 0.3, dur - 0.8, 0.5, 0.22); s.connect(b); b.connect(g); g.connect(saida); s.start(t); s.stop(t + dur + 0.1); },
      colher(saida, t, dur) { for (let k = 0; k < dur / 0.7; k++) { const ti = t + 0.2 + k * 0.7, g = ac.createGain(); envelope(g, ti, 0.003, 0.01, 0.08, 0.35); oscila('sine', ti, [[0, 700], [0.08, 260]], g, 0.1); g.connect(saida); rajada(ti, 0.1, saida, { f: 3500, pico: 0.15 }); } },
      racao(saida, t, dur) { const s = fonteRuido(); const b = filtro('lowpass', 2600); const g = ac.createGain(); envelope(g, t, 0.15, dur - 0.6, 0.4, 0.3); s.connect(b); b.connect(g); g.connect(saida); s.start(t); s.stop(t + dur + 0.1); for (let k = 0; k < dur * 14; k++) rajada(t + Math.random() * dur, 0.015, saida, { f: rnd(1500, 4000), q: 4, pico: 0.12 }); },
      agua(saida, t, dur) { const s = fonteRuido(); const b = filtro('bandpass', 900, 1.5); b.frequency.setValueAtTime(800, t); b.frequency.linearRampToValueAtTime(1500, t + dur); const g = ac.createGain(); envelope(g, t, 0.2, dur - 0.6, 0.4, 0.28); s.connect(b); b.connect(g); g.connect(saida); s.start(t); s.stop(t + dur + 0.1); for (let k = 0; k < dur * 5; k++) { const ti = t + Math.random() * dur, gg = ac.createGain(); envelope(gg, ti, 0.003, 0.01, 0.05, 0.08); oscila('sine', ti, [[0, rnd(500, 900)], [0.05, rnd(1000, 1600)]], gg, 0.07); gg.connect(saida); } },
      ordenha(saida, t, dur) { for (let k = 0; k < dur / 0.42; k++) rajada(t + k * 0.42, 0.09, saida, { f: rnd(2800, 3600), q: 2, pico: 0.3 }); },
      tosquia(saida, t, dur) { for (let k = 0; k < dur / 0.38; k++) { rajada(t + k * 0.38, 0.02, saida, { tipo: 'highpass', f: 5000, pico: 0.4 }); rajada(t + k * 0.38 + 0.05, 0.02, saida, { tipo: 'highpass', f: 6000, pico: 0.3 }); } },
      ovos(saida, t) { ANIMAL.galinha(saida, t + 0.4); },
      passo(saida, t) { rajada(t, 0.07, saida, { tipo: 'lowpass', f: rnd(500, 800), pico: 0.13, ataque: 0.004 }); rajada(t + 0.01, 0.05, saida, { f: rnd(2500, 4000), q: 1.5, pico: 0.04 }); },
    };
    function trabalho(tipo, x, y, extra) { const s = noLugar('trabalho', x, y, 0.9); if (s) TRABALHO[tipo](s, ac.currentTime + 0.02, extra); }

    // ---------- menu ----------
    const MENU = {
      clique(saida, t) { const g = ac.createGain(); envelope(g, t, 0.002, 0.01, 0.06, 0.35); oscila('sine', t, [[0, 900], [0.05, 650]], g, 0.08); g.connect(saida); },
      abrir(saida, t) { for (const [k, f] of [[0, 520], [1, 780]]) { const g = ac.createGain(); envelope(g, t + k * 0.07, 0.004, 0.03, 0.12, 0.3); oscila('triangle', t + k * 0.07, [[0, f]], g, 0.2); g.connect(saida); } },
      fechar(saida, t) { for (const [k, f] of [[0, 780], [1, 520]]) { const g = ac.createGain(); envelope(g, t + k * 0.07, 0.004, 0.03, 0.12, 0.3); oscila('triangle', t + k * 0.07, [[0, f]], g, 0.2); g.connect(saida); } },
      nivel(saida, t) { [523, 659, 784, 1047].forEach((f, k) => { const g = ac.createGain(); envelope(g, t + k * 0.09, 0.005, 0.06, 0.35, 0.3); oscila('triangle', t + k * 0.09, [[0, f]], g, 0.5); g.connect(saida); }); },
      moedas(saida, t) { [1319, 1760, 2093].forEach((f, k) => { const g = ac.createGain(); envelope(g, t + k * 0.06, 0.002, 0.02, 0.25, 0.22); oscila('triangle', t + k * 0.06, [[0, f]], g, 0.3); g.connect(saida); }); },
      obra(saida, t) { const g = ac.createGain(); envelope(g, t, 0.005, 0.05, 0.4, 0.7); oscila('sine', t, [[0, 90], [0.3, 45]], g, 0.5); g.connect(saida); rajada(t, 1.1, saida, { tipo: 'lowpass', f: 700, pico: 0.35, ataque: 0.02 }); for (let k = 0; k < 10; k++) rajada(t + 0.1 + Math.random() * 0.9, 0.04, saida, { f: rnd(800, 2500), q: 3, pico: 0.15 }); },
    };
    function menu(tipo) { const s = noLugar('menu', null, null); if (s) MENU[tipo](s, ac.currentTime + 0.01); }

    // ---------- ambiente contínuo: vento, rio, chuva; pássaros de dia, grilos à noite, trovão ----------
    function montarAmbiente() {
      const laço = (f, q, tipo = 'bandpass') => { const s = fonteRuido(true); const b = filtro(tipo, f, q); const g = ac.createGain(); g.gain.value = 0; s.connect(b); b.connect(g); g.connect(grupo.ambiente); s.start(0, Math.random()); return { g, b }; };
      amb.vento = laço(380, 0.6, 'lowpass');
      amb.rio = laço(700, 0.7);
      amb.chuva = laço(2200, 0.4); const hp = filtro('highpass', 700); amb.chuva.b.disconnect(); amb.chuva.b.connect(hp); hp.connect(amb.chuva.g);
      amb.proxPassaro = 2; amb.proxGrilo = 0; amb.proxGota = 0;
    }
    function passaro(t, saida) { // canto curto: notas que deslizam rápido
      const n = 2 + Math.floor(Math.random() * 5), base = rnd(2200, 3800), estilo = Math.random();
      for (let k = 0; k < n; k++) {
        const ti = t + k * rnd(0.09, 0.16), g = ac.createGain(); envelope(g, ti, 0.005, 0.03, 0.06, 0.18);
        const f = base * (estilo < 0.5 ? 1 + k * 0.06 : 1 - k * 0.05); oscila('sine', ti, [[0, f * 0.85], [0.05, f * 1.15], [0.09, f]], g, 0.12); g.connect(saida);
      }
    }
    function grilo(t, saida, f) { for (let k = 0; k < 3; k++) { const ti = t + k * 0.045, g = ac.createGain(); envelope(g, ti, 0.003, 0.012, 0.02, 0.1); oscila('sine', ti, [[0, f]], g, 0.04); g.connect(saida); } }
    function trovao(t, saida, perto) { const s = fonteRuido(); const b = filtro('lowpass', perto ? 300 : 140); const g = ac.createGain(); envelope(g, t, perto ? 0.05 : 0.4, 0.6, 2.8, perto ? 0.9 : 0.5); s.connect(b); b.connect(g); g.connect(saida); s.start(t); s.stop(t + 4.2); }
    /** chamado a cada quadro: câmera, hora (noite 0–1), chuva 0–1, distância da câmera ao rio */
    function quadro(cam, noite, chuva, distRio, dt) {
      ouvinte = cam;
      if (!ac || ac.state !== 'running' || !amb.vento) return;
      const t = ac.currentTime, alvo = (no, v) => no.g.gain.setTargetAtTime(v, t, 0.8);
      alvo(amb.vento, 0.08 + 0.05 * Math.sin(t * 0.13) + chuva * 0.08);
      alvo(amb.rio, Math.max(0, 1 - distRio / 900) * 0.32);
      alvo(amb.chuva, chuva * 0.55);
      const dia = 1 - noite;
      amb.proxPassaro -= dt; amb.proxGrilo -= dt; amb.proxGota -= dt;
      if (amb.proxPassaro <= 0) { amb.proxPassaro = rnd(2.5, 8) / Math.max(0.2, dia); if (dia > 0.3 && chuva < 0.5) { const s = noLugar('ambiente', cam.x + Math.random() * cam.largura, cam.y + Math.random() * cam.altura); if (s) { s.gain.value *= dia * 0.8; passaro(t + 0.02, s); } } }
      if (noite > 0.3 && amb.proxGrilo <= 0) { amb.proxGrilo = rnd(0.25, 0.6); for (let k = 0; k < 2; k++) { const s = noLugar('ambiente', cam.x + Math.random() * cam.largura, cam.y + Math.random() * cam.altura); if (s) { s.gain.value *= noite * (1 - chuva * 0.7) * 0.7; grilo(t + Math.random() * 0.2, s, rnd(4300, 5200)); } } }
      if (chuva > 0.05 && amb.proxGota <= 0) { amb.proxGota = 0.03 / chuva; const s = noLugar('ambiente', null, null); if (s) rajada(t, 0.02, s, { f: rnd(2500, 6000), q: 3, pico: 0.06 * chuva }); }
    }
    /** trovão (quem decide é o clima, junto com o clarão) */
    function trovejar(perto, atraso = 0) { const s = noLugar('ambiente', null, null); if (s) trovao(ac.currentTime + atraso, s, perto); }
    return { ativar, definir, vol, animal, trabalho, menu, quadro, trovejar, get ativo() { return !!ac && ac.state === 'running'; } };
  }
  raiz.Som = { criar, PADRAO };
})(typeof self !== 'undefined' ? self : globalThis);
