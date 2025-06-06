export default class Gradient {
  constructor() {
    this.gradientStops = [
      { pos: 0, night: "#121222", day: "#FDFEFD" },
      { pos: 32, night: "#0E2634", day: "#FFFFFF" },
      { pos: 35, night: "#14313F", day: "#EDFBFF" },
      { pos: 38, night: "#183845", day: "#D8F5FD" },
      { pos: 49, night: "#445561", day: "#DCFBFF" },
      { pos: 55, night: "#8B7D7D", day: "#5DDAF5" },
      { pos: 60, night: "#AC967F", day: "#3D5C70" },
      { pos: 64, night: "#FFD786", day: "#C0A1A6" },
      { pos: 65, night: "#FF6536", day: "#F7F0AB" },
      { pos: 67, night: "#121222", day: "#F4B04D" },
      { pos: 68, night: "#08080F", day: "#FEF2BD" },
      { pos: 70, night: "#211C22", day: "#FFD85F" },
      { pos: 71, night: "#4E2827", day: "#FFEEB6" },
      { pos: 72, night: "#FF322C", day: "#98673E" },
      { pos: 73, night: "#FFF7D3", day: "#362930" },
      { pos: 74, night: "#FFF7D3", day: "#141726" },
      { pos: 75, night: "#FFD395", day: "#F8C15D" },
      { pos: 76, night: "#FF7C00", day: "#DC6120" },
      { pos: 77, night: "#FC8310", day: "#FFE685" },
      { pos: 78, night: "#744746", day: "#111521" },
      { pos: 80, night: "#4E2827", day: "#121929" },
      { pos: 81, night: "#211C22", day: "#161A26" },
      { pos: 82, night: "#000000", day: "#12121B" },
      { pos: 83, night: "#211C22", day: "#121826" },
      { pos: 84, night: "#000000", day: "#37110E" },
      { pos: 85, night: "#4E2827", day: "#F88B12" },
      { pos: 86, night: "#000000", day: "#EC651F" },
      { pos: 87, night: "#4E2827", day: "#702819" },
      { pos: 89, night: "#FF322C", day: "#AB3F18" },
      { pos: 90, night: "#FF9000", day: "#9C3715" },
      { pos: 91, night: "#28120A", day: "#FF951C" },
      { pos: 93, night: "#28120A", day: "#101825" },
      { pos: 96, night: "#000000", day: "#111216" },
      { pos: 98, night: "#000000", day: "#161A26" },
      { pos: 100, night: "#000000", day: "#000000" },
    ];

    this.isSliding = false;
    this.manualTimeOffset = 0;
    this.manualRatio = 0;
    this.setupGlobalSlider();

    this.lastUpdate = 0;
    this.frameInterval = 1000 / 30; // ~30 FPS
    this.t = 0;

    this.ratio = 0;
  }

  getDayNightRatio() {
    const now = performance.now();
    const baseTime = (now / 60000) * 2 * Math.PI; // base oscillation
    return 0.5 + 0.5 * Math.sin(baseTime + this.manualTimeOffset);
  }

  updateGradient(timestamp = performance.now()) {
    if (timestamp - this.lastUpdate < this.frameInterval) {
      requestAnimationFrame(this.updateGradient.bind(this));
      return;
    }
    this.lastUpdate = timestamp;
    const ratio = this.getDayNightRatio(timestamp); // passe le temps
    this.ratio = ratio;
    const time = performance.now() / 10000; //
    const gradient = this.gradientStops
      .map((stop, i) => {
        const pos = this.getWavyPosition(stop.pos, i, time);
        const color = this.lerpColor(stop.night, stop.day, this.ratio);
        return `${color} ${pos}%`;
      })
      .join(", ");

    const element = document.querySelector(".gradient");
    if (element) {
      element.style.background = `linear-gradient(to bottom, ${gradient})`;
    }

    requestAnimationFrame(this.updateGradient.bind(this));
  }

  lerpColor(color1, color2, t) {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);

    const r = Math.round(
      ((c1 >> 16) & 0xff) * (1 - t) + ((c2 >> 16) & 0xff) * t
    );
    const g = Math.round(((c1 >> 8) & 0xff) * (1 - t) + ((c2 >> 8) & 0xff) * t);
    const b = Math.round((c1 & 0xff) * (1 - t) + (c2 & 0xff) * t);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  getWavyPosition(basePos, index, time) {
    const amplitude = 1.5;
    let amplitudeMultiplier = Math.sin(time * 0.5) * 5;
    const frequency = 0.3;
    return (
      basePos +
      amplitude * amplitudeMultiplier * Math.sin(frequency * index + time)
    );
  }

  setupGlobalSlider() {
    const element = document.querySelector(".inscriptions");
    if (!element) return;

    element.addEventListener("mousedown", (e) => {
      this.isSliding = true;
      this.lastCursorX = e.clientX;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isSliding) return;

      if (this.lastCursorX != null) {
        const deltaX = e.clientX - this.lastCursorX;
        this.lastCursorX = e.clientX;

        // Influence la vitesse de l'oscillation en déplaçant le curseur
        this.manualTimeOffset += deltaX * 0.005; // facteur à ajuster pour la sensibilité
      }
    });

    window.addEventListener("mouseup", () => {
      this.isSliding = false;
      this.lastCursorX = null;
    });
  }

  updateManualRatio(e, element) {
    const rect = element.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const maxDist = window.innerWidth / 2;

    let ratio = 0.5 + dx / (2 * maxDist); // dx normalisé entre [-0.5, 0.5] → [0, 1]
    this.manualRatio = Math.max(0, Math.min(1, this.ratio)); // clamp
  }
}
