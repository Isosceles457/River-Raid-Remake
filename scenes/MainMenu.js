export default class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    // Fondo oscuro con transparencia
    this.add.rectangle(240, 320, 480, 640, 0x111133, 0.95);

    // Caja central para el menú
    this.add
      .rectangle(240, 340, 340, 380, 0x222244, 0.98)
      .setStrokeStyle(4, 0x00ffff)
      .setOrigin(0.5);

    // Título fuera del cuadro, arriba, con animación y estilo
    const title = this.add
      .text(240, 60, "River Remake", {
        font: "bold 48px Arial",
        fill: " #00ffff", // No todos los navegadores soportan gradientes en canvas, pero el color base sí
        color: "#00ffff",
        stroke: "#000",
        strokeThickness: 8,
        shadow: { offsetX: 0, offsetY: 4, color: "#000", blur: 8, fill: true },
      })
      .setOrigin(0.5);
    title.setAlpha(0);
    title.setScale(0.7);

    // Animación de entrada (fade in + rebote)
    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      ease: "Bounce.Out",
      duration: 900,
      delay: 200,
    });

    // Botón Start
    const startBtnBox = this.add
      .rectangle(240, 230 + 40, 220, 50, 0x00cc88, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const startBtn = this.add
      .text(240, 230 + 40, "Jugar", {
        font: "bold 26px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Botón Map
    const mapBtnBox = this.add
      .rectangle(240, 290 + 40, 220, 50, 0x0088cc, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const mapBtn = this.add
      .text(240, 290 + 40, "Mapas", {
        font: "bold 26px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Botón About
    const aboutBtnBox = this.add
      .rectangle(240, 350 + 40, 220, 50, 0x4444cc, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const aboutBtn = this.add
      .text(240, 350 + 40, "Acerca de", {
        font: "bold 26px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Botón Exit
    const exitBtnBox = this.add
      .rectangle(240, 410 + 40, 220, 50, 0xcc0044, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const exitBtn = this.add
      .text(240, 410 + 40, "Salir", {
        font: "bold 26px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Interactividad (tanto en caja como en texto)
    startBtnBox.on("pointerdown", () => this.scene.start("GameScene"));
    startBtn.on("pointerdown", () => this.scene.start("GameScene"));

    mapBtnBox.on("pointerdown", () => this.scene.start("MapSelect"));
    mapBtn.on("pointerdown", () => this.scene.start("MapSelect"));

    aboutBtnBox.on("pointerdown", () =>
      window.open("https://github.com/isosceles457/River-Raid-Remake", "_blank")
    );
    aboutBtn.on("pointerdown", () =>
      window.open("https://github.com/isosceles457/River-Raid-Remake", "_blank")
    );

    exitBtnBox.on("pointerdown", () => window.close());
    exitBtn.on("pointerdown", () => window.close());

    // Efecto hover (opcional, solo en PC)
    [startBtnBox, mapBtnBox, aboutBtnBox, exitBtnBox].forEach((box) => {
      box.on("pointerover", () => box.setFillStyle(0xffffff, 0.15));
      box.on("pointerout", () => {
        if (box === startBtnBox) box.setFillStyle(0x00cc88, 1);
        if (box === mapBtnBox) box.setFillStyle(0x0088cc, 1);
        if (box === aboutBtnBox) box.setFillStyle(0x4444cc, 1);
        if (box === exitBtnBox) box.setFillStyle(0xcc0044, 1);
      });
    });
  }
}
