import { Input } from '../engine/Input.js';
import { AudioEngine } from '../engine/AudioEngine.js';
import { Camera } from '../engine/Camera.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { AssetGenerator } from '../assets/AssetGenerator.js';
import { SpriteLibrary } from '../assets/SpriteLibrary.js';
import { Player } from './Player.js';
import { Map } from './Map.js';
import { Boss } from './Bosses.js';
import { DialogueSystem } from './DialogueSystem.js';
import { Almanac } from './Almanac.js';
import { TrainingDummy } from './TrainingDummy.js';
import { ASTHMA_REWARDS } from './AsthmaRewards.js';

const BOSS_LIST = [
  { id: 'traqueon', name: 'Traqueon', concept: 'Traqueia', icon: '🌬️', hp: 250, desc: 'Mestre do Fluxo e rajadas da Traqueia.' },
  { id: 'bronkar', name: 'Bronkar', concept: 'Brônquios', icon: '🌿', hp: 320, desc: 'Ataques ramificados e múltiplas ondas de ar.' },
  { id: 'bronquius', name: 'Bronquius', concept: 'Bronquíolos', icon: '⚡', hp: 400, desc: 'Alta velocidade e rajadas densas de agulhas de ar.' },
  { id: 'alveor', name: 'Alveor', concept: 'Alvéolos', icon: '🫧', hp: 480, desc: 'Névoas de O2 e nuvens tóxicas de CO2.' },
  { id: 'diafragon', name: 'Diafragon', concept: 'Diafragma', icon: '🫀', hp: 550, desc: 'Ondas de choque verticais e ritmo de ventilação.' },
  { id: 'guardiaoFinal', name: 'Guardião Final', concept: 'Mestre dos Pulmões', icon: '👑', hp: 700, desc: 'Combinação suprema de todos os 5 Guardiões!' }
];

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false; // pixel art nítido (imageRendering não existe no contexto 2D)

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Engine Modules
    this.input = new Input();
    this.audio = new AudioEngine();
    this.camera = new Camera(1024, 576);
    this.particleSystem = new ParticleSystem();
    this.assetGen = new AssetGenerator();
    this.assets = null;
    this.dialogue = new DialogueSystem();
    this.almanac = new Almanac();

    // Game Mode & State
    this.mode = 'WORLD';
    this.state = 'TITLE'; // 'TITLE', 'WORLD', 'BOSS_INTRO', 'BOSS_BATTLE', 'VICTORY', 'DEFEAT', 'PAUSE'

    // Entity Instances
    this.player = new Player(300, 300);
    this.currentMap = new Map('village', 'Vila da Respiração', 1472, 864);
    this.currentBoss = null;
    this.dummy = null;

    // Progressão
    this.defeatedBosses = new Set();
    this.chickens = [];

    // HUD Elements
    this.hpBarFill = document.getElementById('hp-bar-fill');
    this.hpText = document.getElementById('hp-text');
    this.staminaBarFill = document.getElementById('stamina-bar-fill');
    this.staminaText = document.getElementById('stamina-text');
    this.objectiveText = document.getElementById('objective-text');
    this.inhalerStatusText = document.getElementById('inhaler-status-text');
    this.inhalerPrompt = document.getElementById('inhaler-active-prompt');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.interactionText = document.getElementById('interaction-text');
    this.locationTag = document.getElementById('location-name');
    this.statStrength = document.getElementById('stat-strength');
    this.statStamina = document.getElementById('stat-stamina');

    // Boss Cutscene / HP UI
    this.bossIntroOverlay = document.getElementById('boss-intro-overlay');
    this.bossIntroName = document.getElementById('boss-intro-name');
    this.bossIntroDesc = document.getElementById('boss-intro-desc');
    this.bossHpContainer = document.getElementById('boss-hp-container');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossPhaseLabel = document.getElementById('boss-phase-label');

    this.mainObjective = 'Fale com a Dra. Alveola na Vila da Respiração.';
    this.cutsceneTimer = 0;
    this.bossSelectReturn = 'title';

    this.lastTime = 0;
  }

  async init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Carrega os assets REAIS da pasta (ASSETS) + sprites gerados (NPCs e Bosses)
    const lib = await SpriteLibrary.load();
    const generated = this.assetGen.generateAll();
    lib.npcs = generated.npcs;
    lib.bosses = generated.bosses;
    lib.environmentChest = generated.environment.chest;
    this.assets = lib;

    this.setupUIListeners();
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // redimensionar o canvas reseta o contexto: reativa o pixel art nítido
    this.ctx.imageSmoothingEnabled = false;
    this.camera.viewportWidth = this.canvas.width;
    this.camera.viewportHeight = this.canvas.height;
  }

  setupUIListeners() {
    document.getElementById('btn-start-world').addEventListener('click', () => {
      this.mode = 'WORLD';
      this.startGuidedWorld();
    });

    document.getElementById('btn-start-bosses').addEventListener('click', () => {
      this.bossSelectReturn = 'title';
      this.showBossSelection();
    });

    document.getElementById('btn-open-almanac').addEventListener('click', () => this.almanac.show());
    document.getElementById('btn-pause-almanac').addEventListener('click', () => this.almanac.show());
    document.getElementById('btn-open-controls').addEventListener('click', () => {
      document.getElementById('controls-screen').classList.remove('hidden');
    });
    document.getElementById('btn-close-controls').addEventListener('click', () => {
      document.getElementById('controls-screen').classList.add('hidden');
    });

    document.getElementById('btn-back-from-bosses').addEventListener('click', () => {
      document.getElementById('boss-select-screen').classList.add('hidden');
      if (this.bossSelectReturn === 'world') {
        document.getElementById('hud-overlay').classList.remove('hidden');
        this.state = 'WORLD';
      } else {
        document.getElementById('title-screen').classList.remove('hidden');
      }
    });

    // Botão da aba de Bosses no HUD
    document.getElementById('btn-hud-bosses').addEventListener('click', () => {
      this.bossSelectReturn = 'world';
      this.state = 'PAUSE';
      this.showBossSelection();
    });

    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-quit-main-menu').addEventListener('click', () => this.returnToTitle());
    document.getElementById('btn-toggle-sound').addEventListener('click', (e) => {
      const enabled = this.audio.toggleSound();
      e.currentTarget.innerText = `🔊 SOM / MÚSICA: ${enabled ? 'LIGADO' : 'DESLIGADO'}`;
    });

    document.getElementById('btn-victory-continue').addEventListener('click', () => {
      this.bossSelectReturn = 'title';
      this.showBossSelection();
    });
    document.getElementById('btn-victory-world').addEventListener('click', () => this.startGuidedWorld());
    document.getElementById('btn-retry').addEventListener('click', () => {
      if (this.currentBoss) this.startBossBattle(this.currentBoss.id);
      else this.startGuidedWorld();
    });
    document.getElementById('btn-defeat-world').addEventListener('click', () => this.startGuidedWorld());

    document.getElementById('inhaler-hud-btn').addEventListener('click', () => {
      this.player.useInhaler(this.audio, this.particleSystem);
    });
  }

  // ------------------------------------------------------------
  // Troca de mapa SEGURA: limpa tudo que "vazava" entre mapas
  // (partículas do boss, tremor de câmera, estados do jogador,
  // câmera com a posição do mapa anterior, estado do canvas).
  // ------------------------------------------------------------
  enterMap(map, px, py) {
    this.currentMap = map;
    this.camera.setMapSize(map.width, map.height);
    this.player.x = px;
    this.player.y = py;
    this.player.resetTransient();
    this.particleSystem.particles.length = 0;
    this.camera.snapTo(this.player.x, this.player.y);
    this.resetCanvasState();
  }

  resetCanvasState() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.shadowBlur = 0;
    c.shadowColor = 'transparent';
    c.filter = 'none';
    c.textAlign = 'start';
    c.textBaseline = 'alphabetic';
    c.lineWidth = 1;
    c.setLineDash([]);
    c.imageSmoothingEnabled = false;
  }

  startGuidedWorld() {
    this.hideAllScreens();
    document.getElementById('hud-overlay').classList.remove('hidden');
    // Manequim de treino no centro da área de treino
    this.dummy = new TrainingDummy(700, 700);
    const village = new Map('village', 'Vila da Respiração', 1472, 864);
    village.attachDummy(this.dummy);
    this.enterMap(village, 700, 470);

    // Galinhas da vila (assets spr_animals.png)
    this.chickens = [
      { x: 300, y: 620, baseX: 300, baseY: 620, phase: 0, frame: 0 },
      { x: 1150, y: 520, baseX: 1150, baseY: 520, phase: 2, frame: 0 },
      { x: 560, y: 528, baseX: 560, baseY: 528, phase: 4, frame: 0 }
    ];

    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.currentBoss = null;

    this.mainObjective = this.defeatedBosses.size < 6
      ? 'Explore a vila, treine na Área de Treino e desafie os Guardiões (Totem a leste)!'
      : 'Você derrotou todos os Guardiões! Explore livremente.';

    this.state = 'WORLD';
    this.mode = 'WORLD';
    this.audio.playBgm('village');
  }

  showBossSelection() {
    this.hideAllScreens();
    const grid = document.getElementById('boss-grid-list');
    grid.innerHTML = '';

    BOSS_LIST.forEach(b => {
      const defeated = this.defeatedBosses.has(b.id);
      const reward = ASTHMA_REWARDS[b.id];
      const card = document.createElement('div');
      card.className = 'boss-card-item' + (defeated ? ' defeated' : '');
      card.innerHTML = `
        <div class="boss-card-header">
          <span class="boss-card-icon">${b.icon}</span>
          <div>
            <div class="boss-card-title">${b.name} ${defeated ? '<span class="defeated-tag">✔ DERROTADO</span>' : ''}</div>
            <div class="boss-card-concept">Conceito: ${b.concept}</div>
          </div>
        </div>
        <div class="boss-card-desc">${b.desc}</div>
        <div class="boss-card-reward">🎁 Recompensa: <strong>${reward.melhoria.texto}</strong><br>📖 Revela: "${reward.titulo}"</div>
        <button class="btn-primary" style="padding: 8px; font-size: 12px; margin-top: 6px;">⚔️ ${defeated ? 'LUTAR NOVAMENTE' : 'DESAFIAR GUARDIÃO'}</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        this.mode = 'BOSS_RUSH';
        this.startBossBattle(b.id);
      });
      grid.appendChild(card);
    });

    document.getElementById('boss-select-screen').classList.remove('hidden');
  }

  startBossBattle(bossId) {
    this.hideAllScreens();
    document.getElementById('hud-overlay').classList.remove('hidden');

    this.enterMap(new Map('guardianArena', 'Arena dos Guardiões', 800, 600), 400, 450);
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;

    const info = BOSS_LIST.find(b => b.id === bossId) || BOSS_LIST[0];
    this.currentBoss = new Boss(bossId, info.name, info.concept, info.hp, 360, 150);

    this.state = 'BOSS_INTRO';
    this.cutsceneTimer = 0;

    this.bossIntroName.innerText = info.name.toUpperCase();
    this.bossIntroDesc.innerText = `Guardião: ${info.concept} — derrote-o para aprender sobre a asma e ganhar: ${ASTHMA_REWARDS[bossId].melhoria.texto}`;
    this.bossIntroOverlay.classList.remove('hidden');
    this.bossHpContainer.classList.add('hidden');

    this.audio.playBgm('boss');
  }

  hideAllScreens() {
    document.querySelectorAll('.screen-overlay').forEach(s => s.classList.add('hidden'));
    document.getElementById('hud-overlay').classList.add('hidden');
    this.bossIntroOverlay.classList.add('hidden');
    this.bossHpContainer.classList.add('hidden');
  }

  resumeGame() {
    document.getElementById('pause-screen').classList.add('hidden');
    this.state = (this.currentBoss && this.currentBoss.state !== 'DEFEATED') ? 'BOSS_BATTLE' : 'WORLD';
  }

  returnToTitle() {
    this.hideAllScreens();
    this.audio.stopBgm();
    this.state = 'TITLE';
    document.getElementById('title-screen').classList.remove('hidden');
  }

  // GAME LOOP
  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.input.update();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.input.isJustPressed(['Escape', 'KeyP'])) {
      if (this.state === 'WORLD' || this.state === 'BOSS_BATTLE') {
        this.state = 'PAUSE';
        document.getElementById('pause-screen').classList.remove('hidden');
        return;
      } else if (this.state === 'PAUSE') {
        this.resumeGame();
        return;
      }
    }

    if (this.state === 'TITLE' || this.state === 'PAUSE') return;

    if (this.input.isInhaler) {
      this.player.useInhaler(this.audio, this.particleSystem);
    }

    if (this.dialogue.active) {
      if (this.input.isInteract) this.dialogue.advance();
      return;
    }

    if (this.state === 'BOSS_INTRO') {
      this.cutsceneTimer += dt;
      if (this.input.isInteract || this.cutsceneTimer >= 3.5) {
        this.bossIntroOverlay.classList.add('hidden');
        this.bossHpContainer.classList.remove('hidden');
        this.state = 'BOSS_BATTLE';
      }
      return;
    }

    // Player
    this.player.update(dt, this.input, this.audio, this.particleSystem, this.currentMap.colliders);
    this.camera.follow(this.player.x, this.player.y);
    this.camera.update(dt);

    // ===== TREINO DE STAMINA: correr aumenta a stamina máxima =====
    const runLevel = Math.floor(this.player.sprintDistance / 400);
    if (runLevel > this.player.staminaFromRun && this.player.maxStamina < 250) {
      this.player.staminaFromRun = runLevel;
      this.player.maxStamina = Math.min(250, this.player.maxStamina + 1);
      this.particleSystem.emitDamageText(this.player.x + 12, this.player.y - 10, '🏃 +1 STAMINA MÁX!', true);
      this.audio.playChest();
    }

    // Ataques
    let attackHitbox = null;
    if (this.input.isAttack) {
      attackHitbox = this.player.attack(this.audio, this.particleSystem);
    } else if (this.input.isHeavyAttack) {
      attackHitbox = this.player.heavyAttack(this.audio, this.particleSystem);
    } else if (this.input.isDash) {
      this.player.dash(this.audio, this.particleSystem);
    }

    this.particleSystem.update(dt);

    // ===== TREINO DE FORÇA: manequim =====
    if (this.dummy && this.state === 'WORLD') {
      this.dummy.update(dt);
      if (attackHitbox) {
        const dist = Math.hypot(attackHitbox.x - this.dummy.x, attackHitbox.y - (this.dummy.y - 40));
        if (dist < attackHitbox.radius + 30) {
          const leveled = this.dummy.registerHit();
          this.audio.playHit();
          this.particleSystem.emitDamageText(this.dummy.x, this.dummy.y - 90, `-${attackHitbox.damage}`, true);
          if (leveled) {
            this.player.bonusDamage += 2;
            this.particleSystem.emitDamageText(this.player.x + 12, this.player.y - 16, '⚡ FORÇA +2! DANO AUMENTOU!', true);
            this.audio.playChest();
          }
        }
      }
    }

    // Galinhas passeando
    this.chickens.forEach(c => {
      c.phase += dt;
      c.x = c.baseX + Math.sin(c.phase * 0.6) * 40;
      c.y = c.baseY + Math.cos(c.phase * 0.4) * 22;
      c.frame = Math.floor(c.phase * 6) % 4;
    });

    this.checkInteractions();

    // ===== BOSS =====
    if (this.state === 'BOSS_BATTLE' && this.currentBoss) {
      this.currentBoss.update(dt, this.player, this.particleSystem, this.audio);

      if (attackHitbox) {
        const dist = Math.hypot(attackHitbox.x - (this.currentBoss.x + 40), attackHitbox.y - (this.currentBoss.y + 40));
        if (dist < attackHitbox.radius + 40) {
          this.currentBoss.takeDamage(attackHitbox.damage, this.audio, this.particleSystem);
          this.camera.shake(8, 0.2);
        }
      }

      if (this.currentBoss.state === 'DEFEATED') {
        this.onBossDefeated();
      }
    }

    // Derrota do jogador
    if (this.player.hp <= 0 && this.state !== 'DEFEAT') {
      this.state = 'DEFEAT';
      this.audio.playHit();
      document.getElementById('defeat-screen').classList.remove('hidden');
    }

    this.updateHUD();
  }

  // ============================================================
  // VITÓRIA: resumo educativo sobre a asma + melhoria permanente
  // ============================================================
  onBossDefeated() {
    this.state = 'VICTORY';
    this.audio.playChest();

    const reward = ASTHMA_REWARDS[this.currentBoss.id];
    this.defeatedBosses.add(this.currentBoss.id);

    // Aplica a melhoria permanente
    reward.melhoria.apply(this.player);

    // Desbloqueia tópico do Almanaque
    let topicId = 'caminhoAr';
    if (this.currentBoss.id === 'traqueon') topicId = 'traqueia';
    else if (this.currentBoss.id === 'bronkar' || this.currentBoss.id === 'bronquius') topicId = 'bronquios';
    else if (this.currentBoss.id === 'alveor') topicId = 'alveolos';
    else if (this.currentBoss.id === 'diafragon') topicId = 'diafragma';
    this.almanac.unlockTopic(topicId);

    // Preenche a tela de vitória
    document.getElementById('victory-title').innerText = `GUARDIÃO ${this.currentBoss.name.toUpperCase()} DERROTADO!`;
    document.getElementById('victory-message').innerText = `Você superou o desafio da ${this.currentBoss.concept}!`;
    document.getElementById('victory-reward-text').innerText = `Melhoria permanente: ${reward.melhoria.texto}`;

    document.getElementById('asthma-title').innerText = `${reward.icon} ${reward.titulo}`;
    const list = document.getElementById('asthma-info-list');
    list.innerHTML = reward.resumo.map(p => `<p>${p}</p>`).join('');

    document.getElementById('victory-screen').classList.remove('hidden');
  }

  checkInteractions() {
    let nearInteractive = false;
    let promptLabel = '';
    let interactAction = null;

    // NPCs
    if (this.currentMap.npcs) {
      this.currentMap.npcs.forEach(npc => {
        const dist = Math.hypot((this.player.x + 12) - (npc.x + 16), (this.player.y + 12) - (npc.y + 16));
        if (dist < 44) {
          nearInteractive = true;
          promptLabel = `FALAR COM ${npc.name.toUpperCase()}`;
          interactAction = () => {
            this.dialogue.startDialogue(npc.dialogue, () => {
              if (npc.id === 'alveola') {
                this.mainObjective = 'Treine na Área de Treino (sul) e desafie os Guardiões no Totem (leste)!';
              }
            }, this.audio);
          };
        }
      });
    }

    // Livros / Baús / Placas / Totem dos Guardiões
    this.currentMap.interactives.forEach(item => {
      const dist = Math.hypot((this.player.x + 12) - (item.x + 12), (this.player.y + 12) - (item.y + 12));
      if (dist < 42) {
        nearInteractive = true;
        if (item.type === 'chest') promptLabel = 'ABRIR BAÚ';
        else if (item.type === 'book') promptLabel = 'LER LIVRO';
        else if (item.type === 'bossGate') promptLabel = '⚔️ ABRIR CAMINHO DOS GUARDIÕES';
        else promptLabel = 'LER PLACA';

        interactAction = () => {
          if (item.type === 'chest' && !item.opened) {
            item.opened = true;
            this.player.hp = this.player.maxHp;
            this.audio.playChest();
            this.particleSystem.emitDamageText(this.player.x + 12, this.player.y, 'VIDA 100%!', false);
            this.dialogue.startDialogue([{ speaker: 'Baú de Tesouro', text: item.rewardText, portrait: '🎁' }], null, this.audio);
          } else if (item.type === 'book' || item.type === 'sign') {
            this.dialogue.startDialogue([{ speaker: item.title, text: item.text, portrait: item.type === 'book' ? '📖' : '🪧' }], null, this.audio);
          } else if (item.type === 'bossGate') {
            this.bossSelectReturn = 'world';
            this.state = 'PAUSE';
            this.showBossSelection();
          }
        };
      }
    });

    // Transições de mapa
    if (this.currentMap.id === 'village' && this.player.x > this.currentMap.width - 34
      && this.player.y > 340 && this.player.y < 430) {
      this.enterMap(new Map('trail', 'Caminho da Traqueia', 960, 640), 50, 340);
      this.mainObjective = 'Avance pelo caminho e desafie o Guardião Traqueon!';
    } else if (this.currentMap.id === 'trail' && this.player.x < 30) {
      const village = new Map('village', 'Vila da Respiração', 1472, 864);
      if (this.dummy) village.attachDummy(this.dummy);
      this.enterMap(village, village.width - 60, 380);
    } else if (this.currentMap.id === 'trail' && this.player.x > this.currentMap.width - 30) {
      this.startBossBattle('traqueon');
    }

    if (nearInteractive) {
      this.interactionText.innerText = promptLabel;
      this.interactionPrompt.classList.remove('hidden');
      if (this.input.isInteract && interactAction) interactAction();
    } else {
      this.interactionPrompt.classList.add('hidden');
    }
  }

  updateHUD() {
    const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    const staminaPct = Math.max(0, (this.player.stamina / this.player.maxStamina) * 100);

    this.hpBarFill.style.width = `${hpPct}%`;
    this.hpText.innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    this.staminaBarFill.style.width = `${staminaPct}%`;
    this.staminaText.innerText = `${Math.ceil(staminaPct)}%`;

    // Stats de treino
    if (this.statStrength) this.statStrength.innerText = `${this.player.attackDamage}`;
    if (this.statStamina) this.statStamina.innerText = `${this.player.maxStamina}`;

    this.objectiveText.innerText = this.mainObjective;
    this.locationTag.innerText = this.currentMap.name;

    if (this.player.isInhalerActive) {
      this.inhalerStatusText.innerText = 'USANDO...';
      this.inhalerStatusText.style.color = '#38bdf8';
      this.inhalerPrompt.classList.remove('hidden');
    } else {
      this.inhalerStatusText.innerText = 'PRONTO';
      this.inhalerStatusText.style.color = '#4ade80';
      this.inhalerPrompt.classList.add('hidden');
    }

    if (this.state === 'BOSS_BATTLE' && this.currentBoss) {
      const bHpPct = Math.max(0, (this.currentBoss.hp / this.currentBoss.maxHp) * 100);
      this.bossHpFill.style.width = `${bHpPct}%`;
      this.bossPhaseLabel.innerText = `FASE ${this.currentBoss.phase}`;
      document.getElementById('boss-name-label').innerText = `${this.currentBoss.name.toUpperCase()} - Guardião da ${this.currentBoss.concept}`;
    }

    this.renderMinimap();
  }

  renderMinimap() {
    const mCtx = this.minimapCtx;
    mCtx.fillStyle = '#020617';
    mCtx.fillRect(0, 0, 120, 120);

    const scaleX = 120 / this.currentMap.width;
    const scaleY = 120 / this.currentMap.height;

    mCtx.fillStyle = '#334155';
    this.currentMap.colliders.forEach(c => {
      mCtx.fillRect(c.x * scaleX, c.y * scaleY, Math.max(1, c.w * scaleX), Math.max(1, c.h * scaleY));
    });

    mCtx.fillStyle = '#38bdf8';
    mCtx.beginPath();
    mCtx.arc(this.player.x * scaleX, this.player.y * scaleY, 4, 0, Math.PI * 2);
    mCtx.fill();

    if (this.currentBoss) {
      mCtx.fillStyle = '#ef4444';
      mCtx.beginPath();
      mCtx.arc(this.currentBoss.x * scaleX, this.currentBoss.y * scaleY, 5, 0, Math.PI * 2);
      mCtx.fill();
    }

    // manequim no minimapa
    if (this.currentMap.dummy) {
      mCtx.fillStyle = '#fbbf24';
      mCtx.fillRect(this.currentMap.dummy.x * scaleX - 2, this.currentMap.dummy.y * scaleY - 2, 4, 4);
    }
  }

  // RENDER
  render() {
    if (!this.assets) return;
    const ctx = this.ctx;
    // Estado do canvas SEMPRE limpo no início de cada frame (nada "vaza" de boss/partículas)
    this.resetCanvasState();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    try {
      // offsets inteiros: evita linhas/frestas entre tiles e sprites tremidos
      const ox = Math.round(this.camera.offsetX);
      const oy = Math.round(this.camera.offsetY);
      // Y dos pés do jogador: ordena árvores/casas/postes (atrás ou na frente)
      const sortY = this.player.y + this.player.height;

      // Camada 1: Chão
      this.currentMap.drawLayer1_Ground(ctx, this.assets, ox, oy, this.canvas.width, this.canvas.height);
      // Camada 2: Decoração baixa
      this.currentMap.drawLayer2_LowDecor(ctx, this.assets, ox, oy);
      // Camada 3: Objetos físicos (e objetos altos que ficam ATRÁS do jogador)
      this.currentMap.drawLayer3_PhysicalObjects(ctx, this.assets, ox, oy, sortY);

      // Galinhas
      if (this.currentMap.id === 'village') {
        this.chickens.forEach(c => {
          const img = this.assets.chicken[c.frame];
          ctx.drawImage(img, Math.floor(c.x - ox), Math.floor(c.y - oy), 32, 32);
        });
      }

      // Player e Boss
      this.player.draw(ctx, this.assets.player, ox, oy);
      if (this.currentBoss) {
        this.currentBoss.draw(ctx, this.assets.bosses, ox, oy);
      }

      // Camada 4: objetos altos NA FRENTE do jogador (copas, telhados, postes)
      this.currentMap.drawLayer4_HighDecor(ctx, this.assets, ox, oy, sortY);

      // Partículas
      this.particleSystem.draw(ctx, ox, oy);
    } finally {
      ctx.restore();
      this.resetCanvasState();
    }
  }
}
