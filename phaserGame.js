let config = {
  // type - rendering context for the game
  // Phaser.AUTO - automatically tries to use WebGL => if browser X support => fall back to Canvas
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  // Arcade Physics - 2 types of physics bodies: Dynamic & Static
  // Dynamic body - ✓ move around via forces like velocity or acceleration => ✓ bounce & collide w/ other objs && collision influenced by mass of body & other elements
  // Static body - has position & size => X set velocity & never moves even w/ collision
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  // scene - size of canvas
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

// create Phaser Game instance
let game = new Phaser.Game(config);

let platforms;
let player;
let cursors;
let stars, bombs;
let scoreText;
let score = 0;
let gameOver = false;

// load assets
function preload() {
  //              vvvvv string name assigned to the asset
  this.load.image("sky", "assets/sky.png");
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.image("bomb", "assets/bomb.png");
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
}

// obj displayed matches the order of creation
function create() {
  // in Phaser 3 all Game Objects are positioned based on their center by default
  // need to set x/ y coordinates => 400, 300
  /* Background */
  this.add.image(400, 300, "sky");

  // Group - gp similar objs & control as 1 unit
  // Group ✓ create own Game objs using 'create'
  /* Static Objects */
  platforms = this.physics.add.staticGroup();

  // set a ground at the bottom of the canvas => setScale to span across the canvas => refresh after new setting
  platforms.create(400, 568, "ground").setScale(2).refreshBody();

  platforms.create(600, 400, "ground");
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");

  /* Dynamic Objects */
  player = this.physics.add.sprite(100, 450, "dude");

  // velocity of bouncing
  player.setBounce(0.2);
  // stop player frm running off the edge
  player.setCollideWorldBounds(true);

  // define animations
  this.anims.create({
    key: "left",
    // set usage of spritesheet => which frames to use - "start" & "end"
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    // loop
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  // create Collider obj
  // monitor 2 physics objs => check for collision / overlap => ✓ optionally invoke callback
  // allows player to collide w/ all platforms & platform X collapse => firm ground
  this.physics.add.collider(player, platforms);

  /* create dynamic objs - stars */
  stars = this.physics.add.group({
    key: "star",
    // repeat creation 11x => produce 12pcs in total
    repeat: 11,
    // set the position of the stars => start at (12,0) coordinates
    // stepX - next child add 70px to x coordinate => result in stars populating whole screen
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  // give each child a random bounce between 0.4 & 0.8 (Bounce range: 0,1)
  stars.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.6));
  });

  // stop stars from falling out of screen => lands on the 'ground's
  this.physics.add.collider(stars, platforms);

  // check if player & stars overlap
  this.physics.add.overlap(player, stars, collectStar, null, this);

  // create Text Game Obj
  // (x, y, default string, style)
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  // Phaser ✓ built-in Keyboard manager => X add eventListeners
  cursors = this.input.keyboard.createCursorKeys();

  /* create dynamic objs - bombs */
  bombs = this.physics.add.group();

  this.physics.add.collider(bombs, platforms);

  this.physics.add.collider(player, bombs, hitBomb, null, this);
}

/* Movements */
function update() {
  if (gameOver) return;

  // check which key is being held down
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play("right", true);
  } else {
    // when no key is held down => player is still
    player.setVelocityX(0);
    player.anims.play("turn");
  }

  if (cursors.up.isDown) {
    // Check is 'up' key is held && let jump only when the player is touching the floor
    // if (cursors.up.isDown && player.body.touching.down) {

    // how high is the jump
    // vertical velocity of 330 px/sec sq.
    player.setVelocityY(-200);
  }
}

function collectStar(player, star) {
  // disable physics body of star => make the star invisible => collected
  star.disableBody(true, true);

  // update score & score text
  score += 10;
  scoreText.setText(`Score: ${score}`);

  // activate bomb & drop new stars when all stars are collected
  if (stars.countActive(true) === 0) {
    stars.children.iterate((child) => {
      child.enableBody(true, child.x, 0, true, true);
    });

    let x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    let bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}

function hitBomb(player, bomb) {
  // pause game
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  gameOver = true;
}
