export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.background = null;
    this.player = null;
    this.enemies = null;
    this.bullets = null;
    this.lastFired = 0;
    this.fuelGroup = null;
    this.fuelLevel = 100;
    this.fuelText = null;
    this.score = 0;
    this.scoreText = null;
    this.isGameOver = false;
    this.isPaused = false;
    this.pauseBtn = null;
    this.pauseUI = [];
    this.touchControls = {};
    this.touchObjects = [];
    this.gameSpeed = 1;
    this.enemyDelay = 1000;
    this.difficultyTimer = null;
    this.lastEnemyShot = 0;
    this.riverSegments = [];
    this.riverGraphics = null;
    this.riverLeft = [];
    this.riverRight = [];
    this.riverWidth = 320;
    this.riverStep = 20;
    this.riverSegments = Math.ceil(640 / this.riverStep) + 2;
    this.riverOffset = 0;
    this.riverColliders = [];
    this.firstRiverGeneration = true;
  }

  init() {
    this.selectedMap = localStorage.getItem("selectedMap") || "original";
  }

  preload() {
    if (this.selectedMap === "space") {
      this.load.image("background", "../assets/backgroundSpace.webp");
      this.load.image("player", "../assets/spaceShip.png");
      this.load.image("enemy", "../assets/enemySpace.png");
    } else {
      this.load.image("background", "../assets/backgroundOriginal.webp");
      this.load.image("player", "../assets/originalShip.png");
      this.load.image("enemy", "../assets/enemyOriginal.png");
    }

    this.load.image("fuel", "../assets/GASOLINA.png");
    this.load.image("bullet", "../assets/bullet.png");
  }

  create() {
    this.isGameOver = false;
    this.isPaused = false;
    this.fuelLevel = 100;
    this.score = 0;
    this.gameSpeed = 2;
    this.enemyDelay = 1000;

    this.background = this.add
      .tileSprite(0, 0, 480, 640, "background")
      .setOrigin(0, 0);

    this.riverGraphics = this.add.graphics();
    this.generateRiver();
    this.drawRiver();

    this.player = this.physics.add.sprite(240, 550, "player");
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.enemies = this.physics.add.group();

    this.enemyTimer = this.time.addEvent({
      delay: this.enemyDelay,
      callback: () => {
        const y = 0;
        const x = this.getSafeRiverX(y);
        const enemy = this.physics.add.sprite(x, -10, "enemy");
        enemy.vx = Phaser.Math.Between(-60, 60);
        enemy.canShoot = Phaser.Math.Between(0, 100) < 25;
        this.enemies.add(enemy);
      },
      loop: true,
    });

    this.bullets = this.physics.add.group();

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bullet, enemy) => {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.updateScoreText();
      },
      null,
      this
    );

    this.fuelGroup = this.physics.add.group();

    this.fuelTimer = this.time.addEvent({
      delay: 3000,
      callback: () => {
        const y = 0;
        const x = this.getSafeRiverX(y);
        const fuel = this.physics.add.sprite(x, -30, "fuel");
        this.fuelGroup.add(fuel);
      },
      loop: true,
    });

    this.physics.add.overlap(
      this.player,
      this.fuelGroup,
      (player, fuel) => {
        fuel.destroy();
        this.fuelLevel = Math.min(this.fuelLevel + 25, 100);
        this.updateFuelText();
      },
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      () => {
        this.gameOver("¡HAS SIDO DESTRUIDO!");
      },
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      () => {
        this.gameOver("¡TE DISPARARON!");
      },
      null,
      this
    );

    this.fuelTextBg = this.add
      .rectangle(70, 30, 100, 28, 0x222244, 0.7)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x00ffff);
    this.fuelText = this.add
      .text(70, 30, `⛽ Fuel: ${this.fuelLevel}`, {
        font: "bold 15px Arial",
        fill: "#00ffff",
        stroke: "#000",
        strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true },
      })
      .setOrigin(0.5);

    this.scoreTextBg = this.add
      .rectangle(410, 30, 100, 28, 0x222244, 0.7)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xffff00);
    this.scoreText = this.add
      .text(410, 30, `⭐ Score: ${this.score}`, {
        font: "bold 15px Arial",
        fill: "#ffff00",
        stroke: "#000",
        strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true },
      })
      .setOrigin(0.5);

    this.pauseBtn = this.add
      .rectangle(240, 30, 40, 28, 0x222244, 0.8)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    this.add
      .text(240, 30, "⏸", {
        font: "bold 18px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5);

    this.pauseBtn.on("pointerdown", () => {
      if (!this.isGameOver && !this.isPaused) this.pauseGame();
    });

    this.input.keyboard.on("keydown-ESC", () => {
      if (!this.isGameOver && !this.isPaused) this.pauseGame();
    });

    this.createTouchControls();

    this.difficultyTimer = this.time.addEvent({
      delay: 10000,
      callback: () => {
        if (this.gameSpeed < 7) this.gameSpeed += 0.3;
        if (this.enemyDelay > 350) this.enemyDelay -= 50;
        this.enemyTimer.remove(false);
        this.enemyTimer = this.time.addEvent({
          delay: this.enemyDelay,
          callback: () => {
            const y = 0;
            const x = this.getSafeRiverX(y);
            const enemy = this.physics.add.sprite(x, -10, "enemy");
            enemy.vx = Phaser.Math.Between(-60, 60);
            enemy.canShoot = Phaser.Math.Between(0, 100) < 25;
            this.enemies.add(enemy);
          },
          loop: true,
        });
      },
      loop: true,
    });

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isPaused && !this.isGameOver) {
          this.score += 1;
          this.updateScoreText();
        }
      },
      loop: true,
    });

    this.createRiverColliders();

    this.physics.add.overlap(
      this.player,
      this.riverColliders,
      () => {
        this.gameOver("Cuidado con las montañas");
      },
      null,
      this
    );
  }

  update(time, delta) {
    if (this.isGameOver || this.isPaused) return;

    this.background.tilePositionY -= this.gameSpeed;

    this.riverOffset += this.gameSpeed;
    if (this.riverOffset > this.riverStep) {
      this.riverOffset -= this.riverStep;
      this.generateRiver();
    }
    this.drawRiver();

    this.riverColliders.clear(true, true);
    for (let i = 0; i < this.riverLeft.length - 1; i++) {
      const lx = (this.riverLeft[i].x + this.riverLeft[i + 1].x) / 2;
      const ly = (this.riverLeft[i].y + this.riverLeft[i + 1].y) / 2;
      this.riverColliders
        .create(lx, ly, null)
        .setSize(24, this.riverStep)
        .setVisible(false)
        .setOrigin(0.5);

      const rx = (this.riverRight[i].x + this.riverRight[i + 1].x) / 2;
      const ry = (this.riverRight[i].y + this.riverRight[i + 1].y) / 2;
      this.riverColliders
        .create(rx, ry, null)
        .setSize(24, this.riverStep)
        .setVisible(false)
        .setOrigin(0.5);
    }

    let velocityX = 0,
      velocityY = 0;

    if (this.cursors.left.isDown) velocityX = -200;
    else if (this.cursors.right.isDown) velocityX = 200;
    if (this.cursors.up.isDown) velocityY = -200;
    else if (this.cursors.down.isDown) velocityY = 200;

    if (this.touchControls.left) velocityX = -200;
    if (this.touchControls.right) velocityX = 200;
    if (this.touchControls.up) velocityY = -200;
    if (this.touchControls.down) velocityY = 200;

    this.player.setVelocity(velocityX, velocityY);

    if (
      (this.cursors.space?.isDown || this.touchControls.shoot) &&
      time > this.lastFired + 300
    ) {
      const bullet = this.bullets.create(
        this.player.x,
        this.player.y - 20,
        "bullet"
      );
      bullet.setVelocityY(-300);
      bullet.setCollideWorldBounds(false);
      this.lastFired = time;
    }

    this.enemies.children.iterate((e) => {
      if (e) {
        e.y += this.gameSpeed;
        if (e.vx) e.x += e.vx * (this.gameSpeed / 60);

        let idx = Math.floor(e.y / this.riverStep);
        idx = Phaser.Math.Clamp(idx, 0, this.riverLeft.length - 1);
        const leftLimit = this.riverLeft[idx].x + 18;
        const rightLimit = this.riverRight[idx].x - 18;
        if (e.x < leftLimit) {
          e.x = leftLimit;
          e.vx *= -1;
        } else if (e.x > rightLimit) {
          e.x = rightLimit;
          e.vx *= -1;
        }
        if (e.y > 700) e.destroy();
      }
    });

    this.fuelGroup.children.iterate((f) => {
      if (f) {
        f.y += this.gameSpeed;
        if (f.y > 700) f.destroy();
      }
    });

    this.fuelLevel -= 0.05;
    if (this.fuelLevel <= 0) {
      this.fuelLevel = 0;
      this.gameOver("¡SIN COMBUSTIBLE!");
    } else {
      this.updateFuelText();
    }
  }

  generateRiver() {
    if (!this.riverLeft.length) {
      let x = 240;
      for (let i = 0; i < this.riverSegments; i++) {
        const dx = this.firstRiverGeneration ? 0 : Phaser.Math.Between(-14, 14);
        x = Phaser.Math.Clamp(x + dx, 100, 380);

        const y = i * this.riverStep;
        this.riverLeft.push({ x: x - this.riverWidth / 2, y });
        this.riverRight.push({ x: x + this.riverWidth / 2, y });
      }
      this.firstRiverGeneration = false;
      return;
    }

    this.riverLeft.forEach((p) => (p.y += this.riverStep));
    this.riverRight.forEach((p) => (p.y += this.riverStep));
    this.riverLeft.pop();
    this.riverRight.pop();

    let prevX = (this.riverLeft[0].x + this.riverRight[0].x) / 2;
    let dx = Phaser.Math.Between(-14, 14);
    if (Phaser.Math.Between(0, 100) < 7) dx *= 2;
    let x = Phaser.Math.Clamp(prevX + dx, 100, 380);

    this.riverLeft.unshift({ x: x - this.riverWidth / 2, y: 0 });
    this.riverRight.unshift({ x: x + this.riverWidth / 2, y: 0 });
  }

  getSafeRiverX(y) {
    let idx = Math.floor(y / this.riverStep);
    idx = Phaser.Math.Clamp(idx, 0, this.riverLeft.length - 1);
    const left = this.riverLeft[idx].x + 24;
    const right = this.riverRight[idx].x - 24;
    return Phaser.Math.Between(left, right);
  }

  drawRiver() {
    this.riverGraphics.clear();

    const offsetY = this.riverOffset;

    this.riverGraphics.fillStyle(0x003366, 1);
    this.riverGraphics.beginPath();
    this.riverGraphics.moveTo(
      this.riverLeft[0].x,
      this.riverLeft[0].y - offsetY
    );

    for (let i = 1; i < this.riverLeft.length; i++) {
      this.riverGraphics.lineTo(
        this.riverLeft[i].x,
        this.riverLeft[i].y - offsetY
      );
    }

    for (let i = this.riverRight.length - 1; i >= 0; i--) {
      this.riverGraphics.lineTo(
        this.riverRight[i].x,
        this.riverRight[i].y - offsetY
      );
    }

    this.riverGraphics.closePath();
    this.riverGraphics.fillPath();

    this.riverGraphics.lineStyle(6, 0x00ffff, 0.7);
    this.riverGraphics.beginPath();

    for (let i = 0; i < this.riverLeft.length; i++) {
      this.riverGraphics.lineTo(
        this.riverLeft[i].x,
        this.riverLeft[i].y - offsetY
      );
    }

    for (let i = this.riverRight.length - 1; i >= 0; i--) {
      this.riverGraphics.lineTo(
        this.riverRight[i].x,
        this.riverRight[i].y - offsetY
      );
    }

    this.riverGraphics.closePath();
    this.riverGraphics.strokePath();
  }

  createRiverColliders() {
    if (this.riverColliders && this.riverColliders.length) {
      this.riverColliders.forEach((c) => c.destroy());
      this.riverColliders = [];
    }

    const offsetY = this.riverOffset;
    this.riverColliders = this.physics.add.staticGroup();

    for (let i = 0; i < this.riverLeft.length - 1; i++) {
      const lx = (this.riverLeft[i].x + this.riverLeft[i + 1].x) / 2;
      const ly = (this.riverLeft[i].y + this.riverLeft[i + 1].y) / 2 - offsetY;

      const leftCollider = this.riverColliders
        .create(lx, ly, null)
        .setSize(24, this.riverStep)
        .setVisible(false)
        .setOrigin(0.5);

      const rx = (this.riverRight[i].x + this.riverRight[i + 1].x) / 2;
      const ry =
        (this.riverRight[i].y + this.riverRight[i + 1].y) / 2 - offsetY;

      const rightCollider = this.riverColliders
        .create(rx, ry, null)
        .setSize(24, this.riverStep)
        .setVisible(false)
        .setOrigin(0.5);
    }
  }

  updateFuelText() {
    this.fuelText.setText(`⛽ Fuel: ${Math.floor(this.fuelLevel)}`);
  }

  updateScoreText() {
    this.scoreText.setText(`⭐ Score: ${this.score}`);
  }

  pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    if (this.enemyTimer) this.enemyTimer.paused = true;
    if (this.fuelTimer) this.fuelTimer.paused = true;
    if (this.scoreTimer) this.scoreTimer.paused = true;
    if (this.difficultyTimer) this.difficultyTimer.paused = true;

    const overlay = this.add.rectangle(240, 320, 480, 640, 0x000000, 0.7);

    const menuBox = this.add
      .rectangle(240, 320, 340, 260, 0x222244, 0.95)
      .setStrokeStyle(4, 0x00ffff)
      .setOrigin(0.5);

    const pauseText = this.add
      .text(240, 250, "⏸ PAUSA", {
        font: "bold 28px Arial",
        fill: "#00ffff",
        stroke: "#000",
        strokeThickness: 3,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true },
      })
      .setOrigin(0.5);

    const continueBtn = this.add
      .rectangle(240, 320, 180, 38, 0x00cc88, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const continueTxt = this.add
      .text(240, 320, "Continuar", {
        font: "bold 18px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5);

    const menuBtn = this.add
      .rectangle(240, 370, 180, 38, 0xcc0044, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const menuTxt = this.add
      .text(240, 370, "Volver al menú", {
        font: "bold 18px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5);

    continueBtn.on("pointerdown", () => this.resumeGame());
    continueTxt.setInteractive().on("pointerdown", () => this.resumeGame());
    menuBtn.on("pointerdown", () => this.scene.start("MainMenu"));
    menuTxt
      .setInteractive()
      .on("pointerdown", () => this.scene.start("MainMenu"));

    this.pauseUI = [
      overlay,
      menuBox,
      pauseText,
      continueBtn,
      continueTxt,
      menuBtn,
      menuTxt,
    ];
  }

  resumeGame() {
    this.isPaused = false;
    this.physics.resume();
    if (this.enemyTimer) this.enemyTimer.paused = false;
    if (this.fuelTimer) this.fuelTimer.paused = false;
    if (this.scoreTimer) this.scoreTimer.paused = false;
    if (this.difficultyTimer) this.difficultyTimer.paused = false;
    this.pauseUI.forEach((obj) => obj.destroy());
  }

  gameOver(message) {
    this.physics.pause();
    this.isGameOver = true;
    this.player.setTint(0xff0000);

    if (this.enemyTimer) this.enemyTimer.remove(false);
    if (this.fuelTimer) this.fuelTimer.remove(false);
    if (this.scoreTimer) this.scoreTimer.remove(false);
    if (this.difficultyTimer) this.difficultyTimer.remove(false);

    const safeClear = (group) => {
      if (group && group.children && typeof group.clear === "function") {
        try {
          group.clear(true, true);
        } catch (e) {
          console.warn("Error clearing group in gameOver", e);
        }
      }
    };

    safeClear(this.enemies);
    safeClear(this.bullets);
    safeClear(this.enemyBullets);
    safeClear(this.fuelGroup);

    let best = localStorage?.getItem("riverraid_best") || 0;
    if (this.score > best) {
      best = this.score;
      localStorage.setItem("riverraid_best", best);
    }

    this.add.rectangle(240, 320, 480, 640, 0x000000, 0.7);

    this.add
      .rectangle(240, 320, 340, 220, 0x222244, 0.95)
      .setStrokeStyle(4, 0xff4444)
      .setOrigin(0.5);

    this.add
      .text(240, 250, message, {
        font: "bold 22px Arial",
        fill: "#ff4444",
        stroke: "#000",
        strokeThickness: 3,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(240, 295, `El mejor intento: ${best ?? 0}`, {
        font: "bold 18px Arial",
        fill: "#00ffff",
        stroke: "#000",
        strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(240, 325, `Tu puntaje: ${this.score ?? 0}`, {
        font: "bold 18px Arial",
        fill: "#ffff00",
        stroke: "#000",
        strokeThickness: 2,
        shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true },
      })
      .setOrigin(0.5);

    const menuBtn = this.add
      .rectangle(240, 370, 180, 38, 0xcc0044, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const menuTxt = this.add
      .text(240, 370, "Volver al menú", {
        font: "bold 18px Arial",
        fill: "#fff",
      })
      .setOrigin(0.5);

    menuBtn.on("pointerdown", () => this.scene.start("MainMenu"));
    menuTxt
      .setInteractive()
      .on("pointerdown", () => this.scene.start("MainMenu"));
  }

  createTouchControls() {
    if (window.innerWidth > 600) return;

    this.touchObjects = [];

    const size = 54,
      alpha = 0.5,
      yBase = 570,
      xBase = 60;

    const left = this.add
      .circle(xBase, yBase, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add
      .text(xBase, yBase, "◀", { font: "32px Arial", fill: "#00ffff" })
      .setOrigin(0.5);
    left.on("pointerdown", () => (this.touchControls.left = true));
    left.on("pointerup", () => (this.touchControls.left = false));
    left.on("pointerout", () => (this.touchControls.left = false));
    this.touchObjects.push(left);

    const right = this.add
      .circle(xBase + 120, yBase, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add
      .text(xBase + 120, yBase, "▶", { font: "32px Arial", fill: "#00ffff" })
      .setOrigin(0.5);
    right.on("pointerdown", () => (this.touchControls.right = true));
    right.on("pointerup", () => (this.touchControls.right = false));
    right.on("pointerout", () => (this.touchControls.right = false));
    this.touchObjects.push(right);

    const up = this.add
      .circle(xBase + 60, yBase - 50, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add
      .text(xBase + 60, yBase - 50, "▲", {
        font: "32px Arial",
        fill: "#00ffff",
      })
      .setOrigin(0.5);
    up.on("pointerdown", () => (this.touchControls.up = true));
    up.on("pointerup", () => (this.touchControls.up = false));
    up.on("pointerout", () => (this.touchControls.up = false));
    this.touchObjects.push(up);

    const down = this.add
      .circle(xBase + 60, yBase + 50, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add
      .text(xBase + 60, yBase + 50, "▼", {
        font: "32px Arial",
        fill: "#00ffff",
      })
      .setOrigin(0.5);
    down.on("pointerdown", () => (this.touchControls.down = true));
    down.on("pointerup", () => (this.touchControls.down = false));
    down.on("pointerout", () => (this.touchControls.down = false));
    this.touchObjects.push(down);

    const shoot = this.add
      .circle(420, yBase, size / 2, 0xffff00, alpha)
      .setStrokeStyle(2, 0xffff00)
      .setInteractive();
    this.add
      .text(420, yBase, "●", { font: "32px Arial", fill: "#ffff00" })
      .setOrigin(0.5);
    shoot.on("pointerdown", () => (this.touchControls.shoot = true));
    shoot.on("pointerup", () => (this.touchControls.shoot = false));
    shoot.on("pointerout", () => (this.touchControls.shoot = false));
    this.touchObjects.push(shoot);
  }

  shutdown() {
    if (this.touchObjects && Array.isArray(this.touchObjects)) {
      this.touchObjects.forEach((obj) => {
        if (obj && typeof obj.destroy === "function") {
          obj.destroy();
        }
      });
      this.touchObjects = [];
    }

    if (this.pauseUI && Array.isArray(this.pauseUI)) {
      this.pauseUI.forEach((obj) => {
        if (obj && typeof obj.destroy === "function") {
          obj.destroy();
        }
      });
      this.pauseUI = [];
    }

    [
      this.enemyTimer,
      this.fuelTimer,
      this.scoreTimer,
      this.difficultyTimer,
    ].forEach((timer) => {
      if (timer && typeof timer.destroy === "function") {
        timer.destroy();
      }
    });

    const safeClearGroup = (group) => {
      if (group && group.children && typeof group.clear === "function") {
        try {
          group.clear(true, true);
        } catch (e) {
          console.warn("Error clearing group", e);
        }
      }
    };

    safeClearGroup(this.enemies);
    safeClearGroup(this.bullets);
    safeClearGroup(this.enemyBullets);
    safeClearGroup(this.fuelGroup);
    safeClearGroup(this.riverColliders);

    const safeDestroy = (obj) => {
      if (obj && typeof obj.destroy === "function") {
        try {
          obj.destroy();
        } catch (e) {
          console.warn("Error destroying object", e);
        }
      }
    };

    safeDestroy(this.player);
    safeDestroy(this.background);
    safeDestroy(this.riverGraphics);
    safeDestroy(this.fuelTextBg);
    safeDestroy(this.fuelText);
    safeDestroy(this.scoreTextBg);
    safeDestroy(this.scoreText);
    safeDestroy(this.pauseBtn);

    this.riverLeft = [];
    this.riverRight = [];
    this.touchControls = {};

    try {
      this.input.keyboard.off("keydown-ESC");
    } catch (e) {
      console.warn("Error removing keyboard listener", e);
    }

    try {
      this.events.off("shutdown", this.shutdown, this);
    } catch (e) {
      console.warn("Error removing shutdown listener", e);
    }
  }
}
