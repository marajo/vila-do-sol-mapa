// Economia do mapa novo: moedas, XP, nível do jogador, níveis das construções, armazém do celeiro e venda.
// Salva na chave própria `vila-do-sol-mapa-v1`. Na primeira vez lê (só lê, nunca grava) o progresso do jogo atual em
// `vila-do-sol-v1` e traz moedas, XP, níveis da casa e do celeiro e a colheita guardada.
(function (raiz) {
  'use strict';
  const CHAVE = 'vila-do-sol-mapa-v1', ANTIGA = 'vila-do-sol-v1';
  const NOMES = { casa: 'Casa', celeiro: 'Celeiro', horta: 'Horta', galinheiro: 'Galinheiro', porcos: 'Chiqueiro', ovelhas: 'Curral das ovelhas', vacas: 'Curral das vacas', pomar: 'Pomar' };
  /** preço de cada nível (índice = nível novo) e nível do jogador pedido */
  const OBRAS = {
    casa: { custo: [0, 0, 500, 1400], pede: [0, 1, 3, 6] },
    celeiro: { custo: [0, 150, 350, 1100], pede: [0, 1, 2, 5] },
    horta: { custo: [0, 50, 250, 700], pede: [0, 1, 2, 4] },
    galinheiro: { custo: [0, 120, 350, 800], pede: [0, 2, 3, 5] },
    pomar: { custo: [0, 200, 600, 1500], pede: [0, 3, 4, 6] },
    porcos: { custo: [0, 250, 600, 1200], pede: [0, 3, 4, 6] },
    ovelhas: { custo: [0, 300, 700, 1400], pede: [0, 4, 5, 7] },
    vacas: { custo: [0, 400, 900, 1800], pede: [0, 5, 6, 8] },
  };
  /** produtos: nome, preço de venda por unidade, XP ao colher */
  const PRODUTOS = {
    alface: { nome: 'Alface', icone: '🥬', preco: 8, xp: 2 }, cenoura: { nome: 'Cenoura', icone: '🥕', preco: 12, xp: 2 },
    couve: { nome: 'Couve', icone: '🥬', preco: 14, xp: 3 }, tomate: { nome: 'Tomate', icone: '🍅', preco: 24, xp: 4 },
    milho: { nome: 'Milho', icone: '🌽', preco: 30, xp: 4 }, abobora: { nome: 'Abóbora', icone: '🎃', preco: 45, xp: 6 },
    morango: { nome: 'Morango', icone: '🍓', preco: 65, xp: 7 }, girassol: { nome: 'Girassol', icone: '🌻', preco: 120, xp: 10 },
  };
  /** sementes da loja: preço do pacote (1 canteiro) e nível pedido */
  const SEMENTES = { alface: { preco: 3, pede: 1 }, cenoura: { preco: 5, pede: 1 }, couve: { preco: 6, pede: 2 }, milho: { preco: 12, pede: 2 },
    tomate: { preco: 10, pede: 3 }, abobora: { preco: 18, pede: 4 }, morango: { preco: 25, pede: 5 }, girassol: { preco: 45, pede: 6 } };
  /** animais da loja, por curral */
  const ANIMAIS = { galinheiro: { nome: 'Galinha', icone: '🐔', preco: 40 }, porcos: { nome: 'Porco', icone: '🐷', preco: 90 },
    ovelhas: { nome: 'Ovelha', icone: '🐑', preco: 140 }, vacas: { nome: 'Vaca', icone: '🐄', preco: 220 } };
  const ANTIGOS = ['cenoura', 'milho', 'morango', 'girassol']; // ordem da sacola (bag) do jogo atual
  const novo = () => ({ versao: 1, moedas: 150, xp: 0, niveis: { casa: 1, celeiro: 0, horta: 0, galinheiro: 0, pomar: 0, porcos: 0, ovelhas: 0, vacas: 0 }, armazem: {}, vendidos: 0, colheitas: 0, importado: false,
    sementes: { cenoura: 6, alface: 4 }, plantio: 'cenoura', animais: {}, decor: [] });
  const inteiro = (v, a, b, p) => Number.isFinite(+v) ? Math.max(a, Math.min(b, Math.floor(+v))) : p;

  function criar(armazenamento = raiz.localStorage) {
    const ler = k => { try { return JSON.parse(armazenamento.getItem(k) || 'null'); } catch (e) { return null; } };
    let e = novo(), origem = 'novo';
    const salvo = ler(CHAVE);
    if (salvo && salvo.versao === 1 && salvo.niveis) {
      e = { ...e, ...salvo, niveis: { ...e.niveis, ...salvo.niveis }, armazem: { ...salvo.armazem }, sementes: { ...(salvo.sementes || e.sementes) } };
      if (!SEMENTES[e.plantio]) e.plantio = 'cenoura';
      if (!salvo.animais) { e.animais = {}; for (const k in ANIMAIS) if (salvo.niveis[k] > 0) e.animais[k] = 1; } // salvamento da etapa 1: um bicho por curral feito
      e.decor = Array.isArray(e.decor) ? e.decor.filter(d => d && typeof d.k === 'string' && Number.isFinite(d.x) && Number.isFinite(d.y)) : [];
      e.moedas = inteiro(e.moedas, 0, 1e9, 150); e.xp = inteiro(e.xp, 0, 1e9, 0);
      for (const k in OBRAS) e.niveis[k] = inteiro(e.niveis[k], k === 'casa' ? 1 : 0, 3, k === 'casa' ? 1 : 0);
      origem = 'salvo';
    } else {
      const v = ler(ANTIGA); // progresso do jogo atual: só leitura
      if (v && Number.isFinite(v.coins)) {
        e.moedas = inteiro(v.coins, 0, 1e9, 150); e.xp = inteiro(v.xp, 0, 1e9, 0);
        e.niveis.casa = inteiro(v.houseLevel, 1, 3, 1); e.niveis.celeiro = inteiro(v.barnLevel, 1, 3, 1);
        if (Array.isArray(v.bag)) ANTIGOS.forEach((k, i) => { const n = inteiro(v.bag[i], 0, 1e6, 0); if (n) e.armazem[k] = n; });
        e.importado = true; origem = 'importado';
      }
    }
    let podeSalvar = true;
    function salvar() {
      try { armazenamento.setItem(CHAVE, JSON.stringify(e)); return true; } catch (x) { podeSalvar = false; return false; }
    }
    const nivelJogador = () => 1 + Math.floor(e.xp / 100);
    /** pode evoluir? { ok, custo, pede, motivo } */
    function proximo(id) {
      const n = e.niveis[id] + 1, o = OBRAS[id];
      if (n > 3) return { ok: false, max: true, motivo: `${NOMES[id]} já está no nível máximo` };
      const custo = o.custo[n], pede = o.pede[n];
      if (nivelJogador() < pede) return { ok: false, n, custo, pede, motivo: `Precisa do nível ${pede} do jogador` };
      if (e.moedas < custo) return { ok: false, n, custo, pede, motivo: `Faltam ${custo - e.moedas} moedas` };
      return { ok: true, n, custo, pede };
    }
    /** paga e sobe um nível (XP = 10% do preço); devolve o novo nível ou null */
    function evoluir(id) {
      const p = proximo(id); if (!p.ok) return null;
      const antes = nivelJogador();
      e.moedas -= p.custo; e.niveis[id] = p.n; e.xp += Math.round(p.custo / 10);
      if (p.n === 1 && ANIMAIS[id]) e.animais[id] = Math.max(1, e.animais[id] || 0); // curral novo vem com um bicho
      salvar();
      return { n: p.n, subiu: nivelJogador() > antes };
    }
    /** colheita entra no armazém; devolve se o jogador subiu de nível */
    function guardar(produto, qtd) {
      const pr = PRODUTOS[produto]; if (!pr) return false;
      const antes = nivelJogador();
      e.armazem[produto] = (e.armazem[produto] || 0) + qtd; e.xp += pr.xp * qtd; e.colheitas += qtd; salvar();
      return nivelJogador() > antes;
    }
    const bonusVenda = () => 1 + 0.12 * Math.max(0, e.niveis.celeiro - 1);
    const precoVenda = produto => Math.round(PRODUTOS[produto].preco * bonusVenda());
    /** vende (produto ou todos) no celeiro; devolve moedas ganhas */
    function vender(produto) {
      if (e.niveis.celeiro < 1) return 0;
      let ganho = 0;
      for (const k of produto ? [produto] : Object.keys(e.armazem)) {
        const n = e.armazem[k] || 0; if (!n || !PRODUTOS[k]) continue;
        ganho += n * precoVenda(k); e.vendidos += n; delete e.armazem[k];
      }
      e.moedas += ganho; if (ganho) salvar();
      return ganho;
    }
    const motivoNivel = pede => nivelJogador() < pede ? `Precisa do nível ${pede}` : '';
    function comprarSemente(k, n = 1) {
      const sm = SEMENTES[k]; if (!sm) return 'Semente desconhecida';
      const m = motivoNivel(sm.pede); if (m) return m;
      if (e.moedas < sm.preco * n) return `Faltam ${sm.preco * n - e.moedas} moedas`;
      e.moedas -= sm.preco * n; e.sementes[k] = (e.sementes[k] || 0) + n; salvar(); return '';
    }
    /** o agricultor gasta um pacote para plantar um canteiro */
    function usarSemente(k) { if (!(e.sementes[k] > 0)) return false; e.sementes[k]--; salvar(); return true; }
    /** cap = quantos cabem no curral agora */
    function comprarAnimal(id, cap) {
      const a = ANIMAIS[id]; if (!a) return 'Animal desconhecido';
      if (!e.niveis[id]) return `Construa o ${NOMES[id].toLowerCase()} primeiro`;
      if ((e.animais[id] || 0) >= cap) return 'O curral está cheio: evolua para caber mais';
      if (e.moedas < a.preco) return `Faltam ${a.preco - e.moedas} moedas`;
      e.moedas -= a.preco; e.animais[id] = (e.animais[id] || 0) + 1; e.xp += Math.round(a.preco / 10); salvar(); return '';
    }
    /** item = { id, preco, pede } do catálogo de decorações */
    function podeDecor(item) { return motivoNivel(item.pede) || (e.moedas < item.preco ? `Faltam ${item.preco - e.moedas} moedas` : ''); }
    function comprarDecor(item, x, y) { const m = podeDecor(item); if (m) return m; e.moedas -= item.preco; e.xp += Math.round(item.preco / 10); e.decor.push({ k: item.id, x: Math.round(x), y: Math.round(y) }); salvar(); return ''; }
    return { comprarSemente, usarSemente, comprarAnimal, podeDecor, comprarDecor, motivoNivel,
      estado: e, origem, salvar, get podeSalvar() { return podeSalvar; }, nivelJogador, xpNoNivel: () => e.xp % 100, proximo, evoluir, guardar, vender, precoVenda, bonusVenda, nivel: id => e.niveis[id] };
  }
  raiz.Jogo = { criar, CHAVE, NOMES, OBRAS, PRODUTOS, SEMENTES, ANIMAIS };
})(typeof self !== 'undefined' ? self : globalThis);
