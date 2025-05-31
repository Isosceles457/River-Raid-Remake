export default class MapSelect extends Phaser.Scene {
  constructor() {
    super('MapSelect');
  }

  create() {
    this.add.text(240, 200, 'Selección de mapa (próximamente)', {
      font: '24px Arial',
      fill: '#fff'
    }).setOrigin(0.5);

    const backBtn = this.add.text(240, 400, 'Volver', {
      font: '24px Arial',
      fill: '#0f0'
    }).setOrigin(0.5).setInteractive();

    backBtn.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}