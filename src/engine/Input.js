export class Input {
  constructor() {
    this.keys = {};
    this.justPressedKeys = {};
    this.mouse = { x: 0, y: 0, down: false, rightDown: false, click: false };

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.justPressedKeys[code] = true;
      }
      this.keys[code] = true;

      // Prevent scrolling for key shortcuts
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE'].includes(code)) {
        if (document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        this.mouse.click = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isDown(code) {
    if (Array.isArray(code)) {
      return code.some(k => this.keys[k]);
    }
    return !!this.keys[code];
  }

  isJustPressed(code) {
    if (Array.isArray(code)) {
      return code.some(k => this.justPressedKeys[k]);
    }
    return !!this.justPressedKeys[code];
  }

  update() {
    // Reset one-frame triggers
    this.justPressedKeys = {};
    this.mouse.click = false;
  }

  // Key mappings helper
  get moveVector() {
    let dx = 0;
    let dy = 0;

    if (this.isDown(['KeyW', 'ArrowUp'])) dy -= 1;
    if (this.isDown(['KeyS', 'ArrowDown'])) dy += 1;
    if (this.isDown(['KeyA', 'ArrowLeft'])) dx -= 1;
    if (this.isDown(['KeyD', 'ArrowRight'])) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  get isSprint() {
    return this.isDown(['ShiftLeft', 'Space']);
  }

  get isAttack() {
    return this.isJustPressed(['KeyJ']) || this.mouse.click;
  }

  get isHeavyAttack() {
    return this.isJustPressed(['KeyK']) || this.mouse.rightDown;
  }

  get isDash() {
    return this.isJustPressed(['KeyL']);
  }

  get isInhaler() {
    return this.isJustPressed(['KeyQ', 'KeyC', 'ShiftRight']);
  }

  get isInteract() {
    return this.isJustPressed(['KeyE', 'Enter']);
  }
}
