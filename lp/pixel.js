'use strict';
// kit em pixel do Segredo do Village: baú, chaves por série e céu do dia à noite (tudo desenhado por código, sem imagem)
const PX = (() => {
  const tela = (w, h) => Object.assign(document.createElement('canvas'), {width: w, height: h});
  const grade = (w, h) => Array.from({length: h}, () => new Array(w).fill(0));
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mistura = (a, b, t) => { const B = rgb(b); return '#' + rgb(a).map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

  function pinta(g, cores, contorno) {             // grade de letras -> canvas; pixel de borda vira contorno
    const h = g.length, w = g[0].length, c = tela(w, h), x = c.getContext('2d');
    const vazio = (i, y) => y < 0 || y >= h || i < 0 || i >= w || !g[y][i];
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      if (!g[y][i]) continue;
      x.fillStyle = cores[contorno && (vazio(i - 1, y) || vazio(i + 1, y) || vazio(i, y - 1) || vazio(i, y + 1)) ? contorno : g[y][i]];
      x.fillRect(i, y, 1, 1);
    }
    return c;
  }

  // ---------- chave 11×23: argola em cima, haste, dentes à direita ----------
  const SERIES = {                                  // contorno, escuro, médio, claro, brilho
    bronze: {o: '#3A1C08', d: '#7A4318', m: '#A8652C', l: '#D08A48', h: '#F6C590'},
    prata:  {o: '#262C33', d: '#66717D', m: '#97A3AF', l: '#C9D2DA', h: '#FFFFFF'},
    ouro:   {o: '#3B2410', d: '#B86E12', m: '#EF9F27', l: '#FAC775', h: '#FFF3D6'},
    black:  {o: '#F5C400', d: '#0C0C10', m: '#1C1C24', l: '#33333E', h: '#F5C400'},
  };
  let gChave = null;
  function gradeChave() {
    if (gChave) return gChave;
    const g = grade(11, 23);
    for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
      const dx = x - 5, dy = y - 5, r = Math.hypot(dx, dy);
      if (r > 5.4 || r < 1.6) continue;
      const v = -(dx + dy) / r;                      // luz vindo de cima à esquerda
      g[y][x] = v > .8 && r > 3 ? 'h' : v > .1 ? 'l' : v > -.6 ? 'm' : 'd';
    }
    for (let y = 10; y < 23; y++) for (let x = 3; x <= 7; x++) g[y][x] = x <= 4 ? (y < 16 ? 'h' : 'l') : x === 5 ? 'm' : 'd';
    for (let y = 11; y <= 13; y++) for (let x = 2; x <= 8; x++) g[y][x] = x <= 4 ? 'l' : x === 5 ? 'm' : 'd';
    for (const [y0, y1, x1] of [[15, 17, 9], [19, 21, 10]]) for (let y = y0; y <= y1; y++) for (let x = 8; x <= x1; x++) g[y][x] = 'd';
    return gChave = g;
  }
  function chave(serie) {                           // {frente, costas}: as costas são a mesma chave mais escura
    const cor = SERIES[serie] || SERIES.ouro, g = gradeChave();
    const costas = Object.fromEntries(Object.entries(cor).map(([k, v]) => [k, mistura(v, '#000000', k === 'o' ? .1 : .35)]));
    return {frente: pinta(g, cor, 'o'), costas: pinta(g, costas, 'o'), cor};
  }
  function giraChave(ctx, k, cx, cy, ang) {         // gira no eixo vertical; de perfil vira uma lâmina de 1 px
    const c = Math.cos(ang), w = k.frente.width, h = k.frente.height, img = c >= 0 ? k.frente : k.costas;
    const meia = w / 2 * Math.abs(c), x0 = Math.round(cx - meia), x1 = Math.max(x0 + 1, Math.round(cx + meia)), top = Math.round(cy - h / 2);
    for (let x = x0; x < x1; x++) {
      const sx = Math.abs(c) < .12 ? 5 : Math.max(0, Math.min(w - 1, Math.floor((x + .5 - cx) / c + w / 2)));
      ctx.drawImage(img, sx, 0, 1, h, x, top, 1, h);
    }
  }

  // ---------- baú 41×30: tampa (12 linhas) e corpo (18), em madeira ou no metal da Black ----------
  const BAU = {
    madeira: {k: '#2A1606', w: '#633806', W: '#8A5212', L: '#A8692A', g: '#B86E12', G: '#EF9F27', Y: '#FAC775', H: '#FFF3D6', x: '#1B1525'},
    metal:   {k: '#000000', w: '#0C0C10', W: '#1C1C24', L: '#33333E', g: '#B88A00', G: '#F5C400', Y: '#FFE066', H: '#FFFFFF', x: '#000000'},
  };
  function bau(estilo = 'madeira') {
    const W = 41, cor = BAU[estilo], tampa = grade(W, 12), corpo = grade(W, 18);
    const faixa = x => x >= 6 && x <= 8 || x >= 32 && x <= 34, tom = x => x === 6 || x === 32 ? 'Y' : x === 8 || x === 34 ? 'g' : 'G';
    for (let y = 0; y < 12; y++) {
      const a = [4, 2, 1][y] || 0;                   // tampa arredondada
      for (let x = a; x < W - a; x++) {
        let k = y >= 10 ? (y === 10 ? 'G' : 'g') : faixa(x) ? tom(x) : y <= 3 ? 'L' : y === 6 ? 'w' : 'W';
        if (!faixa(x) && y < 10 && x >= 36) k = k === 'L' ? 'W' : 'w';
        if (faixa(x) && (y === 4 || y === 8) && (x === 7 || x === 33)) k = 'H';
        tampa[y][x] = k;
      }
    }
    for (let y = 0; y < 18; y++) for (let x = 1; x < W - 1; x++) {
      let k = y === 0 || y === 6 || y === 12 || y === 17 || x >= 36 ? 'w' : 'W';
      if (faixa(x)) k = tom(x);
      if ((x <= 4 || x >= 36) && y >= 13) k = x === 1 || y === 13 ? 'Y' : 'G';
      if (faixa(x) && (y === 3 || y === 9 || y === 15) && (x === 7 || x === 33)) k = 'H';
      if (x >= 16 && x <= 24 && y >= 1 && y <= 8) k = x === 16 || y === 1 ? 'Y' : x === 24 || y === 8 ? 'g' : 'G';
      corpo[y][x] = k;
    }
    for (const [x, y] of [[19, 3], [20, 3], [21, 3], [19, 4], [20, 4], [21, 4], [20, 5], [20, 6]]) corpo[y][x] = 'x';
    corpo[2][17] = 'H';
    return {tampa: pinta(tampa, cor, 'k'), corpo: pinta(corpo, cor, 'k'), fechadura: {x: 20, y: 4}};
  }

  // ---------- céu: p = 0 no início do Esquenta (dia), 1 na abertura do baú (noite) ----------
  const CEU = [                                     // p, topo, horizonte, morro longe, morro perto, chão
    [0,   '#4FA8E0', '#BFE8F7', '#86B884', '#4F8A47', '#3A6B34'],
    [.35, '#5B8ED0', '#F6D69B', '#87A274', '#4D7A40', '#36602F'],
    [.6,  '#7A4F93', '#F59A5A', '#77617A', '#4A4052', '#2E2A36'],
    [.8,  '#2E2350', '#B85A78', '#433A57', '#2A2438', '#1E1A28'],
    [1,   '#0F0B19', '#2A1F42', '#2A2140', '#1A1428', '#120E1C'],
  ];
  function ceu(p) {
    let i = 0;
    while (i < CEU.length - 2 && p > CEU[i + 1][0]) i++;
    const a = CEU[i], b = CEU[i + 1], t = Math.max(0, Math.min(1, (p - a[0]) / (b[0] - a[0])));
    const [topo, horizonte, longe, perto, chao] = a.slice(1).map((c, j) => mistura(c, b[j + 1], t));
    return {topo, horizonte, longe, perto, chao};
  }

  return {tela, mistura, chave, giraChave, bau, ceu, SERIES};
})();
