//import Vector from "@onemorestudio/vectorjs";
import Vector from "/src/Vector.js";
import * as Tone from "tone";

export default class Circle {
  constructor(
    ctx,
    x,
    y,
    r,
    sampler,
    compressor,
    masterVolume,
    sampler2,
    bassSampler
  ) {
    this.ctx = ctx;
    this.posX = x;
    this.posY = y;

    this.radius = r;
    // this.originalRadius = r;

    this.position = new Vector(this.posX, this.posY);
    this.vel = new Vector(0, 0);
    this.acc = new Vector(0, 0);
    this.mass = this.radius * this.radius;
    this.friction = 0.998;

    this.isAnimating = false;
    this.setup();
    this.isBaseCircle = false;

    this.sampler = sampler;
    this.sampler2 = sampler2;
    this.bassSampler = bassSampler;

    this.strokeColor = ["#000000"];
    this.colors = [
      "#000000",
      "#262626",
      "#323232",
      "#1D1D1D",
      "#000000",
      "#000000",
    ];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.hp = 8;

    this.canCollide = false;

    this.strokeGradient = null;
    this.isExploding = false;

    this.chordTemplates = [
      ["C", "E", "G", "B", "F#"], // Cmaj7(#11)
      ["D", "F#", "A", "C", "E"], // D7(9,13)
      ["E", "G", "B", "D", "A"], // Em11
      ["F#", "A", "C", "E", "B"], // F#m7b5(add13)
      ["G", "B", "D", "F#", "A"], // Gmaj9
      ["A", "C", "E", "G", "D"], // Am11
      ["B", "D", "F#", "A", "E"], // Bm7(add11,13)

      // F Lydien : F G A B C D E
      ["F", "A", "C", "E", "B"], // Fmaj7(#11)
      ["G", "B", "D", "F", "A"], // Gm9
      ["A", "C", "E", "G", "D"], // Am11
      ["B", "D", "F", "A", "E"], // Bm7b5(add13)
      ["C", "E", "G", "B", "D"], // Cmaj9
      ["D", "F", "A", "C", "G"], // Dm11
      ["E", "G", "B", "D", "A"], // Em11

      // G Lydien : G A B C# D E F#
      ["G", "B", "D", "F#", "C#"], // Gmaj7(#11,13)
      ["A", "C#", "E", "G", "D"], // A7(13)
      ["B", "D", "F#", "A", "E"], // Bm9
      ["C#", "E", "G", "B", "F#"], // C#m7b5(add13)
      ["D", "F#", "A", "C#", "E"], // Dmaj9
      ["E", "G", "B", "D", "A"], // Em11
      ["F#", "A", "C#", "E", "B"],
    ];

    this.selectedChordTemplate =
      this.chordTemplates[
        Math.floor(Math.random() * this.chordTemplates.length)
      ];
    this.currentNoteIndex = 0;

    this.notes = [
      "C1",
      "F1",
      "A1",
      "C2",
      "D2",
      "E2",
      "F2",
      "G2",
      "A2",
      "B2",
      "C3",
    ];
    this.compressor = compressor;
    this.masterVolume = masterVolume;

    this.lineWidth = 1;

    this.setup();
  }

  setup() {
    setTimeout(() => {
      this.canCollide = true;
    }, 200);
  }

  draw() {
    if (!this.isBaseCircle && this.radius > 0) {
      if (!this.isExploding) {
        this.ctx.beginPath();
        this.ctx.arc(
          this.position.x,
          this.position.y,
          this.radius,
          0,
          Math.PI * 2
        );

        this.strokeGradient = this.ctx.createLinearGradient(
          0,
          this.position.y,
          0,
          this.position.y + this.radius * 2
        );
        this.strokeGradient.addColorStop(0.0, "#000000");
        this.strokeGradient.addColorStop(0.37, "#FFFFFF");
        this.strokeGradient.addColorStop(1.0, "#FFFFFF");

        this.ctx.strokeStyle = this.strokeGradient;

        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        this.ctx.stroke();
      } else {
        //EXPLODING
        console.log("exploding");
        this.radius = this.radius + 3.5;
        this.ctx.beginPath();
        this.ctx.arc(
          this.position.x,
          this.position.y,
          this.radius,
          0,
          Math.PI * 2
        );

        this.lineWidth = this.lineWidth - 0.02;
        this.ctx.lineWidth = this.lineWidth;

        this.strokeGradient = this.ctx.createLinearGradient(
          0,
          this.position.y,
          0,
          this.position.y + this.radius * 2
        );
        this.strokeGradient.addColorStop(0.0, "#000000");
        this.strokeGradient.addColorStop(0.37, "#FFFFFF");
        this.strokeGradient.addColorStop(1.0, "#FFFFFF");

        this.ctx.strokeStyle = this.strokeGradient;
        this.ctx.stroke();
      }
    }
  }

  applyForce(force) {
    let f = force.copy();
    f.div(this.mass); // Divise la force par la masse pour obtenir l'accélération
    this.acc.add(f); // Ajoute directement la force à l'accélération

    //console.log(this.acc);
  }

  updatePosition(deltaTime) {
    this.vel.add(this.acc.mult(deltaTime)); // Multiplie l'accélération par le deltaTime avant de l'ajouter à la vélocité
    this.vel.mult(this.friction); // Applique le frottement à la vélocité
    this.position.add(this.vel); // Multiplie la vélocité par le deltaTime avant de l'ajouter à la position
    this.acc.mult(0); // Réinitialise l'accélération après chaque frame
  }

  drawSmallCircle() {
    this.ctx.beginPath();
    this.ctx.arc(this.posX, this.posY, 1, 0, Math.PI * 2);
    this.ctx.fillStyle = this.color;
    this.ctx.fill();
  }

  edgeCollision(width, height) {
    this.offset = this.radius;
    if (this.position.x + this.offset > width) {
      this.position.x = width - this.offset;
      this.vel.x *= -1;
      this.collide(this.sampler, "4n");
    } else if (this.position.x - this.offset < 0) {
      this.position.x = this.offset;
      this.vel.x *= -1;
      this.collide(this.sampler, "4n");
    }
    if (this.position.y + this.offset > height) {
      this.position.y = height - this.offset;
      this.vel.y *= -1;
      this.collide(this.sampler, "4n");
    } else if (this.position.y - this.offset < 0) {
      this.position.y = this.offset;
      this.vel.y *= -1;
      this.collide(this.sampler, "4n");
    }

    //sounds ---> on preshot le son pour enlever le décallage
    if (
      this.position.y + this.offset >= height - this.vel.y &&
      this.vel.y > 1
    ) {
      this.collide(this.sampler, "4n");
      // impact imminent, on joue le son avec un frame d'avance
      this.position.y = height - this.offset;
      this.vel.y *= -1;
    }
  }

  checkCollision(otherCircle) {
    // Calculer le vecteur entre les deux centres
    const distVector = this.position.copy().sub(otherCircle.position);

    // Calculer la distance entre les deux cercles
    const distance = distVector.mag();

    // Vérifier si une collision a lieu
    const minDistance = this.radius + otherCircle.radius;
    if (distance < minDistance) {
      // Résolution de la collision

      // Normaliser le vecteur de collision
      const collisionNormal = distVector.copy().normalize();

      // Réajuster les positions pour éviter le chevauchement
      const overlap = minDistance - distance;
      const correction = collisionNormal.copy().mult(overlap / 2);
      this.position.add(correction);
      otherCircle.position.sub(correction);

      // Inverser les vélocités dans la direction du vecteur de collision
      const thisVelocityAlongNormal = this.vel.dot(collisionNormal);
      const otherVelocityAlongNormal = otherCircle.vel.dot(collisionNormal);

      // Échanger les composantes de vélocité le long du vecteur de collision
      const restitution = 0.8; // Coefficient de restitution exagéré pour un effet "goofy"
      const impulse = collisionNormal
        .copy()
        .mult(
          (otherVelocityAlongNormal - thisVelocityAlongNormal) * restitution
        );

      this.vel.add(impulse);
      otherCircle.vel.sub(impulse);

      // Ajouter une impulsion supplémentaire pour un effet exagéré
      const extraImpulse = collisionNormal.copy().mult(0.5); // Ajustez la force ici
      this.vel.add(extraImpulse);
      otherCircle.vel.sub(extraImpulse);

      this.collide(this.sampler, "4n");
    }
  }

  checkCollisionWithHandle(handle) {
    // Points du segment (Handle)
    const A = new Vector(handle.posX, handle.posY);
    const B = new Vector(handle.posX2, handle.posY2);

    // Vecteur du segment AB
    const AB = B.copy().sub(A);

    // Vecteur entre le point A et le centre du cercle
    const AP = this.position.copy().sub(A);

    // Projeter AP sur AB pour trouver le point le plus proche sur le segment // !! PAS COMRPIS
    const t = Math.max(0, Math.min(1, AP.dot(AB) / AB.magSq()));

    const closestPoint = A.copy().add(AB.copy().mult(t));
    //console.log("Closest Point:", closestPoint.x, closestPoint.y);

    // Calculer la distance entre le centre du cercle et le point le plus proche
    const distVector = this.position.copy().sub(closestPoint);
    const distance = distVector.mag();

    // Vérifier si le cercle est en collision avec le segment
    if (distance <= this.radius) {
      // Résolution de la collision
      console.log("Collision avec le segment");
      // Normaliser le vecteur de collision
      const collisionNormal = distVector.copy().normalize();

      // Réajuster la position du cercle pour éviter le chevauchement
      const penetrationDepth = this.radius - distance;
      this.position.add(collisionNormal.copy().mult(penetrationDepth));

      // Inverser la vélocité dans la direction du vecteur de collision
      const velocityAlongNormal = this.vel.dot(collisionNormal);
      this.vel.sub(collisionNormal.copy().mult(2 * velocityAlongNormal));

      this.collide(this.sampler2, "8n");
    }
  }

  playSound(sampler, duration) {
    if (!sampler || !sampler.loaded || this.isExploding) {
      console.warn("Sampler non prêt !");
      return;
    }

    const minRadius = 2;
    const maxRadius = 200;

    // Normalisation de radius pour définir l’octave
    const clampedRadius = Math.max(minRadius, Math.min(this.radius, maxRadius));
    const normalized = (clampedRadius - minRadius) / (maxRadius - minRadius);

    // Inversion : plus grand = plus grave
    const baseOctave = 0;
    const maxOctave = 3;
    const dynamicOctave = Math.floor(
      baseOctave + (1 - normalized) * (maxOctave - baseOctave)
    );

    // Construit la note à jouer
    const baseNote = this.selectedChordTemplate[this.currentNoteIndex];
    const note = `${baseNote}${dynamicOctave}`;

    if (this.currentNoteIndex >= this.selectedChordTemplate.length) {
      this.currentNoteIndex = 0;
      this.selectedChord =
        this.chords[Math.floor(Math.random() * this.chords.length)];
    }

    this.activeVoices = (this.activeVoices || 0) + 1;
    // Volume global basé sur le nombre de voix (logarithmique)
    const targetVolumeDb = Tone.gainToDb(1 / this.activeVoices);
    this.masterVolume.volume.rampTo(targetVolumeDb, 0.05); // transition douce

    // Déclenchement
    if (this.radius > 80) {
      this.bassSampler.triggerAttackRelease(note, duration, Tone.now());
    } else {
      sampler.triggerAttackRelease(note, duration, Tone.now());
    }

    // Décrément après la note
    setTimeout(() => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);

      // Réajuster volume
      const newVolumeDb =
        this.activeVoices > 0 ? Tone.gainToDb(1 / this.activeVoices) : 0; // volume normal si aucune note active

      this.masterVolume.volume.rampTo(newVolumeDb, 0.1);
    }, 1000);
  }

  collide(sampler, duration) {
    if (this.canCollide) {
      this.canCollide = false;
      this.playSound(sampler, duration);
      this.hp = this.hp - 1;
      setTimeout(() => {
        this.canCollide = true;
      }, 200);
    }
  }

  explode() {
    this.isExploding = true;
  }
}
