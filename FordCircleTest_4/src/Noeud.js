import Utils from "/src/utils.js";

export default class Noeud {
  constructor(ctx, x, y, r) {
    this.ctx = ctx;
    this.posX = x;
    this.posY = y;
    this.r = r;
    this.color = "#FFFFFF";

    this.velocityX = (Math.random() - 0.5) * 0.5;
    this.velocityY = (Math.random() - 0.5) * 0.5;

    this.strokeGradient1 = null;
    this.strokeGradient2 = null;

    this.lineGradient = null;

    this.interactionDistance = 10;

    this.mouseX;
    this.mouseY;

    this.utils = new Utils();

    this.interactionDistance = 25;
    this.currentDistance = 0;
  }

  draw(mouseX, mouseY) {
    this.mouseX = mouseX;
    this.mouseY = mouseY;

    if (this.currentDistance < this.interactionDistance) {
      //Draw hover style :)
      this.ctx.beginPath();
      this.ctx.fillStyle = this.color;
      this.ctx.globalAlpha = 0.45;
      this.ctx.arc(this.posX, this.posY, this.r, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
    this.drawCircles();

    this.currentDistance = this.utils.distance(
      this.posX,
      this.posY,
      this.mouseX,
      this.mouseY
    );
  }

  move(canvasWidth, canvasHeight) {
    // Met à jour la position
    this.posX += this.velocityX;
    this.posY += this.velocityY;
    // Empêche de sortir des bords horizontaux
    if (this.posX - this.r < 0 || this.posX + this.r > canvasWidth) {
      this.velocityX *= -1;
      this.posX = Math.max(this.r, Math.min(canvasWidth - this.r, this.posX));
    }
    // Empêche de sortir des bords verticaux
    if (this.posY - this.r < 0 || this.posY + this.r > canvasHeight) {
      this.velocityY *= -1;
      this.posY = Math.max(this.r, Math.min(canvasHeight - this.r, this.posY));
    }
  }

  drawCircles() {
    this.strokeGradient1 = this.ctx.createLinearGradient(
      0,
      this.posY,
      0,
      this.posY + this.r * 2
    );
    this.strokeGradient1.addColorStop(0.0, "#000000");
    this.strokeGradient1.addColorStop(0.37, "#FFFFFF");
    this.strokeGradient1.addColorStop(1.0, "#FFFFFF");

    this.strokeGradient2 = this.ctx.createLinearGradient(
      0,
      this.posY,
      0,
      this.posY + this.r * 2
    );
    this.strokeGradient2.addColorStop(0.0, "#FFFFFF");
    this.strokeGradient2.addColorStop(0.37, "#000000");
    this.strokeGradient2.addColorStop(1.0, "#000000");

    // Cercle 1
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.strokeGradient1;
    this.ctx.lineWidth = 1;
    this.ctx.arc(this.posX, this.posY, this.r, 0, Math.PI * 2);
    this.ctx.stroke();

    //inerCercle1
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.strokeGradient2;
    this.ctx.arc(this.posX, this.posY, this.r - 1, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  isMouseNear(mouseX, mouseY) {
    const dist = this.utils.distance(this.posX, this.posY, mouseX, mouseY);
    return dist < this.interactionDistance;
  }
}
