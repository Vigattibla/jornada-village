// bloco dourado em pixel art com o ArUco 4x4 no miolo (usado pelo jogo e pelo kit de impressão)
// grade 44×54 px; miolo = 24 px (6 células de 4 px) com 1 célula de papel em volta; 42 mm de miolo => 1,75 mm/px
const BLOCO = {w: 44, h: 54, miolo: {x: 10, y: 10, s: 24}, mm: 42};
function blocoSVG(dic, id, n) {
  const code = dic.codeList[id], r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const ESC = '#633806', OURO = '#EF9F27', LUZ = '#FAC775', SOMBRA = '#B86E12', TINTA = '#1B1525', PAPEL = '#FFF8E8';
  let s = r(0, 0, 44, 54, ESC) + r(1, 1, 42, 52, OURO) + r(1, 1, 42, 1, LUZ) + r(1, 1, 1, 52, LUZ) + r(1, 52, 42, 1, SOMBRA) + r(42, 1, 1, 52, SOMBRA);
  for (const [x, y] of [[3, 3], [39, 3], [3, 49], [39, 49]]) s += r(x, y, 2, 2, ESC) + r(x, y, 1, 1, LUZ);   // rebites
  s += r(5, 5, 34, 34, ESC) + r(6, 6, 32, 32, PAPEL) + r(10, 10, 24, 24, TINTA);                          // zona quieta + miolo
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (code[y * 4 + x] === '1') s += r(14 + 4 * x, 14 + 4 * y, 4, 4, PAPEL);
  const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
  const d = DIG[n % 10];                           // número do bloco (ordem na parede) e seta do sentido
  for (let i = 0; i < 15; i++) if (d[i] === '1') s += r(16 + 2 * (i % 3), 41 + 2 * (i / 3 | 0), 2, 2, ESC);
  for (let i = 0; i < 4; i++) s += r(25 + i, 42 + i, 1, 7 - 2 * i, ESC);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 54" width="44" height="54" shape-rendering="crispEdges">${s}</svg>`;
}
