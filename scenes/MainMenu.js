export default class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add
      .text(240, 100, "River Raid Remake", { font: "32px Arial", fill: "#fff" })
      .setOrigin(0.5);

    const startBtn = this.add
      .text(240, 220, "Start", { font: "24px Arial", fill: "#0f0" })
      .setOrigin(0.5)
      .setInteractive();
    const mapBtn = this.add
      .text(240, 280, "Map", { font: "24px Arial", fill: "#0f0" })
      .setOrigin(0.5)
      .setInteractive();
    const aboutBtn = this.add
      .text(240, 340, "About", { font: "24px Arial", fill: "#0f0" })
      .setOrigin(0.5)
      .setInteractive();
    const exitBtn = this.add
      .text(240, 400, "Exit", { font: "24px Arial", fill: "#0f0" })
      .setOrigin(0.5)
      .setInteractive();

    startBtn.on("pointerdown", () => this.scene.start("GameScene"));
    mapBtn.on("pointerdown", () => this.scene.start("MapSelect"));
    aboutBtn.on("pointerdown", () =>
      window.open("https://github.com/isosceles457/River-Raid-Remake", "_blank")
    );
    exitBtn.on("pointerdown", () => window.close());
  }
}
