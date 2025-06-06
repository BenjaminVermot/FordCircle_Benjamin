import * as Tone from "tone";

export default class Handle {
  constructor(ctx, x, y, x2, y2, r) {
    this.ctx = ctx;
    this.posX = x;
    this.posY = y;
    this.posX2 = x2;
    this.posY2 = y2;
    this.r = r;
    this.color = "#000000";

    this.strokeGradient1 = null;
    this.strokeGradient2 = null;

    this.lineGradient = null;

    this.isBeingHovered = false;

    this.firstNoeud;
    this.secondNoeud;

    this.isDestroyed = false;

    this.lineDash = 4;
    this.lineWidth = 1;
  }

  draw() {
    this.drawLine();
  }

  drawLine() {
    this.ctx.globalAlpha = 0.5;
    // Créer un gradient qui suit l'orientation de la ligne
    this.lineGradient = this.ctx.createLinearGradient(
      this.posX,
      this.posY,
      this.posX2,
      this.posY2
    );
    this.lineGradient.addColorStop(0.0, "#000000");
    this.lineGradient.addColorStop(0.3, "#FFFFFF");
    this.lineGradient.addColorStop(0.7, "#FFFFFF");
    this.lineGradient.addColorStop(1.0, "#000000");

    this.ctx.beginPath();
    this.ctx.strokeStyle = this.lineGradient; // applique le gradient à la ligne

    if (this.isDestroyed) {
      this.lineWidth = this.lineWidth - 0.02;
      this.ctx.lineWidth = this.lineWidth;
    } else {
      this.ctx.lineWidth = 1;
    }
    if (!this.firstNoeud) {
      this.ctx.setLineDash([4, 4]); // [longueur du trait, longueur du vide]
    }
    if (this.isBeingHovered) {
      this.ctx.globalAlpha = 1;
      this.ctx.setLineDash([4, 4]); // [longueur du trait, longueur du vide]
      this.ctx.stroke();
    }

    this.ctx.moveTo(this.posX, this.posY);
    this.ctx.lineTo(this.posX2, this.posY2);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Réinitialise pour les autres dessins
    this.ctx.globalAlpha = 1;
  }

  updatePosition() {
    this.posX = this.firstNoeud.posX;
    this.posY = this.firstNoeud.posY;
    if (this.secondNoeud) {
      this.posX2 = this.secondNoeud.posX;
      this.posY2 = this.secondNoeud.posY;
    }
  }

  playSound(effectSampler) {
    let note = "C3"; // Note par défaut
    let duration = "2n"; // Durée par défaut
    let randomPitch = Math.random() * 12 - 6; // Valeur aléatoire entre -6 et +6 demi-tons
    note = Tone.Frequency(note).transpose(randomPitch).toNote(); // Transposer la note
    effectSampler.triggerAttackRelease(note, duration, Tone.now());
  }

  isMouseNearLine(mouseX, mouseY, threshold = 10) {
    // tenchniquement pas compris mais je m'en sers
    const { posX, posY, posX2, posY2 } = this;

    const A = mouseX - posX;
    const B = mouseY - posY;
    const C = posX2 - posX;
    const D = posY2 - posY;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = posX;
      yy = posY;
    } else if (param > 1) {
      xx = posX2;
      yy = posY2;
    } else {
      xx = posX + param * C;
      yy = posY + param * D;
    }

    const dx = mouseX - xx;
    const dy = mouseY - yy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist <= threshold;
  }

  destroy() {
    this.isDestroyed = true;
  }
}
