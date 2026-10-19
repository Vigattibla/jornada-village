'use strict';
// landing do Segredo do Village: fases por data, abertura animada, séries, Chave (inscrição) e moldura dos stories
const CONFIG = {
  api: '',          // endpoint da lista (POST text/plain com JSON, devolve {numero}); vazio = modo demonstração
  politica: '',     // link da política de privacidade do Village
  instagram: '',    // perfil do Village
  revenda: '',      // link de compra a partir de 27/11
  versaoTexto: 'lp-2026-10-17-v1',
};

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(4, '0');
const suave = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const semente = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const el = (tag, props = {}, ...filhos) => { const e = Object.assign(document.createElement(tag), props); e.append(...filhos); return e; };
const nro = n => el('span', {className: 'nro'}, 'n', el('sup', {textContent: 'o'}), ' ' + pad(n));   // a Jersey 10 desenha º como "o" comum
const reduz = !/[?&]anima(&|=|$)/.test(location.search) && matchMedia('(prefers-reduced-motion: reduce)').matches;   // ?anima força o movimento na revisão; reduzido corta tremor, pulos e trilha, mas o céu, o Bê respirando e o brilho do baú seguem
const guarda = {
  ler: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  por: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- datas (Brasília, -03:00, sem horário de verão) ----------
const BR = s => Date.parse(s + ':00-03:00');
const DATAS = {esquenta: BR('2026-10-26T00:00'), lista: BR('2026-11-02T00:00'), abre: BR('2026-11-27T00:00'), fecha: BR('2026-12-01T00:00')};
const SERIES = [
  {id: 'bronze', nome: 'Bronze', ini: BR('2026-11-02T00:00'), fim: BR('2026-11-09T00:00'), dt: '02 a 08/11', tinta: '#7A4318', luz: '#F6C590'},
  {id: 'prata', nome: 'Prata', ini: BR('2026-11-09T00:00'), fim: BR('2026-11-16T00:00'), dt: '09 a 15/11', tinta: '#5A6570', luz: '#E6ECF1'},
  {id: 'ouro', nome: 'Ouro', ini: BR('2026-11-16T00:00'), fim: BR('2026-11-23T00:00'), dt: '16 a 22/11', tinta: '#B86E12', luz: '#FAC775'},
  {id: 'black', nome: 'Black', ini: BR('2026-11-23T00:00'), fim: BR('2026-11-27T00:00'), dt: '23 a 26/11', tinta: '#1C1C24', luz: '#F5C400'},
];
const Q = new URLSearchParams(location.search);
const simulada = Q.has('data') ? BR(Q.get('data')) : NaN, carregou = Date.now();
const agora = () => isNaN(simulada) ? Date.now() : simulada + Date.now() - carregou;
const faseEm = t => t < DATAS.lista ? 'esquenta' : t < DATAS.abre ? 'lista' : t < DATAS.fecha ? 'aberto' : 'fechado';
const serieEm = t => SERIES.find(s => t >= s.ini && t < s.fim) || null;
const progresso = t => Math.max(0, Math.min(1, (t - DATAS.esquenta) / (DATAS.abre - DATAS.esquenta)));
const dataBR = t => new Date(t - 3 * 3600e3).toISOString().replace(/^\d+-(\d+)-(\d+)T(\d+:\d+).*/, '$2/$1 $3');

// origem do primeiro toque (UTM/ref), sem dado pessoal
const origem = (() => {
  const salva = guarda.ler('segredo-origem');
  if (salva) return salva;
  const o = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) if (Q.get(k)) o[k] = Q.get(k).slice(0, 80);
  try { if (document.referrer) o.referrer = new URL(document.referrer).hostname; } catch {}
  if (Object.keys(o).length) guarda.por('segredo-origem', o);
  return o;
})();

// ---------- imagens ----------
const imagem = src => Object.assign(new Image(), {src});
const sprite = imagem('../be-spritesheet.png'), folhaImg = imagem('../folha-dourada.png'), logoImg = imagem('village.svg');
let atlas = null;
fetch('../be-atlas.json').then(r => r.json()).then(a => sprite.decode().then(() => { atlas = a; })).catch(() => {});
const folhaOk = () => folhaImg.complete && folhaImg.naturalWidth > 0;
function logoPx(w) {                                // logo do Village na grade de pixel: creme, traços em ouro e contorno escuro
  if (!logoImg.complete || !logoImg.naturalWidth) return null;
  const h = Math.round(w * 58.23 / 140.31), W = w + 2, H = h + 2, c = PX.tela(W, H), x = c.getContext('2d');
  x.drawImage(logoImg, 1, 1, w, h);
  const a = x.getImageData(0, 0, W, H).data, cheio = k => a[k * 4 + 3] > 90, saida = x.createImageData(W, H);
  const pinta = (k, hex) => { const v = parseInt(hex.slice(1), 16); saida.data.set([v >> 16, v >> 8 & 255, v & 255, 255], k * 4); };
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const k = y * W + i;
    if (cheio(k)) pinta(k, a[k * 4] > 150 ? '#FAC775' : '#FFF3D6');
    else if (i > 0 && cheio(k - 1) || i < W - 1 && cheio(k + 1) || y > 0 && cheio(k - W) || y < H - 1 && cheio(k + W)) pinta(k, '#2A1606');
  }
  x.putImageData(saida, 0, 0);
  return c;
}
const BAUS = {madeira: PX.bau('madeira'), metal: PX.bau('metal')};
const FECHO = [[19, 3], [20, 3], [21, 3], [19, 4], [20, 4], [21, 4], [20, 5], [20, 6]];
function quadro(nome, t) {
  const a = atlas.animations[nome], n = a.frames.length;
  return a.frames[a.loop ? Math.floor(t * a.fps) % n : Math.min(n - 1, Math.floor(t * a.fps))];
}

// ---------- desenho em pixel ----------
function circulo(x, cx, cy, r, cor) {
  x.fillStyle = cor;
  for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r + r * .8 - dy * dy)); if (w >= 0) x.fillRect(cx - w, cy + dy, 2 * w + 1, 1); }
}
function brilho(x, cx, cy, n, cor, miolo = '#FFFFFF') {
  x.fillStyle = cor; x.fillRect(cx - n, cy, 2 * n + 1, 1); x.fillRect(cx, cy - n, 1, 2 * n + 1);
  x.fillStyle = miolo; x.fillRect(cx, cy, 1, 1);
}
function nuvem(w, c1, c2, R) {
  const h = Math.ceil(w * .42), c = PX.tela(w, h), x = c.getContext('2d');
  const bolhas = Array.from({length: 4}, (_, k) => ({cx: w * (.18 + .21 * k), r: h * (.5 + R() * .5)}));
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    if (!bolhas.some(b => (i - b.cx) ** 2 + (y - h + 1) ** 2 <= b.r * b.r)) continue;
    x.fillStyle = y > h * .62 ? c2 : c1; x.fillRect(i, y, 1, 1);
  }
  return c;
}

// céu, sol/lua, morros, chalés e chão; p = 0 dia no começo do Esquenta, 1 noite na abertura do baú
function fundo(W, H, chao, p, chales, lua = [W - 24, chao - 84]) {
  const cor = PX.ceu(p), c = PX.tela(W, H), x = c.getContext('2d'), horiz = chao - 4, N = 8;
  const img = x.createImageData(W, H), d = img.data, A = rgb(cor.topo), B = rgb(cor.horizonte);
  for (let y = 0; y < chao; y++) {
    const u = Math.min(N - 1, y / horiz * (N - 1)), b = Math.floor(u), f = u - b;
    for (let i = 0; i < W; i++) {
      const k = Math.min(N - 1, b + (f > .5 && ((i + y) & 1) ? 1 : 0)) / (N - 1), o = (y * W + i) * 4;   // pontilhado entre faixas
      for (let j = 0; j < 3; j++) d[o + j] = A[j] + (B[j] - A[j]) * k;
      d[o + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  const ceuEm = y => PX.mistura(cor.topo, cor.horizonte, Math.min(N - 1, Math.floor(y / horiz * (N - 1))) / (N - 1));
  if (p < .64) {                                    // sol descendo até o morro
    const u = p / .64, sx = Math.round(W * .78), sy = Math.round(chao - 78 + 70 * u * u);
    x.globalAlpha = .3; circulo(x, sx, sy, 9, PX.mistura('#FFF8E8', '#F59A5A', u)); x.globalAlpha = 1;
    circulo(x, sx, sy, 6, PX.mistura('#FFF3D6', '#F7A65A', u));
  }
  if (p > .62) {                                    // lua crescente
    const [mx, my] = lua;
    x.globalAlpha = suave(.62, .85, p); circulo(x, mx, my, 6, '#FFF3D6'); circulo(x, mx + 3, my - 2, 5, ceuEm(my - 2)); x.globalAlpha = 1;
  }
  const noite = suave(.5, .75, p);
  const onda = (base, amp, f1, f2, ph) => Array.from({length: W}, (_, i) => Math.round(base + amp * (Math.sin(i * f1 + ph) * .6 + Math.sin(i * f2 + ph * 2) * .4)));
  const longe = onda(30, 9, .045, .11, 1), perto = onda(13, 5, .07, .17, 4);
  for (let i = 0; i < W; i++) { x.fillStyle = cor.longe; x.fillRect(i, chao - longe[i], 1, longe[i]); }
  const borda = PX.mistura(cor.perto, '#FFFFFF', .14 * (1 - noite));
  for (let i = 0; i < W; i++) { x.fillStyle = cor.perto; x.fillRect(i, chao - perto[i], 1, perto[i]); x.fillStyle = borda; x.fillRect(i, chao - perto[i], 1, 1); }
  // chalés do resort; as janelas acendem quando escurece
  const parede = PX.mistura(PX.mistura(cor.longe, '#FFF3D6', .4), cor.longe, noite * .8), telhado = PX.mistura('#8A3B22', PX.mistura(cor.longe, '#000000', .3), noite);
  for (const hx of chales) {
    const base = chao - Math.max(longe[hx] || 0, perto[hx] || 0) + 1;
    x.fillStyle = parede; x.fillRect(hx - 3, base - 5, 7, 5);
    x.fillStyle = telhado; for (let r = 0; r < 4; r++) x.fillRect(hx - 4 + r, base - 6 - r, 9 - 2 * r, 1);
    x.fillStyle = noite > .4 ? '#FAC775' : PX.mistura(parede, '#000000', .35); x.fillRect(hx - 2, base - 3, 1, 1); x.fillRect(hx + 1, base - 3, 2, 2);
  }
  x.fillStyle = cor.chao; x.fillRect(0, chao, W, H - chao);
  x.fillStyle = PX.mistura(cor.chao, '#FFFFFF', .1 * (1 - noite) + .03); x.fillRect(0, chao, W, 1);
  const R = semente(5); x.fillStyle = PX.mistura(cor.chao, '#000000', .25);
  for (let i = 0; i < W * (H - chao) / 14; i++) x.fillRect(R() * W | 0, chao + 2 + (R() * (H - chao - 2) | 0), 1, 1);

  const RS = semente(42), RN = semente(9);
  const estrelas = Array.from({length: Math.round(W * horiz / 150)}, () => ({x: RS() * W | 0, y: RS() * horiz * .85 | 0, lim: RS(), ph: RS() * 6.3, v: 1 + RS() * 2.5, grande: RS() < .08}));
  const tarde = suave(.25, .65, p), c1 = PX.mistura('#FFFFFF', '#F4A882', tarde), c2 = PX.mistura('#D8E8F4', '#B86A7A', tarde);
  const nuvens = [0, 1, 2].map(() => ({img: nuvem(16 + RN() * 16 | 0, c1, c2, RN), x0: RN() * W, y: chao - 115 + RN() * 55 | 0, v: 1.2 + RN() * 1.8}));
  const sil = PX.mistura(cor.perto, '#000000', .35), kp = suave(.5, .95, p);
  const palma = {tronco: PX.mistura('#8A6A44', sil, kp), troncoEsc: PX.mistura('#6B4F2E', sil, kp), folha: PX.mistura('#3F8A3C', sil, kp), folhaEsc: PX.mistura('#2C6A2E', sil, kp)};
  return {c, cor, p, estrelas, nuvens, palma, vis: suave(.45, 1, p), nuvemA: 1 - suave(.55, .8, p), noite};
}

function palmeira(x, bx, by, h, inclina, bal, c) {
  let tx = bx, ty = by;
  for (let i = 0; i <= h; i++) {
    const u = i / h; tx = Math.round(bx + inclina * 7 * u * u + bal * u * u); ty = by - i;
    x.fillStyle = i % 4 ? c.tronco : c.troncoEsc; x.fillRect(tx - (u < .4 ? 1 : 0), ty, u < .4 ? 3 : 2, 1);
  }
  for (const [ang, len] of [[-2.85, 14], [-2.35, 12], [-1.75, 8], [-1.3, 11], [-.75, 14], [-.25, 13]]) {
    for (let s = 0; s <= 1; s += 1 / len) {
      const fx = Math.round(tx + 1 + Math.cos(ang) * s * len + bal * 1.4 * s), fy = Math.round(ty + Math.sin(ang) * s * len + s * s * len * .55);
      x.fillStyle = c.folha; x.fillRect(fx, fy, 1, s < .6 ? 2 : 1);
      if (s > .2 && Math.round(s * len) % 2 === 0) { x.fillStyle = c.folhaEsc; x.fillRect(fx, fy + 2, 1, 1); }
    }
  }
}

// baú: est = {estilo, forca (brilho 0..1), dx, lid (tampa levantada, px negativos), aberto}
function desenhaBau(x, t, x0, base, est) {
  const b = BAUS[est.estilo], dx = est.dx || 0, lid = est.lid || 0;
  if (est.forca > 0) {
    const pul = 1 + .06 * Math.sin(t * 2.2);
    for (const [r, a] of [[34, .05], [25, .07], [17, .1]]) { x.globalAlpha = a * est.forca; circulo(x, x0 + 20, base - 15, Math.round(r * pul), '#FAC775'); }
    x.globalAlpha = 1;
  }
  x.globalAlpha = .3; x.fillStyle = '#000000'; x.fillRect(x0 - 1, base, 43, 2); x.globalAlpha = 1;
  if (est.aberto) {                                 // facho de luz atrás, tampa aberta mostrando o lado de dentro
    const topo = base - 108, g = x.createLinearGradient(0, base - 18, 0, topo);
    g.addColorStop(0, 'rgba(255,243,214,.65)'); g.addColorStop(1, 'rgba(250,199,117,0)');
    x.globalAlpha = .75 + .25 * Math.sin(t * 3); x.fillStyle = g;
    x.beginPath(); x.moveTo(x0 + 3, base - 18); x.lineTo(x0 + 38, base - 18); x.lineTo(x0 + 54, topo); x.lineTo(x0 - 13, topo); x.fill();
    x.globalAlpha = 1;
    const [borda, dentro, aro] = est.estilo === 'metal' ? ['#000000', '#1C1C24', '#F5C400'] : ['#2A1606', '#4A2A0C', '#EF9F27'];
    x.fillStyle = borda; x.fillRect(x0 + 2, base - 30, 37, 12);
    x.fillStyle = dentro; x.fillRect(x0 + 3, base - 29, 35, 10);
    x.fillStyle = aro; x.fillRect(x0 + 3, base - 29, 35, 1); x.fillRect(x0 + 3, base - 29, 1, 10); x.fillRect(x0 + 37, base - 29, 1, 10);
    x.globalAlpha = .55 + .2 * Math.sin(t * 3); x.fillStyle = '#FAC775'; x.fillRect(x0 + 4, base - 22, 33, 4); x.globalAlpha = 1;
    x.drawImage(b.corpo, x0, base - 18);
    x.fillStyle = '#FFF3D6'; x.fillRect(x0 + 2, base - 18, 37, 1);
    return;
  }
  x.drawImage(b.corpo, x0 + dx, base - 18);
  if (lid < 0) {                                    // fresta quando a tampa pula: escuro nas pontas, ouro no meio, como luz saindo do fundo
    const y0 = base - 18 + lid;
    x.fillStyle = '#2A1606'; x.fillRect(x0 + dx + 2, y0, 37, -lid);
    for (let i = 0; i < 37; i++) {
      const v = 1 - Math.abs(i - 18) / 19;
      if (v > .25) { x.fillStyle = v > .75 ? '#FFF3D6' : v > .5 ? '#FAC775' : '#B86E12'; x.fillRect(x0 + dx + 2 + i, y0, 1, -lid); }
    }
  }
  x.drawImage(b.tampa, x0 + dx, base - 30 + lid);
  if (lid < 0) {                                    // raios curtos escapando pela frente da tampa
    x.globalAlpha = .45; x.fillStyle = '#FAC775';
    for (const [rx, rh] of [[13, 4], [17, 7], [20, 10], [23, 7], [27, 4]]) x.fillRect(x0 + dx + rx, base - 18 + lid - rh, 1, rh);
    x.globalAlpha = 1;
  }
  if (est.forca > 0) {                              // fechadura acesa por dentro e uma faísca de vez em quando
    const pul = .5 + .5 * Math.sin(t * 2.4);
    x.fillStyle = PX.mistura('#1B1525', '#FAC775', est.forca * (.3 + .6 * pul));
    for (const [i, j] of FECHO) x.fillRect(x0 + dx + i, base - 18 + j, 1, 1);
    const ciclo = (t % 2.6) / .5, n = Math.round(Math.sin(Math.min(1, ciclo) * Math.PI) * 3);
    if (ciclo < 1 && n > 0) brilho(x, x0 + dx + 20, base - 14, n, '#FAC775');
  }
}

// ---------- abertura ----------
const hero = $('topo'), ceu = $('ceu'), cx = ceu.getContext('2d');
const tBe = PX.tela(40, 58), xBe = tBe.getContext('2d');
const cena = {s: 3, W: 0, H: 0, chao: 0, bauX: 0, beX: 0, F: null, fase: '', palmas: [], vagas: [], folhas: [], brilhos: [], tremor: -9, proxTremor: 2, be: null, falaI: 0};
const TREM = [[1, -1], [-1, 0], [1, -2], [0, 0], [-1, -1], [1, 0], [0, -1], [0, 0], [0, 0], [0, 0]];   // [dx, tampa] a 14 quadros/s
const FALAS = {
  esquenta: ['Shhh!', 'Ele mexeu!', 'Só abre dia 27…', 'As chaves saem dia 02/11.'],
  lista: ['Shhh!', 'Já pegou sua chave?', 'Ele está mais agitado…', 'Abre dia 27, à meia-noite.'],
  aberto: ['Abriu!', 'Quem tem a chave entra primeiro!'],
  fechado: ['Até a próxima!', 'Ele vai voltar…'],
};

function dimensiona() {
  const w = hero.clientWidth, h = hero.offsetHeight, largo = w >= 860;
  const s = cena.s = Math.max(2, Math.min(5, Math.floor(Math.min(w / 130, h / 170))));
  const W = cena.W = Math.ceil(w / s), H = cena.H = Math.ceil(h / s);
  ceu.width = W; ceu.height = H; ceu.style.width = W * s + 'px'; ceu.style.height = H * s + 'px';
  cena.chao = H - Math.max(14, Math.round(H * .07));
  cena.bauX = Math.round(W * (largo ? .68 : .58)) - 20;
  cena.beX = cena.bauX - 14;
  cena.chales = (largo ? [.44, .52, .86] : [.16, .27]).map(f => Math.round(W * f));
  cena.palmas = [{x: Math.round(W * .08), h: 44, l: 1, ph: 0}, {x: Math.round(W * .94), h: 36, l: -1, ph: 2}];
  if (W > 220) cena.palmas.push({x: Math.round(W * .46), h: 30, l: .6, ph: 4});
  const R = semente(3);
  cena.vagas = Array.from({length: Math.round(W / 13)}, () => ({x: R() * W, y: cena.chao - 6 - R() * 26, ph: R() * 6.3}));
  montaFundo();
  const toque = $('toqueBau'), esq = cena.beX - 14;
  Object.assign(toque.style, {left: esq * s + 'px', top: (cena.chao - 58) * s + 'px', width: (cena.bauX + 41 - esq) * s + 'px', height: 58 * s + 'px'});
  if (reduz) desenha(0);
}
function montaFundo() { cena.F = fundo(cena.W, cena.H, cena.chao, progresso(agora()), cena.chales); }

function tremor(t, forte) {
  cena.tremor = t;
  for (let i = 0; i < (forte ? 10 : 4); i++) cena.brilhos.push({x: cena.bauX + 6 + Math.random() * 29, y: cena.chao - 19, vx: (Math.random() - .5) * 24, vy: -12 - Math.random() * 18, g: 26, vida: 0, max: .5 + Math.random() * .5});
  if (!forte && (!cena.be || t > cena.be.ate) && Math.random() < .5) cena.be = {nome: 'jump', ini: t + .1, ate: t + .5};
}

function atualiza(t, dt) {
  const f = cena.fase;
  if (!reduz && (f === 'esquenta' || f === 'lista') && t >= cena.proxTremor) {   // o baú fica mais agitado perto do dia 27
    tremor(t);
    cena.proxTremor = t + (f === 'lista' ? 7 - 4.5 * cena.F.p : 8) * (.7 + Math.random() * .6);
  }
  if (folhaOk() && cena.folhas.length < (cena.W > 220 ? 6 : 4) && Math.random() < dt * .7)
    cena.folhas.push({x: Math.random() * (cena.W + 30), y: -12, vy: 5 + Math.random() * 5, vx: -2 - Math.random() * 3, ph: Math.random() * 6.3, fr: Math.random() * 8});
  for (const l of cena.folhas) { l.y += l.vy * dt; l.x += l.vx * dt; l.fr += dt * 8; }
  cena.folhas = cena.folhas.filter(l => l.y < cena.chao - 6 && l.x > -16);
  if (f === 'aberto' && Math.random() < dt * 14)
    cena.brilhos.push({x: cena.bauX + 4 + Math.random() * 33, y: cena.chao - 19, vx: (Math.random() - .5) * 4, vy: -8 - Math.random() * 12, g: -3, vida: 0, max: 1.6 + Math.random()});
  for (const b of cena.brilhos) { b.vida += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += b.g * dt; }
  cena.brilhos = cena.brilhos.filter(b => b.vida < b.max);
}

function quadroBe(t) {
  const e = cena.be;
  if (e && t >= e.ini && t < e.ate) return {fr: quadro(e.nome, t - e.ini), dy: e.nome === 'jump' ? -Math.round(Math.sin((t - e.ini) / (e.ate - e.ini) * Math.PI) * 5) : 0};
  if (cena.fase === 'aberto') return {fr: quadro(Math.floor(t / 3) % 2 ? 'win' : 'idle', t), dy: 0};
  return {fr: quadro('idle', t), dy: 0};
}

function desenha(t) {
  const {W, chao, F} = cena, x = cx;
  x.imageSmoothingEnabled = false;
  x.drawImage(F.c, 0, 0);
  for (const e of F.estrelas) {
    if (e.lim > F.vis) continue;
    const a = (.45 + .55 * (.5 + .5 * Math.sin(t * e.v + e.ph))) * Math.min(1, (F.vis - e.lim) * 6);
    x.globalAlpha = a;
    if (e.grande && a > .85) brilho(x, e.x, e.y, 1, '#FFF8E8'); else { x.fillStyle = '#FFF8E8'; x.fillRect(e.x, e.y, 1, 1); }
  }
  if (F.nuvemA > 0) { x.globalAlpha = F.nuvemA; for (const n of F.nuvens) x.drawImage(n.img, Math.round((n.x0 + t * n.v) % (W + 50)) - 30, n.y); }
  x.globalAlpha = 1;
  for (const pm of cena.palmas) palmeira(x, pm.x, chao, pm.h, pm.l, Math.sin(t * .9 + pm.ph) * 1.2, F.palma);
  const vg = suave(.6, .85, F.p);
  if (vg > 0) for (const v of cena.vagas) {
    const a = Math.max(0, Math.sin(t * 1.7 + v.ph)) * vg; if (a <= 0) continue;
    const vx = Math.round(v.x + Math.sin(t * .6 + v.ph) * 7), vy = Math.round(v.y + Math.sin(t * .9 + v.ph * 1.3) * 3);
    x.globalAlpha = a; if (a > .85) brilho(x, vx, vy, 1, '#FAC775', '#FFF8E8'); else { x.fillStyle = '#FAC775'; x.fillRect(vx, vy, 1, 1); }
  }
  x.globalAlpha = 1;
  const f = cena.fase, k = (t - cena.tremor) * 14 | 0, [dx, lid] = k >= 0 && k < TREM.length ? TREM[k] : [0, 0];
  desenhaBau(x, t, cena.bauX, chao, {estilo: f === 'aberto' || f === 'fechado' ? 'metal' : 'madeira', forca: f === 'fechado' ? 0 : f === 'aberto' ? 1 : .35 + .65 * F.p, dx, lid, aberto: f === 'aberto'});
  if (atlas && !cena.semBe) {                       // com a trilha ligada, quem desenha o Bê é ela
    const q = quadroBe(t);
    xBe.clearRect(0, 0, 40, 58); xBe.drawImage(sprite, q.fr.x, q.fr.y, 40, 58, 0, 0, 40, 58);
    const sombra = suave(.5, 1, F.p) * .38;
    if (sombra) { xBe.globalCompositeOperation = 'source-atop'; xBe.globalAlpha = sombra; xBe.fillStyle = '#1B1430'; xBe.fillRect(0, 0, 40, 58); xBe.globalAlpha = 1; xBe.globalCompositeOperation = 'source-over'; }
    x.globalAlpha = .3; x.fillStyle = '#000000'; x.fillRect(cena.beX - 8, chao, 16, 1); x.globalAlpha = 1;
    x.drawImage(tBe, cena.beX - 20, chao - 56 + q.dy);
  }
  if (folhaOk()) for (const l of cena.folhas) x.drawImage(folhaImg, (l.fr | 0) % 8 * 12, 0, 12, 12, Math.round(l.x + Math.sin(t * 1.5 + l.ph) * 5), Math.round(l.y), 12, 12);
  for (const b of cena.brilhos) {
    const r = 1 - b.vida / b.max, bx = Math.round(b.x), by = Math.round(b.y), c = r > .66 ? '#FFF3D6' : r > .33 ? '#FAC775' : '#EF9F27';
    if (r > .7) brilho(x, bx, by, 1, c); else { x.fillStyle = c; x.fillRect(bx, by, 1, 1); }
  }
}

let visivel = true, rodando = false, ultimo = 0;
function laco(ms) {
  rodando = false;
  if (!visivel || document.hidden) return;
  if (ms - ultimo >= 33) { const t = ms / 1000; atualiza(t, Math.min(.1, (ms - ultimo) / 1000)); ultimo = ms; desenha(t); }
  pede();
}
function pede() { if (!rodando) { rodando = true; requestAnimationFrame(laco); } }
new IntersectionObserver(([e]) => { visivel = e.isIntersecting; pede(); }).observe(hero);
document.addEventListener('visibilitychange', pede);

let falaT = 0;
function fala(msg) {
  const b = $('balao'); b.textContent = msg;
  b.style.left = cena.beX * cena.s + 'px'; b.style.top = (cena.chao - 60) * cena.s + 'px';
  b.classList.add('on'); clearTimeout(falaT); falaT = setTimeout(() => b.classList.remove('on'), 2200);
}
$('toqueBau').addEventListener('click', () => {
  const t = performance.now() / 1000, lista = FALAS[cena.fase] || FALAS.esquenta;
  if (cena.fase !== 'aberto' && !reduz) tremor(t, true);
  cena.be = {nome: 'win', ini: t, ate: t + 1.6};
  fala(lista[cena.falaI++ % lista.length]);
});

// ---------- contagem ----------
const relogio = {alvo: 0, fim: 0, ult: {}};
function tique(t) {                                 // c* = contagem do topo, f* = contagem do baú no fim da trilha
  for (const [p, alvo] of [['c', relogio.alvo], ['f', relogio.fim]]) {
    if (!alvo) continue;
    const r = Math.max(0, alvo - t) / 1000 | 0;
    const v = {D: r / 86400 | 0, H: r / 3600 % 24 | 0, M: r / 60 % 60 | 0, S: r % 60};
    for (const k in v) {
      const id = p + k, txt = String(v[k]).padStart(2, '0');
      if (relogio.ult[id] === txt) continue;
      const e = $(id); e.textContent = txt;
      if (relogio.ult[id] !== undefined && !reduz) { e.classList.remove('troca'); void e.offsetWidth; e.classList.add('troca'); }
      relogio.ult[id] = txt;
    }
  }
}

// ---------- lembrete na agenda ----------
const EVENTO = {titulo: 'O Segredo do Village: a lista abre', ini: '20261102T120000Z', fim: '20261102T123000Z', texto: 'Hoje saem as primeiras chaves da Série Bronze. Quem tem a chave entra primeiro.'};
const urlLimpa = () => location.origin + location.pathname;
function baixa(blob, nome) {
  const a = el('a', {href: URL.createObjectURL(blob), download: nome});
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function ics() {
  const st = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', u = urlLimpa();
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Village Resort//Segredo//PT', 'BEGIN:VEVENT', 'UID:lista-20261102@segredo-village', `DTSTAMP:${st}`,
    `DTSTART:${EVENTO.ini}`, `DTEND:${EVENTO.fim}`, `SUMMARY:${EVENTO.titulo}`, `DESCRIPTION:${EVENTO.texto}\\n${u}`, `URL:${u}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:A lista do Segredo abriu', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function botoesAgenda(alvo) {
  const g = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({action: 'TEMPLATE', text: EVENTO.titulo, dates: EVENTO.ini + '/' + EVENTO.fim, details: EVENTO.texto + '\n' + urlLimpa()});
  alvo.replaceChildren(
    el('a', {className: 'bt', href: g, target: '_blank', rel: 'noopener', textContent: 'Google Agenda'}),
    el('button', {className: 'bt sec', type: 'button', textContent: 'Outra agenda', onclick: () => baixa(new Blob([ics()], {type: 'text/calendar;charset=utf-8'}), 'segredo-village.ics')}));
}

// ---------- fases ----------
let faseAtual = '';
function aplicaFase() {
  const t = agora(), f = faseAtual = cena.fase = faseEm(t), s = serieEm(t), ch = guarda.ler('segredo-chave');
  const fimSerie = s ? s.dt.split(' a ')[1] : '';
  $('heroTexto').textContent = {
    esquenta: 'Tem um baú dourado escondido no Village. Dia 02/11 a lista abre e saem as primeiras chaves.',
    lista: `As chaves estão saindo. Esta semana é a Série ${s && s.nome}, que fecha dia ${fimSerie}. Quem tem a chave entra primeiro.`,
    aberto: 'O baú abriu! Quem tem a chave já recebeu o caminho para entrar primeiro.',
    fechado: 'O baú fechou por este ano. A lista continua, com as novidades de Natal, Réveillon e férias.',
  }[f];
  const cont = {esquenta: ['A lista abre em', DATAS.lista], lista: ['O baú abre em', DATAS.abre], aberto: ['O baú fecha em', DATAS.fecha]}[f];
  $('contagem').classList.toggle('oculto', !cont);
  if (cont) { $('contRot').textContent = cont[0]; relogio.alvo = cont[1]; tique(t); }

  const ac = $('heroAcoes'), nota = (...f) => el('div', {className: 'nota'}, ...f);
  ac.replaceChildren();
  if (f === 'esquenta') {
    const ag = el('div', {className: 'agenda'}); botoesAgenda(ag);
    ac.append(el('div', {className: 'px-t', textContent: 'Me avise quando abrir:'}), ag);
    if (CONFIG.instagram) ac.append(el('a', {className: 'bt sec', href: CONFIG.instagram, target: '_blank', rel: 'noopener', textContent: 'Seguir o Village no Instagram'}), nota('Comente BAÚ no post fixado.'));
    else ac.append(nota('Instagram: link a definir.'));
  } else if (f === 'lista') {
    ac.append(ch ? el('a', {className: 'bt', href: '#chave'}, 'Ver minha chave ', nro(ch.numero)) : el('a', {className: 'bt', href: '#chave', textContent: 'Pegar minha chave'}), nota('Grátis · sem sorteio · só para maiores de 18'));
  } else if (f === 'aberto') {
    ac.append(CONFIG.revenda ? el('a', {className: 'bt', href: CONFIG.revenda, target: '_blank', rel: 'noopener', textContent: 'Entrar no baú'}) : el('button', {disabled: true, textContent: 'Entrar no baú (link a definir)'}));
    if (ch) ac.append(nota('Sua chave: ', nro(ch.numero)));
  } else ac.append(el('a', {className: 'bt', href: '#chave', textContent: 'Entrar na lista'}));

  $('chaveSub').textContent = {
    esquenta: 'Sua chave numerada sai a partir de 02/11.',
    lista: `Série ${s && s.nome} aberta até ${fimSerie}. Grátis, sem sorteio, só para maiores de 18.`,
    aberto: 'O baú já abriu, mas a lista continua: entre para saber das próximas.',
    fechado: 'A lista continua: entre para saber das próximas.',
  }[f];
  $('chaveAntes').classList.toggle('oculto', f !== 'esquenta');
  document.querySelectorAll('[data-agenda]').forEach(botoesAgenda);
  if (f === 'esquenta') { $('form').classList.add('oculto'); $('minha').classList.add('oculto'); }
  else if (ch) mostraMinha(ch, false);
  else { $('form').classList.remove('oculto'); $('minha').classList.add('oculto'); }
  relogio.fim = {esquenta: DATAS.abre, lista: DATAS.abre, aberto: DATAS.fecha}[f] || 0;
  $('fimRel').classList.toggle('oculto', !relogio.fim);
  $('fimTit').textContent = {esquenta: 'O baú abre em', lista: 'O baú abre em', aberto: 'O baú abriu! Fecha em', fechado: 'O baú fechou'}[f];
  $('fimSub').textContent = {
    esquenta: '27 de novembro, à meia-noite. A lista das chaves abre dia 02/11.',
    lista: '27 de novembro, à meia-noite. Quem tem a chave entra primeiro.',
    aberto: 'Quem tem a chave já recebeu o caminho para entrar.',
    fechado: 'Até o ano que vem. A lista continua, com as novidades de Natal, Réveillon e férias.',
  }[f];
  const fa = $('fimAcoes'); fa.replaceChildren();
  if (f === 'esquenta') { const ag = el('div', {className: 'agenda'}); botoesAgenda(ag); fa.append(el('div', {className: 'px-t', textContent: 'Me avise quando a lista abrir:'}), ag); }
  else if (f === 'lista') fa.append(ch ? el('a', {className: 'bt', href: '#chave'}, 'Ver minha chave ', nro(ch.numero)) : el('a', {className: 'bt', href: '#chave', textContent: 'Pegar minha chave'}));
  else if (f === 'aberto') fa.append(CONFIG.revenda ? el('a', {className: 'bt', href: CONFIG.revenda, target: '_blank', rel: 'noopener', textContent: 'Entrar no baú'}) : el('button', {disabled: true, textContent: 'Entrar no baú (link a definir)'}));
  else fa.append(el('a', {className: 'bt', href: '#chave', textContent: 'Entrar na lista'}));
  if (relogio.fim) tique(t);
  $('bEnviar').textContent = s ? 'Pegar minha chave' : 'Entrar na lista';
  montaSeries(t);
  montaFundo();
  if (reduz) { desenha(0); desenhaBauFim(0); }
}

const cacheImg = {};
function imgChave(serie, esc) {
  const k = serie + esc;
  if (!cacheImg[k]) { const fr = PX.chave(serie).frente, c = PX.tela(fr.width * esc, fr.height * esc), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(fr, 0, 0, c.width, c.height); cacheImg[k] = c.toDataURL(); }
  return cacheImg[k];
}
function montaSeries(t) {
  $('listaSeries').replaceChildren(...SERIES.map(s => {
    const st = t >= s.fim ? 'fechada' : t >= s.ini ? 'aberta' : 'em breve';
    const d = el('div', {className: `serie ${st === 'em breve' ? '' : st} ${s.id === 'black' ? 'black' : ''}`});
    d.append(el('img', {className: 'px', alt: '', src: imgChave(s.id, 3)}), el('h3', {textContent: s.nome}), el('div', {className: 'dt', textContent: s.dt}), el('span', {className: 'chip', textContent: st === 'aberta' ? 'aberta agora' : st}));
    return d;
  }));
}
function icones() {
  $('icChave').src = imgChave('ouro', 2);
  const fv = PX.tela(32, 32), fx = fv.getContext('2d'); fx.imageSmoothingEnabled = false; fx.drawImage(PX.chave('ouro').frente, 9, 4, 14, 28);
  document.head.append(el('link', {rel: 'icon', href: fv.toDataURL()}));
  const b = BAUS.madeira, c = PX.tela(82, 60), x = c.getContext('2d');
  x.imageSmoothingEnabled = false; x.drawImage(b.corpo, 0, 24, 82, 36); x.drawImage(b.tampa, 0, 0, 82, 24);
  $('icBau').src = c.toDataURL();
  folhaImg.decode().then(() => { const f = PX.tela(48, 48), y = f.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(folhaImg, 0, 0, 12, 12, 0, 0, 48, 48); $('icFolha').src = f.toDataURL(); }).catch(() => {});
}

// ---------- a Chave: inscrição ----------
const form = $('form'), campo = n => form.elements[n];
function sincAceites() {
  for (const [c, ok, caixa] of [['whats', 'aceiteWhats', 'okWhats'], ['email', 'aceiteEmail', 'okEmail']]) {
    const tem = campo(c).value.trim() !== '';
    campo(ok).disabled = !tem; $(caixa).classList.toggle('desl', !tem);
    if (!tem) campo(ok).checked = false;
  }
}
function mascara(e) {
  const d = e.value.replace(/\D/g, '').slice(0, 11);
  e.value = d.length > 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
}
form.addEventListener('input', e => {
  if (e.target.name === 'whats' && e.inputType !== 'deleteContentBackward') mascara(e.target);
  sincAceites(); $('erro').textContent = ''; e.target.removeAttribute('aria-invalid');
});
function valida() {
  const nome = campo('nome').value.trim(), w = campo('whats').value.replace(/\D/g, ''), m = campo('email').value.trim();
  const erro = (msg, e) => { $('erro').textContent = msg; e.setAttribute('aria-invalid', 'true'); e.focus(); return null; };
  if (nome.length < 2) return erro('Conte para a gente como te chamar.', campo('nome'));
  if (!w && !m) return erro('Deixe um WhatsApp ou um e-mail para receber as pistas.', campo('whats'));
  if (w && !/^[1-9]{2}9?\d{8}$/.test(w)) return erro('Confira o WhatsApp: DDD e número.', campo('whats'));
  if (m && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) return erro('Confira o e-mail.', campo('email'));
  const aw = !!w && campo('aceiteWhats').checked, am = !!m && campo('aceiteEmail').checked;
  if (!aw && !am) return erro(w && m ? 'Marque o aceite de pelo menos um canal.' : w ? 'Marque o aceite do WhatsApp para receber as pistas por lá.' : 'Marque o aceite do e-mail para receber as pistas por lá.', campo(w ? 'aceiteWhats' : 'aceiteEmail'));
  if (!campo('maior').checked) return erro('A chave é só para maiores de 18 anos.', campo('maior'));
  const s = serieEm(agora());
  return {   // só vai o canal com aceite marcado
    nome, whatsapp: aw ? '55' + w : '', email: am ? m.toLowerCase() : '',
    aceites: {whatsapp: aw, email: am}, textoAceite: {whatsapp: aw ? $('okWhats').textContent.trim() : '', email: am ? $('okEmail').textContent.trim() : ''},
    maior18: true, quando: form.elements.quando.value || '', serie: s ? s.id : '', fase: faseAtual,
    versaoTexto: CONFIG.versaoTexto, origem, ts: new Date().toISOString(), ...(isNaN(simulada) ? {} : {dataSimulada: new Date(agora()).toISOString()}),
  };
}
async function envia(reg) {
  if (!CONFIG.api) {                                // demonstração: número local, nada sai do aparelho
    await new Promise(r => setTimeout(r, 700));
    const n = (guarda.ler('segredo-demo-n') || 136) + 1; guarda.por('segredo-demo-n', n); return n;
  }
  const r = await fetch(CONFIG.api, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(reg)});
  if (!r.ok) throw new Error('http ' + r.status);
  const j = await r.json();
  if (!j || !Number.isFinite(+j.numero)) throw new Error('resposta sem número');
  return +j.numero;
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  const reg = valida(); if (!reg) return;
  const b = $('bEnviar'), rot = b.textContent; b.disabled = true; b.textContent = 'Forjando sua chave…';
  try {
    const ch = {numero: await envia(reg), serie: reg.serie, quando: Date.now(), demo: !CONFIG.api};
    guarda.por('segredo-chave', ch);
    form.reset(); sincAceites();
    mostraMinha(ch, true);
    aplicaHeroChave(ch);
  } catch { $('erro').textContent = 'Não deu para pegar a chave agora. Confira a internet e tente de novo.'; }
  finally { b.disabled = false; b.textContent = rot; }
});
function aplicaHeroChave(ch) {
  if (faseAtual === 'lista') document.querySelectorAll('#heroAcoes a.bt[href="#chave"], #fimAcoes a.bt[href="#chave"]').forEach(a => a.replaceChildren('Ver minha chave ', nro(ch.numero)));
}

// ---------- tela da chave: número, série e chave girando ----------
const giro = $('giro'), gx = giro.getContext('2d');
const g = {k: null, ini: 0, anima: false, raf: 0, cor: null};
const quica = u => { const n = 7.5625, d = 2.75; return u < 1 / d ? n * u * u : u < 2 / d ? n * (u -= 1.5 / d) * u + .75 : u < 2.5 / d ? n * (u -= 2.25 / d) * u + .9375 : n * (u -= 2.625 / d) * u + .984375; };
function mostraMinha(ch, anima) {
  form.classList.add('oculto'); $('minha').classList.remove('oculto');
  const s = SERIES.find(x => x.id === ch.serie);
  $('serChave').textContent = s ? `Série ${s.nome}` : 'Lista do Village';
  $('serChave').style.color = s ? s.tinta : '#B86E12';
  $('demoChave').classList.toggle('oculto', !ch.demo);
  $('minhaTexto').textContent = 'Guarde este número. As pistas chegam pelo canal que você aceitou. À 00h de 27/11, quem tem a chave entra primeiro.';
  g.k = PX.chave(ch.serie || 'ouro'); g.ini = performance.now() / 1000; g.anima = anima && !reduz;
  if (g.anima) {
    const t0 = performance.now(), passo = ms => { const u = Math.min(1, (ms - t0) / 1200); $('numChave').textContent = pad(Math.round(ch.numero * (1 - (1 - u) ** 3))); if (u < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
    $('minha').scrollIntoView({behavior: 'smooth', block: 'center'});
  } else $('numChave').textContent = pad(ch.numero);
  if (reduz) desenhaGiro(g.ini + 1); else pedeGiro();
}
function desenhaGiro(t) {
  const u = t - g.ini, x = gx, c = g.k.cor;
  x.clearRect(0, 0, 32, 32);
  const y = g.anima && u < .8 ? Math.round(16 - 28 * (1 - quica(u / .8))) : 16 + Math.round(Math.sin(u * 2));
  x.globalAlpha = .16 + .06 * Math.sin(u * 3); circulo(x, 16, 16, 13, c.l); x.globalAlpha = .22; circulo(x, 16, 16, 9, c.h); x.globalAlpha = 1;
  const ang = g.anima ? 1.6 * u + 12 * (1 - Math.exp(-2 * u)) : 1.6 * u;
  PX.giraChave(x, g.k, 16, y, reduz ? 0 : ang);
  for (const [sx, sy, ph] of [[5, 7, 0], [27, 9, 2], [6, 25, 4], [26, 24, 1]]) {
    const a = Math.sin(u * 2.5 + ph); if (a > .3) brilho(x, sx, sy, a > .8 ? 2 : 1, c.l === '#33333E' ? '#F5C400' : c.h);
  }
}
function laçoGiro(ms) {
  g.raf = 0;
  if ($('minha').classList.contains('oculto')) return;
  desenhaGiro(ms / 1000); pedeGiro();
}
function pedeGiro() { if (!g.raf) g.raf = requestAnimationFrame(laçoGiro); }

// ---------- moldura 1080×1920 para os stories: laço de 6 s que vira vídeo, e o quadro 0 vira imagem ----------
const LACO = 6, volta = 2 * Math.PI / LACO;         // tudo que mexe fecha o ciclo em LACO segundos
async function cenaMoldura(ch) {
  try { await Promise.all([document.fonts.load('400 64px "Jersey 10"'), logoImg.decode(), folhaImg.decode()]); } catch {}
  const L = PX.tela(135, 240), x = L.getContext('2d'), K = PX.tela(11, 23), kx = K.getContext('2d');
  const F = fundo(135, 240, 226, .95, [24, 36, 112], [118, 44]), lg = logoPx(70), chv = PX.chave(ch.serie || 'ouro');
  const C = PX.tela(1080, 1920), y = C.getContext('2d'), T = PX.tela(1080, 1920), z = T.getContext('2d');
  const fonte = tam => `400 ${tam * 1.25 | 0}px "Jersey 10", system-ui, sans-serif`;
  const texto = (str, Y, tam, cor) => {                 // str também aceita [[trecho, escala, subida]] para o "nº" sobrescrito
    const partes = (Array.isArray(str) ? str : [[str]]).map(([t, k = 1, dy = 0]) => ({t, dy, f: fonte(tam * k)}));
    let x0 = 540; z.textAlign = 'left';
    for (const q of partes) { z.font = q.f; q.w = z.measureText(q.t).width; x0 -= q.w / 2; }
    const o = Math.max(4, tam / 14 | 0), passos = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o], [0, o * 2]].map(d => [...d, '#2A1606']);
    for (const [a, b, c] of [...passos, [0, 0, cor]]) {
      let x = x0; z.fillStyle = c;
      for (const q of partes) { z.font = q.f; z.fillText(q.t, x + a, Y + b - q.dy); x += q.w; }
    }
  };
  texto('EU TENHO A CHAVE', 600, 84, '#FFF3D6');        // texto fora das faixas que o Instagram cobre (topo e rodapé)
  texto([['N', .55], ['o', .36, 52], [' ' + pad(ch.numero)]], 1372, 170, ch.serie === 'black' ? '#F5C400' : '#FAC775');
  texto('27/11 · 00h', 1478, 64, '#FFF3D6');
  if (ch.demo) texto('DEMONSTRAÇÃO', 1892, 36, '#FF8A7A');
  const folhas = [[18, 10, 1, 0], [108, 100, 3, 1.7], [28, 190, 5, 3.4], [116, 250, 6, 5]];   // x, altura inicial, quadro, fase
  const brilhos = [[37, 92, 0], [98, 104, .25], [94, 150, .5], [40, 146, .75]];
  function quadro(t) {
    t = (t % LACO + LACO) % LACO;
    const s = t % (LACO / 2) / (LACO / 2), pouso = s > .86 && s < .98;   // duas voltas por laço; o baú pula quando a chave para
    x.imageSmoothingEnabled = false; x.drawImage(F.c, 0, 0);
    x.fillStyle = '#FFF8E8';
    for (const e of F.estrelas) if (e.lim < F.vis && e.y < 200) {
      x.globalAlpha = .3 + .7 * (.5 + .5 * Math.sin(e.ph + volta * t * (1 + (e.v | 0))));
      if (e.grande) brilho(x, e.x, e.y, 1, '#FFF8E8'); else x.fillRect(e.x, e.y, 1, 1);
    }
    x.globalAlpha = 1;
    if (lg) x.drawImage(lg, (135 - lg.width) / 2 | 0, 31);
    const bal = Math.sin(volta * t) * 1.4;
    palmeira(x, 10, 226, 44, 1, bal, F.palma); palmeira(x, 126, 226, 36, -1, -bal, F.palma);
    desenhaBau(x, volta * 2 * t / 2.2, 47, 226, {estilo: 'madeira', forca: pouso ? 1.6 : 1, lid: pouso ? (s > .89 && s < .95 ? -2 : -1) : 0});
    const pul = 1 + .08 * Math.sin(volta * 2 * t), ky = 82 + Math.round(Math.sin(volta * 2 * t + 1));
    for (const [r, a] of [[32, .07], [23, .09], [15, .12]]) { x.globalAlpha = a * (pouso ? 1.5 : 1); circulo(x, 67, ky + 34, Math.round(r * pul), '#FAC775'); }
    x.globalAlpha = 1;
    kx.clearRect(0, 0, 11, 23); PX.giraChave(kx, chv, 5.5, 11.5, 2 * Math.PI * suave(.45, .86, s));
    x.drawImage(K, 51, ky, 33, 69);
    for (const [bx, by, f] of brilhos) { const n = Math.round(2.4 * Math.sin(volta * 2 * t + f * 2 * Math.PI)); if (n > 0) brilho(x, bx, by, n, '#FAC775'); }
    if (folhaOk()) for (const [fx, fy, fr, ph] of folhas) {
      const u = (fy + t / LACO * 270) % 270 - 15;
      x.drawImage(folhaImg, (fr + Math.floor(t / LACO * 24)) % 8 * 12, 0, 12, 12, Math.round(fx - 6 + Math.sin(volta * 2 * t + ph) * 4), Math.round(u), 12, 12);
    }
    y.imageSmoothingEnabled = false; y.drawImage(L, 0, 0, 1080, 1920); y.drawImage(T, 0, 0);
  }
  quadro(0);
  return {C, quadro};
}
function gravaMoldura(C) {                          // MediaRecorder do próprio canvas: mp4 onde der (Safari, Chrome novo), senão webm
  const tipo = window.MediaRecorder && C.captureStream && ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  if (!tipo) return null;
  const st = C.captureStream(30), rec = new MediaRecorder(st, {mimeType: tipo, videoBitsPerSecond: 8e6}), partes = [];
  rec.ondataavailable = e => e.data.size && partes.push(e.data);
  const pronto = new Promise(ok => {
    rec.onstop = () => { st.getTracks().forEach(k => k.stop()); ok(rec.cancelado || !partes.length ? null : new Blob(partes, {type: tipo.split(';')[0]})); };
    rec.onerror = () => ok(null);
  });
  rec.start();
  return {rec, pronto, ext: tipo.includes('mp4') ? 'mp4' : 'webm'};
}
const moldura = {chave: '', cena: null, img: null, video: null, raf: 0, grav: null};
const arquivoMoldura = (blob, ext) => new File([blob], `chave-${moldura.chave.split(':')[0]}.${ext}`, {type: blob.type});
const podeEnviar = f => !!(f && navigator.canShare && navigator.canShare({files: [f]}));
function botoesMoldura() {
  const v = moldura.video, gravando = !!moldura.grav, bc = $('bCompartilhar');
  bc.disabled = gravando; bc.textContent = gravando ? 'Preparando vídeo…' : 'Compartilhar';
  bc.classList.toggle('oculto', !gravando && !podeEnviar(v) && !podeEnviar(moldura.img));
  $('bBaixarVideo').classList.toggle('oculto', !v);
  if (v) Object.assign($('bBaixarVideo'), {href: URL.createObjectURL(v), download: v.name});
}
function animaMoldura(ms0) {                        // a prévia é o próprio canvas gravado; com movimento reduzido para no quadro 0 depois da gravação
  const passo = ms => {
    const t = (ms - ms0) / 1000, g = moldura.grav;
    if (g && t >= LACO) { g.rec.stop(); moldura.grav = null; }
    if (reduz && !moldura.grav) { moldura.cena.quadro(0); moldura.raf = 0; return; }
    moldura.cena.quadro(t); moldura.raf = requestAnimationFrame(passo);
  };
  moldura.raf = requestAnimationFrame(passo);
}
$('bMoldura').addEventListener('click', async () => {
  const ch = guarda.ler('segredo-chave'); if (!ch) return;
  const b = $('bMoldura'); b.disabled = true;
  try {
    const id = `${pad(ch.numero)}:${ch.serie}:${!!ch.demo}`;
    if (moldura.chave !== id) {
      Object.assign(moldura, {chave: id, video: null, cena: await cenaMoldura(ch)});
      const png = await new Promise(r => moldura.cena.C.toBlob(r, 'image/png'));
      moldura.img = arquivoMoldura(png, 'png');
      Object.assign($('bBaixar'), {href: URL.createObjectURL(png), download: moldura.img.name});
      $('cvMoldura').replaceWith(Object.assign(moldura.cena.C, {id: 'cvMoldura', role: 'img', ariaLabel: 'Chave girando com o número da sua chave, para os stories'}));
    }
    if (!moldura.video && !moldura.grav) {
      const g = moldura.grav = gravaMoldura(moldura.cena.C);
      if (g) g.pronto.then(v => { if (v) moldura.video = arquivoMoldura(v, g.ext); if (moldura.grav === g) moldura.grav = null; botoesMoldura(); });
    }
    botoesMoldura(); $('dMoldura').showModal(); animaMoldura(performance.now());
  } finally { b.disabled = false; }
});
$('bCompartilhar').addEventListener('click', () => {
  const f = podeEnviar(moldura.video) ? moldura.video : moldura.img;
  navigator.share({files: [f], text: 'Eu tenho a chave do Segredo do Village. ' + urlLimpa() + '?ref=moldura'}).catch(() => {});
});
$('dMoldura').addEventListener('close', () => {
  cancelAnimationFrame(moldura.raf); moldura.raf = 0;
  if (moldura.grav) { moldura.grav.rec.cancelado = true; moldura.grav.rec.stop(); moldura.grav = null; }
});
$('bFechar').addEventListener('click', () => $('dMoldura').close());

// ---------- fotos: chegam em pixel e ficam nítidas; a aérea acompanha a rolagem ----------
const PASSOS = [40, 28, 20, 14, 10, 7, 5, 3, 2, 1];
function pixelaFoto(fig) {                          // desenha a foto em blocos de n px num canvas pequeno que o CSS amplia sem suavizar
  const img = fig.querySelector('img'), cv = fig.querySelector('canvas'), cx = cv.getContext('2d');
  let n0 = 0;
  return (n, forca) => {
    if (n === n0 && !forca) return;
    n0 = img.naturalWidth ? n : 0;                  // sem a foto carregada, nada de canvas vazio: fica a img nativa
    fig.classList.toggle('pxl', n > 1 && n0 > 0);
    if (!n0 || n <= 1) return;
    const w = Math.ceil(fig.clientWidth / n), h = Math.ceil(fig.clientHeight / n), k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k;   // só a proporção: com srcset o naturalWidth não é o tamanho real do arquivo
    Object.assign(cv, {width: w, height: h});
    cx.drawImage(img, (w - dw) * (parseFloat(getComputedStyle(fig).getPropertyValue('--x')) || .5), h - dh, dw, dh);   // cobre e ancora pela base, igual ao object-position
  };
}
if (!reduz && 'IntersectionObserver' in window) {
  const fa = $('aerea'), aerea = pixelaFoto(fa);
  const rola = forca => {                           // nítida quando o centro da foto chega no meio da tela
    const r = fa.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height) * 2.3));
    aerea(PASSOS[Math.round(p * (PASSOS.length - 1))], forca);
  };
  let pedido = 0;
  addEventListener('scroll', () => pedido || (pedido = requestAnimationFrame(() => { pedido = 0; rola(); })), {passive: true});
  addEventListener('resize', () => rola(true));
  fa.querySelector('img').addEventListener('load', () => rola(true));
  rola(true);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const f = e.target.px, img = e.target.querySelector('img');
    const roda = (i = 0) => { f(PASSOS[i]); if (i < PASSOS.length - 1) setTimeout(roda, 110, i + 1); };
    if (img.complete && img.naturalWidth) roda();
    else { img.addEventListener('load', () => roda(), {once: true}); img.addEventListener('error', () => f(1), {once: true}); }
  }), {threshold: .4});
  document.querySelectorAll('.foto').forEach(fig => { fig.px = pixelaFoto(fig); fig.px(PASSOS[0]); io.observe(fig); });
}

// ---------- fim da trilha: o baú com a contagem ----------
const bauFim = $('bauFim'), xBf = bauFim.getContext('2d'), bf = {tremor: -9, prox: 3};
function desenhaBauFim(t) {
  const f = cena.fase;
  if (!reduz && (f === 'esquenta' || f === 'lista') && t > bf.prox) { bf.tremor = t; bf.prox = t + 3.4; }
  const k = (t - bf.tremor) * 14 | 0, [dx, lid] = k >= 0 && k < TREM.length ? TREM[k] : [0, 0];
  xBf.clearRect(0, 0, 96, 100);
  desenhaBau(xBf, t, 28, 74, {estilo: f === 'aberto' || f === 'fechado' ? 'metal' : 'madeira', forca: f === 'fechado' ? 0 : f === 'aberto' ? 1 : .35 + .65 * cena.F.p, dx, lid, aberto: f === 'aberto'});
}
if (reduz && 'IntersectionObserver' in window) {   // sem a trilha, o baú do fim ganha o próprio laço só para o brilho
  let bfVis = false, bfRaf = 0, bfUlt = 0;
  const bfLaco = ms => { bfRaf = 0; if (!bfVis || document.hidden) return; if (ms - bfUlt >= 33) { bfUlt = ms; desenhaBauFim(ms / 1000); } bfRaf = requestAnimationFrame(bfLaco); };
  const bfPede = () => { if (!bfRaf && bfVis) bfRaf = requestAnimationFrame(bfLaco); };
  new IntersectionObserver(([e]) => { bfVis = e.isIntersecting; bfPede(); }).observe(bauFim);
  document.addEventListener('visibilitychange', bfPede);
}

// ---------- trilha: o Bê sai do topo, passa pelo X na aérea e desce estação por estação até o baú ----------
const tr = {pts: [], d: 0, dir: 1, sentido: 1, parado: -9, chegou: -9, naChegada: false, falou: false, falaAte: 0, falaW: 0, u: 2, sb: 2, vh: 0, W: 0, H: 0, fim: 0, m: [], passosY: [], chave: '', sbAtual: 0, falas: [], falaMsg: '', yB: 0, lado: -1, max: 0};
const trilha = document.createElement('div');
trilha.id = 'trilha'; trilha.setAttribute('aria-hidden', 'true');
trilha.innerHTML = '<canvas class="tr-falta"></canvas><canvas class="tr-feita"></canvas>' + ['01', '02', '03', '04', '05', '06'].map(n => `<span class="marco">${n}</span>`).join('') + '<canvas class="xis" width="18" height="18"></canvas>'; 
const trilhaBe = document.createElement('div');     // camada do Bê acima dos selos; a estrada fica embaixo deles
trilhaBe.id = 'trilhaBe'; trilhaBe.setAttribute('aria-hidden', 'true');
trilhaBe.innerHTML = '<canvas class="be" width="40" height="58"></canvas><div id="falaT"></div>';
document.body.append(trilha, trilhaBe);
const [cvFalta, cvFeita] = trilha.children, cvX = trilha.querySelector('.xis'), cvBe = trilhaBe.querySelector('.be'), balaoT = trilhaBe.querySelector('#falaT'), marcos = trilha.querySelectorAll('.marco'), xTb = cvBe.getContext('2d');
const hist = $('historia'), aer = $('aerea'), passos = [...hist.children], estacoes = ['como', 'series', 'chave', 'resort'].map(id => $(id).querySelector('h2'));
document.documentElement.classList.add('trilhado');
hist.classList.remove('rev');
passos.forEach(p => p.classList.add('passo', ...(reduz || Q.has('revela') ? ['vis'] : [])));
if (reduz) { trilha.classList.add('fixa'); trilhaBe.classList.add('fixa'); }

function caminho(pts, raio) {                       // polilinha com cantos arredondados, amostrada a cada ~1 px, com a distância acumulada
  const out = [], add = (x, y) => { const a = out[out.length - 1]; out.push({x, y, d: a ? a.d + Math.hypot(x - a.x, y - a.y) : 0}); };
  const reta = (ax, ay, bx, by) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let i = 1; i <= n; i++) add(ax + (bx - ax) * i / n, ay + (by - ay) * i / n); };
  let [x0, y0] = pts[0]; add(x0, y0);
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i];
    if (i === pts.length - 1) { reta(x0, y0, px, py); break; }
    const [nx, ny] = pts[i + 1], l1 = Math.hypot(px - x0, py - y0), l2 = Math.hypot(nx - px, ny - py), r = Math.min(raio, l1 / 2, l2 / 2);
    const ax = px - (px - x0) / l1 * r, ay = py - (py - y0) / l1 * r, bx = px + (nx - px) / l2 * r, by = py + (ny - py) / l2 * r;
    reta(x0, y0, ax, ay);
    const n = Math.max(2, Math.ceil(r * 1.6));
    for (let k = 1; k <= n; k++) { const s = k / n, q = 1 - s; add(q * q * ax + 2 * q * s * px + s * s * bx, q * q * ay + 2 * q * s * py + s * s * by); }
    x0 = bx; y0 = by;
  }
  return out;
}
function busca(campo, v) {                          // a trilha só desce: y e d crescem juntos
  const p = tr.pts; let a = 0, b = p.length - 1;
  if (v <= p[0][campo]) b = 1; else if (v >= p[b][campo]) a = b - 1;
  else while (b - a > 1) { const m = a + b >> 1; if (p[m][campo] < v) a = m; else b = m; }
  return [a, b, Math.min(1, Math.max(0, (v - p[a][campo]) / ((p[b][campo] - p[a][campo]) || 1)))];
}
const porY = y => { const [a, b, k] = busca('y', y); return tr.pts[a].d + (tr.pts[b].d - tr.pts[a].d) * k; };
function ponto(d) {
  const p = tr.pts, [a, b, k] = busca('d', d), i0 = Math.max(0, a - 8), i1 = Math.min(p.length - 1, b + 8);
  return {x: p[a].x + (p[b].x - p[a].x) * k, y: p[a].y + (p[b].y - p[a].y) * k, tx: (p[i1].x - p[i0].x) / ((p[i1].d - p[i0].d) || 1)};
}

function montaTrilha() {
  if (!cena.W) return;
  const s = cena.s, sy = scrollY, W = document.documentElement.clientWidth, largo = W >= 860, R = e => e.getBoundingClientRect(), Y = r => r.top + sy;
  const rH = R(hero), rS = R(hist), rA = R(aer), rT = R(hist.querySelector('h2'));
  const u = tr.u = tr.sb = largo ? 3 : 2;
  tr.vh = innerHeight; tr.W = W;
  const A = [Math.round(rH.left + cena.beX * s), Math.round(rH.top + sy + cena.chao * s)];
  const fimH = rH.bottom + sy, faixa = Math.round(largo ? rS.right - 42 : rS.left + 42), topoA = Y(rA), hA = rA.height, botA = topoA + hA;
  const foto = largo ? [[.62, .16], [.42, .34], [.5, .5]] : [[.74, .18], [.28, .36], [.62, .52]];
  const [p4, p5, X] = foto.map(([fx, fy]) => [Math.round(W * fx), Math.round(topoA + hA * fy)]);
  const saida = largo ? [[faixa, Math.round(topoA + hA * .72)]] : [[Math.round(W * .86), Math.round(topoA + hA * .66)], [Math.round(W * .86), Math.round(botA - 30)], [faixa, Math.round(botA + 30)]];
  const rF = R(document.querySelector('#resort .fotos')), fts = [...document.querySelectorAll('#resort .foto')].map(R);
  const zz = (largo ? [[.62, .5], [.5, .35], [.5, .65]] : [[.32, .55], [.7, .5], [.22, .5]]).map(([fx, fy], i) => [Math.round(fts[i].left + fts[i].width * fx), Math.round(Y(fts[i]) + fts[i].height * fy)]);
  const rB = R(bauFim), bs = rB.width / 96, cB = Math.round(rB.left + 48.5 * bs), yB = tr.yB = Math.round(Y(rB) + 74 * bs);   // chão do baú do fim
  const lx = zz[2][0], lado = lx < cB ? -1 : 1, para = Math.round(cB + lado * 32.5 * bs), pre = lado < 0 ? Math.min(lx, para - 40) : Math.max(lx, para + 40);
  zz[2][0] = pre;                                   // a descida final fica reta em x: inclinada, a estrada dava um degrau logo abaixo da foto do lago
  tr.pts = caminho([A, [A[0], fimH - 12], [faixa, fimH + 56], [faixa, topoA - 70], p4, p5, X, ...saida, [faixa, Math.round(Y(rF) - 50)], ...zz, [pre, yB], [cB, yB]], 46);
  const total = tr.pts[tr.pts.length - 1].d;
  tr.fim = total - Math.abs(cB - para);             // o Bê para do lado do baú; a estrada termina por baixo dele
  tr.yHist = rS.top + sy;
  tr.H = yB + 40; tr.lado = lado;
  for (const c of [trilha, trilhaBe]) Object.assign(c.style, {width: W + 'px', height: tr.H + 'px'});
  tr.max = document.documentElement.scrollHeight - innerHeight;
  const Wu = Math.ceil(W / u), Hu = Math.ceil(tr.H / u);
  for (const c of [cvFalta, cvFeita]) { Object.assign(c, {width: Wu, height: Hu}); Object.assign(c.style, {width: Wu * u + 'px', height: Hu * u + 'px'}); }
  const mapas = [[topoA, botA], [Y(rF), Y(rF) + rF.height]], us = []; let ult = '';   // sobre as fotos a estrada vira tracejado de mapa
  for (const p of tr.pts) { const ux = Math.round(p.x / u), uy = Math.round(p.y / u), k = ux + ',' + uy; if (k !== ult) { us.push({x: ux, y: uy, d: p.d / u, foto: mapas.some(([a, b]) => p.y >= a && p.y <= b)}); ult = k; } }
  const xF = cvFeita.getContext('2d'), xA = cvFalta.getContext('2d');
  const terra = us.filter(p => !p.foto), mapa = us.filter(p => p.foto);
  for (const p of terra) circulo(xF, p.x, p.y, 4, '#3B2410');            // estrada: contorno escuro, faixa creme, tracejado de ouro
  for (const p of terra) circulo(xF, p.x, p.y, 3, '#FFF3D6');
  xF.fillStyle = '#EF9F27'; for (const p of terra) if (Math.floor(p.d / 3) % 2 === 0) xF.fillRect(p.x, p.y, 1, 1);
  const traco = mapa.filter(p => Math.floor(p.d / 4) % 2 === 0);
  xF.fillStyle = '#3B2410'; for (const p of traco) xF.fillRect(p.x - 2, p.y - 2, 5, 5);
  xF.fillStyle = '#FAC775'; for (const p of traco) xF.fillRect(p.x - 1, p.y - 1, 3, 3);
  const pontos = []; let ultD = -9;                 // o que falta andar: pontinhos
  for (const p of us) if (p.d - ultD >= 7) { pontos.push(p); ultD = p.d; }
  xA.fillStyle = '#3B2410'; for (const p of pontos) xA.fillRect(p.x - 2, p.y - 2, 4, 4);
  xA.fillStyle = '#FFF3D6'; for (const p of pontos) xA.fillRect(p.x - 1, p.y - 1, 2, 2);
  const xX = cvX.getContext('2d'), cruz = [];
  for (let i = 0; i < 14; i++) for (let k = 0; k < 3; k++) cruz.push([1 + i + k, 2 + i], [14 - i + k, 2 + i]);
  xX.clearRect(0, 0, 18, 18);
  xX.fillStyle = '#3B2410'; for (const [i, j] of cruz) xX.fillRect(i - 1, j - 1, 3, 3);
  xX.fillStyle = '#E0483B'; for (const [i, j] of cruz) xX.fillRect(i, j, 1, 1);
  Object.assign(cvX.style, {width: 18 * u + 'px', height: 18 * u + 'px', left: X[0] - 9 * u + 'px', top: X[1] - 9 * u + 'px'});
  const ys = [rT, ...estacoes.map(R)].map(r => Y(r) + r.height / 2);   // marcos: título da história, borda da aérea e um por estação
  ys.splice(1, 0, topoA);
  tr.m = ys.map(porY);
  tr.m.forEach((d, i) => Object.assign(marcos[i].style, {left: Math.round(ponto(d).x) + 'px', top: Math.round(ys[i]) + 'px'}));
  tr.passosY = passos.map(p => p.getBoundingClientRect().top + sy);
  const rC = R(document.querySelector('#chave .cartinha'));
  tr.falas = [[porY(X[1]), 'É aqui?'], [porY(Math.max(X[1] + 80, botA - 120)), 'Ainda não. Vem!'], [porY(Y(rC) - 150), 'Pega a sua chave!']].map(([d, msg]) => ({d, msg, feita: tr.d >= d}));
  tr.ySer = Y(R($('listaSeries')));
  tr.chave = '';
  if (reduz) { marcos.forEach(m => m.classList.add('on')); return; }
  cena.semBe = true;
  trPede();
}

function falaTrilha(msg, t) { tr.falaMsg = msg; balaoT.textContent = msg; tr.falaW = balaoT.offsetWidth; tr.falaAte = t + 2.2; }
let trRaf = 0, trUlt = 0, trVis = true;
function trQuadro(ms) {
  trRaf = 0;
  if (!tr.pts.length || !trVis || document.hidden) return;
  const t = ms / 1000, dt = Math.min(.1, (ms - (trUlt || ms)) / 1000), yAlvo = scrollY + tr.vh * .6;
  trUlt = ms;
  let alvo = porY(yAlvo);
  const zona = tr.vh * .4, falta = tr.max - scrollY, antes = tr.d;   // no último trecho da rolagem ele completa a trilha até o baú
  if (falta < zona) { const d0 = porY(tr.max - zona + tr.vh * .6); alvo = Math.max(alvo, d0 + (tr.fim - d0) * (1 - Math.max(0, falta) / zona)); }
  alvo = Math.min(tr.fim, alvo);
  tr.d += (alvo - tr.d) * Math.min(1, dt * 9);      // segue a rolagem com um leve atraso, para o passo não travar
  if (Math.abs(alvo - tr.d) < .3) tr.d = alvo;
  if (Math.abs(tr.d - antes) > .05) { tr.parado = t; tr.sentido = Math.sign(tr.d - antes); }
  const p = ponto(tr.d), inicio = tr.d < 30, sb = inicio ? cena.s : tr.sb;
  if (!inicio && Math.abs(p.tx) > .25) tr.dir = Math.sign(p.tx) * tr.sentido;
  if (!tr.falou && scrollY > 30) { tr.falou = true; falaTrilha('Vem comigo!', t); }   // fala ainda no topo, antes de sair andando
  if (tr.falaMsg === 'Vem comigo!' && p.y > tr.yHist) tr.falaAte = Math.min(tr.falaAte, t);   // e cala antes de chegar no texto
  for (const f of tr.falas) {                       // falas das estações, só descendo
    if (!f.feita && tr.d >= f.d) { f.feita = true; if (tr.d - f.d < 80) falaTrilha(f.msg, t); }
    else if (f.feita && tr.d < f.d - 120) f.feita = false;
  }
  if (tr.d >= tr.fim - .5 && !tr.naChegada) { tr.naChegada = true; tr.chegou = t; bf.tremor = t; falaTrilha({aberto: 'Abriu!', fechado: 'Fechou!'}[cena.fase] || 'Trancado!', t); }
  if (tr.d < tr.fim - 20) tr.naChegada = false;
  passos.forEach((el, i) => { if (yAlvo + 140 >= tr.passosY[i]) el.classList.add('vis'); });
  marcos.forEach((m, i) => m.classList.toggle('on', tr.d >= tr.m[i] - 4));
  if (yAlvo >= tr.ySer + 60) $('listaSeries').classList.add('gira');   // as quatro chaves giram uma vez, em sequência
  if (Math.abs(scrollY + tr.vh / 2 - tr.yB) < tr.vh) desenhaBauFim(t);
  // estrada feita até os pés do Bê (a faixa inteira); no trecho final, que anda de lado até o baú, o corte é em x
  const b = 4 * tr.u + 1, yL = Math.round(p.y + b), yT = Math.min(yL, tr.yB - 2 - b), xL = Math.round(p.x - tr.lado * b), E = 1e5, chegou = tr.d >= tr.fim - .5;
  const [a, c] = tr.lado < 0 ? [0, xL] : [xL, E], [a2, c2] = tr.lado < 0 ? [xL, E] : [0, xL];
  cvFeita.style.clipPath = chegou ? 'none' : `polygon(0 0,${E}px 0,${E}px ${yT}px,${c}px ${yT}px,${c}px ${yL}px,${a}px ${yL}px,${a}px ${yT}px,0 ${yT}px)`;
  cvFalta.style.clipPath = chegou ? 'inset(100%)' : `polygon(0 ${yL}px,${a2}px ${yL}px,${a2}px ${yT}px,${c2}px ${yT}px,${c2}px ${yL}px,${E}px ${yL}px,${E}px ${E}px,0 ${E}px)`;
  if (atlas) {
    let fr, dy = 0;
    if (tr.d < 2) ({fr, dy} = quadroBe(t));
    else if (t - tr.parado < .25) fr = atlas.animations.run.frames[Math.floor(tr.d / (3.2 * sb)) % 6];
    else if (tr.naChegada && t - tr.chegou < 1.6) fr = quadro('win', t - tr.chegou);
    else fr = quadro('idle', t);
    const tinta = suave(.5, 1, cena.F.p) * .38 * Math.max(0, 1 - tr.d / 150), chave = fr.x + ',' + fr.y + ',' + tinta.toFixed(2);
    if (chave !== tr.chave) {
      tr.chave = chave;
      xTb.clearRect(0, 0, 40, 58);
      xTb.globalAlpha = .3; xTb.fillStyle = '#000000'; xTb.fillRect(12, 56, 16, 1); xTb.globalAlpha = 1;
      xTb.drawImage(sprite, fr.x, fr.y, 40, 58, 0, 0, 40, 58);
      if (tinta) { xTb.globalCompositeOperation = 'source-atop'; xTb.globalAlpha = tinta; xTb.fillStyle = '#1B1430'; xTb.fillRect(0, 0, 40, 56); xTb.globalAlpha = 1; xTb.globalCompositeOperation = 'source-over'; }
    }
    if (sb !== tr.sbAtual) { tr.sbAtual = sb; Object.assign(cvBe.style, {width: 40 * sb + 'px', height: 58 * sb + 'px'}); }
    cvBe.style.transform = `translate(${Math.round(p.x - 20 * sb)}px,${Math.round(p.y - 56 * sb + dy * sb)}px) scaleX(${tr.dir})`;
  }
  const fala = t < tr.falaAte;
  balaoT.classList.toggle('on', fala);
  if (fala) {                                       // o balão fica dentro da tela; a ponta continua apontando para o Bê
    const cx = Math.min(tr.W - tr.falaW / 2 - 6, Math.max(tr.falaW / 2 + 6, p.x));
    Object.assign(balaoT.style, {left: cx + 'px', top: p.y - 50 * sb - 12 + 'px'});
    balaoT.style.setProperty('--rabo', Math.round(Math.min(tr.falaW - 23, Math.max(17, tr.falaW / 2 - 3 + p.x - cx))) + 'px');
  }
  trPede();
}
function trPede() { if (!trRaf && !reduz && tr.pts.length) trRaf = requestAnimationFrame(trQuadro); }
let trRz = 0, trLarg = 0;
const agendaTrilha = () => { clearTimeout(trRz); trRz = setTimeout(montaTrilha, 200); };
if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { trVis = e.isIntersecting; trPede(); }).observe(trilha);
document.addEventListener('visibilitychange', trPede);
new ResizeObserver(agendaTrilha).observe(document.querySelector('main'));
new ResizeObserver(agendaTrilha).observe(hero);
addEventListener('resize', () => { const w = document.documentElement.clientWidth; if (w !== trLarg) { trLarg = w; agendaTrilha(); } });
addEventListener('load', agendaTrilha);
document.fonts && document.fonts.ready.then(agendaTrilha);

// ---------- revelar seções ao rolar ----------
const revs = document.querySelectorAll('.rev');
if (reduz || Q.has('revela') || !('IntersectionObserver' in window)) revs.forEach(r => r.classList.add('vis'));
else { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), {threshold: .12}); revs.forEach(r => io.observe(r)); }

// ---------- links que dependem do Gustavo ----------
for (const id of ['linkPolitica', 'linkPolitica2', 'linkPolitica3']) { const a = $(id); if (CONFIG.politica) a.href = CONFIG.politica; else { a.removeAttribute('target'); a.title = 'link a definir'; } }
if (CONFIG.instagram) $('linkInsta').href = CONFIG.instagram; else { $('linkInsta').removeAttribute('href'); $('linkInsta').textContent = 'Instagram (a definir)'; }
if (!CONFIG.api) $('demoForm').classList.remove('oculto');
const avisos = [!CONFIG.api && 'PRÉVIA · não divulgar · lista demo', !isNaN(simulada) && 'data: ' + dataBR(simulada)].filter(Boolean);
if (avisos.length) { $('faixa').textContent = avisos.join(' · '); $('faixa').classList.remove('oculto'); document.body.style.paddingTop = $('faixa').offsetHeight + 'px'; }

// ---------- início ----------
icones();
dimensiona();
aplicaFase();
let rz = 0;
new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(dimensiona, 120); }).observe(hero);
setInterval(() => {
  const t = agora();
  if (faseEm(t) !== faseAtual) aplicaFase();
  else if (relogio.alvo || relogio.fim) tique(t);
  if (Math.abs(progresso(t) - cena.F.p) > .003) montaFundo();
}, 1000);
pede();
