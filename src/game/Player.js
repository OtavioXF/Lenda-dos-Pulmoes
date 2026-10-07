export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;

    // Core Stats
    this.maxHp = 100;
    this.hp = 100;
    this.maxStamina = 100;
    this.stamina = 100;

    // Treino / Progressão
    this.bonusDamage = 0;      // FORÇA: manequim (+2 a cada 10 golpes) e bosses
    this.sprintDistance = 0;   // distância total correndo (px) → stamina máx
    this.staminaFromRun = 0;   // bônus de stamina já concedido

    // Movement Speeds
    this.walkSpeed = 130;
    this.runSpeed = 210;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'down'; // down, up, left, right
    this.isMoving = false;
    this.isSprinting = false;

    // Inhaler Mechanic State (CRITICAL SPEC REQUIREMENT)
    this.isInhalerActive = false;
    this.inhalerTimer = 0;
    this.inhalerDuration = 1.00; // melhoria do Alveor reduz para 0.6s

    // Combat & Dash
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.25;
    this.dashCooldown = 0;

    // Damage & Invulnerability
    this.invulnerableTimer = 0;

    // Animation frame index
    this.animFrame = 0;
    this.animTimer = 0;
  }

  // Zera estados temporários de combate/animação (chamado ao trocar de mapa / sair de boss)
  resetTransient() {
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    this.isSprinting = false;
    this.isInhalerActive = false;
    this.inhalerTimer = 0;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invulnerableTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  get attackDamage() { return 20 + this.bonusDamage; }
  get heavyDamage() { return 45 + this.bonusDamage; }

  useInhaler(audio, particleSystem) {
    if (!this.isInhalerActive) {
      this.isInhalerActive = true;
      this.inhalerTimer = 0;
      if (audio) audio.playInhaler();
    }
  }

  attack(audio, particleSystem) {
    if (this.isInhalerActive) return false;
    if (this.attackCooldown > 0 || this.isAttacking || this.isDashing) return false;

    const cost = 15;
    if (this.stamina < cost) return false;

    this.stamina -= cost;
    this.isAttacking = true;
    this.attackTimer = 0.25;
    this.attackCooldown = 0.35;

    if (audio) audio.playSlash();

    let attackX = this.x + this.width / 2;
    let attackY = this.y + this.height / 2;
    let angle = 0;

    if (this.facing === 'right') { attackX += 24; angle = 0; }
    else if (this.facing === 'left') { attackX -= 24; angle = Math.PI; }
    else if (this.facing === 'down') { attackY += 24; angle = Math.PI / 2; }
    else if (this.facing === 'up') { attackY -= 24; angle = -Math.PI / 2; }

    if (particleSystem) particleSystem.emitSlash(attackX, attackY, angle);

    return { x: attackX, y: attackY, radius: 30, damage: this.attackDamage };
  }

  heavyAttack(audio, particleSystem) {
    if (this.isInhalerActive) return false;
    if (this.attackCooldown > 0 || this.isAttacking || this.isDashing) return false;

    const cost = 30;
    if (this.stamina < cost) return false;

    this.stamina -= cost;
    this.isAttacking = true;
    this.attackTimer = 0.40;
    this.attackCooldown = 0.60;

    if (audio) audio.playSlash();

    let attackX = this.x + this.width / 2;
    let attackY = this.y + this.height / 2;
    let angle = 0;

    if (this.facing === 'right') { attackX += 28; angle = 0; }
    else if (this.facing === 'left') { attackX -= 28; angle = Math.PI; }
    else if (this.facing === 'down') { attackY += 28; angle = Math.PI / 2; }
    else if (this.facing === 'up') { attackY -= 28; angle = -Math.PI / 2; }

    if (particleSystem) particleSystem.emitSlash(attackX, attackY, angle);

    return { x: attackX, y: attackY, radius: 40, damage: this.heavyDamage };
  }

  dash(audio, particleSystem) {
    if (this.dashCooldown > 0 || this.isDashing) return false;
    const cost = 25;
    if (this.stamina < cost) return false;

    this.stamina -= cost;
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldown = 0.5;

    if (audio) audio.playDash();

    if (particleSystem) {
      particleSystem.emitInhalerMist(this.x + 12, this.y + 12, -this.vx / 100, -this.vy / 100);
    }
    return true;
  }

  takeDamage(amount, audio, particleSystem) {
    if (this.invulnerableTimer > 0 || this.isDashing) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 1.0;

    if (audio) audio.playHit();
    if (particleSystem) {
      particleSystem.emitDamageText(this.x + 12, this.y, `-${amount}`, false);
    }
    return true;
  }

  update(dt, input, audio, particleSystem, mapColliders = []) {
    // Update Timers
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) this.isAttacking = false;
    }
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // Inalador: 100% em `inhalerDuration` segundos, movimento livre
    if (this.isInhalerActive) {
      this.inhalerTimer += dt;
      const restorationSpeed = 100 / this.inhalerDuration;
      this.stamina = Math.min(this.maxStamina, this.stamina + restorationSpeed * dt);

      if (particleSystem && Math.random() < 0.3) {
        particleSystem.emitInhalerMist(this.x + 12, this.y + 12);
      }

      if (this.inhalerTimer >= this.inhalerDuration) {
        this.isInhalerActive = false;
        this.stamina = this.maxStamina;
      }
    }

    // Input Movement handling
    const { dx, dy } = input.moveVector;
    this.isSprinting = input.isSprint && this.stamina > 0 && (dx !== 0 || dy !== 0) && !this.isInhalerActive;
    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 15 * dt);
      // TREINO DE STAMINA: correr acumula distância (Game converte em bônus)
      this.sprintDistance += this.runSpeed * dt;
    }

    let currentSpeed = this.isSprinting ? this.runSpeed : this.walkSpeed;
    if (this.isDashing) {
      currentSpeed = 380;
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.isDashing = false;
    }

    if (dx > 0) this.facing = 'right';
    else if (dx < 0) this.facing = 'left';
    else if (dy > 0) this.facing = 'down';
    else if (dy < 0) this.facing = 'up';

    this.vx = dx * currentSpeed;
    this.vy = dy * currentSpeed;

    let nextX = this.x + this.vx * dt;
    let nextY = this.y + this.vy * dt;

    if (!this.checkCollision(nextX, this.y, mapColliders)) this.x = nextX;
    if (!this.checkCollision(this.x, nextY, mapColliders)) this.y = nextY;

    // Animação
    if (this.isMoving) {
      this.animTimer += dt * (this.isSprinting ? 14 : 9);
      if (this.animTimer >= 1) {
        this.animFrame++;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
    }

    // Regeneração natural lenta de stamina
    if (!this.isInhalerActive && !this.isSprinting && !this.isDashing) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 8 * dt);
    }
  }

  checkCollision(newX, newY, colliders) {
    const pBounds = {
      x: newX + 4,
      y: newY + 14, // colisor só nos pés
      w: this.width - 8,
      h: 10
    };

    for (const c of colliders) {
      if (
        pBounds.x < c.x + c.w &&
        pBounds.x + pBounds.w > c.x &&
        pBounds.y < c.y + c.h &&
        pBounds.y + pBounds.h > c.y
      ) {
        return true;
      }
    }
    return false;
  }

  // ============================================================
  // DRAW — usa o spritesheet real player_anims.png (assets)
  // Células de 32x64 em x=32+96*i; bloco y=0 = andar, y=64 = correr/ação
  // ============================================================
  draw(ctx, playerSprites, offsetX, offsetY) {
    const px = Math.floor(this.x - offsetX);
    const py = Math.floor(this.y - offsetY);
    const S = 2; // escala INTEIRA = pixel art nítido (2.2 borrava/distorcia os pixels)
    const cw = playerSprites.cellW * S;   // 70.4
    const ch = playerSprites.cellH * S;   // 140.8
    const feet = playerSprites.feetY * S; // 88

    // Flash de invulnerabilidade
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Escolha do frame
    let frame;
    if (this.isInhalerActive) {
      frame = playerSprites.runFrames[1]; // pose de esforço (inalador)
    } else if (this.isAttacking) {
      frame = playerSprites.runFrames[this.attackTimer > 0.2 ? 3 : 7];
    } else if (!this.isMoving) {
      frame = playerSprites.idleFrame;
    } else if (this.isSprinting) {
      frame = playerSprites.runFrames[this.animFrame % playerSprites.runFrames.length];
    } else {
      frame = playerSprites.walkFrames[this.animFrame % playerSprites.walkFrames.length];
    }

    const dx = px + this.width / 2 - cw / 2;
    const dy = py + this.height - feet;

    // espelha quando olha para a esquerda
    if (this.facing === 'left') {
      ctx.save();
      ctx.translate(px + this.width / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(playerSprites.img,
        frame.sx, frame.sy, playerSprites.cellW, playerSprites.cellH,
        -cw / 2, dy, cw, ch);
      ctx.restore();
    } else {
      ctx.drawImage(playerSprites.img,
        frame.sx, frame.sy, playerSprites.cellW, playerSprites.cellH,
        dx, dy, cw, ch);
    }

    ctx.globalAlpha = 1.0;
  }
}
