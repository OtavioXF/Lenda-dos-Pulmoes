export class AssetGenerator {
  constructor() {
    this.cache = {};
  }

  createCanvas(width, height) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx };
  }

  // Utility: draw pixel rect with shadow
  px(ctx, x, y, w, h, color, shadowColor = null) {
    if (shadowColor) {
      ctx.fillStyle = shadowColor;
      ctx.fillRect(x, y + 1, w, h);
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  generateAll() {
    return {
      player: this.generatePlayerSprites(),
      npcs: this.generateNPCSprites(),
      bosses: this.generateBossSprites(),
      houses: this.generateModularHouseParts(),
      environment: this.generateEnvironmentAssets(),
      tiles: this.generateTileAssets(),
      furniture: this.generateFurnitureAssets(),
      arenaDecor: this.generateArenaAssets()
    };
  }

  // ========================
  // 1. PROTAGONIST SPRITESHEET - Detailed 32x32 character
  // ========================
  generatePlayerSprites() {
    const W = 32, H = 32;
    const { canvas, ctx } = this.createCanvas(W * 4, H * 8);

    const drawChar = (fx, fy, dir, frame, inhaler = false, attacking = false) => {
      const cx = fx + 16, cy = fy + 16;
      const bob = (frame % 2 === 0) ? -1 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 13, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots
      const legOff = (frame % 2 === 0) ? -2 : 2;
      this.px(ctx, cx - 5, cy + 8 + bob, 4, 6, '#4a3728', '#3a2a1a');
      this.px(ctx, cx + 1, cy + 8 + bob + (dir !== 'idle' ? legOff * 0.3 : 0), 4, 6, '#4a3728', '#3a2a1a');

      // Pants
      this.px(ctx, cx - 5, cy + 5 + bob, 4, 4, '#334155', '#1e293b');
      this.px(ctx, cx + 1, cy + 5 + bob, 4, 4, '#334155', '#1e293b');

      // Tunic body
      this.px(ctx, cx - 7, cy - 4 + bob, 14, 10, '#0284c7', '#075985');
      // Belt
      this.px(ctx, cx - 6, cy + 4 + bob, 12, 2, '#a16207', '#78350f');
      // Belt buckle
      this.px(ctx, cx - 1, cy + 4 + bob, 2, 2, '#fbbf24');

      // Cape tail
      if (dir === 'up') {
        this.px(ctx, cx - 6, cy + bob, 12, 8, '#0369a1', '#064e7c');
      }

      // Head
      this.px(ctx, cx - 6, cy - 11 + bob, 12, 8, '#f5deb3', '#d4a574');
      // Hair
      this.px(ctx, cx - 7, cy - 14 + bob, 14, 5, '#d97706', '#b45309');
      this.px(ctx, cx - 7, cy - 12 + bob, 2, 6, '#d97706'); // side hair L
      this.px(ctx, cx + 5, cy - 12 + bob, 2, 6, '#d97706'); // side hair R

      // Eyes
      if (dir !== 'up') {
        this.px(ctx, cx - 4, cy - 8 + bob, 2, 2, '#1e293b');
        this.px(ctx, cx + 2, cy - 8 + bob, 2, 2, '#1e293b');
        // Eye shine
        this.px(ctx, cx - 4, cy - 8 + bob, 1, 1, '#60a5fa');
        this.px(ctx, cx + 2, cy - 8 + bob, 1, 1, '#60a5fa');
        // Mouth
        this.px(ctx, cx - 1, cy - 5 + bob, 2, 1, '#c4956a');
      }

      // Arms
      const armColor = '#0284c7', armShadow = '#075985';
      if (attacking) {
        // Sword slash
        if (dir === 'right' || dir === 'idle') {
          this.px(ctx, cx + 6, cy - 3 + bob, 4, 4, armColor, armShadow);
          // Sword
          this.px(ctx, cx + 9, cy - 8 + bob, 3, 14, '#94a3b8', '#64748b');
          this.px(ctx, cx + 10, cy - 8 + bob, 1, 4, '#e2e8f0');
          // Slash glow
          ctx.strokeStyle = 'rgba(56,189,248,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx + 10, cy + bob, 12, -1.2, 1.2);
          ctx.stroke();
        } else {
          this.px(ctx, cx - 10, cy - 3 + bob, 4, 4, armColor, armShadow);
          this.px(ctx, cx - 12, cy - 8 + bob, 3, 14, '#94a3b8', '#64748b');
          ctx.strokeStyle = 'rgba(56,189,248,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx - 10, cy + bob, 12, Math.PI - 1.2, Math.PI + 1.2);
          ctx.stroke();
        }
      } else if (inhaler) {
        // Left arm normal
        this.px(ctx, cx - 8, cy - 2 + bob, 3, 6, armColor, armShadow);
        // Right arm holding inhaler
        this.px(ctx, cx + 5, cy - 4 + bob, 3, 5, armColor, armShadow);
        // Inhaler L-shape
        this.px(ctx, cx + 4, cy - 6 + bob, 6, 3, '#38bdf8', '#0ea5e9');
        this.px(ctx, cx + 7, cy - 10 + bob, 3, 6, '#38bdf8', '#0ea5e9');
        // Aerosol puff cloud
        ctx.fillStyle = 'rgba(186,230,253,0.7)';
        ctx.beginPath();
        ctx.arc(cx + 11, cy - 10 + bob, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 14, cy - 12 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        this.px(ctx, cx - 8, cy - 2 + bob, 3, 6, armColor, armShadow);
        this.px(ctx, cx + 5, cy - 2 + bob, 3, 6, armColor, armShadow);
      }
    };

    const dirs = ['idle', 'down', 'up', 'left', 'right'];
    // Rows 0-4: directions, Row 5: inhaler, Row 6: attack, Row 7: dash
    for (let row = 0; row < 5; row++) {
      for (let f = 0; f < 4; f++) {
        drawChar(f * W, row * H, dirs[row], f, false, false);
      }
    }
    // Row 5: Inhaler
    for (let f = 0; f < 4; f++) {
      drawChar(f * W, 5 * H, 'idle', f, true, false);
    }
    // Row 6: Attack
    for (let f = 0; f < 4; f++) {
      drawChar(f * W, 6 * H, f < 2 ? 'right' : 'left', f, false, true);
    }
    // Row 7: Dash
    for (let f = 0; f < 4; f++) {
      drawChar(f * W, 7 * H, 'right', f, false, false);
      // Blur trail
      ctx.fillStyle = 'rgba(56,189,248,0.3)';
      ctx.fillRect(f * W, 7 * H + 4, 32, 24);
    }

    return canvas;
  }

  // ========================
  // 2. NPC SPRITES - Dra Alveola, Mestre Traqueu, Scholar Bronko
  // ========================
  generateNPCSprites() {
    const { canvas, ctx } = this.createCanvas(128, 64);

    // NPC 1: Dra. Alveola (0,0) 32x32
    const a = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(16, 30, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    a(6, 16, 20, 14, '#ffffff'); // White lab coat
    a(8, 14, 16, 4, '#f0abfc'); // Pink scarf
    a(8, 8, 16, 8, '#f5deb3'); // Head skin
    a(6, 5, 20, 5, '#ec4899'); // Pink hair
    a(10, 11, 2, 2, '#1e293b'); // Left eye
    a(18, 11, 2, 2, '#1e293b'); // Right eye
    a(14, 14, 2, 1, '#c4956a'); // Mouth
    a(22, 18, 3, 8, '#ef4444'); // Stethoscope
    a(7, 28, 6, 4, '#64748b'); // Left shoe
    a(17, 28, 6, 4, '#64748b'); // Right shoe
    // Cross symbol
    a(12, 20, 6, 2, '#ef4444');
    a(14, 18, 2, 6, '#ef4444');

    // NPC 2: Mestre Traqueu (32,0) 32x32
    const ox2 = 32;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(ox2 + 16, 30, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    a(ox2 + 6, 14, 20, 16, '#1e3a8a'); // Blue robe
    a(ox2 + 4, 16, 4, 12, '#1e3a8a'); // Left sleeve
    a(ox2 + 24, 16, 4, 12, '#1e3a8a'); // Right sleeve
    a(ox2 + 8, 6, 16, 10, '#f5deb3'); // Head skin
    a(ox2 + 6, 3, 20, 5, '#94a3b8'); // Grey hair/hat
    a(ox2 + 8, 12, 16, 6, '#cbd5e1'); // White beard
    a(ox2 + 12, 9, 2, 2, '#1e293b'); // Left eye
    a(ox2 + 18, 9, 2, 2, '#1e293b'); // Right eye
    a(ox2 + 26, 4, 3, 28, '#a16207'); // Staff
    a(ox2 + 25, 2, 5, 4, '#fbbf24'); // Staff gem

    // NPC 3: Scholar Bronko (64,0) 32x32
    const ox3 = 64;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(ox3 + 16, 30, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    a(ox3 + 6, 14, 20, 14, '#059669'); // Green tunic
    a(ox3 + 8, 6, 16, 10, '#f5deb3'); // Head
    a(ox3 + 4, 3, 24, 5, '#78350f'); // Brown hat wide
    a(ox3 + 8, 1, 16, 4, '#78350f'); // Hat top
    a(ox3 + 12, 9, 2, 2, '#1e293b'); // Left eye
    a(ox3 + 18, 9, 2, 2, '#1e293b'); // Right eye
    a(ox3 + 4, 16, 4, 8, '#059669'); // Sleeve
    a(ox3 + 24, 16, 4, 8, '#059669'); // Sleeve
    a(ox3 + 24, 18, 6, 6, '#fbbf24'); // Book in hand
    a(ox3 + 8, 28, 5, 3, '#64748b');
    a(ox3 + 19, 28, 5, 3, '#64748b');

    return canvas;
  }

  // ========================
  // 3. BOSS SPRITES - All 6 Guardians, detailed and menacing
  // ========================
  generateBossSprites() {
    const bosses = {};
    const S = 128;

    // --- TRAQUEON (Wind Elemental Titan) ---
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // Outer wind aura
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(56,189,248,0.9)');
      grad.addColorStop(0.6, 'rgba(14,165,233,0.5)');
      grad.addColorStop(1, 'rgba(3,105,161,0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);
      // Core body
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath(); ctx.arc(64, 64, 38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(64, 64, 30, 0, Math.PI * 2); ctx.fill();
      // Wind ring marks
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(64, 64, 42, a, a + 0.6);
        ctx.stroke();
      }
      // Menacing eyes (glowing)
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(46, 52, 12, 8);
      ctx.fillRect(70, 52, 12, 8);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(50, 54, 6, 5);
      ctx.fillRect(74, 54, 6, 5);
      // Angry eyebrows
      ctx.fillStyle = '#075985';
      ctx.fillRect(44, 48, 14, 3);
      ctx.fillRect(70, 48, 14, 3);
      // Mouth
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(54, 70, 20, 4);
      ctx.fillRect(56, 74, 16, 2);
      bosses.traqueon = canvas;
    }

    // --- BRONKAR (Branching Wind Dragon) ---
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 55);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(0.5, '#0284c7');
      grad.addColorStop(1, 'rgba(2,132,199,0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);
      // Main body
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(30, 35, 68, 55);
      // Branching wings
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(30, 50); ctx.lineTo(5, 20); ctx.lineTo(20, 55);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(98, 50); ctx.lineTo(123, 20); ctx.lineTo(108, 55);
      ctx.closePath(); ctx.fill();
      // Secondary branches
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(20, 45); ctx.lineTo(0, 50); ctx.lineTo(15, 55);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(108, 45); ctx.lineTo(128, 50); ctx.lineTo(113, 55);
      ctx.closePath(); ctx.fill();
      // Core
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(64, 60, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fb7185';
      ctx.beginPath(); ctx.arc(64, 60, 10, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(48, 48, 8, 6);
      ctx.fillRect(72, 48, 8, 6);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(50, 49, 4, 4);
      ctx.fillRect(74, 49, 4, 4);
      bosses.bronkar = canvas;
    }

    // --- BRONQUIUS (Rapid Phantom) ---
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const grad = ctx.createRadialGradient(64, 55, 5, 64, 55, 55);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, 'rgba(6,182,212,0.05)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);
      // Sharp diamond body
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.moveTo(64, 12); ctx.lineTo(110, 60);
      ctx.lineTo(64, 95); ctx.lineTo(18, 60);
      ctx.closePath(); ctx.fill();
      // Inner glow
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(64, 25); ctx.lineTo(95, 60);
      ctx.lineTo(64, 85); ctx.lineTo(33, 60);
      ctx.closePath(); ctx.fill();
      // Speed lines
      ctx.strokeStyle = '#a5f3fc';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(20 + i * 8, 15 + i * 5);
        ctx.lineTo(10 + i * 6, 30 + i * 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(100 - i * 8, 15 + i * 5);
        ctx.lineTo(110 - i * 6, 30 + i * 8);
        ctx.stroke();
      }
      // Eye slit
      ctx.fillStyle = '#ecfeff';
      ctx.fillRect(50, 50, 28, 6);
      ctx.fillStyle = '#164e63';
      ctx.fillRect(56, 51, 6, 4);
      ctx.fillRect(66, 51, 6, 4);
      bosses.bronquius = canvas;
    }

    // --- ALVEOR (Gas Exchange Entity) ---
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      // O2 bubbles
      ctx.fillStyle = 'rgba(34,197,94,0.35)';
      ctx.beginPath(); ctx.arc(40, 40, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(34,197,94,0.7)';
      ctx.beginPath(); ctx.arc(40, 40, 20, 0, Math.PI * 2); ctx.fill();
      // CO2 bubbles
      ctx.fillStyle = 'rgba(168,85,247,0.35)';
      ctx.beginPath(); ctx.arc(88, 40, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(168,85,247,0.7)';
      ctx.beginPath(); ctx.arc(88, 40, 20, 0, Math.PI * 2); ctx.fill();
      // Central capillary core
      ctx.fillStyle = 'rgba(220,38,38,0.6)';
      ctx.beginPath(); ctx.arc(64, 72, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(64, 72, 18, 0, Math.PI * 2); ctx.fill();
      // Eyes across all three
      ctx.fillStyle = '#fff';
      ctx.fillRect(32, 36, 6, 6); ctx.fillRect(44, 36, 6, 6);
      ctx.fillRect(80, 36, 6, 6); ctx.fillRect(92, 36, 6, 6);
      ctx.fillRect(56, 68, 6, 6); ctx.fillRect(70, 68, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(34, 38, 3, 3); ctx.fillRect(46, 38, 3, 3);
      ctx.fillRect(82, 38, 3, 3); ctx.fillRect(94, 38, 3, 3);
      ctx.fillRect(58, 70, 3, 3); ctx.fillRect(72, 70, 3, 3);
      // O2/CO2 labels
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#bbf7d0'; ctx.fillText('O₂', 34, 58);
      ctx.fillStyle = '#e9d5ff'; ctx.fillText('CO₂', 78, 58);
      bosses.alveor = canvas;
    }

    // --- DIAFRAGON (Muscular Piston) ---
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      const grad = ctx.createLinearGradient(0, 20, 0, 110);
      grad.addColorStop(0, '#fecaca');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fillRect(16, 40, 96, 55);
      // Piston upper
      ctx.fillStyle = '#f87171';
      ctx.fillRect(28, 16, 72, 35);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(32, 20, 64, 8);
      // Pressure veins
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(30 + i * 18, 45);
        ctx.lineTo(25 + i * 18, 90);
        ctx.stroke();
      }
      // Glowing core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(64, 40, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(64, 40, 9, 0, Math.PI * 2); ctx.fill();
      // Eyes in core
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(56, 36, 5, 5);
      ctx.fillRect(67, 36, 5, 5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(57, 37, 2, 2);
      ctx.fillRect(68, 37, 2, 2);
      bosses.diafragon = canvas;
    }

    // --- GUARDIÃO FINAL (Supreme Master) ---
    {
      const { canvas, ctx } = this.createCanvas(140, 140);
      const cx = 70, cy = 70;
      // Outer halo
      const haloGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 65);
      haloGrad.addColorStop(0, 'rgba(251,191,36,0.9)');
      haloGrad.addColorStop(0.5, 'rgba(245,158,11,0.4)');
      haloGrad.addColorStop(1, 'rgba(217,119,6,0.05)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, 140, 140);
      // Wing rays
      ctx.strokeStyle = 'rgba(251,191,36,0.6)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25);
        ctx.lineTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
        ctx.stroke();
      }
      // Dark core
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
      // Inner core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
      // Crown
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 30); ctx.lineTo(cx - 12, cy - 42);
      ctx.lineTo(cx - 6, cy - 32); ctx.lineTo(cx, cy - 46);
      ctx.lineTo(cx + 6, cy - 32); ctx.lineTo(cx + 12, cy - 42);
      ctx.lineTo(cx + 18, cy - 30);
      ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 10, cy - 6, 8, 8);
      ctx.fillRect(cx + 2, cy - 6, 8, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 8, cy - 4, 4, 5);
      ctx.fillRect(cx + 4, cy - 4, 4, 5);
      bosses.guardiaoFinal = canvas;
    }

    return bosses;
  }

  // ========================
  // 4. MODULAR HOUSE PARTS
  // ========================
  generateModularHouseParts() {
    const parts = {};
    const wallColors = [
      { main: '#f1f5f9', shadow: '#cbd5e1', trim: '#94a3b8' }, // White
      { main: '#fef9c3', shadow: '#fde047', trim: '#ca8a04' }, // Yellow
      { main: '#bbf7d0', shadow: '#86efac', trim: '#16a34a' }, // Green
      { main: '#bfdbfe', shadow: '#93c5fd', trim: '#2563eb' }, // Blue
      { main: '#fde68a', shadow: '#fcd34d', trim: '#b45309' }, // Beige
    ];

    parts.walls = wallColors.map(wc => {
      const { canvas, ctx } = this.createCanvas(64, 64);
      // Main wall fill
      ctx.fillStyle = wc.main;
      ctx.fillRect(0, 0, 64, 64);
      // Brick lines
      ctx.strokeStyle = wc.shadow;
      ctx.lineWidth = 1;
      for (let y = 0; y < 64; y += 16) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke();
        const off = (y / 16) % 2 === 0 ? 0 : 16;
        for (let x = off; x < 64; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke();
        }
      }
      // Bottom trim
      ctx.fillStyle = wc.trim;
      ctx.fillRect(0, 60, 64, 4);
      return canvas;
    });

    const roofColors = [
      { main: '#991b1b', light: '#dc2626', shadow: '#7f1d1d' },
      { main: '#1e3a8a', light: '#3b82f6', shadow: '#1e2563' },
      { main: '#334155', light: '#64748b', shadow: '#1e293b' }
    ];

    parts.roofs = roofColors.map(rc => {
      const { canvas, ctx } = this.createCanvas(96, 48);
      // Main roof shape
      ctx.fillStyle = rc.main;
      ctx.beginPath();
      ctx.moveTo(48, 0); ctx.lineTo(96, 48); ctx.lineTo(0, 48);
      ctx.closePath(); ctx.fill();
      // Highlight
      ctx.fillStyle = rc.light;
      ctx.beginPath();
      ctx.moveTo(48, 0); ctx.lineTo(72, 24); ctx.lineTo(24, 24);
      ctx.closePath(); ctx.fill();
      // Shingle lines
      ctx.strokeStyle = rc.shadow;
      ctx.lineWidth = 1;
      for (let y = 12; y < 48; y += 12) {
        const ratio = y / 48;
        const leftX = 48 - ratio * 48;
        const rightX = 48 + ratio * 48;
        ctx.beginPath(); ctx.moveTo(leftX, y); ctx.lineTo(rightX, y); ctx.stroke();
      }
      return canvas;
    });

    // Animated Doors
    const doorCanvas = this.createCanvas(128, 32);
    const dCtx = doorCanvas.ctx;
    // Frame 0: CLOSED
    dCtx.fillStyle = '#78350f'; dCtx.fillRect(6, 2, 20, 28);
    dCtx.fillStyle = '#92400e'; dCtx.fillRect(8, 4, 7, 12);
    dCtx.fillStyle = '#92400e'; dCtx.fillRect(17, 4, 7, 12);
    dCtx.fillStyle = '#fbbf24'; dCtx.fillRect(21, 17, 3, 3); // Knob
    dCtx.fillStyle = '#451a03'; dCtx.fillRect(6, 0, 20, 2); // Frame top

    // Frame 1: OPENING
    dCtx.fillStyle = '#0f172a'; dCtx.fillRect(38, 2, 10, 28);
    dCtx.fillStyle = '#78350f'; dCtx.fillRect(48, 2, 10, 28);
    dCtx.fillStyle = '#451a03'; dCtx.fillRect(38, 0, 20, 2);

    // Frame 2: OPEN
    dCtx.fillStyle = '#0f172a'; dCtx.fillRect(70, 2, 20, 28);
    dCtx.fillStyle = '#78350f'; dCtx.fillRect(88, 2, 4, 28);
    dCtx.fillStyle = '#451a03'; dCtx.fillRect(70, 0, 22, 2);

    // Frame 3: CLOSING
    dCtx.fillStyle = '#0f172a'; dCtx.fillRect(102, 2, 6, 28);
    dCtx.fillStyle = '#78350f'; dCtx.fillRect(108, 2, 14, 28);
    dCtx.fillStyle = '#451a03'; dCtx.fillRect(102, 0, 20, 2);

    parts.doorSheet = doorCanvas.canvas;
    return parts;
  }

  // ========================
  // 5. ENVIRONMENT ASSETS
  // ========================
  generateEnvironmentAssets() {
    const env = {};

    // Tree Trunk with bark detail
    const treeTrunk = this.createCanvas(32, 32);
    const tt = treeTrunk.ctx;
    tt.fillStyle = '#78350f';
    tt.fillRect(10, 2, 12, 28);
    tt.fillStyle = '#92400e';
    tt.fillRect(12, 4, 3, 24);
    tt.fillStyle = '#451a03';
    tt.fillRect(18, 6, 2, 8);
    tt.fillRect(12, 16, 2, 6);
    // Roots
    tt.fillStyle = '#78350f';
    tt.fillRect(7, 26, 5, 4);
    tt.fillRect(20, 26, 5, 4);
    env.treeTrunk = treeTrunk.canvas;

    // Tree Crown with depth
    const treeCrown = this.createCanvas(64, 64);
    const tc = treeCrown.ctx;
    // Shadow layer
    tc.fillStyle = '#14532d';
    tc.beginPath(); tc.arc(34, 36, 28, 0, Math.PI * 2); tc.fill();
    // Main foliage
    tc.fillStyle = '#15803d';
    tc.beginPath(); tc.arc(32, 32, 26, 0, Math.PI * 2); tc.fill();
    // Highlight cluster
    tc.fillStyle = '#22c55e';
    tc.beginPath(); tc.arc(26, 24, 16, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = '#4ade80';
    tc.beginPath(); tc.arc(22, 20, 8, 0, Math.PI * 2); tc.fill();
    // Small leaves
    tc.fillStyle = '#166534';
    tc.beginPath(); tc.arc(42, 38, 10, 0, Math.PI * 2); tc.fill();
    env.treeCrown = treeCrown.canvas;

    // Flowers with stems
    const flowers = this.createCanvas(48, 16);
    const fc = flowers.ctx;
    const flowerColors = ['#ef4444', '#facc15', '#a78bfa'];
    flowerColors.forEach((c, i) => {
      // Stem
      fc.fillStyle = '#15803d';
      fc.fillRect(i * 16 + 7, 9, 2, 7);
      // Petals
      fc.fillStyle = c;
      fc.beginPath(); fc.arc(i * 16 + 8, 7, 4, 0, Math.PI * 2); fc.fill();
      // Center
      fc.fillStyle = '#fbbf24';
      fc.beginPath(); fc.arc(i * 16 + 8, 7, 2, 0, Math.PI * 2); fc.fill();
    });
    env.flowers = flowers.canvas;

    // Chest closed + open
    const chest = this.createCanvas(64, 32);
    const cc = chest.ctx;
    // Closed chest
    cc.fillStyle = '#92400e'; cc.fillRect(4, 10, 24, 16);
    cc.fillStyle = '#b45309'; cc.fillRect(5, 8, 22, 4);
    cc.fillStyle = '#fbbf24'; cc.fillRect(14, 14, 4, 6); // Lock
    cc.fillStyle = '#78350f'; cc.fillRect(4, 24, 24, 2);
    // Open chest
    cc.fillStyle = '#92400e'; cc.fillRect(36, 14, 24, 12);
    cc.fillStyle = '#b45309'; cc.fillRect(37, 4, 22, 10); // Lid up
    cc.fillStyle = '#fbbf24'; cc.fillRect(36, 12, 24, 3); // Gold rim
    // Sparkle
    cc.fillStyle = '#fef08a';
    cc.fillRect(44, 7, 2, 2);
    cc.fillRect(50, 5, 2, 2);
    cc.fillRect(47, 3, 2, 2);
    env.chest = chest.canvas;

    // Lamp post
    const lamp = this.createCanvas(16, 32);
    const lc = lamp.ctx;
    lc.fillStyle = '#64748b'; lc.fillRect(6, 10, 4, 22);
    lc.fillStyle = '#fbbf24';
    lc.beginPath(); lc.arc(8, 8, 5, 0, Math.PI * 2); lc.fill();
    lc.fillStyle = '#fef9c3';
    lc.beginPath(); lc.arc(8, 8, 3, 0, Math.PI * 2); lc.fill();
    env.lamp = lamp.canvas;

    // Well
    const well = this.createCanvas(32, 32);
    const wc = well.ctx;
    wc.fillStyle = '#64748b'; wc.fillRect(4, 12, 24, 18);
    wc.fillStyle = '#475569'; wc.fillRect(6, 14, 20, 14);
    wc.fillStyle = '#0c4a6e'; wc.fillRect(8, 16, 16, 10); // Water
    wc.fillStyle = '#78350f'; wc.fillRect(2, 4, 3, 14);
    wc.fillRect(27, 4, 3, 14);
    wc.fillRect(2, 3, 28, 3); // Roof beam
    wc.fillStyle = '#a16207';
    wc.fillRect(14, 6, 4, 10); // Rope
    env.well = well.canvas;

    return env;
  }

  // ========================
  // 6. TILES WITH TEXTURE
  // ========================
  generateTileAssets() {
    const tiles = {};

    // Grass with detail
    const grass = this.createCanvas(32, 32);
    const gc = grass.ctx;
    gc.fillStyle = '#16a34a'; gc.fillRect(0, 0, 32, 32);
    // Grass blades variation
    const grassColors = ['#22c55e', '#15803d', '#4ade80'];
    for (let i = 0; i < 12; i++) {
      gc.fillStyle = grassColors[i % 3];
      const rx = (i * 7 + 3) % 30;
      const ry = (i * 11 + 5) % 28;
      gc.fillRect(rx, ry, 1, 3);
    }
    // Edge detail
    gc.fillStyle = '#14532d';
    gc.fillRect(0, 31, 32, 1);
    gc.fillRect(31, 0, 1, 32);
    tiles.grass = grass.canvas;

    // Stone floor with grout
    const stone = this.createCanvas(32, 32);
    const sc = stone.ctx;
    sc.fillStyle = '#334155'; sc.fillRect(0, 0, 32, 32);
    sc.fillStyle = '#475569'; sc.fillRect(1, 1, 14, 14);
    sc.fillStyle = '#475569'; sc.fillRect(17, 1, 14, 14);
    sc.fillStyle = '#475569'; sc.fillRect(1, 17, 14, 14);
    sc.fillStyle = '#475569'; sc.fillRect(17, 17, 14, 14);
    // Grout lines
    sc.fillStyle = '#1e293b';
    sc.fillRect(0, 15, 32, 2);
    sc.fillRect(15, 0, 2, 32);
    // Cracks
    sc.fillStyle = '#1e293b';
    sc.fillRect(5, 5, 1, 4);
    sc.fillRect(22, 22, 3, 1);
    tiles.stone = stone.canvas;

    // Wooden floor (for interiors)
    const wood = this.createCanvas(32, 32);
    const wctx = wood.ctx;
    wctx.fillStyle = '#a16207'; wctx.fillRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 8) {
      const off = (y / 8) % 2 === 0 ? 0 : 10;
      wctx.fillStyle = '#b45309';
      wctx.fillRect(off, y, 20, 7);
      wctx.fillStyle = '#92400e';
      wctx.fillRect(off + 20, y, 12, 7);
      // Grain lines
      wctx.fillStyle = '#78350f';
      wctx.fillRect(off + 4, y + 3, 8, 1);
    }
    tiles.wood = wood.canvas;

    // Arena floor (dark stone for boss arenas)
    const arena = this.createCanvas(32, 32);
    const ac = arena.ctx;
    ac.fillStyle = '#1e293b'; ac.fillRect(0, 0, 32, 32);
    ac.fillStyle = '#334155'; ac.fillRect(1, 1, 14, 14);
    ac.fillStyle = '#334155'; ac.fillRect(17, 1, 14, 14);
    ac.fillStyle = '#334155'; ac.fillRect(1, 17, 14, 14);
    ac.fillStyle = '#334155'; ac.fillRect(17, 17, 14, 14);
    ac.fillStyle = '#0f172a';
    ac.fillRect(0, 15, 32, 2);
    ac.fillRect(15, 0, 2, 32);
    // Subtle rune marks
    ac.fillStyle = 'rgba(56,189,248,0.15)';
    ac.fillRect(6, 6, 4, 4);
    ac.fillRect(22, 22, 4, 4);
    tiles.arena = arena.canvas;

    // Dirt
    const dirt = this.createCanvas(32, 32);
    const dc = dirt.ctx;
    dc.fillStyle = '#78350f'; dc.fillRect(0, 0, 32, 32);
    dc.fillStyle = '#92400e';
    for (let i = 0; i < 10; i++) {
      dc.fillRect((i * 7 + 2) % 28, (i * 11 + 3) % 28, 3, 3);
    }
    tiles.dirt = dirt.canvas;

    // Water
    const water = this.createCanvas(32, 32);
    const wtx = water.ctx;
    wtx.fillStyle = '#0284c7'; wtx.fillRect(0, 0, 32, 32);
    wtx.fillStyle = '#38bdf8';
    wtx.fillRect(4, 8, 12, 2);
    wtx.fillRect(18, 20, 10, 2);
    wtx.fillStyle = '#7dd3fc';
    wtx.fillRect(8, 14, 6, 1);
    wtx.fillRect(22, 6, 6, 1);
    tiles.water = water.canvas;

    return tiles;
  }

  // ========================
  // 7. FURNITURE for house interiors
  // ========================
  generateFurnitureAssets() {
    const furn = {};

    // Table
    const table = this.createCanvas(32, 32);
    const tc = table.ctx;
    tc.fillStyle = '#92400e'; tc.fillRect(4, 8, 24, 4);
    tc.fillStyle = '#78350f';
    tc.fillRect(6, 12, 3, 16);
    tc.fillRect(23, 12, 3, 16);
    tc.fillStyle = '#a16207'; tc.fillRect(4, 6, 24, 3);
    furn.table = table.canvas;

    // Bed
    const bed = this.createCanvas(32, 48);
    const bc = bed.ctx;
    bc.fillStyle = '#78350f'; bc.fillRect(2, 4, 28, 40);
    bc.fillStyle = '#bfdbfe'; bc.fillRect(4, 6, 24, 30);
    bc.fillStyle = '#e0f2fe'; bc.fillRect(4, 6, 24, 10);
    bc.fillStyle = '#93c5fd'; bc.fillRect(6, 8, 8, 6);
    bc.fillRect(18, 8, 8, 6);
    bc.fillStyle = '#451a03';
    bc.fillRect(2, 0, 28, 5);
    furn.bed = bed.canvas;

    // Bookshelf
    const shelf = this.createCanvas(32, 32);
    const shc = shelf.ctx;
    shc.fillStyle = '#78350f'; shc.fillRect(2, 0, 28, 32);
    // Shelves
    shc.fillStyle = '#451a03';
    shc.fillRect(4, 10, 24, 2);
    shc.fillRect(4, 22, 24, 2);
    // Books
    const bookColors = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7'];
    for (let s = 0; s < 3; s++) {
      const sy = s * 12;
      for (let b = 0; b < 4; b++) {
        shc.fillStyle = bookColors[(s * 4 + b) % bookColors.length];
        shc.fillRect(5 + b * 6, sy + 1, 5, 9);
      }
    }
    furn.bookshelf = shelf.canvas;

    // Potion bottle
    const potion = this.createCanvas(16, 16);
    const pc = potion.ctx;
    pc.fillStyle = '#6d28d9'; pc.fillRect(5, 6, 6, 8);
    pc.fillStyle = '#8b5cf6';
    pc.beginPath(); pc.arc(8, 6, 4, 0, Math.PI * 2); pc.fill();
    pc.fillStyle = '#a78bfa';
    pc.fillRect(7, 2, 2, 4);
    furn.potion = potion.canvas;

    // Rug
    const rug = this.createCanvas(48, 32);
    const rc = rug.ctx;
    rc.fillStyle = '#7c2d12';
    rc.beginPath(); rc.ellipse(24, 16, 22, 14, 0, 0, Math.PI * 2); rc.fill();
    rc.fillStyle = '#9a3412';
    rc.beginPath(); rc.ellipse(24, 16, 16, 10, 0, 0, Math.PI * 2); rc.fill();
    rc.fillStyle = '#ea580c';
    rc.beginPath(); rc.ellipse(24, 16, 8, 5, 0, 0, Math.PI * 2); rc.fill();
    furn.rug = rug.canvas;

    return furn;
  }

  // ========================
  // 8. ARENA DECOR
  // ========================
  generateArenaAssets() {
    const ad = {};

    // Pillar
    const pillar = this.createCanvas(24, 48);
    const pc = pillar.ctx;
    pc.fillStyle = '#475569'; pc.fillRect(4, 4, 16, 40);
    pc.fillStyle = '#64748b'; pc.fillRect(6, 6, 12, 36);
    pc.fillStyle = '#334155'; pc.fillRect(2, 0, 20, 6);
    pc.fillRect(2, 42, 20, 6);
    // Rune glow
    pc.fillStyle = 'rgba(56,189,248,0.4)';
    pc.fillRect(9, 16, 6, 2);
    pc.fillRect(9, 24, 6, 2);
    pc.fillRect(9, 32, 6, 2);
    ad.pillar = pillar.canvas;

    // Torch
    const torch = this.createCanvas(16, 24);
    const tc = torch.ctx;
    tc.fillStyle = '#78350f'; tc.fillRect(6, 8, 4, 16);
    // Flame
    tc.fillStyle = '#f59e0b';
    tc.beginPath(); tc.arc(8, 6, 5, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = '#fbbf24';
    tc.beginPath(); tc.arc(8, 5, 3, 0, Math.PI * 2); tc.fill();
    tc.fillStyle = '#fef3c7';
    tc.beginPath(); tc.arc(8, 4, 1.5, 0, Math.PI * 2); tc.fill();
    ad.torch = torch.canvas;

    return ad;
  }
}
