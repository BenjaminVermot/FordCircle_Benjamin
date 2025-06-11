export default class Gradient {
  constructor() {
    this.gradientStops = [
      { pos: 0, night: "#121222", day: "#0A0A0C" },
      { pos: 32, night: "#0E2634", day: "#0F0F19" },
      { pos: 35, night: "#14313F", day: "#101125" },
      { pos: 38, night: "#183845", day: "#101125" },
      { pos: 49, night: "#445561", day: "#101125" },
      { pos: 55, night: "#8B7D7D", day: "#191A2F" },
      { pos: 60, night: "#AC967F", day: "#55567B" },
      { pos: 64, night: "#F2D38D", day: "#F4ADCB" },
      { pos: 65, night: "#FB950B", day: "#B495CC" },
      { pos: 67, night: "#121222", day: "#121222" },
      { pos: 68, night: "#08080F", day: "#08080F" },
      { pos: 70, night: "#211C22", day: "#211C22" },
      { pos: 71, night: "#A42A0A", day: "#0E315B" },
      { pos: 72, night: "#F74006", day: "#095EBF" },
      { pos: 73, night: "#FFF7D3", day: "#FFBB85" },
      { pos: 74, night: "#FFF7D3", day: "#FFBB85" },
      { pos: 75, night: "#F2D38D", day: "#F4ADCB" },
      { pos: 76, night: "#FB950B", day: "#B495CC" },
      { pos: 77, night: "#FB950B", day: "#B495CC" },
      { pos: 78, night: "#744746", day: "#744746" },
      { pos: 80, night: "#A42A0A", day: "#0E315B" },
      { pos: 81, night: "#211C22", day: "#211C22" },
      { pos: 82, night: "#000000", day: "#000000" },
      { pos: 83, night: "#211C22", day: "#211C22" },
      { pos: 84, night: "#000000", day: "#000000" },
      { pos: 85, night: "#A42A0A", day: "#0E315B" },
      { pos: 86, night: "#000000", day: "#000000" },
      { pos: 87, night: "#A42A0A", day: "#0E315B" },
      { pos: 89, night: "#F74006", day: "#095EBF" },
      { pos: 90, night: "#FB950B", day: "#B495CC" },
      { pos: 91, night: "#28120A", day: "#28120A" },
      { pos: 93, night: "#28120A", day: "#28120A" },
      { pos: 96, night: "#000000", day: "#000000" },
      { pos: 98, night: "#000000", day: "#000000" },
      { pos: 100, night: "#000000", day: "#000000" },
    ];

    this.isSliding = false;
    this.manualTimeOffset = 0;
    this.manualRatio = 0;
    this.setupGlobalSlider();

    this.lastUpdate = 0;
    this.frameInterval = 1000 / 30; // ~30 FPS
    this.t = 0;
    this.hourElement = document.querySelector(".heure");

    this.ratio = 0;
  }

  getDayNightRatio() {
    const now = performance.now();
    const baseTime = (now / 60000) * 2 * Math.PI; // Vitesse du cycle jour/nuit
    return 0.5 + 0.5 * Math.sin(baseTime + this.manualTimeOffset);
  }

  getHourFromRatio() {
    let hour = (12 + this.ratio * 12) % 24;
    let minutes = Math.round((hour % 1) * 60);
    hour = Math.floor(hour);
    // Format HH:MM
    return `${hour.toString().padStart(2, "0")}h${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  updateGradient(timestamp = performance.now()) {
    if (timestamp - this.lastUpdate < this.frameInterval) {
      requestAnimationFrame(this.updateGradient.bind(this));
      return;
    }
    this.lastUpdate = timestamp;
    const ratio = this.getDayNightRatio(timestamp);
    this.ratio = ratio;
    const time = performance.now() / 10000;
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
