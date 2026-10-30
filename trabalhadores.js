// Equipe do mapa novo (os mesmos personagens do jogo, folhas Pixel Lab): Tomé cuida das vacas, Lia das ovelhas,
// Bento dos porcos e Clara das galinhas. Cada um sai de casa, vai pela estrada até a porteira do seu curral,
// abre, entra, fecha, cuida (cocho, água, ordenha, tosquia, ovos), abre, sai, fecha e volta para casa. Depois de um
// descanso, faz tudo de novo. Os animais abrem caminho e vêm comer quando o cocho é servido.
(function (raiz) {
  'use strict';
  const DIRS = 8, C_CEL = 92, VEL = 58, PASSO = 36;
  const EQUIPE = [
    { nome: 'Tomé', pasta: 'tome', curral: 'vacas', atraso: 2 },
    { nome: 'Lia', pasta: 'lia', curral: 'ovelhas', atraso: 6 },
    { nome: 'Bento', pasta: 'bento', curral: 'porcos', atraso: 10 },
    { nome: 'Clara', pasta: 'clara', curral: 'galinheiro', atraso: 14 },
  ];
  /** 0 = sul, 2 = leste, 4 = norte, 6 = oeste (ordem das linhas da folha) */
  const direcao = (dx, dy) => Math.round(((Math.atan2(dx, dy) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % DIRS;

  /**
   * o: { C (currais), bichos, rota(ax, ay, bx, by, grade), gradeFora(), gradeDentro(), livre(grade, x, y) → [x, y],
   *      casa() → [x, y] (porta de casa), grama, imagem(pasta) → Image }
   */
  function criar(o) {
    const { C, bichos } = o;
    const equipe = EQUIPE.map(p => ({ ...p, cur: C.currais.find(c => c.id === p.curral), img: o.imagem(p.pasta), x: 0, y: 0, visivel: false, alfa: 0,
      passos: [], atual: null, espera: p.atraso, dist: 0, dir: 0, pose: 'parado', tTarefa: 0, texto: '', rastro: 0, caminho: null }));

    function tarefas(t) {
      const cur = t.cur, objs = cur.objetos, frente = obj => [(obj.pegada[0] + obj.pegada[2]) / 2, obj.pegada[3] + 24];
      const cocho = objs.find(x => x.tipo === 'cocho' || x.tipo === 'comedouro'), agua = objs.find(x => x.tipo === 'bebedouro');
      const lista = [];
      const servir = { cocho: 'Enchendo o cocho de feno', comedouro: 'Enchendo o comedouro de milho' }[cocho.tipo];
      lista.push({ ponto: frente(cocho), dur: 4, texto: cur.id === 'porcos' ? 'Servindo a lavagem' : cur.id === 'ovelhas' ? 'Pondo feno no cocho' : servir, depois: () => bichos.chamarPara(cur, cocho) });
      if (cur.id === 'galinheiro') {
        const casa = objs.find(x => x.tipo === 'casinha'), ovos = 3 + Math.floor(Math.random() * 4);
        lista.push({ ponto: [casa.pegada[2] - 14, casa.pegada[3] + 26], dur: 4, texto: `Recolhendo ${ovos} ovos` });
      }
      lista.push({ ponto: frente(agua), dur: 3, texto: cur.id === 'vacas' ? 'Limpando o bebedouro' : 'Trocando a água' });
      if (cur.id === 'vacas' || cur.id === 'ovelhas') lista.push({ bicho: true, dur: 6, texto: cur.id === 'vacas' ? 'Ordenhando' : 'Tosquiando' });
      return lista;
    }
    /** a rotina inteira, do sair de casa ao entrar de novo */
    function roteiro(t) {
      const pp = C.pontosPorteira(t.cur), casa = o.casa();
      const passos = [{ tipo: 'surgir' }, { tipo: 'andar', ate: pp.fora, grade: 'fora' }, { tipo: 'portao', abrir: true, olhar: pp.meio },
        { tipo: 'andar', ate: pp.dentro, direto: true }, { tipo: 'portao', abrir: false, olhar: pp.meio }];
      for (const tf of tarefas(t)) passos.push({ tipo: 'andar', ate: tf.ponto, bicho: tf.bicho, grade: 'dentro' }, { tipo: 'tarefa', ...tf });
      passos.push({ tipo: 'andar', ate: pp.dentro, grade: 'dentro' }, { tipo: 'portao', abrir: true, olhar: pp.meio }, { tipo: 'andar', ate: pp.fora, direto: true },
        { tipo: 'portao', abrir: false, olhar: pp.meio }, { tipo: 'andar', ate: casa, grade: 'fora' }, { tipo: 'sumir' });
      return passos;
    }
    function olharPara(t, x, y) { t.dir = direcao(x - t.x, y - t.y); }

    function atualizar(dt, agora) {
      for (const t of equipe) {
        if (!t.atual) {
          if (t.passos.length) t.atual = t.passos.shift();
          else if (!t.visivel) { t.espera -= dt; if (t.espera <= 0) { [t.x, t.y] = o.casa(); t.passos = roteiro(t); t.dir = 0; } continue; }
          else continue;
        }
        const p = t.atual;
        if (p.tipo === 'surgir') { t.visivel = true; t.pose = 'parado'; t.alfa = Math.min(1, t.alfa + dt * 2); if (t.alfa >= 1) t.atual = null; }
        else if (p.tipo === 'sumir') { t.pose = 'parado'; t.dir = 4; t.alfa = Math.max(0, t.alfa - dt * 2); if (t.alfa <= 0) { t.visivel = false; t.atual = null; t.espera = 35 + Math.random() * 20; } }
        else if (p.tipo === 'portao') {
          olharPara(t, p.olhar[0], p.olhar[1]); t.pose = 'empurrar';
          p.t = (p.t || 0) + dt;
          if (C.portao(t.cur, p.abrir) && p.t > 0.5) t.atual = null;
        } else if (p.tipo === 'tarefa') {
          t.pose = 'tarefa'; t.texto = p.bichoAlvo ? `${p.texto} a ${p.bichoAlvo.nome}` : p.texto;
          if (p.bichoAlvo) olharPara(t, p.bichoAlvo.x, p.bichoAlvo.y - 10);
          p.t = (p.t || 0) + dt;
          if (p.t >= p.dur) { if (p.depois) p.depois(); if (p.bichoAlvo) bichos.reservar(p.bichoAlvo, false); t.texto = ''; t.atual = null; t.pose = 'parado'; }
        } else if (p.tipo === 'andar') {
          if (!t.caminho) {
            let alvo = p.ate;
            if (p.bicho) { // escolhe um animal em pé, segura ele parado e para ao lado dele
              const opc = bichos.bichos.filter(b => b.cur === t.cur && !b.reservado && b.deit < 0.2);
              const b = opc[Math.floor(Math.random() * opc.length)] || bichos.bichos.find(b => b.cur === t.cur);
              bichos.reservar(b, true);
              const prox = t.passos[0]; if (prox && prox.tipo === 'tarefa') prox.bichoAlvo = b;
              alvo = [b.x, b.y + b.e.raio * 0.5 + 16];
            }
            const grade = p.grade === 'dentro' ? o.gradeDentro() : o.gradeFora();
            if (!p.direto) alvo = o.livre(grade, alvo[0], alvo[1]);
            t.caminho = p.direto ? [alvo.slice()] : o.rota(t.x, t.y, alvo[0], alvo[1], grade) || [alvo.slice()];
          }
          t.pose = 'andando';
          let resta = VEL * dt;
          while (resta > 0 && t.caminho.length) {
            const [tx, ty] = t.caminho[0], dx = tx - t.x, dy = ty - t.y, d = Math.hypot(dx, dy);
            if (d < 0.5) { t.caminho.shift(); continue; }
            const s = Math.min(d, resta);
            t.x += (dx / d) * s; t.y += (dy / d) * s; resta -= s; t.dist += s; t.rastro += s;
            t.dir = direcao(dx, dy);
            if (t.rastro > 5 && o.grama) { t.rastro = 0; o.grama.pisar(t.x, t.y + 3, dx, dy, agora); }
          }
          if (!t.caminho.length) { t.caminho = null; t.atual = null; t.pose = 'parado'; }
        }
      }
    }
    /** posições de quem está dentro de algum curral (os bichos desviam) */
    const gente = () => equipe.filter(t => t.visivel && C.dentro(t.cur, t.x, t.y, 4)).map(t => ({ x: t.x, y: t.y }));

    function quadroFolha(t, agora) {
      if (t.pose === 'andando') return [Math.floor((t.dist / PASSO) * 8) % 8, t.dir];
      if (t.pose === 'tarefa') return [Math.floor(agora * 5) % 5, 11];
      if (t.pose === 'empurrar') return [t.dir, 8];
      return [t.dir, 8];
    }
    function extras(ctx, cam, agora) {
      const out = [];
      for (const t of equipe) {
        if (!t.visivel || t.x < cam.x - 60 || t.x > cam.x + cam.largura + 60 || t.y < cam.y - 10 || t.y > cam.y + cam.altura + 90) continue;
        out.push({ y: t.y + 0.3, desenhar: () => {
          ctx.globalAlpha = t.alfa;
          ctx.fillStyle = 'rgba(20,30,10,.35)'; ctx.beginPath(); ctx.ellipse(t.x, t.y, 12, 4, 0, 0, 7); ctx.fill();
          if (t.img.complete && t.img.naturalWidth) { const [c, l] = quadroFolha(t, agora); ctx.drawImage(t.img, c * C_CEL, l * C_CEL, C_CEL, C_CEL, t.x - 42, t.y - 76, 84, 84); }
          ctx.globalAlpha = 1;
        } });
      }
      return out;
    }
    /** balão com o que cada um está fazendo (tamanho fixo na tela) */
    function rotulos(ctx, zoom) {
      for (const t of equipe) {
        if (!t.visivel || !t.texto) continue;
        const f = 13 / zoom; ctx.font = `600 ${f}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const txt = `${t.nome}: ${t.texto}`, w = ctx.measureText(txt).width + 14 / zoom, y = t.y - 86;
        ctx.fillStyle = 'rgba(28,34,18,.82)'; ctx.beginPath(); ctx.roundRect(t.x - w / 2, y - 11 / zoom, w, 22 / zoom, 11 / zoom); ctx.fill();
        ctx.fillStyle = '#fff8e0'; ctx.fillText(txt, t.x, y);
      }
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
    function em(x, y) { return equipe.find(t => t.visivel && Math.abs(x - t.x) < 18 && y < t.y + 4 && y > t.y - 64); }
    function descricao(t) {
      const p = t.atual;
      const faz = t.texto || (p && p.tipo === 'portao' ? (p.abrir ? 'abrindo a porteira' : 'fechando a porteira') : C.dentro(t.cur, t.x, t.y, 4) ? 'cuidando dos animais' : t.passos.length > 6 ? `indo para o curral` : 'voltando para casa');
      return `${t.nome} · ${faz}`;
    }
    /** chama todo mundo que está em casa (um de cada vez) */
    function chamar() { let k = 0; for (const t of equipe) if (!t.visivel && !t.passos.length) t.espera = 0.5 + 2.5 * k++; }
    return { equipe, atualizar, gente, extras, rotulos, em, descricao, chamar };
  }

  raiz.Trabalhadores = { criar };
})(typeof self !== 'undefined' ? self : globalThis);
