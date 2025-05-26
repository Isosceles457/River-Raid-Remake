// River Raid Remake básico con Phaser 3
const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  parent: "game-container",
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

let player,
  cursors,
  river,
  enemies,
  fuels,
  score = 0,
  scoreText,
  fuel = 100,
  fuelText,
  gameOver = false;

const RIVER_WIDTH = 220;
const PLAYER_SPEED = 200;
const ENEMY_SPEED = 180;
const FUEL_SPEED = 180;

const game = new Phaser.Game(config);

function preload() {
  // Sprites simples con gráficos generados
  this.textures.generate("player", {
    data: ["  2  ", " 222 ", "22222", " 222 ", "  2  "],
    pixelWidth: 10,
    palette: { 2: "#fff" },
  });
  this.textures.generate("enemy", {
    data: ["  3  ", " 333 ", "33333", " 333 ", "  3  "],
    pixelWidth: 10,
    palette: { 3: "#f00" },
  });
  this.textures.generate("fuel", {
    data: ["  4  ", " 444 ", "44444", " 444 ", "  4  "],
    pixelWidth: 10,
    palette: { 4: "#0f0" },
  });
}

function create() {
  // Fondo del río
  river = this.add.graphics();
  drawRiver(this);

  // Jugador
  player = this.physics.add.sprite(
    config.width / 2,
    config.height - 60,
    "player"
  );
  player.setCollideWorldBounds(true);

  // Enemigos y fuel
  enemies = this.physics.add.group();
  fuels = this.physics.add.group();

  // Controles
  cursors = this.input.keyboard.createCursorKeys();

  // Texto de puntuación y fuel
  scoreText = this.add.text(10, 10, "Puntos: 0", {
    fontSize: "20px",
    fill: "#fff",
  });
  fuelText = this.add.text(350, 10, "Fuel: 100", {
    fontSize: "20px",
    fill: "#fff",
  });

  // Colisiones
  this.physics.add.overlap(player, enemies, hitEnemy, null, this);
  this.physics.add.overlap(player, fuels, collectFuel, null, this);
}

function update() {
  if (gameOver) return;

  // Movimiento jugador
  player.setVelocity(0);
  if (
    cursors.left.isDown &&
    player.x > config.width / 2 - RIVER_WIDTH / 2 + 20
  ) {
    player.setVelocityX(-PLAYER_SPEED);
  } else if (
    cursors.right.isDown &&
    player.x < config.width / 2 + RIVER_WIDTH / 2 - 20
  ) {
    player.setVelocityX(PLAYER_SPEED);
  }

  // Fuel
  fuel -= 0.05;
  if (fuel <= 0) {
    endGame(this, "¡Sin fuel!");
  }
  fuelText.setText("Fuel: " + Math.max(0, Math.floor(fuel)));

  // Spawnear enemigos y fuel
  if (Phaser.Math.Between(0, 100) < 2) {
    spawnEnemy(this);
  }
  if (Phaser.Math.Between(0, 100) < 1) {
    spawnFuel(this);
  }

  // Mover enemigos y fuel
  enemies.children.iterate(function (child) {
    if (child) {
      child.y += (ENEMY_SPEED * this.game.loop.delta) / 1000;
      if (child.y > config.height + 40) child.destroy();
    }
  }, this);
  fuels.children.iterate(function (child) {
    if (child) {
      child.y += (FUEL_SPEED * this.game.loop.delta) / 1000;
      if (child.y > config.height + 40) child.destroy();
    }
  }, this);

  // Puntos
  score += 0.05;
  scoreText.setText("Puntos: " + Math.floor(score));
}

function drawRiver(scene) {
  river.clear();
  river.fillStyle(0x0066ff, 1);
  river.fillRect(
    config.width / 2 - RIVER_WIDTH / 2,
    0,
    RIVER_WIDTH,
    config.height
  );
  // Bordes
  river.lineStyle(4, 0xffffff, 1);
  river.strokeRect(
    config.width / 2 - RIVER_WIDTH / 2,
    0,
    RIVER_WIDTH,
    config.height
  );
}

function spawnEnemy(scene) {
  const x = Phaser.Math.Between(
    config.width / 2 - RIVER_WIDTH / 2 + 20,
    config.width / 2 + RIVER_WIDTH / 2 - 20
  );
  const enemy = enemies.create(x, -20, "enemy");
  enemy.setImmovable(true);
}

function spawnFuel(scene) {
  const x = Phaser.Math.Between(
    config.width / 2 - RIVER_WIDTH / 2 + 20,
    config.width / 2 + RIVER_WIDTH / 2 - 20
  );
  const fuelItem = fuels.create(x, -20, "fuel");
  fuelItem.setImmovable(true);
}

function hitEnemy(player, enemy) {
  endGame(this, "¡Colisión!");
}

function collectFuel(player, fuelItem) {
  fuel = Math.min(100, fuel + 30);
  fuelItem.destroy();
}

function endGame(scene, msg) {
  gameOver = true;
  scene.add.text(config.width / 2 - 80, config.height / 2, msg, {
    fontSize: "32px",
    fill: "#f00",
  });
  scene.physics.pause();
}
