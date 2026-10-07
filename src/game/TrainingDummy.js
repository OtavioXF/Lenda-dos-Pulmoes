// ============================================================
// TrainingDummy — Manequim de treino construído com os assets:
// poste de cerca (corpo) + trilho (braços) + saco (cabeça).
// O jogador bate para ganhar FORÇA (+ dano de ataque).
// ============================================================

export class TrainingDummy {
  constructor(x, y) {
    this.x = x;          // centro
    this.y = y;          // base (pés)
    this.hits = 0;
    this.hitsPerLevel = 10;
    this.wobble = 0;     // animação de balanço ao levar golpe
    this.flashTimer = 0;
    this.levelUpTimer = 0;
  }

  get strengthLevel() {
    return Math.floor(this.hits / this.hitsPerLevel);
  }

  get progress() {
    return (this.hits % this.hitsPerLevel) / this.hitsPerLevel;
  }

  // Retorna true se subiu de nível de força
  registerHit() {
    const before = this.strengthLevel;
    this.hits++;
    this.wobble = 1;
    this.flashTimer = 0.15;
    const leveled = this.strengthLevel > before;
    if (leveled) this.levelUpTimer = 1.2;
    return leveled;
  }

  update(dt) {
    if (this.wobble > 0) this.wobble = Math.max(0, this.wobble - dt * 3);
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.levelUpTimer > 0) this.levelUpTimer -= dt;
  }

  draw(ctx, lib, ox, oy) {
    const px = Math.floor(this.x - ox);
    const py = Math.floor(this.y - oy);
    const wob = Math.sin(Date.now() / 40) * this.wobble * 0.18;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(wob);

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // base: toco
    ctx.drawImage(lib.env.stump, -18, -14, 36, 26);
    // corpo: dois postes de cerca empilhados (escala inteira 2x, sem esticar o sprite)
    ctx.drawImage(lib.structures.fencePost, -8, -56, 16, 24);
    ctx.drawImage(lib.structures.fencePost, -8, -34, 16, 24);
    // braços: trilho horizontal da cerca (2x)
    ctx.drawImage(lib.structures.fenceH, -40, -54, 80, 32);
    // cabeça: saco
    ctx.drawImage(lib.structures.sack, -16, -88, 32, 32);

    // alvo pintado no peito
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(0, -38, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(0, -38, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(0, -38, 2, 0, Math.PI * 2); ctx.fill();

    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-40, -88, 80, 100);
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // barra de progresso de FORÇA acima do manequim
    const bw = 64;
    ctx.fillStyle = 'rgba(2,6,23,0.75)';
    ctx.fillRect(px - bw / 2, py - 104, bw, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - bw / 2 + 1, py - 103, (bw - 2) * this.progress, 8);
    ctx.strokeStyle = '#fbbf24';
    ctx.strokeRect(px - bw / 2, py - 104, bw, 10);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MANEQUIM  •  ${this.hits % this.hitsPerLevel}/${this.hitsPerLevel} golpes`, px, py - 110);
    ctx.textAlign = 'start';

    // efeito de level up
    if (this.levelUpTimer > 0) {
      const a = Math.min(1, this.levelUpTimer);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ FORÇA +2!', px, py - 122 - (1.2 - this.levelUpTimer) * 22);
      ctx.textAlign = 'start';
      ctx.globalAlpha = 1.0;
    }
  }
}
