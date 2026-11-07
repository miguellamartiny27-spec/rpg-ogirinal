import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#14211f");

    const glow = this.add.graphics();
    glow.fillStyle(0x29463b, 0.55);
    glow.fillCircle(width * 0.5, height * 0.42, Math.min(width, height) * 0.42);

    this.add.text(width / 2, height * 0.29, "RPG", {
      fontFamily: "Georgia, serif",
      fontSize: Math.min(76, Math.max(42, width * 0.08)) + "px",
      color: "#e8d6a5",
      fontStyle: "bold",
      stroke: "#24352d",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, "ORIGINAL", {
      fontFamily: "Arial, sans-serif",
      fontSize: Math.max(18, width * 0.027) + "px",
      color: "#a9c69b",
      letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.58, "Um novo mundo está esperando.", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#d1d9c6"
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height * 0.72, 210, 58, 0xb58b4b)
      .setStrokeStyle(3, 0xe7cc8e)
      .setInteractive({ useHandCursor: true });

    const label = this.add.text(width / 2, height * 0.72, "COMEÇAR", {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#17231e",
      fontStyle: "bold",
      letterSpacing: 2
    }).setOrigin(0.5);

    button.on("pointerover", () => button.setFillStyle(0xd0a65e));
    button.on("pointerout", () => button.setFillStyle(0xb58b4b));
    button.on("pointerdown", () => this.scene.start("WorldScene"));
    label.setInteractive().on("pointerdown", () => this.scene.start("WorldScene"));

    this.add.text(width / 2, height - 24, "PROTÓTIPO  •  VERSÃO 0.1", {
      fontSize: "11px",
      color: "#82978a",
      letterSpacing: 2
    }).setOrigin(0.5);
  }
}