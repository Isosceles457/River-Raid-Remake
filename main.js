const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let background;
let player;
let enemies;
let bullets;
let lastFired = 0;
let fuelGroup;
let fuelLevel = 100;
let fuelText;
let score = 0;
let scoreText;
let isGameOver = false;

function preload() {
  this.load.image("player", "assets/player1.png");
  this.load.image("background", "assets/background.webp");
  this.load.image("enemy", "assets/enemy.png");
  this.load.image("fuel", "assets/fuel.png");
  this.load.image("bullet", "assets/bullet.png");
}

function create() {
  background = this.add
    .tileSprite(0, 0, 480, 640, "background")
    .setOrigin(0, 0);

  player = this.physics.add.sprite(240, 550, "player");
  player.setCollideWorldBounds(true);

  this.cursors = this.input.keyboard.createCursorKeys();

  // Enemigos
  enemies = this.physics.add.group();

  this.enemyTimer = this.time.addEvent({
    delay: 1000,
    callback: () => {
      const x = Phaser.Math.Between(50, 430);
      const enemy = this.physics.add.sprite(x, -10, "enemy").setScale(0.5);
      enemies.add(enemy);
    },
    loop: true,
  });

  // Balas
  bullets = this.physics.add.group();

  this.physics.add.overlap(
    bullets,
    enemies,
    (bullet, enemy) => {
      bullet.destroy();
      enemy.destroy();
      score += 10;
      updateScoreText();
    },
    null,
    this
  );

  // Combustible
  fuelGroup = this.physics.add.group();

  this.fuelTimer = this.time.addEvent({
    delay: 3000,
    callback: () => {
      const x = Phaser.Math.Between(50, 430);
      const fuel = this.physics.add.sprite(x, -30, "fuel");
      fuelGroup.add(fuel);
    },
    loop: true,
  });

  // Colisión jugador - combustible
  this.physics.add.overlap(
    player,
    fuelGroup,
    (player, fuel) => {
      fuel.destroy();
      fuelLevel = Math.min(fuelLevel + 25, 100);
      updateFuelText();
    },
    null,
    this
  );

  // Colisión jugador - enemigo (muere)
  this.physics.add.overlap(
    player,
    enemies,
    () => {
      gameOver.call(this, "YOU WERE HIT!");
    },
    null,
    this
  );

  // UI
  fuelText = this.add.text(10, 10, `Fuel: ${fuelLevel}`, {
    font: "16px Arial",
    fill: "#ffffff",
  });

  scoreText = this.add.text(360, 10, `Score: ${score}`, {
    font: "16px Arial",
    fill: "#ffffff",
  });
}

function update(time, delta) {
  if (isGameOver) return;

  background.tilePositionY -= 2;

  // Movimiento jugador
  player.setVelocity(0);
  if (this.cursors.left.isDown) player.setVelocityX(-200);
  else if (this.cursors.right.isDown) player.setVelocityX(200);
  if (this.cursors.up.isDown) player.setVelocityY(-200);
  else if (this.cursors.down.isDown) player.setVelocityY(200);

  // Disparo
  if (this.cursors.space?.isDown && time > lastFired + 300) {
    const bullet = bullets.create(player.x, player.y - 20, "bullet");
    bullet.setVelocityY(-300);
    bullet.setCollideWorldBounds(false);
    lastFired = time;
  }

  // Movimiento enemigos
  enemies.children.iterate((e) => {
    if (e) {
      e.y += 2;
      if (e.y > 700) e.destroy();
    }
  });

  // Movimiento fuel
  fuelGroup.children.iterate((f) => {
    if (f) {
      f.y += 2;
      if (f.y > 700) f.destroy();
    }
  });

  // Combustible
  fuelLevel -= 0.05;
  if (fuelLevel <= 0) {
    fuelLevel = 0;
    gameOver.call(this, "OUT OF FUEL");
  } else {
    updateFuelText();
  }
}

function updateFuelText() {
  fuelText.setText(`Fuel: ${Math.floor(fuelLevel)}`);
}

function updateScoreText() {
  scoreText.setText(`Score: ${score}`);
}

function gameOver(message) {
  this.physics.pause();
  isGameOver = true;
  player.setTint(0xff0000);

  // Cancelar timers
  if (this.enemyTimer) this.enemyTimer.remove(false);
  if (this.fuelTimer) this.fuelTimer.remove(false);

  // Mostrar texto de game over
  this.add
    .text(240, 320, message, {
      font: "28px Arial",
      fill: "#ff4444",
    })
    .setOrigin(0.5);
}
