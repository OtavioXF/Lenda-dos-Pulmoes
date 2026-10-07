// ============================================================
// Map — Mapas construídos 100% com os assets da pasta (ASSETS).
// Camadas: 1) chão  2) decor baixa  3) objetos físicos  4) copas
// Objetos altos (árvores, casas, postes...) são ordenados por Y com o
// jogador: quem está "atrás" é desenhado depois (por cima), quem está
// "na frente" é desenhado antes. Isso elimina o bug de árvore/casa
// cobrindo o personagem quando ele está na frente.
// ============================================================

const T = 32; // tamanho do tile no jogo (sprites de 16px exibidos em 2x)

// hash determinístico para variação de tiles
function hash(tx, ty) {
  return Math.abs((tx * 73856093) ^ (ty * 19349663)) % 100;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// tamanho (em px do sprite original) de cada casa da SpriteLibrary.buildings
const HOUSE_SIZES = [[122, 97], [166, 111], [120, 158], [128, 114], [84, 78], [90, 79]];

// nomes antigos de árvore → variante nova (sprites completos). 'legacyTall' = antigas árvores altas
const TREE_ALIAS = {
  treeBig1: { v: 'C', legacy: 28 },
  treeBig2: { v: 'B', legacy: 28 },
  treeRound: { v: 'A', legacy: 0 },
  treeA: { v: 'A', legacy: 0 }, treeB: { v: 'B', legacy: 0 },
  treeC: { v: 'C', legacy: 0 }, treeD: { v: 'D', legacy: 0 },
  treeL: { v: 'L', legacy: 0 }, treeLD: { v: 'LD', legacy: 0 }
};

// [sprite, largura, altura] de cada decoração (sempre escala inteira 2x)
const DECO = {
  fenceH: [lib => lib.structures.fenceH, 80, 32],
  fencePost: [lib => lib.structures.fencePost, 16, 24],
  lampOn: [lib => lib.structures.lampOn, 32, 96],
  stall: [lib => lib.structures.stall, 128, 64],
  crates: [lib => lib.structures.crates, 96, 64],
  pot1: [lib => lib.structures.pot1, 32, 32],
  pot2: [lib => lib.structures.pot2, 32, 32],
  cart: [lib => lib.structures.cart, 88, 66],
  sack: [lib => lib.structures.sack, 32, 32],
  sack2: [lib => lib.structures.sack2, 32, 32],
  sack3: [lib => lib.structures.sack3, 32, 32],
  logs: [lib => lib.structures.logs, 96, 32],
  rock1: [lib => lib.env.rock1, 32, 32],
  rock2: [lib => lib.env.rock2, 30, 28],
  stump: [lib => lib.env.stump, 36, 26],
  bush1: [lib => lib.structures.bush1, 32, 26],
  bush2: [lib => lib.structures.bush2, 32, 26]
};

// decorações que cobrem o jogador dependendo da posição (ordenadas por Y)
const SORTED_TYPES = new Set(['tree', 'lampOn', 'stall', 'crates', 'cart']);

export class Map {
  constructor(id, name, width, height) {
    this.id = id;
    this.name = name;
    this.width = width;
    this.height = height;

    this.colliders = [];
    this.interactives = [];
    this.npcs = [];
    this.decorations = []; // { type, x, y, variant? }
    this.houseSlots = [];  // { idx, x, y, scale }
    this.flowerTiles = []; // { tile, tx, ty }
    this.noDecorRects = []; // áreas onde NÃO nascem flores/arbustos
    this.flowerCfg = null;
    this.dirtTiles = new Set();   // "tx,ty"
    this.dirtDarkTiles = new Set();
    this.stoneTiles = new Set();
    this.waterTiles = new Set();
    this.trackTiles = new Set();  // pista de corrida
    this.dummy = null;            // manequim de treino (preenchido pelo Game)
    this.sortables = [];          // objetos altos ordenados por Y

    this.initMapData();
    this.finalize();
  }

  // liga o manequim ao mapa (e garante UM único colisor, mesmo ao voltar de outro mapa)
  attachDummy(dummy) {
    this.dummy = dummy;
    if (dummy && !this._dummyCollider) {
      this._dummyCollider = { x: dummy.x - 12, y: dummy.y - 14, w: 26, h: 18 };
      this.colliders.push(this._dummyCollider);
    }
  }

  addFenceH(x, y, lengthPx) {
    // sprite da cerca = 40x16 → 80x32 em 2x; segmentos de 80px
    for (let fx = x; fx < x + lengthPx; fx += 80) {
      this.decorations.push({ type: 'fenceH', x: fx, y });
    }
    this.colliders.push({ x, y: y + 8, w: lengthPx, h: 10 });
  }

  addTree(type, x, y) {
    const alias = TREE_ALIAS[type] || TREE_ALIAS.treeA;
    const v = alias.v;
    const big = v === 'L' || v === 'LD';
    const w = big ? 84 : 56, h = big ? 96 : 64;
    y += alias.legacy; // árvores antigas eram mais altas: mantém a mesma base
    this.decorations.push({ type: 'tree', variant: v, x, y, w, h });
    // tronco fica na base do sprite
    if (big) this.colliders.push({ x: x + 30, y: y + 72, w: 24, h: 18 });
    else this.colliders.push({ x: x + 20, y: y + 48, w: 16, h: 12 });
  }

  addHouse(idx, x, y, scale) {
    const [sw, sh] = HOUSE_SIZES[idx];
    const w = sw * scale, h = sh * scale;
    this.houseSlots.push({ idx, x, y, scale, w, h });
    // colisor cobre a base da casa
    this.colliders.push({ x: x + w * 0.08, y: y + h * 0.45, w: w * 0.84, h: h * 0.55 });
    this.noDecorRects.push({ x: x - 8, y: y - 8, w: w + 16, h: h + 16 });
  }

  initMapData() {
    if (this.id === 'village') this.buildVillage();
    else if (this.id === 'trail') this.buildTrail();
    else if (this.id === 'guardianArena') this.buildArena();
  }

  // ------------------------------------------------------------
  // Pós-processamento: flores só em grama livre + ordenação por Y
  // ------------------------------------------------------------
  isTileOccupied(tx, ty) {
    const key = `${tx},${ty}`;
    if (this.dirtTiles.has(key) || this.trackTiles.has(key) || this.stoneTiles.has(key) || this.waterTiles.has(key)) return true;
    const r = { x: tx * T - 4, y: ty * T - 4, w: T + 8, h: T + 8 };
    if (this.colliders.some(c => rectsOverlap(r, c))) return true;
    if (this.noDecorRects.some(c => rectsOverlap(r, c))) return true;
    return false;
  }

  finalize() {
    // Flores/arbustos NÃO nascem mais em cima de estrada, lago, pedra, casas, árvores ou objetos
    if (this.flowerCfg) {
      const { limit, kinds } = this.flowerCfg;
      for (let tx = 1; tx < this.width / T - 1; tx++) {
        for (let ty = 1; ty < this.height / T - 1; ty++) {
          const h = hash(tx, ty);
          if (h < limit && !this.isTileOccupied(tx, ty)) {
            this.flowerTiles.push({ tile: kinds[h % kinds.length], tx, ty });
          }
        }
      }
    }

    // objetos altos: ordenados por base (Y) para cobrir/descobrir o jogador corretamente
    this.decorations.forEach(d => {
      if (!SORTED_TYPES.has(d.type)) return;
      const h = d.type === 'tree' ? d.h : DECO[d.type][2];
      this.sortables.push({ kind: 'deco', d, baseY: d.y + h });
    });
    this.houseSlots.forEach(slot => {
      this.sortables.push({ kind: 'house', slot, baseY: slot.y + slot.h });
    });
    this.sortables.sort((a, b) => a.baseY - b.baseY);
  }

  // ============================================================
  // VILA DA RESPIRAÇÃO — com área de treino, casas, lago e praça
  // ============================================================
  buildVillage() {
    const W = this.width, H = this.height;

    // ---------- Estradas de terra ----------
    // estrada principal horizontal (y 352..416)
    for (let tx = 0; tx < W / T; tx++) {
      this.dirtTiles.add(`${tx},11`);
      this.dirtTiles.add(`${tx},12`);
    }
    // estrada vertical até a área de treino (x 640..704)
    for (let ty = 11; ty < 18; ty++) {
      this.dirtTiles.add(`20,${ty}`);
      this.dirtTiles.add(`21,${ty}`);
    }
    // praça de pedra em frente à casa central (sem "calombos" de terra soltos na estrada)
    for (let ty = 8; ty <= 10; ty++) {
      for (let tx = 14; tx <= 19; tx++) {
        this.stoneTiles.add(`${tx},${ty}`);
      }
    }

    // ---------- ÁREA DE TREINO (sul) ----------
    // cerca delimitando x 480..960, y 560..800 com abertura no topo (x 640..704)
    this.addFenceH(480, 560, 160);           // topo esquerdo (2 segmentos)
    this.addFenceH(704, 560, 240);           // topo direito (3 segmentos)
    this.addFenceH(480, 792, 480);           // base (6 segmentos)
    for (let fy = 600; fy < 792; fy += 24) { // laterais
      this.decorations.push({ type: 'fencePost', x: 480, y: fy });
      this.decorations.push({ type: 'fencePost', x: 944, y: fy });
    }
    this.colliders.push({ x: 478, y: 600, w: 10, h: 192 });
    this.colliders.push({ x: 946, y: 600, w: 10, h: 192 });
    this.noDecorRects.push({ x: 470, y: 550, w: 500, h: 270 });

    // piso do pátio de treino: terra contínua (sem "ilhas" de grama quadradas)
    for (let ty = 18; ty <= 24; ty++) {
      for (let tx = 15; tx <= 29; tx++) {
        this.dirtTiles.add(`${tx},${ty}`);
      }
    }

    // pista de corrida oval dentro da área de treino
    const cx = 720, cy = 690, rx = 175, ry = 78;
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      for (let th = -1; th <= 1; th++) {
        const px = cx + Math.cos(a) * (rx + th * 16);
        const py = cy + Math.sin(a) * (ry + th * 16);
        this.trackTiles.add(`${Math.floor(px / T)},${Math.floor(py / T)}`);
      }
    }
    // piso central de terra onde fica o manequim
    for (let ty = 20; ty <= 22; ty++) {
      for (let tx = 20; tx <= 23; tx++) {
        this.dirtTiles.add(`${tx},${ty}`);
      }
    }

    // decorações da área de treino (todas em escala inteira 2x)
    this.decorations.push({ type: 'logs', x: 520, y: 604 });      // bloco de cortar + lenha
    this.colliders.push({ x: 524, y: 622, w: 88, h: 14 });
    this.decorations.push({ type: 'sack', x: 496, y: 664 });
    this.decorations.push({ type: 'sack2', x: 524, y: 676 });
    this.colliders.push({ x: 498, y: 684, w: 28, h: 12 });
    this.colliders.push({ x: 526, y: 696, w: 28, h: 12 });
    this.decorations.push({ type: 'cart', x: 850, y: 615 });
    this.colliders.push({ x: 854, y: 640, w: 80, h: 34 });
    this.decorations.push({ type: 'crates', x: 496, y: 724 });
    this.colliders.push({ x: 502, y: 752, w: 84, h: 32 });

    // placa da área de treino
    this.interactives.push({
      type: 'sign', x: 616, y: 520,
      title: 'Área de Treino',
      text: '🏋️ ÁREA DE TREINO: Bata no MANEQUIM com [J] para ganhar FORÇA e aumentar seu dano! CORRA pela pista ou pelo mapa segurando [SHIFT] para ganhar STAMINA MÁXIMA!'
    });

    // ---------- Lago (sudoeste) ----------
    for (let ty = 19; ty <= 23; ty++) {
      for (let tx = 2; tx <= 6; tx++) {
        if ((tx === 2 || tx === 6) && (ty === 19 || ty === 23)) continue; // cantos arredondados
        this.waterTiles.add(`${tx},${ty}`);
      }
    }
    this.colliders.push({ x: 64, y: 608, w: 160, h: 160 });
    this.decorations.push({ type: 'rock1', x: 52, y: 592 });
    this.decorations.push({ type: 'rock2', x: 228, y: 600 });
    this.decorations.push({ type: 'rock1', x: 228, y: 740 });

    // ---------- Casas (escala 1.5x/2x — padrão de pixel regular) ----------
    this.addHouse(1, 60, 120, 1.5);    // casa grande dupla
    this.addHouse(0, 390, 140, 1.5);   // casa simples
    this.addHouse(2, 680, 60, 1.5);    // torre (clínica da Dra. Alveola)
    this.addHouse(3, 960, 130, 1.5);   // casa de telhado rosa
    this.addHouse(5, 1240, 132, 2);    // casinha pequena

    // ---------- Feira (barraca montada, fora das casas) ----------
    this.decorations.push({ type: 'stall', x: 466, y: 436 });
    this.colliders.push({ x: 470, y: 468, w: 120, h: 28 });
    this.noDecorRects.push({ x: 456, y: 426, w: 150, h: 90 });
    this.decorations.push({ type: 'pot1', x: 652, y: 314 });
    this.decorations.push({ type: 'pot2', x: 690, y: 320 });

    // ---------- Postes de luz ao longo da estrada ----------
    [180, 460, 760, 1060, 1330].forEach(lx => {
      this.decorations.push({ type: 'lampOn', x: lx, y: 288 });
      this.colliders.push({ x: lx + 11, y: 372, w: 10, h: 10 });
    });

    // ---------- Árvores (sprites completos) ----------
    const trees = [
      ['treeBig1', 60, 440], ['treeBig2', 250, 470], ['treeRound', 330, 500],
      ['treeBig2', 1080, 460], ['treeBig1', 1180, 500], ['treeRound', 1300, 470],
      ['treeBig1', 1000, 560], ['treeBig2', 1130, 620], ['treeRound', 1050, 700],
      ['treeBig1', 260, 640], ['treeBig2', 340, 700], ['treeRound', 120, 780],
      ['treeBig2', 1380, 600], ['treeBig1', 1330, 720]
    ];
    trees.forEach(([tp, x, y]) => this.addTree(tp, x, y));
    this.decorations.push({ type: 'stump', x: 380, y: 560 });
    this.decorations.push({ type: 'stump', x: 1150, y: 560 });

    // ---------- Flores e arbustos (camada baixa, só em grama livre) ----------
    this.flowerCfg = { limit: 6, kinds: ['flowerRed', 'flowerPink', 'bushTeal', 'tuftStone', 'stones'] };

    // ---------- NPCs ----------
    this.npcs.push({
      id: 'alveola', name: 'Dra. Alveola', x: 430, y: 330, srcX: 0, portrait: '👩‍⚕️',
      dialogue: [
        { speaker: 'Dra. Alveola', text: 'Olá, bravo jovem! Bem-vindo à Vila da Respiração! Eu sou a Dra. Alveola, especialista em doenças respiratórias como a ASMA.', portrait: '👩‍⚕️' },
        { speaker: 'Dra. Alveola', text: 'Sua Reserva Respiratória é preciosa! Pressione [Q] para usar o Inalador — ele recupera 100% da Reserva em 1 segundo, e você pode continuar andando!', portrait: '👩‍⚕️' },
        { speaker: 'Dra. Alveola', text: 'Derrote os Guardiões no CAMINHO DOS GUARDIÕES e cada um revelará conhecimentos valiosos sobre a asma, além de melhorias para você!', portrait: '👩‍⚕️' }
      ]
    });
    this.npcs.push({
      id: 'bronko', name: 'Scholar Bronko', x: 780, y: 330, srcX: 64, portrait: '👨‍🏫',
      dialogue: [
        { speaker: 'Scholar Bronko', text: 'Saudações! Sabia que os Brônquios formam uma árvore com mais de 23 níveis de ramificações antes de chegar aos Alvéolos?', portrait: '👨‍🏫' },
        { speaker: 'Scholar Bronko', text: 'Na asma, essas vias aéreas ficam inflamadas e estreitas. Leia os livros espalhados pela vila para aprender mais!', portrait: '👨‍🏫' }
      ]
    });
    this.npcs.push({
      id: 'treinador', name: 'Treinador Fôlego', x: 560, y: 660, srcX: 32, portrait: '🏋️',
      dialogue: [
        { speaker: 'Treinador Fôlego', text: 'E aí, campeão! Quer ficar mais forte? BATA no manequim de treino com [J]! A cada 10 golpes sua FORÇA aumenta!', portrait: '🏋️' },
        { speaker: 'Treinador Fôlego', text: 'E para ganhar fôlego, CORRA! Segure [SHIFT] e corra pela pista ou por todo o mapa. A distância acumulada aumenta sua STAMINA MÁXIMA!', portrait: '🏋️' },
        { speaker: 'Treinador Fôlego', text: 'Treinar o corpo é como tratar a asma: exercício regular e controlado fortalece a respiração. Mas sempre com orientação, hein!', portrait: '🏋️' }
      ]
    });
    this.npcs.push({
      id: 'traqueu', name: 'Mestre Traqueu', x: 1300, y: 380, srcX: 32, portrait: '🧙‍♂️',
      dialogue: [
        { speaker: 'Mestre Traqueu', text: 'A estrada a leste leva ao Caminho da Traqueia e ao Salão do Guardião Traqueon!', portrait: '🧙‍♂️' },
        { speaker: 'Mestre Traqueu', text: 'Ou, se preferir, toque no TOTEM DOS GUARDIÕES aqui ao lado para abrir o Caminho dos Guardiões e escolher qualquer Boss!', portrait: '🧙‍♂️' },
        { speaker: 'Mestre Traqueu', text: 'Use [J] para ataque rápido, [K] para ataque forte, [L] para esquiva e [Q] para o Inalador! Boa sorte, jovem!', portrait: '🧙‍♂️' }
      ]
    });

    // ---------- Totem dos Guardiões (abre a aba de Bosses) ----------
    this.interactives.push({
      type: 'bossGate', x: 1380, y: 430,
      title: 'Totem dos Guardiões'
    });

    // ---------- Livros e baús (fora da copa das árvores) ----------
    this.interactives.push({
      type: 'book', x: 300, y: 470,
      title: 'Anatomia Respiratória - Vol. 1',
      text: 'O ar entra pelo NARIZ, onde é aquecido, umedecido e filtrado. Depois segue pela FARINGE e LARINGE em direção à Traqueia, Brônquios e Alvéolos.'
    });
    this.interactives.push({
      type: 'book', x: 1240, y: 470,
      title: 'Asma: O Básico',
      text: 'A ASMA é uma inflamação crônica das vias aéreas. Os sintomas incluem falta de ar, chiado no peito, tosse e aperto torácico — geralmente piores à noite.'
    });
    this.interactives.push({
      type: 'chest', x: 150, y: 520, w: 32, h: 32, opened: false,
      rewardText: 'Você encontrou o ELIXIR PULMONAR! Sua Vida foi restaurada ao máximo!'
    });
    this.interactives.push({
      type: 'chest', x: 1250, y: 660, w: 32, h: 32, opened: false,
      rewardText: 'Você encontrou ERVAS MEDICINAIS! +5 HP Máximo permanentemente!'
    });
    this.interactives.forEach(i => {
      this.noDecorRects.push({ x: i.x - 10, y: i.y - 10, w: 52, h: 52 });
    });
    this.npcs.forEach(n => {
      this.noDecorRects.push({ x: n.x - 10, y: n.y - 10, w: 52, h: 52 });
    });

    // ---------- Limites do mapa ----------
    this.colliders.push({ x: 0, y: 0, w: W, h: 40 });
    this.colliders.push({ x: 0, y: 0, w: 40, h: H });
    this.colliders.push({ x: 0, y: H - 30, w: W, h: 30 });
    // borda leste com abertura na estrada (y 340..430)
    this.colliders.push({ x: W - 8, y: 0, w: 8, h: 340 });
    this.colliders.push({ x: W - 8, y: 430, w: 8, h: H - 430 });
  }

  // ============================================================
  // CAMINHO DA TRAQUEIA — trilha estreita entre árvores
  // ============================================================
  buildTrail() {
    const W = this.width, H = this.height;

    // trilha de terra sinuosa
    for (let tx = 0; tx < W / T; tx++) {
      const center = 10 + Math.round(Math.sin(tx * 0.35) * 2);
      this.dirtTiles.add(`${tx},${center}`);
      this.dirtTiles.add(`${tx},${center + 1}`);
    }

    // mata fechada ao norte e ao sul
    for (let i = 0; i < 14; i++) {
      const x = 30 + i * 68;
      this.addTree(i % 2 ? 'treeBig1' : 'treeBig2', x, 60 + (i % 3) * 30);
      this.addTree(i % 2 ? 'treeRound' : 'treeBig1', x + 20, 480 + (i % 3) * 30);
    }

    // pedras e troncos
    this.decorations.push({ type: 'rock1', x: 200, y: 240 });
    this.decorations.push({ type: 'rock2', x: 500, y: 420 });
    this.decorations.push({ type: 'logs', x: 640, y: 214 });
    this.colliders.push({ x: 644, y: 232, w: 88, h: 14 });
    this.decorations.push({ type: 'stump', x: 350, y: 430 });

    this.flowerCfg = { limit: 5, kinds: ['flowerRed', 'flowerPink', 'tuftStone'] };

    this.interactives.push({
      type: 'sign', x: 150, y: 300,
      title: 'Placa de Sinalização',
      text: '➡️ SALÃO DA RESPIRAÇÃO logo adiante. O Guardião Traqueon domina as correntes de ar da Traqueia. Derrotá-lo revela conhecimentos sobre a ASMA!'
    });
    this.interactives.forEach(i => {
      this.noDecorRects.push({ x: i.x - 10, y: i.y - 10, w: 52, h: 52 });
    });

    // limites norte e sul (mata)
    this.colliders.push({ x: 0, y: 0, w: W, h: 150 });
    this.colliders.push({ x: 0, y: H - 130, w: W, h: 130 });
  }

  // ============================================================
  // ARENA DOS GUARDIÕES
  // ============================================================
  buildArena() {
    const W = this.width, H = this.height;

    // piso central de pedra (anel)
    const cx = W / 2, cy = H / 2;
    for (let ty = 0; ty < H / T; ty++) {
      for (let tx = 0; tx < W / T; tx++) {
        const d = Math.hypot(tx * T + 16 - cx, ty * T + 16 - cy);
        if (d < 150) this.stoneTiles.add(`${tx},${ty}`);
      }
    }

    // postes de luz nos cantos
    [[110, 110], [W - 142, 110], [110, H - 142], [W - 142, H - 142]].forEach(([x, y]) => {
      this.decorations.push({ type: 'lampOn', x, y });
      this.colliders.push({ x: x + 11, y: y + 84, w: 10, h: 10 });
    });

    // cercas decorativas nas bordas internas (múltiplos de 80px)
    this.addFenceH(100, 70, 160);
    this.addFenceH(W - 260, 70, 160);
    this.addFenceH(100, H - 90, 160);
    this.addFenceH(W - 260, H - 90, 160);

    // paredes da arena
    this.colliders.push({ x: 0, y: 0, w: W, h: 60 });
    this.colliders.push({ x: 0, y: 0, w: 60, h: H });
    this.colliders.push({ x: W - 60, y: 0, w: 60, h: H });
    this.colliders.push({ x: 0, y: H - 60, w: W, h: 60 });
  }

  // ============================================================
  // CAMADA 1 — CHÃO
  // ============================================================
  drawLayer1_Ground(ctx, lib, offsetX, offsetY, viewportW, viewportH) {
    // coordenadas SEMPRE inteiras → sem frestas/tremida entre tiles
    offsetX = Math.round(offsetX);
    offsetY = Math.round(offsetY);
    ctx.imageSmoothingEnabled = false;

    const startX = Math.max(0, Math.floor(offsetX / T));
    const startY = Math.max(0, Math.floor(offsetY / T));
    const endX = Math.min(Math.ceil(this.width / T), Math.ceil((offsetX + viewportW) / T) + 1);
    const endY = Math.min(Math.ceil(this.height / T), Math.ceil((offsetY + viewportH) / T) + 1);
    const waterFrame = Math.floor(Date.now() / 500) % 2;
    const isArena = this.id === 'guardianArena';

    const isPath = (k) => this.dirtTiles.has(k) || this.trackTiles.has(k) || this.stoneTiles.has(k);

    // fora do mapa: escuridão (pintado ANTES, para nunca cobrir o chão)
    ctx.fillStyle = '#101c10';
    ctx.fillRect(0, 0, viewportW, viewportH);

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const key = `${tx},${ty}`;
        const dx = tx * T - offsetX;
        const dy = ty * T - offsetY;
        const h = hash(tx, ty);

        // base (grama ou terra escura da arena) com variação discreta
        let base;
        if (isArena) {
          base = lib.tiles.dirtDark[h < 60 ? 0 : (h < 85 ? 1 : 2)];
        } else {
          base = lib.tiles.grass[h < 55 ? 0 : (h < 75 ? 1 : (h < 90 ? 2 : 3))];
        }
        ctx.drawImage(base, dx, dy, T, T);

        if (this.waterTiles.has(key)) {
          ctx.drawImage(lib.tiles.water[(waterFrame + tx + ty) % 2], dx, dy, T, T);
          const nN = !this.waterTiles.has(`${tx},${ty - 1}`);
          const nS = !this.waterTiles.has(`${tx},${ty + 1}`);
          const nW = !this.waterTiles.has(`${tx - 1},${ty}`);
          const nE = !this.waterTiles.has(`${tx + 1},${ty}`);
          // espuma clara interna
          ctx.fillStyle = 'rgba(200,236,255,0.45)';
          if (nN) ctx.fillRect(dx, dy + 3, T, 2);
          if (nS) ctx.fillRect(dx, dy + T - 5, T, 2);
          if (nW) ctx.fillRect(dx + 3, dy, 2, T);
          if (nE) ctx.fillRect(dx + T - 5, dy, 2, T);
          // margem escura onde encosta na grama
          ctx.fillStyle = 'rgba(20,60,110,0.55)';
          if (nN) ctx.fillRect(dx, dy, T, 3);
          if (nS) ctx.fillRect(dx, dy + T - 3, T, 3);
          if (nW) ctx.fillRect(dx, dy, 3, T);
          if (nE) ctx.fillRect(dx + T - 3, dy, 3, T);
        } else if (this.stoneTiles.has(key)) {
          ctx.drawImage((tx + ty) % 5 === 0 ? lib.tiles.stone2 : lib.tiles.stone, dx, dy, T, T);
        } else if (this.trackTiles.has(key) || this.dirtTiles.has(key)) {
          const dirt = lib.tiles.dirt[h < 65 ? 0 : (h < 88 ? 1 : 2)];
          ctx.drawImage(dirt, dx, dy, T, T);
          if (this.trackTiles.has(key) && (tx + ty) % 4 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(dx + 13, dy + 13, 6, 6);
          }
          // contorno suave nas bordas do caminho (onde encosta na grama)
          ctx.fillStyle = 'rgba(95,55,35,0.35)';
          if (!isPath(`${tx},${ty - 1}`)) ctx.fillRect(dx, dy, T, 2);
          if (!isPath(`${tx},${ty + 1}`)) ctx.fillRect(dx, dy + T - 2, T, 2);
          if (!isPath(`${tx - 1},${ty}`)) ctx.fillRect(dx, dy, 2, T);
          if (!isPath(`${tx + 1},${ty}`)) ctx.fillRect(dx + T - 2, dy, 2, T);
        }
      }
    }
  }

  // ============================================================
  // CAMADA 2 — DECORAÇÃO BAIXA (flores, sob os pés)
  // ============================================================
  drawLayer2_LowDecor(ctx, lib, offsetX, offsetY) {
    this.flowerTiles.forEach(f => {
      const img = lib.env[f.tile];
      if (img) ctx.drawImage(img, f.tx * T - Math.round(offsetX), f.ty * T - Math.round(offsetY), T, T);
    });
  }

  // desenha uma decoração (tudo em escala inteira → sem pixels distorcidos)
  drawDeco(ctx, lib, d, offsetX, offsetY) {
    const px = Math.floor(d.x - offsetX);
    const py = Math.floor(d.y - offsetY);
    if (d.type === 'tree') {
      ctx.drawImage(lib.trees[d.variant], px, py);
      return;
    }
    const e = DECO[d.type];
    if (e) ctx.drawImage(e[0](lib), px, py, e[1], e[2]);
  }

  drawSortable(ctx, lib, o, offsetX, offsetY) {
    if (o.kind === 'house') {
      const slot = o.slot;
      const def = lib.buildings[slot.idx];
      ctx.drawImage(def.img, def.sx, def.sy, def.sw, def.sh,
        Math.floor(slot.x - offsetX), Math.floor(slot.y - offsetY), slot.w, slot.h);
    } else {
      this.drawDeco(ctx, lib, o.d, offsetX, offsetY);
    }
  }

  // ============================================================
  // CAMADA 3 — OBJETOS FÍSICOS (tudo que fica ATRÁS/ao lado do jogador)
  // sortY = Y dos pés do jogador. Objetos altos cuja base está acima
  // dos pés do jogador são desenhados aqui (antes do jogador).
  // ============================================================
  drawLayer3_PhysicalObjects(ctx, lib, offsetX, offsetY, sortY = Infinity) {
    offsetX = Math.round(offsetX);
    offsetY = Math.round(offsetY);

    // Decorações baixas (cercas, pedras, tocos, vasos, sacos, lenha...)
    this.decorations.forEach(d => {
      if (SORTED_TYPES.has(d.type)) return;
      this.drawDeco(ctx, lib, d, offsetX, offsetY);
    });

    // brilho dos postes acesos (no chão, antes dos objetos altos)
    this.decorations.forEach(d => {
      if (d.type !== 'lampOn') return;
      const px = Math.floor(d.x - offsetX);
      const py = Math.floor(d.y - offsetY);
      const grad = ctx.createRadialGradient(px + 16, py + 24, 2, px + 16, py + 24, 52);
      grad.addColorStop(0, 'rgba(251,191,36,0.30)');
      grad.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(px - 40, py - 30, 112, 112);
    });

    // Objetos altos que ficam atrás do jogador (casas, árvores, postes, barraca...)
    this.sortables.forEach(o => {
      if (o.baseY <= sortY) this.drawSortable(ctx, lib, o, offsetX, offsetY);
    });

    // Manequim de treino
    if (this.dummy) this.dummy.draw(ctx, lib, offsetX, offsetY);

    // NPCs (sprites gerados — não existem NPCs nos assets)
    this.npcs.forEach(npc => {
      const px = Math.floor(npc.x - offsetX);
      const py = Math.floor(npc.y - offsetY);
      const bob = Math.round(Math.sin(Date.now() / 600 + npc.x) * 2);
      ctx.drawImage(lib.npcs, npc.srcX, 0, 32, 32, px, py + bob, 32, 32);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, px + 17, py - 3 + bob);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText(npc.name, px + 16, py - 4 + bob);
      ctx.textAlign = 'start';
    });

    // Interativos
    this.interactives.forEach(item => {
      const px = Math.floor(item.x - offsetX);
      const py = Math.floor(item.y - offsetY);

      if (item.type === 'chest') {
        const srcX = item.opened ? 32 : 0;
        ctx.drawImage(lib.environmentChest, srcX, 0, 32, 32, px, py, 32, 32);
        if (!item.opened) {
          const sparkle = Math.sin(Date.now() / 300) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(251,191,36,${sparkle * 0.6})`;
          ctx.beginPath(); ctx.arc(px + 16, py - 4, 4, 0, Math.PI * 2); ctx.fill();
        }
      } else if (item.type === 'book') {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px, py, 18, 14);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 2, py + 1, 14, 12);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 8, py, 2, 14);
        const float = Math.sin(Date.now() / 500) * 3;
        ctx.font = '12px sans-serif';
        ctx.fillText('📖', px + 2, py - 4 + float);
      } else if (item.type === 'sign') {
        ctx.drawImage(lib.structures.sign, px, py, 32, 32);
      } else if (item.type === 'bossGate') {
        // Totem dos Guardiões: poste apagado + runa flutuante
        ctx.drawImage(lib.structures.lampOff, px - 8, py - 52, 32, 96);
        const float = Math.sin(Date.now() / 400) * 4;
        const grad = ctx.createRadialGradient(px + 8, py - 20, 4, px + 8, py - 20, 50);
        grad.addColorStop(0, 'rgba(244,63,94,0.35)');
        grad.addColorStop(1, 'rgba(244,63,94,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(px - 44, py - 72, 104, 104);
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️', px + 8, py - 56 + float);
        ctx.fillStyle = '#fecdd3';
        ctx.font = 'bold 9px "Outfit", sans-serif';
        ctx.fillText('TOTEM DOS GUARDIÕES', px + 8, py + 24);
        ctx.textAlign = 'start';
      }
    });
  }

  // ============================================================
  // CAMADA 4 — objetos altos que ficam NA FRENTE do jogador
  // (copas das árvores, telhados, postes...) — por cima do jogador
  // ============================================================
  drawLayer4_HighDecor(ctx, lib, offsetX, offsetY, sortY = Infinity) {
    offsetX = Math.round(offsetX);
    offsetY = Math.round(offsetY);
    this.sortables.forEach(o => {
      if (o.baseY > sortY) this.drawSortable(ctx, lib, o, offsetX, offsetY);
    });
  }
}
