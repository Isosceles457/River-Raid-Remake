export default class MapSelect extends Phaser.Scene {
  constructor() {
    super("MapSelect");
  }

  create() {
    // Fondo negro
    this.add.rectangle(240, 320, 480, 640, 0x000000).setOrigin(0.5);

    this.add
      .text(240, 50, "Selecciona un mapa", {
        font: "32px Arial",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 3,
        shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 2, fill: true },
      })
      .setOrigin(0.5);

    const originalBtn = this.add
      .rectangle(240, 160, 400, 120, 0x004400, 0.8) // Aumenté la altura de la caja
      .setStrokeStyle(3, 0x00ff00)
      .setInteractive();

    this.add
      .text(240, 140, "🌲 Original", {
        font: "28px Arial",
        fill: "#0f0",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(240, 190, "Aventúrate en un bosque lleno de desafíos.", {
        font: "18px Arial",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 1,
        wordWrap: { width: 380 }, // Ajuste para que el texto se envuelva
        align: "center",
      })
      .setOrigin(0.5);

    const spaceBtn = this.add
      .rectangle(240, 300, 400, 120, 0x000044, 0.8) // Aumenté la altura de la caja
      .setStrokeStyle(3, 0x00ffff)
      .setInteractive();

    this.add
      .text(240, 280, "🚀 Espacial", {
        font: "28px Arial",
        fill: "#0ff",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(
        240,
        330,
        "Viaja por el espacio y atraviesa un agujero de gusano.",
        {
          font: "18px Arial",
          fill: "#fff",
          stroke: "#000",
          strokeThickness: 1,
          wordWrap: { width: 380 }, // Ajuste para que el texto se envuelva
          align: "center",
        }
      )
      .setOrigin(0.5);

    const backBtn = this.add
      .rectangle(240, 500, 200, 60, 0x440000, 0.8)
      .setStrokeStyle(3, 0xff0000)
      .setInteractive();

    this.add
      .text(240, 500, "⬅️ Volver", {
        font: "24px Arial",
        fill: "#f00",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    originalBtn.on("pointerdown", () => {
      localStorage.setItem("selectedMap", "original");
      this.scene.start("GameScene");
    });

    spaceBtn.on("pointerdown", () => {
      localStorage.setItem("selectedMap", "space");
      this.scene.start("GameScene");
    });

    backBtn.on("pointerdown", () => this.scene.start("MainMenu"));
  }
}
