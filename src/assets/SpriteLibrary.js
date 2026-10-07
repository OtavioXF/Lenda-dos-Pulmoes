// ============================================================
// SpriteLibrary — Carrega os PNGs da pasta (ASSETS) e recorta
// todos os sprites usados no mapa, player e decorações.
// TODAS as coordenadas foram medidas nos arquivos originais.
// ============================================================

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar asset: ${src}`));
    img.src = src;
  });
}

function cut(img, sx, sy, sw, sh) {
  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}


// ---------- Helpers de sprite (tudo em escala INTEIRA = pixel art sem distorção) ----------
function scaleNN(src, k) {
  const c = document.createElement('canvas');
  c.width = src.width * k;
  c.height = src.height * k;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

function flipH(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.translate(src.width, 0);
  x.scale(-1, 1);
  x.drawImage(src, 0, 0);
  return c;
}

function recolor(src, fn) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] === 0) continue;
    const [r, g, b] = fn(d.data[i], d.data[i + 1], d.data[i + 2]);
    d.data[i] = Math.min(255, r);
    d.data[i + 1] = Math.min(255, g);
    d.data[i + 2] = Math.min(255, b);
  }
  x.putImageData(d, 0, 0);
  return c;
}

// monta um sprite composto a partir de pedaços de uma spritesheet
// parts: [sheet, sx, sy, sw, sh, dx, dy]
function compose(w, h, parts) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  parts.forEach(([img, sx, sy, sw, sh, dx, dy]) => x.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh));
  return c;
}


// ---------- Geração de tiles de chão LIMPOS ----------
// Os tiles originais da spritesheet são pedaços de "autotile" (bordas, cantos
// transparentes, sombras) — repetidos pelo mapa causavam o efeito quebrado.
// Aqui usamos só a cor sólida medida no sprite + detalhes pontuais determinísticos.
function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function solidTile(base, specks, seed, count) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 16, 16);
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(r() * 15) + 0;
    const y = Math.floor(r() * 15) + 0;
    ctx.fillStyle = specks[Math.floor(r() * specks.length)];
    ctx.fillRect(x, y, 1, 1);
  }
  return c;
}

// pedra: remove o verde dos cantos (vira rejunte cinza) para o piso ficar contínuo
function cleanStone(img, sx, sy) {
  const c = cut(img, sx, sy, 16, 16);
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, 16, 16);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];
    if (g > r + 25 && g > b + 25) { // pixel verde (grama do canto)
      d.data[i] = 96; d.data[i + 1] = 106; d.data[i + 2] = 120; d.data[i + 3] = 255;
    }
  }
  ctx.putImageData(d, 0, 0);
  return c;
}

export class SpriteLibrary {
  static async load() {
    const [terrains, structures, animals, playerSheet,
      house1, house2, house4, house5, house6, house7] = await Promise.all([
      loadImage('/assets/spr_terrains.png'),
      loadImage('/assets/spr_structures_exterior.png'),
      loadImage('/assets/spr_animals.png'),
      loadImage('/assets/player_anims.png'),
      loadImage('/assets/buildings/ob_house_01.png'),
      loadImage('/assets/buildings/ob_house_02.png'),
      loadImage('/assets/buildings/ob_house_04.png'),
      loadImage('/assets/buildings/ob_house_05.png'),
      loadImage('/assets/buildings/ob-house_06.png'),
      loadImage('/assets/buildings/ob_house_07.png')
    ]);

    const lib = {};

    // ===================== TILES DE TERRENO (16x16) =====================
    lib.tiles = {
      // grama: cor sólida medida (116,200,87) + 3 variações discretas
      grass: [
        solidTile('rgb(116,200,87)', [], 1, 0),
        solidTile('rgb(116,200,87)', ['rgb(139,223,110)', 'rgb(96,178,70)'], 11, 3),
        solidTile('rgb(116,200,87)', ['rgb(139,223,110)'], 23, 2),
        solidTile('rgb(116,200,87)', ['rgb(96,178,70)', 'rgb(139,223,110)'], 37, 4)
      ],
      // terra clara (estradas / pista)
      dirt: [
        solidTile('rgb(194,133,105)', [], 2, 0),
        solidTile('rgb(194,133,105)', ['rgb(176,116,90)', 'rgb(208,148,120)'], 5, 4),
        solidTile('rgb(194,133,105)', ['rgb(176,116,90)'], 9, 2)
      ],
      // terra escura (arena)
      dirtDark: [
        solidTile('rgb(116,76,58)', [], 3, 0),
        solidTile('rgb(116,76,58)', ['rgb(97,60,44)', 'rgb(132,90,70)'], 7, 4),
        solidTile('rgb(116,76,58)', ['rgb(97,60,44)'], 13, 2)
      ],
      stone: cleanStone(terrains, 576, 16),   // pedra (praça/arena)
      stone2: cleanStone(terrains, 544, 48),  // pedra variante
      water: [
        cut(terrains, 176, 304, 16, 16),
        cut(terrains, 192, 304, 16, 16)
      ]
    };

    // ===================== DECORAÇÕES DE TERRENO =====================
    lib.env = {
      stump: cut(terrains, 455, 242, 18, 13),      // toco
      rock1: cut(terrains, 272, 272, 16, 16),      // pedra cinza (os recortes antigos eram pedaços de árvore)
      rock2: cut(terrains, 305, 273, 15, 14),      // pedra cinza 2
      // tiles de grama com flores/arbustos (16x16 — usados na camada baixa)
      flowerRed: cut(terrains, 304, 192, 16, 16),
      flowerPink: cut(terrains, 320, 192, 16, 16),
      bushTeal: cut(terrains, 304, 208, 16, 16),
      tuftStone: cut(terrains, 328, 208, 16, 16),
      stones: cut(terrains, 352, 208, 16, 16)
    };

    // ===================== ÁRVORES (sprite COMPLETO, sem pedaços de autotile) =====================
    // Os recortes antigos eram pedaços de autotile (daí as árvores em "L"/cortadas).
    // Aqui usamos a árvore redonda inteira (28x32) com variações: espelhada, escura e grande.
    const treeBase = cut(terrains, 450, 192, 28, 32);
    const treeDark = recolor(treeBase, (r, g, b) => [r * 0.80, g * 0.87, b * 0.93]);
    lib.trees = {
      A: scaleNN(treeBase, 2),
      B: scaleNN(flipH(treeBase), 2),
      C: scaleNN(treeDark, 2),
      D: scaleNN(flipH(treeDark), 2),
      L: scaleNN(treeBase, 3),
      LD: scaleNN(flipH(treeDark), 3)
    };

    // ===================== ESTRUTURAS EXTERIORES =====================
    lib.structures = {
      fencePost: cut(structures, 20, 16, 8, 12),
      fenceH: cut(structures, 36, 16, 40, 16),     // cerca horizontal (desenhada em 2x = 80px)
      lampOn: cut(structures, 304, 16, 16, 48),    // poste de luz alto aceso
      lampOff: cut(structures, 272, 16, 16, 48),   // poste alto apagado
      lampShort: cut(structures, 320, 32, 16, 32), // poste baixo aceso
      bridgeV: cut(structures, 144, 6, 48, 67),    // ponte vertical
      bridgeH: cut(structures, 199, 16, 66, 48),   // ponte horizontal
      pot1: cut(structures, 80, 160, 16, 16),      // vaso prateado
      pot2: cut(structures, 96, 160, 16, 16),
      sign: cut(structures, 112, 112, 16, 16),     // placa de madeira
      mailbox: cut(structures, 128, 160, 16, 17),
      // sacos reais (os recortes antigos pegavam um toco/peça errada)
      sack: cut(structures, 160, 160, 16, 16),
      sack2: cut(structures, 176, 160, 16, 16),
      sack3: cut(structures, 192, 160, 16, 16),
      cart: cut(structures, 223, 129, 44, 33),     // carrinho de mão
      // barraca de feira montada com caixas longas + vasos + sacos + arbusto
      stall: compose(64, 32, [
        [structures, 176, 112, 32, 16, 0, 16],
        [structures, 176, 128, 32, 16, 32, 16],
        [structures, 80, 160, 16, 16, 4, 2],
        [structures, 96, 160, 16, 16, 20, 2],
        [structures, 176, 160, 16, 16, 38, 2],
        [structures, 176, 144, 16, 13, 48, 5]
      ]),
      // pilha de caixas e barril
      crates: compose(48, 32, [
        [structures, 144, 112, 16, 16, 0, 16],
        [structures, 160, 112, 16, 16, 16, 16],
        [structures, 144, 160, 16, 16, 32, 16],
        [structures, 160, 112, 16, 16, 8, 2]
      ]),
      // área de lenha: bloco de cortar + lenha + tora
      logs: compose(48, 16, [
        [structures, 80, 144, 16, 16, 0, 0],
        [structures, 96, 144, 16, 16, 16, 0],
        [structures, 112, 144, 16, 16, 32, 0]
      ]),
      bush1: cut(structures, 176, 144, 16, 13),
      bush2: cut(structures, 192, 144, 16, 13)
    };

    // ===================== CASAS (bbox real medido) =====================
    // { img, sx, sy, sw, sh } — recorte justo do sprite
    lib.buildings = [
      { id: 'house1', img: house1, sx: 68, sy: 83, sw: 122, sh: 97 },
      { id: 'house2', img: house2, sx: 21, sy: 69, sw: 166, sh: 111 },
      { id: 'house4', img: house4, sx: 69, sy: 36, sw: 120, sh: 158 }, // torre/clínica
      { id: 'house5', img: house5, sx: 65, sy: 75, sw: 128, sh: 114 }, // telhado rosa
      { id: 'house6', img: house6, sx: 96, sy: 89, sw: 84, sh: 78 },
      { id: 'house7', img: house7, sx: 22, sy: 26, sw: 90, sh: 79 }
    ];

    // ===================== PLAYER (player_anims.png 768x128) =====================
    // Células de 32x64, começando em x=32, espaçadas de 96px.
    // Bloco 1 (y=0): 6 frames de caminhada. Bloco 2 (y=64): 8 frames de corrida/ação.
    lib.player = {
      img: playerSheet,
      cellW: 32,
      cellH: 64,
      feetY: 40,          // pés do personagem dentro da célula
      walkFrames: [0, 1, 2, 3, 4, 5].map(i => ({ sx: 32 + 96 * i, sy: 0 })),
      runFrames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ sx: 32 + 96 * i, sy: 64 })),
      idleFrame: { sx: 32 + 96 * 1, sy: 0 }
    };

    // ===================== ANIMAIS (galinhas) =====================
    lib.chicken = [0, 1, 2, 3].map(i => cut(animals, 16 + i * 16, 64, 16, 16));

    return lib;
  }
}
