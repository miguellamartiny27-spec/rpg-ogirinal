import Phaser from "phaser";
import { WORLD } from "../config.js";

export class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
    this.keys = null;
    this.touchDirection = { x: 0, y: 0 };
  }

  create() {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createControls();
    this.createHud();

    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(Math.min(1, this.scale.width / 760));

    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT");
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
  }

  createTextures() {
    if (this.textures.exists("hero")) return;

    const hero = this.make.graphics({ x: 0, y: 0, add: false });
    hero.fillStyle(0x253b35); hero.fillRect(7, 2, 18, 28);
    hero.fillStyle(0xe6b987); hero.fillRect(9, 2, 14, 12);
    hero.fillStyle(0x5a382b); hero.fillRect(8, 0, 16, 5);
    hero.fillStyle(0x3f6d91); hero.fillRect(7, 14, 18, 12);
    hero.fillStyle(0xddd2b5); hero.fillRect(8, 26, 7, 6); hero.fillRect(18, 26, 7, 6);
    hero.fillStyle(0x27312d); hero.fillRect(12, 7, 2, 2); hero.fillRect(19, 7, 2, 2);
    hero.generateTexture("hero", 32, 34);
    hero.destroy();

    const tree = this.make.graphics({ x: 0, y: 0, add: false });
    tree.fillStyle(0x4a3528); tree.fillRect(18, 25, 12, 25);
    tree.fillStyle(0x31563b); tree.fillCircle(24, 20, 21);
    tree.fillStyle(0x477348); tree.fillCircle(14, 17, 13);
    tree.fillStyle(0x5b854d); tree.fillCircle(30, 12, 12);
    tree.generateTexture("tree", 48, 52);
    tree.destroy();

    const rock = this.make.graphics({ x: 0, y: 0, add: false });
    rock.fillStyle(0x68756b); rock.fillEllipse(18, 14, 31, 22);
    rock.fillStyle(0x879184); rock.fillEllipse(13, 9, 13, 7);
    rock.generateTexture("rock", 36, 28);
    rock.destroy();
  }

  createWorld() {
    const tile = 48;
    const map = this.add.graphics();
    for (let y = 0; y < WORLD.height; y += tile) {
      for (let x = 0; x < WORLD.width; x += tile) {
        const variation = ((x / tile * 13 + y / tile * 7) % 5);
        const color = variation === 0 ? 0x5b8351 : variation === 1 ? 0x527b4c : 0x567f4e;
        map.fillStyle(color, 1);
        map.fillRect(x, y, tile, tile);
        map.fillStyle(0x71935c, 0.14);
        map.fillRect(x + 5 + variation * 3, y + 9, 3, 3);
        map.fillRect(x + 28, y + 30 - variation, 2, 2);
      }
    }

    // Trilha central e clareira inicial.
    map.fillStyle(0xb99a69, 1);
    map.fillPoints([
      new Phaser.Math.Vector2(0, 510),
      new Phaser.Math.Vector2(0, 590),
      new Phaser.Math.Vector2(570, 590),
      new Phaser.Math.Vector2(700, 650),
      new Phaser.Math.Vector2(760, 700),
      new Phaser.Math.Vector2(820, 650),
      new Phaser.Math.Vector2(700, 560),
      new Phaser.Math.Vector2(590, 510)
    ], true);
    map.fillStyle(0xc7aa79, 0.55);
    map.fillEllipse(890, 590, 390, 280);
    map.fillStyle(0x397d83, 1);
    map.fillEllipse(1460, 260, 440, 250);
    map.fillStyle(0x5ca0a0, 0.45);
    map.fillEllipse(1430, 235, 300, 95);

    // Detalhes de vegetação e pedras.
    this.obstacles = this.physics.add.staticGroup();
    const treePositions = [
      [170,150],[290,230],[470,120],[620,210],[790,130],[1030,150],[1180,430],
      [1540,500],[1660,680],[1450,900],[1250,1030],[930,990],[620,930],[300,900],
      [120,720],[250,650],[1080,720],[1580,1000],[1720,180],[80,300]
    ];
    treePositions.forEach(([x,y]) => {
      const t = this.add.image(x,y,"tree").setOrigin(0.5,0.82);
      this.obstacles.add(this.physics.add.existing(t, true));
      t.body.setSize(22, 18).setOffset(13, 29);
      t.setDepth(y);
    });

    const rockPositions = [[390,430],[510,760],[980,350],[1130,850],[350,1040],[1650,820],[760,300]];
    rockPositions.forEach(([x,y]) => {
      const r = this.add.image(x,y,"rock");
      this.obstacles.add(this.physics.add.existing(r, true));
      r.body.setSize(28, 16).setOffset(4, 8);
      r.setDepth(y);
    });

    map.setDepth(-10);
    this.add.text(865, 445, "CLAREIRA DO COMEÇO", {
      fontSize: "13px", color: "#f1e4bd", fontStyle: "bold",
      stroke: "#354936", strokeThickness: 4, letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);
    this.add.text(1450, 110, "LAGO SERENO", {
      fontSize: "12px", color: "#d6eeee", stroke: "#28545a", strokeThickness: 4, letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(820, 610, "hero");
    this.player.setDepth(1000);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(18, 14).setOffset(7, 18);
    this.player.setMaxVelocity(155, 155);
    this.physics.add.collider(this.player, this.obstacles);
  }

  createControls() {
    const makeButton = (x, y, label, dx, dy) => {
      const bg = this.add.circle(x, y, 25, 0x17231e, 0.72)
        .setScrollFactor(0).setDepth(3000).setStrokeStyle(2, 0xc6b27d, 0.8)
        .setInteractive();
      this.add.text(x, y, label, {
        fontSize: "20px", color: "#f5e9c9", fontStyle: "bold"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(3001);
      const press = () => { this.touchDirection.x = dx; this.touchDirection.y = dy; };
      const release = () => {
        if (this.touchDirection.x === dx && this.touchDirection.y === dy) {
          this.touchDirection.x = 0; this.touchDirection.y = 0;
        }
      };
      bg.on("pointerdown", press);
      bg.on("pointerup", release);
      bg.on("pointerout", release);
    };

    const left = 58, bottom = this.scale.height - 62;
    makeButton(left, bottom, "↓", 0, 1);
    makeButton(left, bottom - 106, "↑", 0, -1);
    makeButton(left - 52, bottom - 53, "←", -1, 0);
    makeButton(left + 52, bottom - 53, "→", 1, 0);
    this.scale.on("resize", () => this.scene.restart());
  }

  createHud() {
    const panel = this.add.rectangle(18, 18, 270, 58, 0x14211f, 0.84)
      .setOrigin(0).setScrollFactor(0).setDepth(4000)
      .setStrokeStyle(1, 0xbda46d, 0.75);
    this.add.text(32, 27, "VIAJANTE  •  NÍVEL 1", {
      fontSize: "12px", color: "#e8d8ad", fontStyle: "bold", letterSpacing: 1
    }).setScrollFactor(0).setDepth(4001);
    this.add.rectangle(32, 51, 180, 8, 0x39463c).setOrigin(0).setScrollFactor(0).setDepth(4001);
    this.add.rectangle(32, 51, 180, 8, 0x8d4e48).setOrigin(0).setScrollFactor(0).setDepth(4002);
    this.add.text(224, 47, "100/100", {
      fontSize: "10px", color: "#f4edda"
    }).setScrollFactor(0).setDepth(4002);
    this.add.text(this.scale.width - 18, 20, "WASD / SETAS", {
      fontSize: "11px", color: "#e8d8ad", backgroundColor: "#14211fcc",
      padding: { x: 9, y: 7 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(4000);
  }

  update() {
    if (!this.player || !this.keys) return;
    const speed = 145;
    let x = 0, y = 0;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;
    if (x === 0 && y === 0) {
      x = this.touchDirection.x;
      y = this.touchDirection.y;
    }
    const vector = new Phaser.Math.Vector2(x, y).normalize();
    this.player.setVelocity(vector.x * speed, vector.y * speed);
    if (x < 0) this.player.setFlipX(true);
    else if (x > 0) this.player.setFlipX(false);
  }
}