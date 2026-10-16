// quadro do segredo: 3×3 placas douradas; 8 com ArUco 4x4 (ids 200..207) e a porta no meio (usado pela página e pelo kit)
// grade 144×144 px: moldura de 6 px + 3×3 células de 44 px; cada miolo = 24 px (6 módulos de 4 px) com 1 módulo de papel em volta
const QUADRO = {lado: 144, borda: 6, cel: 44, base: 200, mm: 280};
const Q_COR = {ESC: '#633806', OURO: '#EF9F27', LUZ: '#FAC775', SOMBRA: '#B86E12', TINTA: '#1B1525', PAPEL: '#FFF8E8', MADEIRA: '#8A4B1E', VEIO: '#5C2B24', PEDRA: '#B79B6D', PEDRA2: '#79614F'};
function quadroCelulas() {                         // em ordem de leitura, pulando o centro (porta)
  const r = [];
  for (let l = 0; l < 3; l++) for (let c = 0; c < 3; c++) if (l !== 1 || c !== 1) r.push({id: QUADRO.base + r.length, x0: QUADRO.borda + c * QUADRO.cel, y0: QUADRO.borda + l * QUADRO.cel});
  return r;
}
function quadroCantos(id) {                        // quadrado preto do marcador em px do quadro, horário a partir do topo-esquerdo
  const k = quadroCelulas().find(c => c.id === id), x = k.x0 + 10, y = k.y0 + 10;
  return [{x, y}, {x: x + 24, y}, {x: x + 24, y: y + 24}, {x, y: y + 24}];
}
function portaArco(r, x0, x1) {                    // colunas do arco: [x, topo]; centro do arco em (22, 20) da célula
  const c = [];
  for (let x = x0; x < x1; x++) { const d = Math.abs(x + .5 - 22); c.push([x, d < r ? Math.ceil(20 - Math.sqrt(r * r - d * d)) : 20]); }
  return c;
}
function portaPainel(ox, oy) {                     // folha de madeira da porta (sem moldura), em px da célula deslocada
  const {MADEIRA, VEIO, ESC, OURO, LUZ} = Q_COR, r = (x, y, w, h, c) => `<rect x="${ox + x}" y="${oy + y}" width="${w}" height="${h}" fill="${c}"/>`;
  let s = '';
  for (const [x, t] of portaArco(12, 10, 34)) s += r(x, t, 1, 40 - t, (x - 10) % 5 === 4 ? VEIO : MADEIRA);
  s += r(10, 15, 24, 2, ESC) + r(10, 33, 24, 2, ESC);                                          // ferragens
  for (const x of [12, 31]) s += r(x, 15, 1, 1, LUZ) + r(x, 33, 1, 1, LUZ);
  s += r(20, 23, 4, 4, ESC) + r(21, 24, 2, 2, OURO) + r(21, 27, 2, 3, ESC);                     // fechadura
  return s;
}
function quadroSVG(dic) {
  const {ESC, OURO, LUZ, SOMBRA, TINTA, PAPEL, PEDRA, PEDRA2} = Q_COR, L = QUADRO.lado, r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  let s = r(0, 0, L, L, ESC) + r(1, 1, L - 2, L - 2, OURO) + r(1, 1, L - 2, 1, LUZ) + r(1, 1, 1, L - 2, LUZ) + r(1, L - 2, L - 2, 1, SOMBRA) + r(L - 2, 1, 1, L - 2, SOMBRA);
  s += r(5, 5, L - 10, L - 10, ESC);
  for (const [x, y] of [[L / 2 - 2, 1], [L / 2 - 2, L - 5], [1, L / 2 - 2], [L - 5, L / 2 - 2]]) s += r(x, y, 4, 4, ESC) + r(x + 1, y + 1, 2, 2, LUZ);   // gemas
  const placa = (x0, y0) => r(x0 + 1, y0 + 1, 42, 42, OURO) + r(x0 + 1, y0 + 1, 42, 1, LUZ) + r(x0 + 1, y0 + 1, 1, 42, LUZ) + r(x0 + 1, y0 + 42, 42, 1, SOMBRA) + r(x0 + 42, y0 + 1, 1, 42, SOMBRA);
  for (const {id, x0, y0} of quadroCelulas()) {
    const code = dic.codeList[id];
    s += placa(x0, y0) + r(x0 + 5, y0 + 5, 34, 34, ESC) + r(x0 + 6, y0 + 6, 32, 32, PAPEL) + r(x0 + 10, y0 + 10, 24, 24, TINTA);
    for (const [x, y] of [[2, 2], [40, 2], [2, 40], [40, 40]]) s += r(x0 + x, y0 + y, 2, 2, ESC) + r(x0 + x, y0 + y, 1, 1, LUZ);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (code[y * 4 + x] === '1') s += r(x0 + 14 + 4 * x, y0 + 14 + 4 * y, 4, 4, PAPEL);
  }
  const x0 = QUADRO.borda + QUADRO.cel, y0 = x0;   // porta no centro: pedra, arco escuro, folha de madeira e degrau
  s += placa(x0, y0) + r(x0 + 4, y0 + 4, 36, 36, PEDRA);
  for (const [x, y] of [[6, 8], [32, 12], [7, 30], [34, 28], [12, 5], [27, 6]]) s += r(x0 + x, y0 + y, 3, 1, PEDRA2);
  for (const [x, t] of portaArco(14, 8, 36)) s += r(x0 + x, y0 + t, 1, 41 - t, ESC);
  s += portaPainel(x0, y0) + r(x0 + 6, y0 + 40, 32, 2, PEDRA2) + r(x0 + 6, y0 + 40, 32, 1, PEDRA);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${L}" width="${L}" height="${L}" shape-rendering="crispEdges">${s}</svg>`;
}
const portaSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44" shape-rendering="crispEdges">${portaPainel(0, 0)}</svg>`;
