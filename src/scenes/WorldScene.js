import Phaser from "phaser";
import { WORLD } from "../config.js";

export class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
    this.touchDirection = { x: 0, y: 0 };
  }

  create() {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createNpc();
    this.createControls();
    this.createHud();

    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(Math.min(1, this.scale.width / 760));

    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT");
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
  }

  createTextures() {
    if (this.textures.exists("hero-sheet")) return;

    const hero = this.make.graphics({ x: 0, y: 0, add: false });
    const frameW = 32, frameH = 36;
    const drawHero = (ox, oy, dir, step) => {
      const px = (x, y, w, h, color) => { hero.fillStyle(color, 1); hero.fillRect(ox + x, oy + y, w, h); };
      const skin = 0xe8b887, hair = 0x513528, coat = 0x315f86, dark = 0x26332f, boot = 0x49352b;
      // sombra
      px(7, 30, 18, 4, 0x354b35);
      // pernas e botas
      if (dir === "up" || dir === "down") {
        px(10, 23, 5, 8, 0x344c60); px(18, 23, 5, 8, 0x344c60);
        px(step % 2 ? 8 : 10, 29, 7, 5, boot); px(step % 2 ? 18 : 16, 29, 7, 5, boot);
      } else {
        px(12, 23, 6, 8, 0x344c60); px(step % 2 ? 16 : 11, 29, 8, 5, boot);
      }
      // corpo, braços e mochila
      if (dir === "up") px(7, 12, 5, 12, 0x76523b);
      px(8, 13, 16, 12, coat); px(6, 15, 4, 9, skin); px(22, 15, 4, 9, skin);
      px(10, 13, 12, 3, 0x477da0); px(13, 17, 5, 7, 0xc5a66c);
      // cabeça e cabelo
      px(9, 3, 14, 12, skin); px(8, 2, 16, 6, hair); px(8, 6, 3, 5, hair); px(21, 6, 3, 5, hair);
      if (dir === "down") { px(12, 8, 2, 2, dark); px(19, 8, 2, 2, dark); }
      if (dir === "left") { px(10, 8, 2, 2, dark); px(8, 5, 4, 5, hair); }
      if (dir === "right") { px(20, 8, 2, 2, dark); px(20, 5, 4, 5, hair); }
      if (dir === "up") { px(9, 2, 14, 10, hair); px(11, 10, 10, 3, hair); }
      // detalhes
      px(9, 14, 2, 5, 0x6e9ab0); px(21, 14, 2, 5, 0x6e9ab0);
    };
    const directions = ["down", "left", "right", "up"];
    directions.forEach((dir, row) => {
      for (let frame = 0; frame < 4; frame++) drawHero(frame * frameW, row * frameH, dir, frame);
    });
    hero.generateTexture("hero-sheet", frameW * 4, frameH * 4);
    hero.destroy();
    const heroTexture = this.textures.get("hero-sheet");
    directions.forEach((dir, row) => {
      for (let frame = 0; frame < 4; frame++) {
        heroTexture.add(`${dir}-${frame}`, 0, frame * frameW, row * frameH, frameW, frameH);
      }
    });
    directions.forEach((dir) => {
      this.anims.create({
        key: `hero-walk-${dir}`,
        frames: [0, 1, 2, 3].map((frame) => ({ key: "hero-sheet", frame: `${dir}-${frame}` })),
        frameRate: 8,
        repeat: -1
      });
    });

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

    const bush = this.make.graphics({ x: 0, y: 0, add: false });
    bush.fillStyle(0x294b32); bush.fillEllipse(24, 25, 42, 23);
    bush.fillStyle(0x3e7042); bush.fillCircle(14, 20, 13);
    bush.fillStyle(0x4e8148); bush.fillCircle(29, 15, 15);
    bush.fillStyle(0x5d8b50); bush.fillCircle(39, 23, 11);
    bush.fillStyle(0x7da05c, 0.8); bush.fillCircle(22, 11, 4);
    bush.generateTexture("bush", 52, 34);
    bush.destroy();

    const npc = this.make.graphics({ x: 0, y: 0, add: false });
    npc.fillStyle(0x354a38); npc.fillEllipse(16, 34, 23, 7);
    npc.fillStyle(0x69452f); npc.fillRect(9, 22, 6, 11); npc.fillRect(18, 22, 6, 11);
    npc.fillStyle(0x6b8b53); npc.fillRect(7, 12, 18, 13);
    npc.fillStyle(0x9d7448); npc.fillRect(5, 14, 4, 10); npc.fillRect(23, 14, 4, 10);
    npc.fillStyle(0xe4b98a); npc.fillRect(9, 2, 14, 13);
    npc.fillStyle(0x6b422d); npc.fillRect(8, 1, 16, 5); npc.fillRect(7, 4, 3, 7); npc.fillRect(22, 4, 3, 7);
    npc.fillStyle(0x29352e); npc.fillRect(12, 7, 2, 2); npc.fillRect(19, 7, 2, 2);
    npc.fillStyle(0xd7c28c); npc.fillRect(14, 16, 4, 7);
    npc.generateTexture("village-elder", 32, 38);
    npc.destroy();

    const grass = this.make.graphics({ x: 0, y: 0, add: false });
    grass.lineStyle(2, 0x9ab66a, 0.9);
    grass.beginPath(); grass.moveTo(8, 18); grass.lineTo(5, 5);
    grass.moveTo(10, 18); grass.lineTo(12, 2);
    grass.moveTo(12, 18); grass.lineTo(18, 7); grass.strokePath();
    grass.generateTexture("grass-tuft", 24, 20);
    grass.destroy();
  }

  createWorld() {
    const tile = WORLD.tileSize;
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

    this.obstacles = this.physics.add.staticGroup();
    const treePositions = [
      [170,150],[290,230],[470,120],[620,210],[790,130],[1030,150],[1180,430],
      [1540,500],[1660,680],[1450,900],[1250,1030],[930,990],[620,930],[300,900],
      [120,720],[250,650],[1080,720],[1580,1000],[1720,180],[80,300]
    ];
    treePositions.forEach(([x, y]) => {
      const tree = this.add.image(x, y, "tree").setOrigin(0.5, 0.82);
      this.obstacles.add(tree);
      tree.body.setSize(22, 18).setOffset(13, 29);
      tree.setDepth(y);
    });

    const rockPositions = [[390,430],[510,760],[980,350],[1130,850],[350,1040],[1650,820],[760,300]];
    rockPositions.forEach(([x, y]) => {
      const rock = this.add.image(x, y, "rock");
      this.obstacles.add(rock);
      rock.body.setSize(28, 16).setOffset(4, 8);
      rock.setDepth(y);
    });

    map.setDepth(-10);
    this.add.text(865, 445, "CLAREIRA DO COMEÇO", {
      fontSize: "13px", color: "#f1e4bd", fontStyle: "bold",
      stroke: "#354936", strokeThickness: 4, letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);
    this.add.text(1450, 110, "LAGO SERENO", {
      fontSize: "12px", color: "#d6eeee", stroke: "#28545a",
      strokeThickness: 4, letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    this.createEnvironmentDetails();
    this.createEnvironmentAnimations();
  }

  createEnvironmentDetails() {
    const bushes = [
      [105, 430, 0.9], [250, 390, 0.8], [430, 300, 0.85], [680, 390, 0.9],
      [930, 300, 0.8], [1100, 560, 0.95], [1260, 690, 0.85], [1530, 370, 0.9],
      [1640, 560, 0.8], [1390, 790, 0.9], [1010, 900, 0.85], [700, 850, 0.9],
      [420, 820, 0.8], [180, 820, 0.9], [80, 610, 0.8], [1740, 420, 0.9]
    ];
    bushes.forEach(([x, y, scale]) => {
      this.add.image(x, y, "bush").setScale(scale).setDepth(y - 2);
    });

    const grassPatches = [
      [90, 220], [350, 170], [550, 340], [740, 250], [980, 180],
      [1160, 330], [1320, 520], [1600, 740], [1500, 960], [1180, 960],
      [850, 1060], [540, 980], [260, 1030], [90, 900], [1780, 850],
      [350, 560], [1040, 680], [700, 730], [1260, 160], [1680, 300]
    ];
    grassPatches.forEach(([x, y], index) => {
      this.add.image(x, y, "grass-tuft")
        .setRotation(((index % 5) - 2) * 0.12)
        .setAlpha(0.72).setDepth(y);
    });

    const flowerColors = [0xf0d47a, 0xe7a6a1, 0xd9d5ef, 0xf0e8c8];
    const flowerPatches = [
      [210, 300], [380, 220], [570, 180], [760, 330], [930, 220],
      [1080, 390], [1280, 590], [1550, 650], [1450, 880], [1120, 1030],
      [820, 930], [580, 890], [320, 960], [130, 760], [1710, 940]
    ];
    flowerPatches.forEach(([x, y], index) => {
      const color = flowerColors[index % flowerColors.length];
      this.add.circle(x, y, 3, 0x3c633d).setDepth(y);
      this.add.circle(x, y - 3, 2.5, color).setDepth(y + 1);
      this.add.circle(x - 3, y, 2, color).setDepth(y + 1);
      this.add.circle(x + 3, y, 2, color).setDepth(y + 1);
      this.add.circle(x, y + 2, 2, color).setDepth(y + 1);
    });

    [[220,480],[320,720],[590,470],[870,820],[1080,760],[1320,900],[1580,220],[470,1080]]
      .forEach(([x,y], i) => {
        this.add.ellipse(x, y, 7 + (i % 3) * 2, 4, 0x879184, 0.8).setDepth(y);
      });
  }

  createEnvironmentAnimations() {
    const glints = [
      [1370, 225, 0.9], [1450, 270, 0.65], [1530, 215, 0.8], [1490, 315, 0.55]
    ];
    glints.forEach(([x, y, alpha], index) => {
      const shine = this.add.ellipse(x, y, 44, 5, 0xc4e5d9, alpha)
        .setDepth(1).setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: shine, x: x + (index % 2 ? -18 : 18),
        scaleX: 1.35, alpha: 0.18, duration: 2100 + index * 350,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut",
        delay: index * 420
      });
    });

    const fireflySpots = [
      [190, 250], [460, 190], [730, 300], [1010, 230],
      [1210, 650], [1510, 740], [900, 960], [280, 880]
    ];
    fireflySpots.forEach(([x, y], index) => {
      const glow = this.add.circle(x, y, 2.2, 0xf4e6a0, 0.15).setDepth(y + 3);
      this.tweens.add({
        targets: glow, alpha: 0.9, y: y - 8 - (index % 3) * 3,
        duration: 1300 + index * 170, yoyo: true, repeat: -1,
        ease: "Sine.easeInOut", delay: index * 260
      });
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(820, 610, "hero-sheet", "down-0");
    this.player.setDepth(this.player.y);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(18, 14).setOffset(7, 18);
    this.player.setMaxVelocity(155, 155);
    this.physics.add.collider(this.player, this.obstacles);
  }

  createNpc() {
    this.npc = this.add.image(900, 555, "village-elder").setOrigin(0.5, 0.85).setDepth(555);
    this.npc.setScale(1.15);
    this.add.text(900, 510, "ANCIÃO", {
      fontSize: "10px", color: "#f5e7bd", fontStyle: "bold",
      stroke: "#293b2d", strokeThickness: 3
    }).setOrigin(0.5).setDepth(560);

    this.npcPrompt = this.add.text(900, 485, "E  •  CONVERSAR", {
      fontSize: "11px", color: "#fff3c9", backgroundColor: "#17251ee8",
      padding: { x: 8, y: 5 }, stroke: "#17251e", strokeThickness: 2
    }).setOrigin(0.5).setDepth(4100).setScrollFactor(0).setVisible(false);

    this.dialogPanel = this.add.rectangle(this.scale.width / 2, this.scale.height - 82,
      Math.min(this.scale.width - 32, 620), 116, 0x14211f, 0.96)
      .setStrokeStyle(2, 0xc6a96d, 0.95).setScrollFactor(0).setDepth(5000).setVisible(false);
    this.dialogName = this.add.text(this.scale.width / 2 - 270, this.scale.height - 128,
      "ANCIÃO DA CLAREIRA", {
        fontSize: "12px", color: "#e8c77e", fontStyle: "bold", letterSpacing: 1
      }).setScrollFactor(0).setDepth(5001).setVisible(false);
    this.dialogText = this.add.text(this.scale.width / 2 - 270, this.scale.height - 102,
      "", {
        fontSize: "14px", color: "#f4edda", wordWrap: { width: Math.min(this.scale.width - 90, 540) },
        lineSpacing: 5
      }).setScrollFactor(0).setDepth(5001).setVisible(false);
    this.dialogHint = this.add.text(this.scale.width / 2 + 270, this.scale.height - 45,
      "E / TOQUE PARA FECHAR", {
        fontSize: "9px", color: "#c6b994"
      }).setOrigin(1).setScrollFactor(0).setDepth(5001).setVisible(false);

    this.dialogOpen = false;
    this.dialogLines = [
      "Viajante! Faz tempo que alguém novo não chega à Clareira do Começo.",
      "Ao norte fica o Lago Sereno. Dizem que suas águas escondem histórias antigas.",
      "Explore a região com calma. Há muito para descobrir por estas terras."
    ];
    this.dialogIndex = 0;
    this.interactionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  requestInteraction() {
    if (this.dialogOpen) {
      this.dialogOpen = false;
      [this.dialogPanel, this.dialogName, this.dialogText, this.dialogHint].forEach(item => item.setVisible(false));
      return;
    }
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
    if (distance > 92) return;
    this.dialogOpen = true;
    this.dialogIndex = 0;
    this.dialogName.setVisible(true);
    this.dialogText.setText(this.dialogLines[this.dialogIndex]).setVisible(true);
    [this.dialogPanel, this.dialogHint].forEach(item => item.setVisible(true));
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
          this.touchDirection.x = 0;
          this.touchDirection.y = 0;
        }
      };
      bg.on("pointerdown", press);
      bg.on("pointerup", release);
      bg.on("pointerout", release);
    };

    const left = 58;
    const bottom = this.scale.height - 62;
    makeButton(left, bottom, "↓", 0, 1);
    makeButton(left, bottom - 106, "↑", 0, -1);
    makeButton(left - 52, bottom - 53, "←", -1, 0);
    makeButton(left + 52, bottom - 53, "→", 1, 0);

    this.talkButton = this.add.text(this.scale.width - 72, this.scale.height - 72, "FALAR", {
      fontSize: "12px", color: "#fff0c5", backgroundColor: "#263d2fe8",
      padding: { x: 14, y: 12 }, fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4200).setInteractive()
      .setVisible(false);
    this.talkButton.on("pointerdown", () => this.requestInteraction());
  }

  createHud() {
    this.add.rectangle(18, 18, 270, 58, 0x14211f, 0.84)
      .setOrigin(0).setScrollFactor(0).setDepth(4000)
      .setStrokeStyle(1, 0xbda46d, 0.75);

    this.add.text(32, 27, "VIAJANTE  •  NÍVEL 1", {
      fontSize: "12px", color: "#e8d8ad", fontStyle: "bold", letterSpacing: 1
    }).setScrollFactor(0).setDepth(4001);

    this.add.rectangle(32, 51, 180, 8, 0x39463c)
      .setOrigin(0).setScrollFactor(0).setDepth(4001);
    this.add.rectangle(32, 51, 180, 8, 0x8d4e48)
      .setOrigin(0).setScrollFactor(0).setDepth(4002);

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
    let x = 0;
    let y = 0;

    if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;

    if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
      this.requestInteraction();
    }

    const nearNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) <= 92;
    this.talkButton.setVisible(nearNpc || this.dialogOpen);
    if (this.dialogOpen) {
      this.player.setVelocity(0, 0);
      return;
    }
    if (nearNpc) {
      const point = this.cameras.main.getWorldPoint(this.scale.width / 2, this.scale.height / 2 - 65);
      this.npcPrompt.setPosition(point.x, point.y).setVisible(true);
    } else {
      this.npcPrompt.setVisible(false);
    }

    if (x === 0 && y === 0) {
      x = this.touchDirection.x;
      y = this.touchDirection.y;
    }

    const direction = new Phaser.Math.Vector2(x, y).normalize();
    this.player.setVelocity(direction.x * speed, direction.y * speed);
    this.player.setDepth(this.player.y);
    if (x !== 0 || y !== 0) {
      const dir = Math.abs(x) > Math.abs(y) ? (x < 0 ? "left" : "right") : (y < 0 ? "up" : "down");
      this.player.anims.play(`hero-walk-${dir}`, true);
      this.lastHeroDirection = dir;
    } else {
      this.player.anims.stop();
      this.player.setFrame(`${this.lastHeroDirection || "down"}-0`);
    }
  }
}