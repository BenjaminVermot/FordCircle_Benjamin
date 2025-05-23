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

    this.firstNoeud;
    this.secondNoeud;
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
    this.ctx.lineWidth = 1;
    if (!this.firstNoeud) {
      this.ctx.setLineDash([4, 4]); // [longueur du trait, longueur du vide]
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
}
