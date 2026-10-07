export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emitInhalerMist(x, y, dirX = 0, dirY = 0) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + (Math.random() * 12 - 6),
        vx: Math.cos(angle) * speed + dirX * 15,
        vy: Math.sin(angle) * speed + dirY * 15 - 15, // float slightly up
        size: 4 + Math.random() * 8,
        color: `hsla(${185 + Math.random() * 20}, 90%, 75%, `,
        alpha: 0.8,
        decay: 1.2 + Math.random() * 0.8,
        type: 'mist'
      });
    }
  }

  emitSlash(x, y, angle) {
    for (let i = 0; i < 12; i++) {
      const pAngle = angle + (Math.random() * 0.6 - 0.3);
      const speed = 120 + Math.random() * 100;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        size: 3 + Math.random() * 4,
        color: 'hsla(195, 100%, 85%, ',
        alpha: 0.9,
        decay: 3.5,
        type: 'slash'
      });
    }
  }

  emitWindGust(x, y, vx, vy, color = 'rgba(186, 230, 253, ') {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: vx + (Math.random() * 30 - 15),
        vy: vy + (Math.random() * 30 - 15),
        size: 5 + Math.random() * 10,
        color: color,
        alpha: 0.7,
        decay: 1.5,
        type: 'wind'
      });
    }
  }

  emitGasCloud(x, y, isO2 = true) {
    const color = isO2 ? 'hsla(140, 80%, 65%, ' : 'hsla(280, 80%, 60%, ';
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 16 - 8),
        vx: (Math.random() * 20 - 10),
        vy: (Math.random() * 20 - 10),
        size: 8 + Math.random() * 12,
        color: color,
        alpha: 0.6,
        decay: 0.8,
        type: 'gas'
      });
    }
  }

  emitDamageText(x, y, text, isCritical = false) {
    this.particles.push({
      x: x,
      y: y,
      vx: (Math.random() * 20 - 10),
      vy: -60 - Math.random() * 20,
      text: text,
      isCritical: isCritical,
      alpha: 1.0,
      decay: 1.5,
      type: 'text'
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'mist' || p.type === 'gas') {
        p.size += dt * 6; // grow slightly
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, offsetX, offsetY) {
    ctx.save();
    for (const p of this.particles) {
      const px = p.x - offsetX;
      const py = p.y - offsetY;

      if (p.type === 'text') {
        ctx.font = p.isCritical ? 'bold 16px "Press Start 2P"' : 'bold 13px "Outfit"';
        ctx.fillStyle = p.isCritical ? `rgba(251, 191, 36, ${p.alpha})` : `rgba(239, 68, 68, ${p.alpha})`;
        ctx.fillText(p.text, px, py);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
