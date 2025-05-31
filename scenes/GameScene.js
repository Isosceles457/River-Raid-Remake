export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
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
    this.gameSpeed = 2;
    this.enemyDelay = 1000;
    this.difficultyTimer = null;
  }

  preload() {
    this.load.image("player", "assets/player1.png");
    this.load.image("background", "assets/background.webp");
    this.load.image("enemy", "assets/enemy.png");
    this.load.image("fuel", "assets/fuel.png");
    this.load.image("bullet", "assets/bullet.png");
  }

  create() {
    // Reiniciar variables importantes
    this.isGameOver = false;
    this.isPaused = false;
    this.fuelLevel = 100;
    this.score = 0;
    this.gameSpeed = 2;
    this.enemyDelay = 1000;

    // Eliminar enemigos y fuels existentes si los hay
    if (this.enemies) this.enemies.clear(true, true);
    if (this.fuelGroup) this.fuelGroup.clear(true, true);

    this.background = this.add.tileSprite(0, 0, 480, 640, "background").setOrigin(0, 0);

    this.player = this.physics.add.sprite(240, 550, "player");
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();

    // Enemigos
    this.enemies = this.physics.add.group();

    this.enemyTimer = this.time.addEvent({
      delay: this.enemyDelay,
      callback: () => {
        const x = Phaser.Math.Between(50, 430);
        const enemy = this.physics.add.sprite(x, -10, "enemy").setScale(0.5);
        this.enemies.add(enemy);
      },
      loop: true,
    });

    // Balas
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

    // Combustible
    this.fuelGroup = this.physics.add.group();

    this.fuelTimer = this.time.addEvent({
      delay: 3000,
      callback: () => {
        const x = Phaser.Math.Between(50, 430);
        const fuel = this.physics.add.sprite(x, -30, "fuel");
        this.fuelGroup.add(fuel);
      },
      loop: true,
    });

    // Colisión jugador - combustible
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

    // Colisión jugador - enemigo (muere)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      () => {
        this.gameOver("¡HAS SIDO DESTRUIDO!");
      },
      null,
      this
    );

    // UI Mejorada (ajustando tamaño de textos y cajas)
    this.fuelTextBg = this.add.rectangle(70, 30, 100, 28, 0x222244, 0.7).setOrigin(0.5).setStrokeStyle(2, 0x00ffff);
    this.fuelText = this.add.text(70, 30, `⛽ Fuel: ${this.fuelLevel}`, {
      font: "bold 15px Arial",
      fill: "#00ffff",
      stroke: "#000",
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
    }).setOrigin(0.5);

    this.scoreTextBg = this.add.rectangle(410, 30, 100, 28, 0x222244, 0.7).setOrigin(0.5).setStrokeStyle(2, 0xffff00);
    this.scoreText = this.add.text(410, 30, `⭐ Score: ${this.score}`, {
      font: "bold 15px Arial",
      fill: "#ffff00",
      stroke: "#000",
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
    }).setOrigin(0.5);

    // Botón de pausa centrado arriba (más pequeño)
    this.pauseBtn = this.add.rectangle(240, 30, 40, 28, 0x222244, 0.8)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    this.add.text(240, 30, "⏸", {
      font: "bold 18px Arial",
      fill: "#fff"
    }).setOrigin(0.5);

    this.pauseBtn.on('pointerdown', () => {
      if (!this.isGameOver && !this.isPaused) this.pauseGame();
    });

    // Pausa con teclado
    this.input.keyboard.on('keydown-ESC', () => {
      if (!this.isGameOver && !this.isPaused) this.pauseGame();
    });

    // Controles táctiles
    this.createTouchControls();

    // Timer para aumentar dificultad cada 10 segundos
    this.difficultyTimer = this.time.addEvent({
      delay: 10000,
      callback: () => {
        // Aumenta velocidad hasta un máximo
        if (this.gameSpeed < 7) this.gameSpeed += 0.3;
        // Disminuye el delay de enemigos hasta un mínimo
        if (this.enemyDelay > 350) this.enemyDelay -= 50;
        // Actualiza el timer de enemigos
        this.enemyTimer.remove(false);
        this.enemyTimer = this.time.addEvent({
          delay: this.enemyDelay,
          callback: () => {
            const x = Phaser.Math.Between(50, 430);
            const enemy = this.physics.add.sprite(x, -10, "enemy").setScale(0.5);
            this.enemies.add(enemy);
          },
          loop: true,
        });
      },
      loop: true,
    });

    // Score por tiempo vivo
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
  }

  update(time, delta) {
    if (this.isGameOver || this.isPaused) return;

    this.background.tilePositionY -= this.gameSpeed;

    // Movimiento jugador
    let velocityX = 0, velocityY = 0;
    // Teclado
    if (this.cursors.left.isDown) velocityX = -200;
    else if (this.cursors.right.isDown) velocityX = 200;
    if (this.cursors.up.isDown) velocityY = -200;
    else if (this.cursors.down.isDown) velocityY = 200;
    // Táctil
    if (this.touchControls.left) velocityX = -200;
    if (this.touchControls.right) velocityX = 200;
    if (this.touchControls.up) velocityY = -200;
    if (this.touchControls.down) velocityY = 200;

    this.player.setVelocity(velocityX, velocityY);

    // Disparo
    if ((this.cursors.space?.isDown || this.touchControls.shoot) && time > this.lastFired + 300) {
      const bullet = this.bullets.create(this.player.x, this.player.y - 20, "bullet");
      bullet.setVelocityY(-300);
      bullet.setCollideWorldBounds(false);
      this.lastFired = time;
    }

    // Movimiento enemigos
    this.enemies.children.iterate((e) => {
      if (e) {
        e.y += this.gameSpeed;
        if (e.y > 700) e.destroy();
      }
    });

    // Movimiento fuel
    this.fuelGroup.children.iterate((f) => {
      if (f) {
        f.y += this.gameSpeed;
        if (f.y > 700) f.destroy();
      }
    });

    // Combustible
    this.fuelLevel -= 0.05;
    if (this.fuelLevel <= 0) {
      this.fuelLevel = 0;
      this.gameOver("¡SIN COMBUSTIBLE!");
    } else {
      this.updateFuelText();
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

    // Fondo difuminado
    const overlay = this.add.rectangle(240, 320, 480, 640, 0x000000, 0.7);
    // Caja de menú
    const menuBox = this.add.rectangle(240, 320, 340, 260, 0x222244, 0.95)
      .setStrokeStyle(4, 0x00ffff)
      .setOrigin(0.5);

    // Título
    const pauseText = this.add.text(240, 250, '⏸ PAUSA', {
      font: 'bold 28px Arial',
      fill: '#00ffff',
      stroke: '#000',
      strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
    }).setOrigin(0.5);

    // Botón continuar
    const continueBtn = this.add.rectangle(240, 320, 180, 38, 0x00cc88, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const continueTxt = this.add.text(240, 320, 'Continuar', {
      font: 'bold 18px Arial',
      fill: '#fff'
    }).setOrigin(0.5);

    // Botón menú principal
    const menuBtn = this.add.rectangle(240, 370, 180, 38, 0xcc0044, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const menuTxt = this.add.text(240, 370, 'Volver al menú', {
      font: 'bold 18px Arial',
      fill: '#fff'
    }).setOrigin(0.5);

    continueBtn.on('pointerdown', () => this.resumeGame());
    continueTxt.setInteractive().on('pointerdown', () => this.resumeGame());
    menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    menuTxt.setInteractive().on('pointerdown', () => this.scene.start('MainMenu'));

    this.pauseUI = [overlay, menuBox, pauseText, continueBtn, continueTxt, menuBtn, menuTxt];
  }

  resumeGame() {
    this.isPaused = false;
    this.physics.resume();
    if (this.enemyTimer) this.enemyTimer.paused = false;
    if (this.fuelTimer) this.fuelTimer.paused = false;
    if (this.scoreTimer) this.scoreTimer.paused = false;
    if (this.difficultyTimer) this.difficultyTimer.paused = false;
    this.pauseUI.forEach(obj => obj.destroy());
  }

  gameOver(message) {
    this.physics.pause();
    this.isGameOver = true;
    this.player.setTint(0xff0000);

    // Cancelar timers
    if (this.enemyTimer) this.enemyTimer.remove(false);
    if (this.fuelTimer) this.fuelTimer.remove(false);
    if (this.scoreTimer) this.scoreTimer.remove(false);
    if (this.difficultyTimer) this.difficultyTimer.remove(false);

    // Guardar mejor puntaje
    let best = localStorage.getItem('riverraid_best') || 0;
    if (this.score > best) {
      best = this.score;
      localStorage.setItem('riverraid_best', best);
    }

    // Fondo difuminado
    this.add.rectangle(240, 320, 480, 640, 0x000000, 0.7);

    // Caja de mensaje
    this.add.rectangle(240, 320, 340, 220, 0x222244, 0.95)
      .setStrokeStyle(4, 0xff4444)
      .setOrigin(0.5);

    // Texto de game over
    this.add.text(240, 250, message, {
      font: "bold 22px Arial",
      fill: "#ff4444",
      stroke: "#000",
      strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
    }).setOrigin(0.5);

    // Mejor intento
    this.add.text(240, 295, `El mejor intento: ${best}`, {
      font: "bold 18px Arial",
      fill: "#00ffff",
      stroke: "#000",
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
    }).setOrigin(0.5);

    // Tu puntaje
    this.add.text(240, 325, `Tu puntaje: ${this.score}`, {
      font: "bold 18px Arial",
      fill: "#ffff00",
      stroke: "#000",
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 1, fill: true }
    }).setOrigin(0.5);

    // Botón volver al menú
    const menuBtn = this.add.rectangle(240, 370, 180, 38, 0xcc0044, 1)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive();
    const menuTxt = this.add.text(240, 370, 'Volver al menú', {
      font: 'bold 18px Arial',
      fill: '#fff'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    menuTxt.setInteractive().on('pointerdown', () => this.scene.start('MainMenu'));
  }

  // --- CONTROLES TÁCTILES ---
  createTouchControls() {
    // Solo mostrar en pantallas pequeñas (móviles)
    if (window.innerWidth > 600) return;

    // Flechas
    const size = 54, alpha = 0.5, yBase = 570, xBase = 60;
    // Izquierda
    const left = this.add.circle(xBase, yBase, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add.text(xBase, yBase, "◀", { font: "32px Arial", fill: "#00ffff" }).setOrigin(0.5);
    left.on('pointerdown', () => this.touchControls.left = true);
    left.on('pointerup', () => this.touchControls.left = false);
    left.on('pointerout', () => this.touchControls.left = false);

    // Derecha
    const right = this.add.circle(xBase + 120, yBase, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add.text(xBase + 120, yBase, "▶", { font: "32px Arial", fill: "#00ffff" }).setOrigin(0.5);
    right.on('pointerdown', () => this.touchControls.right = true);
    right.on('pointerup', () => this.touchControls.right = false);
    right.on('pointerout', () => this.touchControls.right = false);

    // Arriba
    const up = this.add.circle(xBase + 60, yBase - 50, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add.text(xBase + 60, yBase - 50, "▲", { font: "32px Arial", fill: "#00ffff" }).setOrigin(0.5);
    up.on('pointerdown', () => this.touchControls.up = true);
    up.on('pointerup', () => this.touchControls.up = false);
    up.on('pointerout', () => this.touchControls.up = false);

    // Abajo
    const down = this.add.circle(xBase + 60, yBase + 50, size / 2, 0x00ffff, alpha)
      .setStrokeStyle(2, 0x00ffff)
      .setInteractive();
    this.add.text(xBase + 60, yBase + 50, "▼", { font: "32px Arial", fill: "#00ffff" }).setOrigin(0.5);
    down.on('pointerdown', () => this.touchControls.down = true);
    down.on('pointerup', () => this.touchControls.down = false);
    down.on('pointerout', () => this.touchControls.down = false);

    // Disparo
    const shoot = this.add.circle(420, 570, size / 2, 0xffff00, alpha)
      .setStrokeStyle(2, 0xffff00)
      .setInteractive();
    this.add.text(420, 570, "●", { font: "32px Arial", fill: "#ffff00" }).setOrigin(0.5);
    shoot.on('pointerdown', () => this.touchControls.shoot = true);
    shoot.on('pointerup', () => this.touchControls.shoot = false);
    shoot.on('pointerout', () => this.touchControls.shoot = false);
  }
}