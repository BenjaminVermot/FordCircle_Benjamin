import Circle from "./Circle.js";
import Handle from "./Handle.js";
import Utils from "./utils.js";
import Vector from "./Vector.js";
import * as Tone from "tone";
import Noeud from "./Noeud.js";

const canvas = document.createElement("canvas");
const container = document.querySelector(".container");
console.log(container);
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const gravityText = document.querySelector(".gravity");

let width;
let height;
let mouseX = 0;
let mouseY = 0;

let Util = new Utils();

let circles = [];
let activeCircles = [];
let baseCircles = [];
let noeuds = [];
let handle;

let isHoveringNoeud = false;
let hoveredNoeud = null;
let firstNoeud = null;
let secondNoeud = null;

let newCollisionLine;
let collisionLines = [];

let showHandle = false;
let baseRadius = 300;

let collisionLinesAmount = 0;
let ambiantChordsNotes = ["F1", "A1", "D2", "F2"];
let isMakingCollisionLine = false;

//--------------- HANDLE ----------------

const startPoint = [0, 0]; // Point de départ (x, y)
const endPoint = [0, 0]; // Point d'arrivée (x, y)
let isDragging = false;
let currentHandle = null;

const points = [];

//--------------- PARAMETERS ----------------
const params = {
  itLimit: 6,
  baseCircles: true,
  gravityX: 0,
  gravityY: 0,
  windX: 0,
  windY: 0,
};
//--------------- PARAMETERS ----------------

//----------------AUDIO-CLIPS--------------------

const limiter = new Tone.Limiter(-6).toDestination();

const masterVolume = new Tone.Volume(0).connect(limiter); // Volume global

const compressor = new Tone.Compressor({
  threshold: -30,
  ratio: 6,
  attack: 0.01,
  release: 0.2,
}).connect(masterVolume);

const reverb = new Tone.Reverb({ decay: 2, preDelay: 0.01 }).connect(
  compressor
);
reverb.generate();

let sampler;
let sampler2;
let ambiantSampler;

window.addEventListener("DOMContentLoaded", async () => {
  sampler = new Tone.Sampler({
    urls: {
      C1: "Main_C1.mp3",
      F1: "Main_F1.mp3",
      A1: "Main_A1.mp3",
      C2: "Main_C2.mp3",
    },
    baseUrl: "Sounds/",
    onload: () => console.log("Samples chargés 🎧"),
  }).connect(reverb);

  sampler.volume.value = -20;

  sampler2 = new Tone.Sampler({
    urls: {
      C1: "Icy_C1.mp3",
      F1: "Icy_F1.mp3",
      A1: "Icy_A1.mp3",
      C2: "Icy_C2.mp3",
    },
    baseUrl: "Sounds/",
    onload: () => console.log("Samples chargés 🎧"),
  }).connect(reverb);

  sampler2.volume.value = -24;

  ambiantSampler = new Tone.Sampler({
    urls: {
      D1: "Ambiant_D.mp3",
      F1: "Ambiant_F.mp3",
      A1: "Ambiant_A.mp3",
      D2: "Ambiant_D2.mp3",
      F2: "Ambiant_F2.mp3",
    },
    baseUrl: "Sounds/",
    onload: () => {
      console.log("Samples chargés 🎧");
      // Lance la boucle d'ambiance après chargement
      Tone.Transport.scheduleRepeat((time) => {
        ambiantSampler.triggerAttackRelease("D1", "8m", time);
      }, "4m"); // toutes les 2 mesures (ajuste selon ton tempo)
      Tone.Transport.start();
    },
  }).connect(reverb);

  ambiantSampler.volume.value = -34;
});

//------------GlobalForces---------------------------
let gravityForce = new Vector(0, 8);
let windForce = new Vector(1, 0.0);

let lastTime = performance.now();

setup();

//--------------- HANDLE RESIZE ----------------
function resizeCanvas() {
  width = window.innerWidth - 40;
  height = window.innerHeight - 40;
  const dpr = window.devicePixelRatio || 1; // !!!! PAS tout à fait compris
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}
resizeCanvas();

//INPUTS--------------------------------------
window.addEventListener("resize", resizeCanvas);

window.addEventListener("mousedown", (event) => {
  if (!isDragging) {
    const { x, y } = getMousePosInCanvas(event);

    if (isHoveringNoeud) {
      isMakingCollisionLine = true;
      instantiateCollisionHandle(x, y);
    } else {
      instantiateHandle(x, y);
    }
    isDragging = true;
  }
});
window.addEventListener("mousemove", (event) => {
  if (isDragging === true) {
    const { x, y } = getMousePosInCanvas(event);
    draggingHandle(x, y);
  }
  GetMouse(event.clientX, event.clientY);
});

window.addEventListener("mouseup", (event) => {
  if (isDragging === true) {
    if (isMakingCollisionLine) {
      lockCollisionHandle();
    } else {
      lockHandle();
    }

    isDragging = false;
  }
});

let toneIsReady = false;
document.addEventListener("mousedown", async () => {
  if (toneIsReady == false) {
    await Tone.start();
    toneIsReady = true;
  }
});

//CLICK GESTION
// Empêcher les clics sur dat.GUI d'affecter le canvas
const guiContainer = document.querySelector(".dg.ac"); // Sélecteur par défaut de dat.GUI
if (guiContainer) {
  guiContainer.addEventListener("mousedown", (e) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
  });
}

// Gestionnaire de clics sur le canvas
canvas.addEventListener("mousedown", (e) => {
  // Logique pour ajouter des cercles ou interagir avec le canvas
  console.log("Clic sur le canvas :", e.clientX, e.clientY);
});

//---------------- GET MOUSE ------------

function setup() {
  GetMouse();
}

function GetMouse(mX, mY) {
  const rect = canvas.getBoundingClientRect(); // CORRECTION DE LA FAUTE

  mouseX = mX - rect.left;
  mouseY = mY - rect.top;

  // Calcul de la gravité en fonction de la position de la souris
  const centerX = width / 2;
  const centerY = height / 2;

  // Distance de la souris par rapport au centre (normalisée entre -1 et 1)
  const dx = (mouseX - centerX) / centerX;
  const dy = (mouseY - centerY) / centerY;

  // Inversion des directions : plus la souris est en bas, plus la gravité va vers le haut
  const maxForce = 4; // Valeur maximale de la gravité

  params.gravityX = dx * maxForce;
  params.gravityY = dy * maxForce;
}

//---------------- CIRCLES GENERATION -----------

function fordCircles(limit) {
  baseRadius =
    Util.distance(startPoint[0], startPoint[1], endPoint[0], endPoint[1]) / 2; // Ajuste le rayon de base pour qu'il fasse la moitié de la distance de l'axe
  const normal = Util.normal(
    startPoint[0],
    startPoint[1],
    endPoint[0],
    endPoint[1]
  ); // Normale de l'axe

  for (let q = 1; q <= limit; q++) {
    for (let p = 0; p <= q; p++) {
      if (gcd(p, q) === 1) {
        let t = p / q;
        let r = baseRadius / (q * q); //!!
        let x = startPoint[0] + (endPoint[0] - startPoint[0]) * t;
        let y = startPoint[1] + (endPoint[1] - startPoint[1]) * t;

        const adjustedX = x + normal[0] * r;
        const adjustedY = y + normal[1] * r;

        let newCircle = new Circle(
          ctx,
          adjustedX,
          adjustedY,
          r,
          sampler,
          compressor,
          masterVolume,
          sampler2
        );

        circles.push(newCircle);

        if (t == 0 || t == 1) {
          newCircle.isBaseCircle = true;
          circles.splice(newCircle);
        }
      }
    }
  }
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function recalculateCircles() {
  circles = []; // Réinitialise le tableau des cercles
  points.length = 0; // Réinitialise la liste des points
  fordCircles(params.itLimit); // Regénère les cercles
}

//HANDLE FUNCTIONS -----------------------

function instantiateHandle(mouseX, mouseY) {
  console.log("instantiateHandle");
  currentHandle = new Handle(ctx, mouseX, mouseY, mouseX, mouseY, 11);
  startPoint[0] = mouseX;
  startPoint[1] = mouseY;
  endPoint[0] = mouseX;
  endPoint[1] = mouseY;
  handle = currentHandle;
  showHandle = true;
}
function draggingHandle(mouseX, mouseY) {
  if (!isMakingCollisionLine) {
    currentHandle.posX2 = mouseX;
    currentHandle.posY2 = mouseY;

    endPoint[0] = mouseX;
    endPoint[1] = mouseY;

    recalculateCircles();
  } else {
    newCollisionLine.posX2 = mouseX;
    newCollisionLine.posY2 = mouseY;

    endPoint[0] = mouseX;
    endPoint[1] = mouseY;
  }
}
function lockHandle() {
  showHandle = false;
  currentHandle = null;

  endPoint[0] = mouseX;
  endPoint[1] = mouseY;

  circles.forEach((element) => {
    activeCircles.push(element);
  });

  circles = []; // Réinitialise le tableau des cercles
}

//INSTNTIATE COLLISION HANDLE
function instantiateCollisionHandle(mouseX, mouseY) {
  newCollisionLine = new Handle(
    ctx,
    hoveredNoeud.posX,
    hoveredNoeud.posY,
    mouseX,
    mouseY,
    11
  );
  newCollisionLine.firstNoeud = firstNoeud;

  //collisionLines.push(newCollisionLine);
}

function lockCollisionHandle() {
  if (!isHoveringNoeud) {
    newCollisionLine = null;
  } else {
    newCollisionLine.secondNoeud = hoveredNoeud;
    collisionLines.push(newCollisionLine);
    newCollisionLine = null;
  }
  isMakingCollisionLine = false;

  collisionLinesAmount++;
  if (collisionLinesAmount >= 2) {
    // On arrête les anciennes boucles pour éviter les superpositions
    Tone.Transport.cancel();

    Tone.Transport.scheduleRepeat((time) => {
      // On joue un accord avec autant de notes que collisionLinesAmount (max la longueur du tableau)
      const notes = ambiantChordsNotes.slice(
        0,
        Math.min(collisionLinesAmount, ambiantChordsNotes.length)
      );
      notes.forEach((note) => {
        ambiantSampler.triggerAttackRelease(note, "8m", time);
      });
    }, "4m"); // toutes les 4 mesures (ajuste selon ton tempo)
    Tone.Transport.start();
  }
}

//NOEUDS ----------------
let numberOfNoeuds = 10;
instantiateNoeud();

function instantiateNoeud() {
  for (let i = 0; i < numberOfNoeuds; i++) {
    let x = Math.random() * (width - 40 - 40) + 40;
    let y = Math.random() * (height - 40 - 40) + 40;
    let newNoeud = new Noeud(ctx, x, y, 10);
    noeuds.push(newNoeud);
  }
}

function getMousePosInCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

//BASE CIRCLES

function showBaseCircles() {
  baseCircles.forEach((element) => {
    element.isBaseCircle = params.baseCircles;
  });
}
//DRAW LOOP ----------------

function draw() {
  ctx.clearRect(0, 0, width, height);
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Temps écoulé en secondes
  lastTime = currentTime;

  //updateVariables
  gravityForce.x = params.gravityX;
  gravityForce.y = params.gravityY;
  windForce.x = params.windX;
  windForce.y = params.windY;

  for (let i = circles.length - 1; i >= 0; i--) {
    circles[i].draw();
  }

  activeCirclesBehavior(deltaTime);
  noeudsBehavior();
  collisionLinesBehavior();
  updateTexts();

  if (showHandle) {
    handle.draw();
  }

  requestAnimationFrame(draw);
}

draw();

function noeudsBehavior() {
  isHoveringNoeud = false;
  hoveredNoeud = null;

  for (const noeud of noeuds) {
    noeud.move(width, height);

    if (noeud.isMouseNear(mouseX, mouseY)) {
      isHoveringNoeud = true;
      hoveredNoeud = noeud;
      firstNoeud = noeud;
    }

    noeud.draw(mouseX, mouseY);
  }
}

function activeCirclesBehavior(deltaTime) {
  for (let i = activeCircles.length - 1; i >= 0; i--) {
    if (activeCircles[i].hp <= 0) {
      const circleToRemove = activeCircles[i];
      circleToRemove.explode();
      setTimeout(() => {
        const idx = activeCircles.indexOf(circleToRemove);
        if (idx !== -1) activeCircles.splice(idx, 1);
      }, 200);
    }
  }

  activeCircles.forEach((circle, i) => {
    // Calculer le poids et appliquer comme gravité
    for (let j = i + 1; j < activeCircles.length; j++) {
      circle.checkCollision(activeCircles[j]);
    }

    collisionLines.forEach((handle) => {
      circle.checkCollisionWithHandle(handle);
    });

    let newX = gravityForce.x * circle.mass;
    let newY = gravityForce.y * circle.mass;
    let weight = new Vector(newX, newY);
    circle.applyForce(weight);
    circle.applyForce(windForce);

    circle.updatePosition(deltaTime);
    circle.edgeCollision(width, height);
    circle.draw();
  });
}

function collisionLinesBehavior() {
  if (newCollisionLine) {
    newCollisionLine.draw();
    newCollisionLine.updatePosition();
  }
  collisionLines.forEach((line) => {
    line.draw();
    line.updatePosition();
  });
}

function updateTexts() {
  let roundedGravX = gravityForce.x.toFixed(1);
  let roundedGravY = gravityForce.y.toFixed(1);
  gravityText.innerHTML = `Gravity/ ${roundedGravX}:${roundedGravY} `;
}

//GUI --------------------------------

//setupGUI();

//sons
//interface day/night cycle
