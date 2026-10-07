export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.mapWidth = 2000;
    this.mapHeight = 2000;
    this.lerpSpeed = 0.1;
  }

  setMapSize(w, h) {
    this.mapWidth = w;
    this.mapHeight = h;
  }

  // Teleporta a câmera para o alvo (usado ao trocar de mapa: evita o "deslizar" vindo da posição antiga)
  snapTo(targetX, targetY) {
    this.targetX = targetX - this.viewportWidth / 2;
    this.targetY = targetY - this.viewportHeight / 2;
    this.x = this.targetX;
    this.y = this.targetY;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.update(0);
  }

  follow(targetX, targetY) {
    this.targetX = targetX - this.viewportWidth / 2;
    this.targetY = targetY - this.viewportHeight / 2;
  }

  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(dt) {
    // Smooth Lerp tracking
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;

    // Clamp camera to map bounds
    if (this.mapWidth <= this.viewportWidth) {
      this.x = (this.mapWidth - this.viewportWidth) / 2; // mapa menor que a tela: centraliza
    } else {
      this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.viewportWidth));
    }
    if (this.mapHeight <= this.viewportHeight) {
      this.y = (this.mapHeight - this.viewportHeight) / 2;
    } else {
      this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.viewportHeight));
    }

    // Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  get offsetX() {
    let ox = this.x;
    if (this.shakeIntensity > 0) {
      ox += (Math.random() * 2 - 1) * this.shakeIntensity;
    }
    return ox;
  }

  get offsetY() {
    let oy = this.y;
    if (this.shakeIntensity > 0) {
      oy += (Math.random() * 2 - 1) * this.shakeIntensity;
    }
    return oy;
  }
}
