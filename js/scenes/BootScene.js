class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.audio("click", "assets/sfx/click.mp3");
    this.load.audio("attack", "assets/sfx/attack.mp3");
    this.load.audio("spell", "assets/sfx/spell.mp3");
    this.load.audio("death", "assets/sfx/death.mp3");
    this.load.audio("turn", "assets/sfx/turn.mp3");
  }

  create() {
    this.scene.start("MenuScene");
  }
}