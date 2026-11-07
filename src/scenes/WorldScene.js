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
    this.createCombat();
    this.createNpc();
    this.createControls();
    this.createHud();
    this.createTutorialUI();

    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT");
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.scale.on("resize", this.layoutInterface, this);
    this.layoutInterface();
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

    const stump = this.make.graphics({ x: 0, y: 0, add: false });
    stump.fillStyle(0x493326); stump.fillEllipse(16, 11, 27, 15);
    stump.fillStyle(0x98714b); stump.fillEllipse(16, 9, 18, 10);
    stump.lineStyle(2, 0x65472f, 1); stump.strokeCircle(16, 9, 6);
    stump.generateTexture("tree-stump", 32, 22);
    stump.destroy();

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

    const guardian = this.make.graphics({ x: 0, y: 0, add: false });
    guardian.fillStyle(0x354a38); guardian.fillEllipse(16, 34, 23, 7);
    guardian.fillStyle(0x344c60); guardian.fillRect(9, 22, 6, 11); guardian.fillRect(18, 22, 6, 11);
    guardian.fillStyle(0x477b83); guardian.fillRect(7, 12, 18, 13);
    guardian.fillStyle(0xd6c18d); guardian.fillRect(5, 14, 4, 10); guardian.fillRect(23, 14, 4, 10);
    guardian.fillStyle(0xe9c69c); guardian.fillRect(9, 2, 14, 13);
    guardian.fillStyle(0x493b32); guardian.fillRect(8, 1, 16, 5); guardian.fillRect(7, 4, 3, 7); guardian.fillRect(22, 4, 3, 7);
    guardian.fillStyle(0x29352e); guardian.fillRect(12, 7, 2, 2); guardian.fillRect(19, 7, 2, 2);
    guardian.fillStyle(0xc6a96d); guardian.fillRect(14, 16, 4, 7);
    guardian.generateTexture("lake-guardian", 32, 38);
    guardian.destroy();

    const grass = this.make.graphics({ x: 0, y: 0, add: false });
    grass.lineStyle(2, 0x9ab66a, 0.9);
    grass.beginPath(); grass.moveTo(8, 18); grass.lineTo(5, 5);
    grass.moveTo(10, 18); grass.lineTo(12, 2);
    grass.moveTo(12, 18); grass.lineTo(18, 7); grass.strokePath();
    grass.generateTexture("grass-tuft", 24, 20);
    grass.destroy();
    const slime = this.make.graphics({ x: 0, y: 0, add: false });
    slime.fillStyle(0x263c32); slime.fillEllipse(20, 30, 32, 10);
    slime.fillStyle(0x526d45); slime.fillEllipse(20, 22, 34, 22);
    slime.fillStyle(0x779455); slime.fillEllipse(16, 17, 22, 13);
    slime.fillStyle(0xe8e2c4); slime.fillCircle(14, 20, 3); slime.fillCircle(27, 20, 3);
    slime.fillStyle(0x26332f); slime.fillCircle(15, 21, 1.5); slime.fillCircle(28, 21, 1.5);
    slime.generateTexture("wandering-slime", 40, 36); slime.destroy();

    const boss = this.make.graphics({ x: 0, y: 0, add: false });
    boss.fillStyle(0x1c2924); boss.fillEllipse(28, 49, 46, 12);
    boss.fillStyle(0x493b2b); boss.fillRect(13, 35, 12, 17); boss.fillRect(32, 35, 12, 17);
    boss.fillStyle(0x292f2a); boss.fillRect(10, 46, 17, 7); boss.fillRect(30, 46, 17, 7);
    boss.fillStyle(0x536348); boss.fillRect(9, 18, 39, 24);
    boss.fillStyle(0x71805a); boss.fillRect(14, 13, 29, 25);
    boss.fillStyle(0x384538); boss.fillRect(5, 20, 9, 22); boss.fillRect(43, 20, 9, 22);
    boss.fillStyle(0x8d7650); boss.fillRect(7, 35, 8, 8); boss.fillRect(42, 35, 8, 8);
    boss.fillStyle(0x5a4934); boss.fillRect(13, 3, 30, 18);
    boss.fillStyle(0x8a7650); boss.fillPoints([
      new Phaser.Geom.Point(14, 8), new Phaser.Geom.Point(4, 0),
      new Phaser.Geom.Point(10, 16), new Phaser.Geom.Point(18, 14)
    ], true);
    boss.fillPoints([
      new Phaser.Geom.Point(42, 8), new Phaser.Geom.Point(52, 0),
      new Phaser.Geom.Point(46, 16), new Phaser.Geom.Point(38, 14)
    ], true);
    boss.fillStyle(0xc6b77b); boss.fillRect(18, 10, 5, 3); boss.fillRect(34, 10, 5, 3);
    boss.fillStyle(0x202a25); boss.fillRect(19, 11, 2, 2); boss.fillRect(35, 11, 2, 2);
    boss.fillStyle(0x9a5540); boss.fillRect(24, 17, 10, 3);
    boss.fillStyle(0x9d895c); boss.fillRect(24, 25, 8, 13);
    boss.fillStyle(0x3b4938); boss.fillRect(2, 27, 7, 12); boss.fillRect(47, 27, 7, 12);
    boss.generateTexture("forest-warden", 56, 56);
    boss.destroy();
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
    this.trees = [];
    const treePositions = [
      [170,150],[290,230],[470,120],[620,210],[790,130],[1030,150],[1180,430],
      [1540,500],[1660,680],[1450,900],[1250,1030],[930,990],[620,930],[300,900],
      [120,720],[250,650],[1080,720],[1580,1000],[1720,180],[80,300]
    ];
    treePositions.forEach(([x, y]) => {
      const tree = this.add.image(x, y, "tree").setOrigin(0.5, 0.82);
      this.obstacles.add(tree);
      tree.body.setSize(22, 18).setOffset(13, 29);
      tree.setData("isTree", true).setData("treeHealth", 3);
      this.trees.push(tree);
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

  createCombat() {
    this.playerStats = { health: 100, stamina: 100 };
    this.resources = { wood: 0, stone: 0 };
    this.craftedItems = [];
    this.weapon = null;
    this.lastAimVector = new Phaser.Math.Vector2(0, 1);
    this.playerBusy = false;
    this.isDodging = false;
    this.playerInvulnerable = false;
    this.combatKeys = this.input.keyboard.addKeys({ light: "J", heavy: "K", dodge: "SPACE" });
  }

  createBoss() {
    this.boss = this.physics.add.sprite(1510, 760, "forest-warden")
      .setScale(1.8).setDepth(760);
    this.boss.body.setSize(30, 28).setOffset(13, 23);
    this.boss.setMaxVelocity(390, 390);
    this.bossStats = { health: 360, maxHealth: 360, state: "idle", hitDuringCharge: false, phaseTwo: false };
    this.physics.add.collider(this.boss, this.obstacles, (boss, obstacle) => {
      // O Guardião destrói árvores ao trombar nelas, em vez de ficar preso atrás delas.
      if (obstacle.active && obstacle.getData("isTree")) {
        this.damageTree(obstacle, 3, "boss");
      }
    });
    this.bossName = this.add.text(this.boss.x, this.boss.y - 65, "GUARDIÃO FENDIDO", {
      fontSize: "12px", color: "#e8d3a0", fontStyle: "bold",
      stroke: "#251f1a", strokeThickness: 4, letterSpacing: 1
    }).setOrigin(0.5).setDepth(900);
    this.bossWorldBarBack = this.add.rectangle(this.boss.x, this.boss.y - 49, 76, 7, 0x211d1b)
      .setDepth(900);
    this.bossWorldBar = this.add.rectangle(this.boss.x, this.boss.y - 49, 72, 4, 0xa34e43)
      .setDepth(901);
    this.bossHudName = this.add.text(this.scale.width / 2, 18, "GUARDIÃO FENDIDO", {
      fontSize: "11px", color: "#e8d3a0", fontStyle: "bold", letterSpacing: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4600).setVisible(false);
    this.bossHudBack = this.add.rectangle(this.scale.width / 2, 39, 260, 9, 0x241e1b, 0.95)
      .setScrollFactor(0).setDepth(4600).setStrokeStyle(1, 0x9b7950, 0.9).setVisible(false);
    this.bossHudFill = this.add.rectangle(this.scale.width / 2 - 128, 39, 256, 5, 0xa34e43)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(4601).setVisible(false);
    this.bossHudHint = this.add.text(this.scale.width / 2, 53, "CHEFE", {
      fontSize: "8px", color: "#c7b99c", letterSpacing: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4600).setVisible(false);
  }

  directionVector(dir) {
    return { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} }[dir] || {x:0,y:1};
  }

  performAttack(heavy = false) {
    if (this.playerBusy || this.isDodging || this.playerStats.health <= 0 || this.craftOpen) return;
    const cost = heavy ? 28 : 14;
    if (this.playerStats.stamina < cost) return;
    this.playerStats.stamina -= cost;
    this.playerBusy = true;
    this.player.setVelocity(0, 0);
    const aim = this.lastAimVector.clone().normalize();
    const slash = this.add.ellipse(
      this.player.x + aim.x * (heavy ? 42 : 34),
      this.player.y + aim.y * (heavy ? 42 : 34),
      heavy ? 66 : 52,
      heavy ? 30 : 23,
      heavy ? 0xe6c477 : 0xd9e4c0,
      0.55
    ).setRotation(Math.atan2(aim.y, aim.x)).setDepth(this.player.y + 8);
    this.tweens.add({
      targets: slash, alpha: 0, scaleX: 1.28,
      duration: heavy ? 270 : 190, onComplete: () => slash.destroy()
    });

    let hitTree = false;
    this.trees.slice().forEach((tree) => {
      if (!tree.active) return;
      const tx = tree.x - this.player.x;
      const ty = (tree.y - 12) - this.player.y;
      const distance = Math.hypot(tx, ty);
      const facing = distance > 0 ? (tx * aim.x + ty * aim.y) / distance : 1;
      if (distance <= (heavy ? 112 : 88) && facing >= 0.48) {
        hitTree = true;
        const damage = this.weapon ? (heavy ? 3 : 2) : (heavy ? 2 : 1);
        this.damageTree(tree, damage, "player");
      }
    });
    if (!hitTree) {
      const hint = this.add.text(this.player.x, this.player.y - 38, "MIRE PARA UMA ÁRVORE", {
        fontSize: "9px", color: "#f0dfb2", fontStyle: "bold",
        stroke: "#26372b", strokeThickness: 3
      }).setOrigin(0.5).setDepth(5000);
      this.tweens.add({ targets: hint, y: hint.y - 18, alpha: 0, duration: 550, onComplete: () => hint.destroy() });
    }
    this.time.delayedCall(heavy ? 560 : 330, () => { this.playerBusy = false; });
  }

  dodge() {
    if(this.playerBusy||this.isDodging||this.playerInvulnerable||this.playerStats.stamina<30||this.playerStats.health<=0)return;
    this.playerStats.stamina-=30;this.isDodging=true;this.playerInvulnerable=true;
    const v = this.lastAimVector.clone();
    if (v.length() < 0.2) {
      const d = this.directionVector(this.lastHeroDirection);
      v.set(d.x, d.y);
    }
    v.normalize();

    // Rastro direcional: deixa claro quando a esquiva começou e para onde foi.
    const angle = Math.atan2(v.y, v.x);
    const streak = this.add.ellipse(
      this.player.x - v.x * 17,
      this.player.y - v.y * 17,
      54,
      15,
      0x9deaff,
      0.78
    ).setRotation(angle).setDepth(this.player.y - 2);
    this.tweens.add({
      targets: streak,
      alpha: 0,
      scaleX: 1.65,
      scaleY: 0.7,
      duration: 260,
      onComplete: () => streak.destroy()
    });

    const burst = this.add.circle(this.player.x, this.player.y + 8, 13, 0xb8efff, 0.48)
      .setDepth(this.player.y - 1);
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2.5,
      duration: 240,
      onComplete: () => burst.destroy()
    });

    this.player.setVelocity(v.x * 285, v.y * 285).setTint(0xb9edff).setAlpha(0.96);

    // Silhuetas curtas mostram a velocidade sem esconder o personagem.
    [0, 65, 130, 195].forEach((delay) => {
      this.time.delayedCall(delay, () => {
        if (!this.player.active || !this.isDodging) return;
        const ghost = this.add.image(
          this.player.x,
          this.player.y,
          this.player.texture.key,
          this.player.frame.name
        ).setTint(0x8edfff).setAlpha(0.5).setScale(1.08).setDepth(this.player.y - 1);
        this.tweens.add({
          targets: ghost,
          alpha: 0,
          scaleX: 0.84,
          scaleY: 0.84,
          x: ghost.x - v.x * 13,
          y: ghost.y - v.y * 13,
          duration: 210,
          onComplete: () => ghost.destroy()
        });
      });
    });

    this.time.delayedCall(260, () => {
      this.isDodging = false;
      if (this.player.active) {
        this.player.setVelocity(0, 0).setAlpha(1).clearTint();
      }
    });
    this.time.delayedCall(370, () => {
      this.playerInvulnerable = false;
      if (this.player.active) this.player.setAlpha(1);
    });
  }

  damageTree(tree, amount, source = "player") {
    if (!tree || !tree.active || !tree.getData("isTree")) return;
    const health = Math.max(0, (tree.getData("treeHealth") || 3) - amount);
    tree.setData("treeHealth", health);

    if (health > 0) {
      tree.setTint(0xe5c17a);
      this.time.delayedCall(110, () => { if (tree.active) tree.clearTint(); });
      const chips = this.add.text(tree.x, tree.y - 42, source === "boss" ? "CRACK!" : "−" + amount, {
        fontSize: "10px", color: "#f2d49a", fontStyle: "bold",
        stroke: "#38291f", strokeThickness: 3
      }).setOrigin(0.5).setDepth(5000);
      this.tweens.add({ targets: chips, y: chips.y - 22, alpha: 0, duration: 430, onComplete: () => chips.destroy() });
      return;
    }

    const x = tree.x;
    const y = tree.y;
    this.obstacles.remove(tree, true, true);
    this.trees = this.trees.filter((item) => item !== tree);
    if (source === "player") {
      this.resources.wood += 2;
      if (this.resourceText) this.resourceText.setText(`MADEIRA ${this.resources.wood}  •  PEDRA ${this.resources.stone}`);
      const loot = this.add.text(x, y - 58, "+2 MADEIRA", {
        fontSize: "10px", color: "#f0d49a", fontStyle: "bold",
        stroke: "#38291f", strokeThickness: 3
      }).setOrigin(0.5).setDepth(5000);
      this.tweens.add({ targets: loot, y: loot.y - 24, alpha: 0, duration: 850, onComplete: () => loot.destroy() });
      this.updateTutorialProgress();
    }

    // O tronco cai e deixa um toco baixo, sem colisão.
    const stump = this.add.image(x, y - 3, "tree-stump").setDepth(y + 1);
    this.tweens.add({
      targets: stump, angle: source === "boss" ? 24 : 12, alpha: 0.92,
      duration: 180, yoyo: true, hold: 80
    });

    for (let i = 0; i < 7; i++) {
      const piece = this.add.rectangle(
        x + Phaser.Math.Between(-9, 9), y - Phaser.Math.Between(15, 38),
        Phaser.Math.Between(4, 8), Phaser.Math.Between(4, 7),
        i % 2 ? 0x477348 : 0x6b8a4d
      ).setDepth(y + 12);
      this.tweens.add({
        targets: piece,
        x: piece.x + Phaser.Math.Between(-38, 38),
        y: piece.y + Phaser.Math.Between(12, 42),
        angle: Phaser.Math.Between(-180, 180), alpha: 0,
        duration: 420, onComplete: () => piece.destroy()
      });
    }
    this.cameras.main.shake(source === "boss" ? 180 : 90, source === "boss" ? 0.006 : 0.0025);
    const label = this.add.text(x, y - 48, "ÁRVORE DERRUBADA", {
      fontSize: "9px", color: "#d8c18b", fontStyle: "bold",
      stroke: "#30251d", strokeThickness: 3
    }).setOrigin(0.5).setDepth(5000);
    this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: 700, onComplete: () => label.destroy() });
  }

  enterBossPhaseTwo() {
    if (this.bossStats.phaseTwo || this.bossStats.health <= 0) return;
    this.bossStats.phaseTwo = true;
    this.bossStats.state = "phaseTransition";
    this.boss.setVelocity(0, 0).setRotation(0).setTint(0xc65b49);
    this.bossName.setText("GUARDIÃO FENDIDO • DESPERTADO");
    this.bossHudName.setText("GUARDIÃO FENDIDO • FASE II");
    this.bossHudHint.setText("ELE ESTÁ MAIS RÁPIDO");
    this.bossHudFill.setFillStyle(0xd65b45);
    this.cameras.main.shake(420, 0.009);

    const burst = this.add.circle(this.boss.x, this.boss.y + 8, 34, 0xc94d3e, 0.32)
      .setStrokeStyle(4, 0xf0b36c, 0.95).setDepth(this.boss.y + 30);
    this.tweens.add({
      targets: burst, scale: 4.2, alpha: 0, duration: 900,
      onComplete: () => burst.destroy()
    });
    this.tweens.add({
      targets: this.boss, scaleX: 2.25, scaleY: 2.25, duration: 360,
      yoyo: true, repeat: 1, ease: "Sine.easeInOut"
    });
    this.time.delayedCall(1150, () => {
      if (!this.boss.active || this.bossStats.health <= 0) return;
      this.boss.clearTint();
      this.bossStats.state = "chasing";
      this.bossHudHint.setText("FASE II • CUIDADO");
    });
  }

  updateBoss() {
    if (!this.boss || !this.boss.active || this.bossStats.health <= 0 || this.playerStats.health <= 0) return;
    const dx = this.player.x - this.boss.x;
    const dy = this.player.y - this.boss.y;
    const distance = Math.hypot(dx, dy);
    const engaged = distance < 520 || this.bossStats.health < this.bossStats.maxHealth;
    [this.bossHudName, this.bossHudBack, this.bossHudFill, this.bossHudHint]
      .forEach((item) => item.setVisible(engaged));
    if (this.bossStats.state === "dead" || this.bossStats.state === "phaseTransition") return;

    this.bossName.setPosition(this.boss.x, this.boss.y - 65).setDepth(this.boss.y + 20);
    this.bossWorldBarBack.setPosition(this.boss.x, this.boss.y - 49).setDepth(this.boss.y + 20);
    this.bossWorldBar.setPosition(this.boss.x, this.boss.y - 49).setDepth(this.boss.y + 21);

    if (this.bossStats.state === "charging") {
      if (!this.bossStats.hitDuringCharge && distance <= 64) {
        this.bossStats.hitDuringCharge = true;
        this.damagePlayer(this.bossStats.phaseTwo ? 34 : 28);
        this.boss.setVelocity(0, 0);
        this.bossStats.state = "recovery";
        this.time.delayedCall(this.bossStats.phaseTwo ? 700 : 1050, () => {
          if (this.boss.active && this.bossStats.health > 0) this.bossStats.state = "chasing";
        });
      }
      return;
    }
    if (this.bossStats.state === "meleeWindup" || this.bossStats.state === "chargeWindup" ||
        this.bossStats.state === "recovery") return;

    if (distance > 440) {
      this.bossStats.state = "idle";
      this.boss.setVelocity(0, 0);
      return;
    }

    const phaseTwo = this.bossStats.phaseTwo;
    if (distance <= (phaseTwo ? 132 : 112)) {
      this.bossStats.state = "meleeWindup";
      this.boss.setVelocity(0, 0).setRotation(0).setTint(phaseTwo ? 0xd65b45 : 0xe5a35c);
      this.tweens.add({
        targets: this.boss, scaleX: phaseTwo ? 2.05 : 1.95, scaleY: phaseTwo ? 1.55 : 1.65,
        duration: phaseTwo ? 300 : 360, yoyo: true, repeat: 0, ease: "Sine.easeIn"
      });
      const warning = this.add.circle(this.boss.x, this.boss.y + 8, 76, 0xd66a43, 0.13)
        .setStrokeStyle(3, 0xe8a15b, 0.9).setDepth(this.boss.y + 5);
      const meleeWindup = phaseTwo ? 500 : 620;
      this.tweens.add({ targets: warning, alpha: 0, scale: 1.28, duration: meleeWindup, onComplete: () => warning.destroy() });
      this.time.delayedCall(meleeWindup, () => {
        if (!this.boss.active || this.bossStats.health <= 0 || this.bossStats.state !== "meleeWindup") return;
        this.boss.clearTint().setScale(1.8).setRotation(0);
        const close = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        if (close <= (phaseTwo ? 148 : 132)) this.damagePlayer(phaseTwo ? 27 : 22);
        this.bossStats.state = "recovery";
        this.time.delayedCall(phaseTwo ? 620 : 850, () => {
          if (this.boss.active && this.bossStats.health > 0) this.bossStats.state = "chasing";
        });
      });
      return;
    }

    if (distance <= (phaseTwo ? 330 : 270)) {
      this.bossStats.state = "chargeWindup";
      this.boss.setVelocity(0, 0).setTint(phaseTwo ? 0xe04b3f : 0xd66a43);
      this.bossChargeVector = new Phaser.Math.Vector2(dx, dy).normalize();
      this.boss.setRotation(Math.atan2(this.bossChargeVector.y, this.bossChargeVector.x));
      this.tweens.add({
        targets: this.boss, scaleX: phaseTwo ? 2.35 : 2.05, scaleY: phaseTwo ? 1.45 : 1.6,
        duration: phaseTwo ? 280 : 360, yoyo: true, repeat: 0, ease: "Sine.easeIn"
      });
      const chargeWindup = phaseTwo ? 520 : 720;
      const warning = this.add.ellipse(this.boss.x, this.boss.y + 8, phaseTwo ? 126 : 104, 44, 0xd64c36, 0.22)
        .setStrokeStyle(3, phaseTwo ? 0xff7258 : 0xf0a05d, 0.95).setDepth(this.boss.y + 6);
      this.tweens.add({ targets: warning, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: chargeWindup, onComplete: () => warning.destroy() });
      this.time.delayedCall(chargeWindup, () => {
        if (!this.boss.active || this.bossStats.health <= 0 || this.bossStats.state !== "chargeWindup") return;
        this.boss.clearTint().setScale(1.8);
        this.bossStats.state = "charging";
        this.bossStats.hitDuringCharge = false;
        const chargeSpeed = phaseTwo ? 470 : 370;
        this.boss.setVelocity(this.bossChargeVector.x * chargeSpeed, this.bossChargeVector.y * chargeSpeed);
        this.time.delayedCall(phaseTwo ? 500 : 430, () => {
          if (!this.boss.active || this.bossStats.health <= 0 || this.bossStats.state !== "charging") return;
          this.boss.setVelocity(0, 0).setRotation(0).setScale(1.8);
          this.bossStats.state = "recovery";
          this.time.delayedCall(phaseTwo ? 700 : 1050, () => {
            if (this.boss.active && this.bossStats.health > 0) this.bossStats.state = "chasing";
          });
        });
      });
      return;
    }

    if (distance <= 440) {
      const direction = new Phaser.Math.Vector2(dx, dy).normalize();
      const chaseSpeed = this.bossStats.phaseTwo ? 98 : 72;
      this.boss.setVelocity(direction.x * chaseSpeed, direction.y * chaseSpeed);
      this.bossStats.state = "chasing";
    }
    this.boss.setDepth(this.boss.y);
  }

  respawnBoss() {
    if (!this.boss) return;
    this.bossStats.health = this.bossStats.maxHealth;
    this.bossStats.state = "idle";
    this.bossStats.hitDuringCharge = false;
    this.bossStats.phaseTwo = false;
    this.boss.setPosition(1510, 760).setActive(true).setVisible(true).setAlpha(1).clearTint();
    this.bossName.setText("GUARDIÃO FENDIDO").setVisible(true).setAlpha(1);
    this.bossHudName.setText("GUARDIÃO FENDIDO");
    this.boss.setScale(1.8).setRotation(0);
    this.bossWorldBarBack.setVisible(true).setAlpha(1);
    this.bossWorldBar.setVisible(true).setAlpha(1);
    this.bossWorldBar.setSize(72, 4);
    this.bossHudFill.setSize(256, 5);
    this.bossHudHint.setText("CHEFE");
  }

  damagePlayer(amount) {
    if(this.playerInvulnerable||this.playerStats.health<=0)return;
    this.playerStats.health=Math.max(0,this.playerStats.health-amount);this.playerInvulnerable=true;
    this.player.setTint(0xffaaa0);this.cameras.main.shake(160,0.006);
    this.time.delayedCall(650,()=>{this.playerInvulnerable=false;if(this.player.active)this.player.clearTint();});
    if(this.playerStats.health===0){
      this.playerBusy=true;this.player.setVelocity(0,0);
      this.time.delayedCall(1300,()=>{this.player.setPosition(820,610).setAlpha(1).clearTint();this.playerStats.health=100;this.playerStats.stamina=100;this.playerBusy=false;this.playerInvulnerable=false;});
    }
  }

  updateEnemy() {
    if(!this.enemy.active||this.enemyStats.health<=0||this.playerStats.health<=0)return;
    const dx=this.player.x-this.enemy.x,dy=this.player.y-this.enemy.y,d=Math.hypot(dx,dy);
    this.enemyName.setPosition(this.enemy.x,this.enemy.y-42).setDepth(this.enemy.y+4);
    this.enemyBar.setPosition(this.enemy.x,this.enemy.y-30).setDepth(this.enemy.y+4);
    if(this.enemyStats.state==="windup"){this.enemy.setVelocity(0,0);return;}
    if(d<290&&d>38){const v=new Phaser.Math.Vector2(dx,dy).normalize();this.enemy.setVelocity(v.x*58,v.y*58);this.enemyStats.state="chasing";}
    else if(d<=38&&this.enemyStats.state!=="cooldown"){
      this.enemy.setVelocity(0,0);this.enemyStats.state="windup";this.enemy.setTint(0xd4a16b);
      this.time.delayedCall(520,()=>{if(!this.enemy.active||this.enemyStats.health<=0)return;this.enemy.clearTint();if(Phaser.Math.Distance.Between(this.enemy.x,this.enemy.y,this.player.x,this.player.y)<=52)this.damagePlayer(12);this.enemyStats.state="cooldown";this.time.delayedCall(850,()=>{if(this.enemy.active&&this.enemyStats.health>0)this.enemyStats.state="idle";});});
    } else if(d>=290){this.enemy.setVelocity(0,0);this.enemyStats.state="idle";}
    this.enemy.setDepth(this.enemy.y);
  }

  createNpc() {
    this.npcs = [
      {
        id: "elder",
        name: "ANCIÃO DA CLAREIRA",
        title: "ANCIÃO",
        x: 900,
        y: 555,
        texture: "village-elder",
        dialogue: [
          "Viajante! Faz tempo que alguém novo não chega à Clareira do Começo.",
          "Ao norte fica o Lago Sereno. Dizem que suas águas escondem histórias antigas.",
          "Explore a região com calma. Há muito para descobrir por estas terras."
        ]
      },
      {
        id: "guardian",
        name: "GUARDIÃ DO LAGO",
        title: "GUARDIÃ",
        x: 1390,
        y: 405,
        texture: "lake-guardian",
        dialogue: [
          "Cuidado ao caminhar perto da água. O Lago Sereno parece tranquilo, mas é profundo.",
          "As marcas nas pedras da margem são mais antigas que a própria Clareira.",
          "Quando estiver preparado, volte aqui. Talvez eu tenha algo importante para contar."
        ]
      }
    ];

    this.npcs.forEach((npc) => {
      npc.sprite = this.add.image(npc.x, npc.y, npc.texture)
        .setOrigin(0.5, 0.85).setScale(1.15).setDepth(npc.y);
      npc.label = this.add.text(npc.x, npc.y - 47, npc.title, {
        fontSize: "10px", color: "#f5e7bd", fontStyle: "bold",
        stroke: "#293b2d", strokeThickness: 3
      }).setOrigin(0.5).setDepth(npc.y + 2);
      this.tweens.add({
        targets: npc.sprite, y: npc.y - 2, duration: 1250,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut",
        delay: npc.id === "guardian" ? 400 : 0
      });
    });

    this.npcPrompt = this.add.text(this.scale.width / 2, 104, "E  •  CONVERSAR", {
      fontSize: "11px", color: "#fff3c9", backgroundColor: "#17251ee8",
      padding: { x: 8, y: 5 }, stroke: "#17251e", strokeThickness: 2
    }).setOrigin(0.5).setDepth(4100).setScrollFactor(0).setVisible(false);

    const dialogWidth = Math.min(this.scale.width - 32, 620);
    const dialogLeft = (this.scale.width - dialogWidth) / 2;
    this.dialogPanel = this.add.rectangle(this.scale.width / 2, this.scale.height - 82,
      dialogWidth, 116, 0x14211f, 0.96)
      .setStrokeStyle(2, 0xc6a96d, 0.95).setScrollFactor(0).setDepth(5000).setVisible(false);
    this.dialogName = this.add.text(dialogLeft + 18, this.scale.height - 128,
      "", {
        fontSize: "12px", color: "#e8c77e", fontStyle: "bold", letterSpacing: 1
      }).setScrollFactor(0).setDepth(5001).setVisible(false);
    this.dialogText = this.add.text(dialogLeft + 18, this.scale.height - 102,
      "", {
        fontSize: "13px", color: "#f4edda", wordWrap: { width: dialogWidth - 36 },
        lineSpacing: 5
      }).setScrollFactor(0).setDepth(5001).setVisible(false);
    this.dialogHint = this.add.text(dialogLeft + dialogWidth - 18, this.scale.height - 45,
      "E / TOQUE PARA AVANÇAR", {
        fontSize: "9px", color: "#c6b994"
      }).setOrigin(1).setScrollFactor(0).setDepth(5001).setVisible(false);

    this.dialogOpen = false;
    this.activeNpc = null;
    this.dialogIndex = 0;
    this.interactionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  getNearbyNpc() {
    if (!this.player || !this.npcs) return null;
    let nearest = null;
    let nearestDistance = 92;
    this.npcs.forEach((npc) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, npc.x, npc.y
      );
      if (distance <= nearestDistance) {
        nearest = npc;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  closeDialogue() {
    this.dialogOpen = false;
    this.activeNpc = null;
    [this.dialogPanel, this.dialogName, this.dialogText, this.dialogHint]
      .forEach((item) => item.setVisible(false));
  }

  requestInteraction() {
    if (this.dialogOpen) {
      if (this.activeNpc && this.dialogIndex < this.activeNpc.dialogue.length - 1) {
        this.dialogIndex += 1;
        this.dialogText.setText(this.activeNpc.dialogue[this.dialogIndex]);
        this.dialogHint.setText("E / TOQUE PARA FECHAR");
      } else {
        this.closeDialogue();
      }
      return;
    }

    const npc = this.getNearbyNpc();
    if (!npc) return;

    this.activeNpc = npc;
    this.dialogOpen = true;
    this.npcPrompt.setVisible(false);
    this.dialogIndex = 0;
    this.dialogName.setText(npc.name).setVisible(true);
    this.dialogText.setText(npc.dialogue[0]).setVisible(true);
    this.dialogHint.setText(npc.dialogue.length > 1 ? "E / TOQUE PARA AVANÇAR" : "E / TOQUE PARA FECHAR");
    [this.dialogPanel, this.dialogHint].forEach((item) => item.setVisible(true));
  }

  createTutorialUI() {
    this.tutorialStage = 1;
    this.tutorialStart = new Phaser.Math.Vector2(this.player.x, this.player.y);
    this.tutorialPanel = this.add.rectangle(this.scale.width / 2, 92, 560, 70, 0x14211f, 0.92)
      .setStrokeStyle(1, 0xc6a96d, 0.9).setScrollFactor(0).setDepth(4500);
    this.tutorialPhaseText = this.add.text(this.scale.width / 2, 69, "ETAPA 1 DE 3  •  MOVIMENTAÇÃO", {
      fontSize: "10px", color: "#e8c77e", fontStyle: "bold", letterSpacing: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4501);
    this.tutorialText = this.add.text(this.scale.width / 2, 99,
      "Use WASD ou as setas para caminhar. No celular, mova o analógico virtual.", {
        fontSize: "11px", color: "#f4edda", align: "center",
        wordWrap: { width: 520 }, lineSpacing: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4501);
    this.resourceText = this.add.text(32, 100, "MADEIRA 0  •  PEDRA 0", {
      fontSize: "10px", color: "#f0dfb2", fontStyle: "bold",
      backgroundColor: "#14211fcc", padding: { x: 7, y: 5 }
    }).setScrollFactor(0).setDepth(4500);
    this.craftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.craftOpen = false;
    this.craftPanel = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 370, 224, 0x14211f, 0.98)
      .setStrokeStyle(2, 0xc6a96d, 1).setScrollFactor(0).setDepth(6000).setVisible(false);
    this.craftTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 82, "BANCADA DE CRIAÇÃO", {
      fontSize: "15px", color: "#e8c77e", fontStyle: "bold", letterSpacing: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(6001).setVisible(false);
    this.craftRecipeText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 28,
      "ESPADA DE MADEIRA\nCusto: 5 madeiras\nUma arma simples para melhorar seus golpes contra recursos.", {
        fontSize: "12px", color: "#f4edda", align: "center",
        lineSpacing: 7, wordWrap: { width: 330 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(6001).setVisible(false);
    this.craftActionText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 55, "CRIAR ESPADA", {
      fontSize: "12px", color: "#fff3d5", fontStyle: "bold",
      backgroundColor: "#526b48", padding: { x: 18, y: 11 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(6002).setInteractive().setVisible(false);
    this.craftActionText.on("pointerdown", () => this.craftWoodenSword());
    this.craftCloseText = this.add.text(this.scale.width / 2 + 165, this.scale.height / 2 - 96, "X", {
      fontSize: "13px", color: "#f0dfb2", fontStyle: "bold",
      backgroundColor: "#53372f", padding: { x: 8, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(6002).setInteractive().setVisible(false);
    this.craftCloseText.on("pointerdown", () => this.toggleCrafting(false));
    this.craftButton = this.add.text(0, 0, "CRIAR", {
      fontSize: "11px", color: "#fff0c5", backgroundColor: "#526b48",
      padding: { x: 15, y: 12 }, fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4300).setInteractive().setVisible(false);
    this.craftButton.on("pointerdown", () => this.toggleCrafting());
  }

  updateTutorialProgress() {
    if (this.tutorialStage === 1) {
      const travelled = Phaser.Math.Distance.Between(
        this.tutorialStart.x, this.tutorialStart.y, this.player.x, this.player.y
      );
      if (travelled >= 120) {
        this.tutorialStage = 2;
        this.tutorialPhaseText.setText("ETAPA 2 DE 3  •  COLETA DE RECURSOS");
        this.tutorialText.setText("Acerte as árvores para conseguir madeira. J ou GOLPE usa ataque leve; K ou FORTE causa mais dano.");
      }
    } else if (this.tutorialStage === 2 && this.resources.wood >= 5) {
      this.tutorialStage = 3;
      this.tutorialPhaseText.setText("ETAPA 3 DE 3  •  CRIAÇÃO DE EQUIPAMENTO");
      this.tutorialText.setText("Você já tem madeira suficiente. Pressione C ou toque em CRIAR para abrir a bancada e fabricar sua primeira espada.");
    } else if (this.tutorialStage === 4) {
      this.tutorialPhaseText.setText("TUTORIAL CONCLUÍDO  •  PRIMEIRO EQUIPAMENTO");
      this.tutorialText.setText("Espada de Madeira equipada! Ela fortalece seus golpes contra árvores. Explore a Clareira e continue evoluindo.");
    }
  }

  toggleCrafting(force) {
    this.craftOpen = typeof force === "boolean" ? force : !this.craftOpen;
    [this.craftPanel, this.craftTitle, this.craftRecipeText,
      this.craftActionText, this.craftCloseText].forEach((item) => item.setVisible(this.craftOpen));
    if (this.craftOpen) {
      const owned = this.craftedItems.includes("wooden-sword");
      this.craftRecipeText.setText(owned
        ? "ESPADA DE MADEIRA\nItem já fabricado e equipado.\nSeus golpes agora causam mais dano às árvores."
        : `ESPADA DE MADEIRA\nCusto: 5 madeiras\nVocê tem: ${this.resources.wood} madeiras\nUma arma simples para melhorar seus golpes contra recursos.`);
      this.craftActionText.setText(owned ? "FABRICADA" : (this.resources.wood >= 5 ? "CRIAR ESPADA" : "MADEIRA INSUFICIENTE"))
        .setAlpha(owned ? 0.65 : 1);
      this.player.setVelocity(0, 0);
    }
  }

  craftWoodenSword() {
    if (this.craftedItems.includes("wooden-sword")) return;
    if (this.resources.wood < 5) {
      this.craftRecipeText.setText(`Faltam ${5 - this.resources.wood} madeiras. Derrube mais árvores usando seus ataques.`);
      return;
    }
    this.resources.wood -= 5;
    this.craftedItems.push("wooden-sword");
    this.weapon = "wooden-sword";
    this.resourceText.setText(`MADEIRA ${this.resources.wood}  •  PEDRA ${this.resources.stone}`);
    this.tutorialStage = 4;
    this.updateTutorialProgress();
    this.craftRecipeText.setText("ESPADA DE MADEIRA\nCriada e equipada! Seus ataques agora causam mais dano às árvores.");
    this.craftActionText.setText("EQUIPADA").setAlpha(0.65);
    this.cameras.main.flash(180, 205, 184, 115);
  }

  createControls() {
    this.input.addPointer(2);
    this.joystickBase = this.add.circle(0, 0, 64, 0x17231e, 0.72)
      .setScrollFactor(0).setDepth(3000)
      .setStrokeStyle(2, 0xc6b27d, 0.9).setInteractive();
    this.joystickKnob = this.add.circle(0, 0, 27, 0xd8c99f, 0.94)
      .setScrollFactor(0).setDepth(3001)
      .setStrokeStyle(2, 0x354936, 0.95);
    this.joystickActive = false;
    this.joystickPointerId = null;

    this.joystickBase.on("pointerdown", (pointer) => {
      this.joystickActive = true;
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
    });
    this.input.on("pointermove", (pointer) => {
      if (this.joystickActive && pointer.id === this.joystickPointerId && pointer.isDown) {
        this.updateJoystick(pointer);
      }
    });
    const releaseJoystick = (pointer) => {
      if (this.joystickActive && (!pointer || pointer.id === this.joystickPointerId)) {
        this.joystickActive = false;
        this.joystickPointerId = null;
        this.touchDirection.x = 0;
        this.touchDirection.y = 0;
        this.joystickKnob.setPosition(this.joystickBase.x, this.joystickBase.y);
      }
    };
    this.input.on("pointerup", releaseJoystick);
    this.input.on("pointerupoutside", releaseJoystick);

    this.talkButton = this.add.text(0, 0, "FALAR", {
      fontSize: "12px", color: "#fff0c5", backgroundColor: "#263d4fe8",
      padding: { x: 14, y: 12 }, fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4200).setInteractive()
      .setVisible(false);
    this.talkButton.on("pointerdown", () => this.requestInteraction());
    this.combatButtons=[];
    const addCombatButton=(label,action,color)=>{
      const bg=this.add.circle(0,0,29,color,0.92).setScrollFactor(0).setDepth(4300).setStrokeStyle(2,0xd8c99f,0.95).setInteractive();
      const txt=this.add.text(0,0,label,{fontSize:"10px",color:"#fff3d5",fontStyle:"bold"}).setOrigin(0.5).setScrollFactor(0).setDepth(4301);
      bg.on("pointerdown",action);this.combatButtons.push({bg,txt});
    };
    addCombatButton("GOLPE",()=>this.performAttack(false),0x526b48);
    addCombatButton("FORTE",()=>this.performAttack(true),0x78513c);
    addCombatButton("ROLAR",()=>this.dodge(),0x3c5c70);
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joystickBase.x;
    const dy = pointer.y - this.joystickBase.y;
    const distance = Math.hypot(dx, dy);
    const maxDistance = 45;
    const scale = distance > maxDistance ? maxDistance / distance : 1;
    const knobX = this.joystickBase.x + dx * scale;
    const knobY = this.joystickBase.y + dy * scale;
    this.joystickKnob.setPosition(knobX, knobY);
    this.touchDirection.x = distance > 6 ? (knobX - this.joystickBase.x) / maxDistance : 0;
    this.touchDirection.y = distance > 6 ? (knobY - this.joystickBase.y) / maxDistance : 0;
  }

  createHud() {
    this.hudPanel = this.add.rectangle(18, 18, 270, 58, 0x14211f, 0.86)
      .setOrigin(0).setScrollFactor(0).setDepth(4000)
      .setStrokeStyle(1, 0xbda46d, 0.75);

    this.hudTitle = this.add.text(32, 27, "VIAJANTE  •  NÍVEL 1", {
      fontSize: "12px", color: "#e8d8ad", fontStyle: "bold", letterSpacing: 1
    }).setScrollFactor(0).setDepth(4001);

    this.healthTrack = this.add.rectangle(32, 51, 180, 8, 0x39463c)
      .setOrigin(0).setScrollFactor(0).setDepth(4001);
    this.healthFill = this.add.rectangle(32, 51, 180, 8, 0x8d4e48)
      .setOrigin(0).setScrollFactor(0).setDepth(4002);

    this.healthText = this.add.text(224, 47, "100/100", {
      fontSize: "10px", color: "#f4edda"
    }).setScrollFactor(0).setDepth(4002);
    this.staminaTrack=this.add.rectangle(32,64,180,5,0x39463c).setOrigin(0).setScrollFactor(0).setDepth(4001);
    this.staminaFill=this.add.rectangle(32,64,180,5,0x8cae65).setOrigin(0).setScrollFactor(0).setDepth(4002);

    this.keyboardHint = this.add.text(this.scale.width - 18, 20, "WASD / SETAS", {
      fontSize: "11px", color: "#e8d8ad", backgroundColor: "#14211fcc",
      padding: { x: 9, y: 7 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(4000);
  }

  layoutInterface() {
    if (!this.player || !this.hudPanel || !this.dialogPanel) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const touchCapable = Boolean(
      this.sys.game.device.input.touch ||
      (typeof window !== "undefined" && (
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
      ))
    );
    // Muitos celulares em modo paisagem têm mais de 980 px de largura.
    // A capacidade de toque, e não a largura, identifica esses aparelhos.
    const mobile = touchCapable || width < 760;
    const mobileLandscape = mobile && width > height;
    this.isMobileLayout = mobile;
    this.isMobileLandscape = mobileLandscape;

    this.cameras.main.setZoom(mobile ? (mobileLandscape ? 1.22 : 0.94) : Math.min(1, width / 960));

    const panelX = mobile ? 14 : 18;
    const panelY = mobile ? 14 : 18;
    const panelW = mobile ? Math.min(width - 28, mobileLandscape ? 300 : 264) : 270;
    const panelH = mobile ? 76 : 74;
    this.hudPanel.setPosition(panelX, panelY).setSize(panelW, panelH);
    this.hudTitle.setPosition(panelX + 14, panelY + 10)
      .setFontSize(mobile ? 12 : 12);
    const barWidth = mobile ? Math.min(mobileLandscape ? 172 : 144, panelW - 100) : 180;
    this.healthTrack.setPosition(panelX+14,panelY+39).setSize(barWidth,7);
    this.healthFill.setPosition(panelX+14,panelY+39).setSize(barWidth,7);
    this.healthText.setPosition(panelX+22+barWidth,panelY+36).setFontSize(10);
    this.staminaTrack.setPosition(panelX+14,panelY+54).setSize(barWidth,6);
    this.staminaFill.setPosition(panelX+14,panelY+54).setSize(barWidth,6);
    this.keyboardHint.setText("WASD • J/K • ESPAÇO • C").setPosition(width-18,20).setVisible(!mobile);
    const combatY=height-(mobile?92:72), combatXs=[width-220,width-145,width-70];
    this.combatButtons.forEach((b,i)=>{b.bg.setPosition(combatXs[i],combatY).setVisible(mobile);b.txt.setPosition(combatXs[i],combatY).setVisible(mobile);});

    const joystickX = mobile ? (mobileLandscape ? 92 : 82) : 58;
    const joystickY = height - (mobile ? (mobileLandscape ? 94 : 102) : 62);
    this.joystickBase.setPosition(joystickX, joystickY).setVisible(mobile);
    this.joystickKnob.setPosition(
      this.joystickActive ? this.joystickKnob.x : joystickX,
      this.joystickActive ? this.joystickKnob.y : joystickY
    ).setVisible(mobile);

    this.talkButton.setPosition(width - (mobile ? 92 : 76), height - (mobile ? 168 : 72))
      .setFontSize(mobile ? 14 : 12)
      .setPadding(mobile ? 18 : 14, mobile ? 15 : 12, mobile ? 18 : 14, mobile ? 15 : 12)
      .setVisible(mobile && (Boolean(this.getNearbyNpc()) || this.dialogOpen));

    const dialogWidth = mobile
      ? Math.min(width - 28, mobileLandscape ? 760 : 520)
      : Math.min(width - 32, 620);
    const dialogHeight = mobile ? (mobileLandscape ? 112 : 126) : 116;
    const dialogX = width / 2;
    const dialogY = mobile
      ? (mobileLandscape ? height - 82 : height - 230)
      : height - 82;
    this.dialogPanel.setPosition(dialogX, dialogY).setSize(dialogWidth, dialogHeight);
    const leftEdge = dialogX - dialogWidth / 2;
    this.dialogName.setPosition(leftEdge + 14, dialogY - dialogHeight / 2 + 12)
      .setFontSize(mobile ? 11 : 12);
    this.dialogText.setPosition(leftEdge + 14, dialogY - dialogHeight / 2 + 36)
      .setFontSize(mobile ? (mobileLandscape ? 13 : 12) : 13)
      .setWordWrapWidth(dialogWidth - 28);
    this.dialogHint.setPosition(leftEdge + dialogWidth - 12, dialogY + dialogHeight / 2 - 9)
      .setFontSize(mobile ? 9 : 9);

    this.npcPrompt.setPosition(width / 2, mobile ? 86 : 104)
      .setFontSize(mobile ? 9 : 11);
    this.tutorialPanel.setPosition(width / 2, mobile ? (mobileLandscape ? 142 : 170) : 92)
      .setSize(Math.min(width - 28, mobile ? 520 : 560), mobile ? 76 : 70);
    this.tutorialPhaseText.setPosition(width / 2, mobile ? (mobileLandscape ? 118 : 146) : 69);
    this.tutorialText.setPosition(width / 2, mobile ? (mobileLandscape ? 149 : 177) : 99)
      .setWordWrapWidth(Math.min(width - 54, mobile ? 470 : 520));
    this.resourceText.setPosition(panelX + 14, panelY + panelH + 8);
    this.craftButton.setPosition(width - (mobile ? 88 : 86), height - (mobile ? 245 : 72))
      .setVisible(mobile);
    const craftW = Math.min(width - 28, mobile ? 320 : 370);
    const craftY = height / 2;
    this.craftPanel.setPosition(width / 2, craftY).setSize(craftW, 224);
    this.craftTitle.setPosition(width / 2, craftY - 82);
    this.craftRecipeText.setPosition(width / 2, craftY - 28).setWordWrapWidth(craftW - 36);
    this.craftActionText.setPosition(width / 2, craftY + 55);
    this.craftCloseText.setPosition(width / 2 + craftW / 2 - 18, craftY - 96);
  }

  update(time, delta) {
    if (!this.player || !this.keys) return;
    const speed = 145;
    let x = 0;
    let y = 0;

    if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;

    if (!this.craftOpen && Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
      this.requestInteraction();
    }

    if (Phaser.Input.Keyboard.JustDown(this.craftKey)) this.toggleCrafting();
    const nearbyNpc = this.getNearbyNpc();
    this.talkButton.setVisible(this.isMobileLayout && (Boolean(nearbyNpc) || this.dialogOpen));
    if (this.dialogOpen || this.craftOpen) {
      this.player.setVelocity(0, 0);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.combatKeys.light)) this.performAttack(false);
    if (Phaser.Input.Keyboard.JustDown(this.combatKeys.heavy)) this.performAttack(true);
    if (Phaser.Input.Keyboard.JustDown(this.combatKeys.dodge)) this.dodge();
    if(!this.playerBusy&&!this.isDodging)this.playerStats.stamina=Math.min(100,this.playerStats.stamina+delta*0.022);
    const barW=this.isMobileLayout?Math.min(this.isMobileLandscape?172:144,Math.min(this.scale.width-28,this.isMobileLandscape?300:264)-100):180;
    this.healthText.setText(`${Math.ceil(this.playerStats.health)}/100`);
    this.healthFill.setSize(barW*this.playerStats.health/100,7);
    this.staminaFill.setSize(barW*this.playerStats.stamina/100,6);
    if (nearbyNpc) {
      this.npcPrompt.setText(`E  •  CONVERSAR COM ${nearbyNpc.title}`)
        .setPosition(this.scale.width / 2, this.isMobileLayout ? 86 : 104).setVisible(true);
    } else {
      this.npcPrompt.setVisible(false);
    }
    this.npcs.forEach((npc) => {
      npc.sprite.setDepth(npc.sprite.y);
      npc.label.setPosition(npc.x, npc.sprite.y - 47).setDepth(npc.sprite.y + 2);
    });

    if (x === 0 && y === 0) {
      x = this.touchDirection.x;
      y = this.touchDirection.y;
    }

    const direction = new Phaser.Math.Vector2(x, y);
    if (direction.length() > 0.12) {
      direction.normalize();
      this.lastAimVector.set(direction.x, direction.y);
    } else {
      direction.set(0, 0);
    }
    if(!this.isDodging&&!this.playerBusy)this.player.setVelocity(direction.x*speed,direction.y*speed);
    this.player.setDepth(this.player.y);
    this.updateTutorialProgress();
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