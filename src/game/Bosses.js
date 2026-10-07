export class Boss {
  constructor(id, name, concept, hp, x, y) {
    this.id = id;
    this.name = name;
    this.concept = concept;
    this.maxHp = hp;
    this.hp = hp;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.phase = 1;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.attackPattern = 0;
    this.projectiles = [];
    this.invulnerableTimer = 0;
    this.moveTimer = 0;
    this.moveAngle = 0;
    this.flashTimer = 0;
    this.auraAngle = 0;
  }

  takeDamage(amount, audio, particleSystem) {
    if (this.invulnerableTimer > 0 || this.state === 'DEFEATED') return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 0.15;
    this.flashTimer = 0.2;
    if (particleSystem) {
      particleSystem.emitDamageText(this.x + 40, this.y, `-${amount}`, true);
    }
    const hpPct = this.hp / this.maxHp;
    if (hpPct <= 0.30 && this.phase < 3) {
      this.phase = 3;
      if (audio) audio.playBossRoar();
      // Enrage burst
      this.fireRadial(12, 200, 18, 4.0);
    } else if (hpPct <= 0.65 && this.phase < 2) {
      this.phase = 2;
      if (audio) audio.playBossRoar();
      this.fireRadial(8, 180, 15, 3.5);
    }
    if (this.hp <= 0) this.state = 'DEFEATED';
    return true;
  }

  // Utility: fire radial projectiles
  fireRadial(count, speed, damage, life, offset = 0) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + offset;
      this.projectiles.push({
        x: this.x + 40, y: this.y + 40,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: 10 + damage * 0.3, damage, life,
        color: this.getProjectileColor()
      });
    }
  }

  // Utility: fire aimed at player
  fireAimed(player, count, spread, speed, damage, life) {
    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - (count - 1) / 2) * spread;
      this.projectiles.push({
        x: this.x + 40, y: this.y + 40,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: 10 + damage * 0.3, damage, life,
        color: this.getProjectileColor()
      });
    }
  }

  // Utility: fire spiral
  fireSpiral(arms, bulletsPerArm, speed, damage, life, rotation = 0) {
    for (let arm = 0; arm < arms; arm++) {
      for (let b = 0; b < bulletsPerArm; b++) {
        const angle = (arm / arms) * Math.PI * 2 + rotation + b * 0.15;
        const spd = speed + b * 15;
        setTimeout(() => {
          if (this.state === 'DEFEATED') return;
          this.projectiles.push({
            x: this.x + 40, y: this.y + 40,
            vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
            radius: 8, damage, life,
            color: this.getProjectileColor()
          });
        }, b * 80);
      }
    }
  }

  getProjectileColor() {
    const colors = {
      traqueon: '#38bdf8', bronkar: '#f43f5e', bronquius: '#06b6d4',
      alveor: '#a855f7', diafragon: '#ef4444', guardiaoFinal: '#fbbf24'
    };
    return colors[this.id] || '#38bdf8';
  }

  update(dt, player, particleSystem, audio) {
    if (this.state === 'DEFEATED') return;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    this.stateTimer += dt;
    this.auraAngle += dt * 2;

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      const dist = Math.hypot(p.x - (player.x + 12), p.y - (player.y + 12));
      if (dist < p.radius + 10) {
        player.takeDamage(p.damage, audio, particleSystem);
        this.projectiles.splice(i, 1);
        continue;
      }
      if (p.life <= 0) this.projectiles.splice(i, 1);
    }

    // Boss movement towards player (slow chase)
    this.moveTimer += dt;
    const chaseSpeed = 30 + this.phase * 15;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 120 && this.state === 'IDLE') {
      this.x += (dx / dist) * chaseSpeed * dt;
      this.y += (dy / dist) * chaseSpeed * dt;
    }
    // Clamp to arena
    this.x = Math.max(70, Math.min(700, this.x));
    this.y = Math.max(70, Math.min(500, this.y));

    // Boss AI
    switch (this.id) {
      case 'traqueon': this.updateTraqueon(dt, player, particleSystem, audio); break;
      case 'bronkar': this.updateBronkar(dt, player, particleSystem, audio); break;
      case 'bronquius': this.updateBronquius(dt, player, particleSystem, audio); break;
      case 'alveor': this.updateAlveor(dt, player, particleSystem, audio); break;
      case 'diafragon': this.updateDiafragon(dt, player, particleSystem, audio); break;
      case 'guardiaoFinal': this.updateGuardiaoFinal(dt, player, particleSystem, audio); break;
    }
  }

  // ========== TRAQUEON ==========
  updateTraqueon(dt, player, ps, audio) {
    const idleTime = Math.max(0.6, 1.8 - this.phase * 0.4);
    if (this.state === 'IDLE') {
      if (ps && Math.random() < 0.15) ps.emitWindGust(this.x + 40, this.y + 40, 0, -30);
      if (this.stateTimer >= idleTime) {
        this.state = 'TELEGRAPH';
        this.stateTimer = 0;
        this.attackPattern = (this.attackPattern + 1) % (2 + this.phase);
      }
    } else if (this.state === 'TELEGRAPH') {
      if (ps && Math.random() < 0.5) ps.emitWindGust(this.x + 40, this.y + 40, 0, -60);
      if (this.stateTimer >= 0.6) {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        if (audio) audio.playBossRoar();

        if (this.attackPattern === 0) {
          // Radial burst
          this.fireRadial(8 + this.phase * 3, 140 + this.phase * 25, 12 + this.phase * 3, 3.5);
        } else if (this.attackPattern === 1) {
          // Aimed triple stream
          this.fireAimed(player, 3 + this.phase, 0.2, 200 + this.phase * 20, 16, 3.0);
        } else if (this.attackPattern === 2) {
          // Spiral wind
          this.fireSpiral(3, 5 + this.phase, 150, 10, 3.0, this.auraAngle);
        } else if (this.attackPattern === 3) {
          // Double radial offset
          this.fireRadial(10, 160, 14, 3.5, 0);
          setTimeout(() => {
            if (this.state !== 'DEFEATED') {
              this.fireRadial(10, 160, 14, 3.5, Math.PI / 10);
            }
          }, 300);
        }
      }
    } else if (this.state === 'ATTACK') {
      if (this.stateTimer >= 0.8) { this.state = 'IDLE'; this.stateTimer = 0; }
    }
  }

  // ========== BRONKAR ==========
  updateBronkar(dt, player, ps, audio) {
    const idleTime = Math.max(0.5, 1.3 - this.phase * 0.3);
    if (this.state === 'IDLE' && this.stateTimer >= idleTime) {
      this.state = 'TELEGRAPH'; this.stateTimer = 0;
    } else if (this.state === 'TELEGRAPH' && this.stateTimer >= 0.5) {
      this.state = 'ATTACK'; this.stateTimer = 0;
      if (audio) audio.playBossRoar();
      this.attackPattern = (this.attackPattern + 1) % (2 + this.phase);

      if (this.attackPattern === 0) {
        // Branching dual wave
        for (let side = -1; side <= 1; side += 2) {
          this.fireAimed(player, 2 + this.phase, 0.3 * side, 180 + this.phase * 20, 16, 3.0);
        }
      } else if (this.attackPattern === 1) {
        // Scatter burst
        this.fireRadial(6 + this.phase * 2, 170 + this.phase * 15, 14, 3.0, Math.random() * Math.PI);
      } else if (this.attackPattern === 2) {
        // Pincer from sides
        for (let i = 0; i < 4; i++) {
          this.projectiles.push({
            x: 70, y: 100 + i * 100,
            vx: 200, vy: (player.y - (100 + i * 100)) * 0.5,
            radius: 14, damage: 18, life: 3.0, color: '#f43f5e'
          });
          this.projectiles.push({
            x: 730, y: 100 + i * 100,
            vx: -200, vy: (player.y - (100 + i * 100)) * 0.5,
            radius: 14, damage: 18, life: 3.0, color: '#fb7185'
          });
        }
      } else {
        // Dense radial + aimed combo
        this.fireRadial(8, 140, 12, 3.0);
        this.fireAimed(player, 4, 0.15, 220, 20, 2.5);
      }
    } else if (this.state === 'ATTACK' && this.stateTimer >= 0.7) {
      this.state = 'IDLE'; this.stateTimer = 0;
    }
  }

  // ========== BRONQUIUS (FAST!) ==========
  updateBronquius(dt, player, ps, audio) {
    const idleTime = Math.max(0.3, 0.8 - this.phase * 0.15);
    if (this.state === 'IDLE' && this.stateTimer >= idleTime) {
      this.state = 'TELEGRAPH'; this.stateTimer = 0;
    } else if (this.state === 'TELEGRAPH' && this.stateTimer >= 0.3) {
      this.state = 'ATTACK'; this.stateTimer = 0;
      this.attackPattern = (this.attackPattern + 1) % (3 + this.phase);

      if (this.attackPattern <= 1) {
        // Fast spiral needles
        this.fireSpiral(4 + this.phase, 4, 220 + this.phase * 20, 10, 2.5, this.auraAngle);
      } else if (this.attackPattern === 2) {
        // Rapid aimed triple
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (this.state !== 'DEFEATED') {
              this.fireAimed(player, 2 + this.phase, 0.25, 260, 12, 2.5);
            }
          }, i * 150);
        }
      } else if (this.attackPattern === 3) {
        // Dash towards player then burst
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * 100;
        this.y += Math.sin(angle) * 100;
        this.fireRadial(12 + this.phase * 2, 200, 14, 2.0);
      } else {
        // Dense ring
        this.fireRadial(16, 180, 8, 3.0, this.auraAngle);
      }
    } else if (this.state === 'ATTACK' && this.stateTimer >= 0.4) {
      this.state = 'IDLE'; this.stateTimer = 0;
    }
  }

  // ========== ALVEOR ==========
  updateAlveor(dt, player, ps, audio) {
    const idleTime = Math.max(0.7, 1.5 - this.phase * 0.3);
    if (this.state === 'IDLE' && this.stateTimer >= idleTime) {
      this.state = 'TELEGRAPH'; this.stateTimer = 0;
    } else if (this.state === 'TELEGRAPH' && this.stateTimer >= 0.6) {
      this.state = 'ATTACK'; this.stateTimer = 0;
      this.attackPattern = (this.attackPattern + 1) % (2 + this.phase);

      if (ps) ps.emitGasCloud(this.x + 40, this.y + 40, false);

      if (this.attackPattern === 0) {
        // Toxic CO2 clouds
        for (let i = 0; i < 3 + this.phase; i++) {
          this.projectiles.push({
            x: this.x + 40, y: this.y + 40,
            vx: (Math.random() * 2 - 1) * 70, vy: (Math.random() * 2 - 1) * 70,
            radius: 26 + this.phase * 4, damage: 14 + this.phase * 2, life: 5.0,
            color: 'rgba(168,85,247,0.6)'
          });
        }
      } else if (this.attackPattern === 1) {
        // Radial + gas
        this.fireRadial(6 + this.phase * 2, 130, 12, 3.5);
      } else if (this.attackPattern === 2) {
        // Aimed gas streams
        this.fireAimed(player, 5, 0.4, 140, 16, 4.0);
      } else {
        // Encircle with slow deadly clouds
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          this.projectiles.push({
            x: player.x + Math.cos(a) * 120, y: player.y + Math.sin(a) * 120,
            vx: -Math.cos(a) * 40, vy: -Math.sin(a) * 40,
            radius: 22, damage: 18, life: 4.0,
            color: 'rgba(168,85,247,0.7)'
          });
        }
      }
    } else if (this.state === 'ATTACK' && this.stateTimer >= 0.9) {
      this.state = 'IDLE'; this.stateTimer = 0;
    }
  }

  // ========== DIAFRAGON ==========
  updateDiafragon(dt, player, ps, audio) {
    const idleTime = Math.max(0.6, 1.3 - this.phase * 0.25);
    if (this.state === 'IDLE' && this.stateTimer >= idleTime) {
      this.state = 'TELEGRAPH'; this.stateTimer = 0;
    } else if (this.state === 'TELEGRAPH' && this.stateTimer >= 0.7) {
      this.state = 'ATTACK'; this.stateTimer = 0;
      if (audio) audio.playBossRoar();
      this.attackPattern = (this.attackPattern + 1) % (3 + this.phase);

      if (this.attackPattern === 0) {
        // Vertical shockwaves
        for (let xOff = -150; xOff <= 150; xOff += 40) {
          this.projectiles.push({
            x: this.x + 40 + xOff, y: this.y + 80,
            vx: 0, vy: 200 + this.phase * 20,
            radius: 16 + this.phase * 2, damage: 20 + this.phase * 3, life: 2.5,
            color: '#ef4444'
          });
        }
      } else if (this.attackPattern === 1) {
        // Horizontal shockwaves
        for (let yOff = -120; yOff <= 120; yOff += 50) {
          this.projectiles.push({
            x: this.x + 80, y: this.y + 40 + yOff,
            vx: 180 + this.phase * 20, vy: 0,
            radius: 16, damage: 18, life: 2.5, color: '#f87171'
          });
          this.projectiles.push({
            x: this.x, y: this.y + 40 + yOff,
            vx: -(180 + this.phase * 20), vy: 0,
            radius: 16, damage: 18, life: 2.5, color: '#f87171'
          });
        }
      } else if (this.attackPattern === 2) {
        // Ground slam radial
        this.fireRadial(10 + this.phase * 3, 160 + this.phase * 20, 22, 3.0);
      } else {
        // Compression waves (aimed + vertical combo)
        this.fireAimed(player, 5, 0.2, 200, 20, 3.0);
        for (let xOff = -100; xOff <= 100; xOff += 60) {
          this.projectiles.push({
            x: this.x + 40 + xOff, y: 70,
            vx: 0, vy: 220,
            radius: 20, damage: 22, life: 3.0, color: '#ef4444'
          });
        }
      }
    } else if (this.state === 'ATTACK' && this.stateTimer >= 0.8) {
      this.state = 'IDLE'; this.stateTimer = 0;
    }
  }

  // ========== GUARDIÃO FINAL ==========
  updateGuardiaoFinal(dt, player, ps, audio) {
    const idleTime = Math.max(0.4, 1.0 - this.phase * 0.2);
    if (this.state === 'IDLE' && this.stateTimer >= idleTime) {
      this.state = 'TELEGRAPH'; this.stateTimer = 0;
    } else if (this.state === 'TELEGRAPH' && this.stateTimer >= 0.5) {
      this.state = 'ATTACK'; this.stateTimer = 0;
      if (audio) audio.playBossRoar();
      this.attackPattern = (this.attackPattern + 1) % (4 + this.phase);

      if (this.attackPattern === 0) {
        // Ultimate radial burst
        this.fireRadial(14 + this.phase * 2, 190 + this.phase * 15, 22, 3.5);
      } else if (this.attackPattern === 1) {
        // Multi-spiral
        this.fireSpiral(5, 6, 160, 18, 3.0, this.auraAngle);
      } else if (this.attackPattern === 2) {
        // Aimed barrages
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            if (this.state !== 'DEFEATED') {
              this.fireAimed(player, 3 + this.phase, 0.15, 240, 20, 2.5);
            }
          }, i * 200);
        }
      } else if (this.attackPattern === 3) {
        // Ring of death closing in
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          this.projectiles.push({
            x: player.x + Math.cos(a) * 200, y: player.y + Math.sin(a) * 200,
            vx: -Math.cos(a) * 80, vy: -Math.sin(a) * 80,
            radius: 14, damage: 25, life: 3.0, color: '#fbbf24'
          });
        }
      } else {
        // Cross shockwave + radial
        this.fireRadial(12, 170, 18, 3.0, this.auraAngle);
        for (let dir = 0; dir < 4; dir++) {
          const a = (dir / 4) * Math.PI * 2;
          for (let b = 0; b < 5; b++) {
            this.projectiles.push({
              x: this.x + 40, y: this.y + 40,
              vx: Math.cos(a) * (100 + b * 40), vy: Math.sin(a) * (100 + b * 40),
              radius: 12, damage: 20, life: 3.5, color: '#f59e0b'
            });
          }
        }
      }
    } else if (this.state === 'ATTACK' && this.stateTimer >= 0.6) {
      this.state = 'IDLE'; this.stateTimer = 0;
    }
  }

  draw(ctx, bossSprites, offsetX, offsetY) {
    if (this.state === 'DEFEATED') return;
    const px = Math.floor(this.x - offsetX);
    const py = Math.floor(this.y - offsetY);

    // Rotating aura ring
    ctx.save();
    ctx.translate(px + 40, py + 40);
    ctx.rotate(this.auraAngle);
    ctx.strokeStyle = this.state === 'TELEGRAPH'
      ? 'rgba(244,63,94,0.5)'
      : `rgba(56,189,248,${0.15 + Math.sin(Date.now() / 300) * 0.1})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 50 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();

    // Telegraph warning zone
    if (this.state === 'TELEGRAPH') {
      const pulse = 0.2 + Math.sin(Date.now() / 100) * 0.15;
      ctx.fillStyle = `rgba(244,63,94,${pulse})`;
      ctx.beginPath();
      ctx.arc(px + 40, py + 40, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flash on damage
    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.6;
    }

    // Boss sprite
    const sprite = bossSprites[this.id] || bossSprites.traqueon;
    ctx.drawImage(sprite, px, py, 80, 80);
    ctx.globalAlpha = 1.0;

    // Phase glow border
    if (this.phase >= 2) {
      ctx.strokeStyle = this.phase === 3 ? '#ef4444' : '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + 40, py + 40, 42, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw projectiles with glow
    for (const p of this.projectiles) {
      const projPx = Math.floor(p.x - offsetX);
      const projPy = Math.floor(p.y - offsetY);

      // Outer glow
      const grad = ctx.createRadialGradient(projPx, projPy, 0, projPx, projPy, p.radius + 4);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(projPx, projPy, p.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(projPx, projPy, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // Bright center
      ctx.beginPath();
      ctx.arc(projPx, projPy, p.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }
}
