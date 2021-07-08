/*
  Level 1: always coffee. 1 thrower. avg. 1 sec                               0.000
  Level 2: 1 in 8 are anvil. 2 throwers.                                      0.125
  Level 3: 1 in 6 are anvils. 1 in 7 are fish. 2 throwers                     0.309
  Level 4: 1 in 7 are anvils. 1 in 12 are vase. 1 in 10 are fish. 3 throwers  0.326
  Level 5: 1 in 10 are anvils. 1 in 8 are fish. 1 in 16 are vase. 4 throwers  0.2875

  chance of hazards = 0.3 - 11 * (level - 4) * (level - 4) / 300
 */

import {Game} from "./core.js";

class Projectile extends PIXI.AnimatedSprite {
  static GRAVITY = 0.6;
  static HORIZONTAL_GRAVITY = 0.2;
  ax = 0;
  ay = 0;
  vx = 0;
  vy = 0;
  constructor(textures, x, y) {
    super(textures);
    this.x = x;
    this.y = y;
  }

  update(scale, delta) {
    this.vx += this.ax * scale;
    this.vy += this.ay * scale;
    if(this.vx >= 0) {
      this.vx = 0;
      this.ax = 0;
    }
    this.x += this.vx * scale;
    this.y += this.vy * scale;
    this.rotation += 0.01 * this.vx * scale;

    if(this.y > beanCounters.app.view.height - 60) {
      this.resetAcc();
      this.resetVel();
      this.y = beanCounters.app.view.height - 60;

      switch(this.currentFrame) {
        case PROJ_VASE: vaseFallSFX.play(); break;
        case PROJ_FISH: fishFallSFX.play(); break;
        case PROJ_ANVIL: anvilFallSFX.play(); break;
        default: coffeeFallSFX.play();
          if(!dead && !waitingForNextLevel) increaseScore(-level);
          break;
      }

      this.gotoAndStop(this.currentFrame + 4);
      this.rotation = 0;
    }
  }

  resetAcc() {
    this.ax = 0;
    this.ay = 0;
  }
  resetVel() {
    this.vx = 0;
    this.vy = 0;
  }
  resetPos() {
    this.x = projectileRespawnPoint.x;
    this.y = projectileRespawnPoint.y;
  }
  resetAll() {
    this.resetAcc();
    this.resetVel();
    this.resetPos();
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const MAX_PROJECTILES = 10;
let showColliders = false;
let projectileRespawnPoint = new Point(1200, 300);
const PROJ_VEL_Y = -15;
let PROJ_VEL_X = -8; //just the maximum distance projectiles are thrown.

const COFFEE_COLLIDER_RADIUS = 60;
const PROJ_COLLIDER_RADIUS = 40;
const PLAYER_COLLIDER_RADIUS = 80;

const graphics  = new PIXI.Graphics();

let score = 0;
let lives = 3;
let level = 1;

//true if running around, false if dead, waiting for next level
let dead = false;
let waitingForNextLevel = false;
let counter = 0;

let scoreText;
let livesText;
let levelText;

let upperText;
let lowerText;
let countDownText;

const coffeeStack = [];
let coffeesStacked = 0;

//saving these to readjust them when window is resized
let playButton;
let pauseButton;
let keepPlayingButton;
let menuButton;
let okayButton;
let musicCheckBox;
let sfxCheckBox;
let debugCheckBox;

let player;
let menuBGSprite;
let truck;
const TRUCK_WAITING = 0;
const TRUCK_LEAVING = 1;
const TRUCK_BACKING_UP = 2;
let truckState = TRUCK_WAITING;

const textures = [];

const projectiles = [];  //animated sprites so can change texture at runtime (reuse as different projectile)

const CATCH_0 = 0;
const CATCH_1 = 1;
const CATCH_2 = 2;
const CATCH_3 = 3;
const CATCH_4 = 4;
const CATCH_5 = 5;
const DIE_COFFEE = 6;
const DIE_ANVIL = 7;
const DIE_FISH = 8;
const DIE_VASE = 9;
const PROJ_ANVIL = 10;
const PROJ_FISH = 11;
const PROJ_VASE = 12;
const PROJ_COFFEE = 13;
const SMASHED_ANVIL = 14;
const SMASHED_FISH = 15;
const SMASHED_VASE = 16;
const SMASHED_COFFEE = 17;

//delays and counters for each 'thrower' in the truck
const delays = [Math.random() +0.5, Math.random() +0.5, Math.random() +0.5, Math.random() +0.5];
const counters = [0, 0, 0, 0];
//index of next projectile available to throw
let nextProjectile = 0;

//audio
const theme = new Audio('audio/theme.mp3');
theme.loop = true;
theme.play();
const coffeeCatchSFX = new Audio('audio/catch.mp3');
const coffeeFallSFX = new Audio('audio/coffee-fall.mp3');
const anvilFallSFX = new Audio('audio/anvil-fall.mp3');
const fishFallSFX = new Audio('audio/fish-fall.mp3');
const vaseFallSFX = new Audio('audio/vase-fall.mp3');
const dieSFX = new Audio('audio/die.mp3');
const stackSFX = new Audio('audio/stack.mp3');
const stackEmptySFX = new Audio('audio/stack-empty.mp3');
const truckBackUpSFX = new Audio('audio/truck-back-up.mp3');
const truckDriveAwaySFX = new Audio('audio/truck-drive-away.mp3');

const audioContext = new AudioContext();
const themeSource = audioContext.createMediaElementSource(theme);
const coffeeCatchSource = audioContext.createMediaElementSource(coffeeCatchSFX);
const coffeeFallSource = audioContext.createMediaElementSource(coffeeFallSFX);
const anvilFallSource = audioContext.createMediaElementSource(anvilFallSFX);
const fishFallSource = audioContext.createMediaElementSource(fishFallSFX);
const vaseFallSource = audioContext.createMediaElementSource(vaseFallSFX);
const dieSource = audioContext.createMediaElementSource(dieSFX);
const stackSource = audioContext.createMediaElementSource(stackSFX);
const stackEmptySource = audioContext.createMediaElementSource(stackEmptySFX);
const truckBackUpSource = audioContext.createMediaElementSource(truckBackUpSFX);
const truckDriveAwaySource = audioContext.createMediaElementSource(truckDriveAwaySFX);

const filterOptions = {type:'lowpass', frequency: 20000, q: 0};
const filterNode = new BiquadFilterNode(audioContext, filterOptions);

const musicGainOptions = {gain: 1};
const musicGainNode = new GainNode(audioContext, musicGainOptions);

const sfxGainOptions = {gain: 1};
const sfxGainNode = new GainNode(audioContext, sfxGainOptions);

themeSource.connect(musicGainNode);
coffeeCatchSource.connect(sfxGainNode);
coffeeFallSource.connect(sfxGainNode);
anvilFallSource.connect(sfxGainNode);
fishFallSource.connect(sfxGainNode);
vaseFallSource.connect(sfxGainNode);
dieSource.connect(sfxGainNode);
stackSource.connect(sfxGainNode);
stackEmptySource.connect(sfxGainNode);
truckBackUpSource.connect(sfxGainNode);
truckDriveAwaySource.connect(sfxGainNode);
musicGainNode.connect(filterNode);
sfxGainNode.connect(filterNode);
filterNode.connect(audioContext.destination);

//God constructor
const beanCounters = new Game(
  function() {
    this.loader
      .add('sheet', 'images/sheet.png')
      .add('menu', 'images/Menu_08.jpg')
      .add('gui', 'images/gui.png')
      .add('truck', 'images/truck.png')
      .add('font', 'fonts/burbank_big_regular_bold.ttf');

  },
  function(resources) {

    resources.sheet.texture.baseTexture.scaleMode = PIXI.NEAREST;
    resources.gui.texture.baseTexture.scaleMode = PIXI.NEAREST;

    for(let y = 0; y < 4; y++) {
      for(let x = 0; x < 5; x++) {
        textures.push(new PIXI.Texture(
          resources.sheet.texture,
          new PIXI.Rectangle(x * 185, y * 185, 185, 185)
        ));
      }
    }

    menuBGSprite = new PIXI.Sprite(resources.menu.texture);
    this.menuScene.addChild(menuBGSprite);

    let buttonTexture = new PIXI.Texture(this.loader.resources.gui.texture, new PIXI.Rectangle(0, 761, 510, 169));
    let starTexture = new PIXI.Texture(resources.gui.texture, new PIXI.Rectangle(389, 946, 34, 32));

    playButton = this.createButton(this.app.view.width/2, this.app.view.height * 0.375, 300, 64, 'PLAY!',
      new PIXI.Texture(this.loader.resources.gui.texture, new PIXI.Rectangle(0, 761, 510, 169)),
      () => {
        this.setScene('game');
        reset();
        filterNode.frequency.value = 20000;
      }, this.menuScene);
    //save this one to
    pauseButton = this.createButton(this.app.view.width-40, 60, 61, 61, '',
      new PIXI.Texture(this.loader.resources.gui.texture, new PIXI.Rectangle(510, 761, 61, 61)), pause, this.gameScene);

    keepPlayingButton = this.createButton(this.app.view.width/2 - 160, this.app.view.height * 0.625, 300, 64, 'KEEP PLAYING',
      buttonTexture,
      () => {
        this.setScene('game');
        filterNode.frequency.value = 20000;
      }, this.pauseScene);

    menuButton = this.createButton(this.app.view.width/2 + 160, this.app.view.height * 0.625, 300, 64, 'MENU',
      buttonTexture,
      () => {
        this.setScene('menu');
        filterNode.frequency.value = 20000;
      }, this.pauseScene);

    okayButton = this.createButton(this.app.view.width/2, this.app.view.height * 0.625, 300, 64, 'OKAY',
      buttonTexture,
      () => {
        this.setScene('menu');
        upperText.visible = false;
      }, this.winScene);

    //checkboxes
    musicCheckBox = this.createCheckBox(this.app.view.width/2, this.app.view.height * 0.25, 300, 64, 'MUSIC',
      buttonTexture, starTexture,
      (isChecked) => {
        musicGainNode.gain.linearRampToValueAtTime(isChecked?1:0, audioContext.currentTime + 1);
      }, true, this.pauseScene);

    sfxCheckBox = this.createCheckBox(this.app.view.width/2, this.app.view.height * 0.375, 300, 64, 'SFX',
      buttonTexture, starTexture,
      (isChecked) => {
        sfxGainNode.gain.linearRampToValueAtTime(isChecked?1:0, audioContext.currentTime + 1);
      }, true, this.pauseScene);

    debugCheckBox = this.createCheckBox(this.app.view.width/2, this.app.view.height * 0.5, 300, 64, 'DEBUG',
      buttonTexture, starTexture,
      (isChecked) => {
        showColliders = isChecked;
        graphics.clear();
      }, false, this.pauseScene);

    livesText = new PIXI.Text('LIVES: 3', Game.ButtonTextStyle);
    livesText.x = 20;
    livesText.y = 48;
    this.gameScene.addChild(livesText);

    levelText = new PIXI.Text('LEVEL: 1', Game.ButtonTextStyle);
    levelText.x = 220;
    levelText.y = 48;
    this.gameScene.addChild(levelText);

    scoreText = new PIXI.Text('SCORE: 0', Game.ButtonTextStyle);
    scoreText.x = 420;
    scoreText.y = 48;
    this.gameScene.addChild(scoreText);

    //initialize stack of coffee on side
    for(let i = 0; i < 60; i++) {
      let sack = new PIXI.Sprite(textures[PROJ_COFFEE]);
      sack.x = -Math.floor((i / 30) + 1)* 50 + 100 + Math.random() * 20;
      sack.y = this.app.view.height - 10 * (i%30) - 160 + 20 * Math.floor((i / 30)) - Math.random() * 5;
      if(i % 30 < 4)
        sack.y += 10;
      sack.visible = false;
      this.gameScene.addChild(sack);
      coffeeStack.push(sack);
    }

    //initialize projectiles
    for(let i = 0; i < MAX_PROJECTILES; i++) {
      const projectile = new Projectile(textures, 900, 300);
      projectile.anchor = new PIXI.Point(0.5, 0.5);
      //projectile.gotoAndStop(Math.floor(Math.random()*4 + 10));
      projectile.gotoAndStop(PROJ_COFFEE);
      projectiles.push(projectile);
      this.gameScene.addChild(projectile);
    }

    player = new PIXI.AnimatedSprite(textures);
    player.y = this.app.view.height - 102;
    player.anchor = new PIXI.Point(0.5, 0.5);
    this.gameScene.addChild(player);

    truck = new PIXI.Sprite(resources.truck.texture);
    this.gameScene.addChild(truck);
    truck.x = this.app.view.width - 246 + 5;
    truck.y = this.app.view.height - 418 - 20;

    upperText = new PIXI.Text('TRUCK UNLOADED!!', Game.ButtonTextStyle);
    upperText.anchor = new PIXI.Point(0.5, 0.5);
    upperText.x = this.app.view.width/2;
    upperText.y = this.app.view.height / 3;
    upperText.visible = false;
    this.gameScene.addChild(upperText);


    lowerText = new PIXI.Text('TRY AGAIN..', Game.ButtonTextStyle);
    lowerText.anchor = new PIXI.Point(0.5, 0.5);
    lowerText.x = this.app.view.width/2;
    lowerText.y = this.app.view.height * 2 / 3;
    lowerText.visible = false;
    this.gameScene.addChild(lowerText);

    countDownText = new PIXI.Text('3', Game.BigTextStyle);
    countDownText.anchor = new PIXI.Point(0.5, 0.5);
    countDownText.x = this.app.view.width/2;
    countDownText.y = this.app.view.height / 3;
    countDownText.tint = 0xeeff00;  //yellow
    countDownText.alpha = 0.5;
    countDownText.visible = false;
    this.gameScene.addChild(countDownText);

    updateProjectileRespawnPoint();

    updateProjectileVelocity();

    this.app.stage.addChild(this.menuScene);

    this.app.stage.addChild(graphics);
  },
  function(scale, delta) {

    if(this.currentScene !== 'game') return; //if not playing, return

    //if dead, increment deadCounter
    if(dead) {
      counter+=delta;
      let seconds = (counter / 1000);
      switch(Math.floor(seconds)) {
        case 0: break;
        case 1: countDownText.visible = true; countDownText.text = '3'; break;
        case 2: countDownText.text = '2'; break;
        case 3: countDownText.text = '1'; break;
        case 4: dead = false; player.gotoAndStop(CATCH_0); countDownText.visible = false; lowerText.visible = false; break;
      }

      countDownText.alpha = Math.ceil(seconds) - seconds;
      countDownText.scale.set((seconds - Math.floor(seconds) + 1) / 2);
    }

    //if waitingForNextLevel, increment waitingCounter
    if(waitingForNextLevel) {
      counter+=delta;

      let dx = this.app.view.width - truck.x; //distance from left edge of truck to right edge of screen
      let truckSpeed = 8 - (dx / truck.width) * 7;
      if(truckState === TRUCK_LEAVING) {
        if(truck.x < this.app.view.width) {
          truck.x += truckSpeed * scale;
        }
        if(counter / 1000 >= 3) {
          truckState = TRUCK_BACKING_UP;
          upperText.text = 'NEXT TRUCK!!';
          truckBackUpSFX.play();
        }
      }

      if(truckState === TRUCK_BACKING_UP) {
        truck.x -= truckSpeed * scale / 2;
        if(truck.x <= this.app.view.width - 246 + 5) {
          truckState = TRUCK_WAITING;
          upperText.visible = false;
        }
      }

      if(counter / 1000 >= 5 && truckState === TRUCK_WAITING) {
        waitingForNextLevel = false;
        // clear stack of coffee
        resetCoffeeStack();
        coffeesStacked = 0;
        // reset player anim
        player.gotoAndStop(CATCH_0);
        // increment level
        level++;
        levelText.text = 'LEVEL: ' + level;

        waitingForNextLevel = false;
      }
    }

    //throwing projectiles
    if(!dead && !waitingForNextLevel) {
      let throwers = level;
      if(level >= 3) throwers--;

      for (let i = 0; i < throwers ; i++) {
        counters[i] += delta / 1000;
        // *** assuming delays.length === counters.length
        if (counters[i] >= delays[i]) {
          delays[i] = Math.random() + 0.5;  //range 0.5 -> 1.5
          counters[i] = 0;

          projectiles[nextProjectile].resetAll();
          projectiles[nextProjectile].visible = true;
          projectiles[nextProjectile].ay = Projectile.GRAVITY;
          projectiles[nextProjectile].ax = Projectile.HORIZONTAL_GRAVITY;
          projectiles[nextProjectile].vy = PROJ_VEL_Y;  //all projectiles have same vertical velocity
          projectiles[nextProjectile].vx = Math.random() * (PROJ_VEL_X + 8) - 8;  //horizontal is range from -8 to -max
          //projectiles[nextProjectile].vx = PROJ_VEL_X;

          projectiles[nextProjectile].gotoAndStop(PROJ_COFFEE);
          if(Math.random() < 0.3 - 11 * (level - 4) * (level - 4) / 300) {
            //is hazard
            if(level < 4) {
              projectiles[nextProjectile].gotoAndStop(Math.random() * (level - 1) + 10);
            } else if(level >= 4) {
              projectiles[nextProjectile].gotoAndStop(Math.random() * 3 + 10);
            }
          }

          nextProjectile++;
          if (nextProjectile === MAX_PROJECTILES)
            nextProjectile = 0;
        }
      }
    }
    //update projectiles
    for(const projectile of projectiles) {
      projectile.update(scale, delta);
    }

    //draw colliders
    if(showColliders) {
      graphics.clear();
      graphics.beginFill(0xff00, 0.3);
      for (const projectile of projectiles) {
        graphics.drawCircle(projectile.x, projectile.y, (projectile.currentFrame === PROJ_COFFEE) ? COFFEE_COLLIDER_RADIUS : PROJ_COLLIDER_RADIUS);
      }
      graphics.drawCircle(player.x, player.y, PLAYER_COLLIDER_RADIUS);
      graphics.drawRect(0, 0, 350, this.app.view.height);

      graphics.endFill();

      graphics.beginFill(0xff, 0.7);
      graphics.drawRect(300, this.app.view.height - 50, this.app.view.width - 300 - 150, 30);
      graphics.endFill();
    }

    //check for and react to collisions
    if(!dead && !waitingForNextLevel) {
      for (const projectile of projectiles) {
        let dx = projectile.x - player.x;
        let dy = projectile.y - player.y;

        //early skip if the projectile is smashed
        if(projectile.currentFrame >= SMASHED_ANVIL) {
          continue;
        }
        //hit! if coffee, reset projectile, increase score, set sprite, play sound
        else if (projectile.currentFrame === PROJ_COFFEE) {
          if (Math.sqrt(dy * dy + dx * dx) <= COFFEE_COLLIDER_RADIUS + PLAYER_COLLIDER_RADIUS) {
            //max coffee
            player.gotoAndStop(player.currentFrame + 1);
            if (player.currentFrame === DIE_COFFEE) {
              projectile.resetAll();
              projectile.visible = false;
              loseLife();
            }
            else {
              increaseScore(2 * level);
              projectile.resetAll();
              projectile.visible = false;
              coffeeCatchSFX.play();
            }
          }
        }
        //if other, lose life, set sprite, lose? play dead sound
        else if (Math.sqrt(dy * dy + dx * dx) <= PROJ_COLLIDER_RADIUS + PLAYER_COLLIDER_RADIUS) {

          loseLife();
          projectile.resetAll();

          switch (projectile.currentFrame) {
            case PROJ_VASE:
              player.gotoAndStop(DIE_VASE);
              break;
            case PROJ_ANVIL:
              player.gotoAndStop(DIE_ANVIL);
              break;
            case PROJ_FISH:
              player.gotoAndStop(DIE_FISH);
              break;
          }
        }
      }
    }
  },
  function(x, y) {
    if (!dead && !waitingForNextLevel && this.currentScene === 'game') {
      if (x > 300 && x < this.app.view.width - 150) {
        player.x = x;
      } else if(x <= 300){
        player.x = 300;
      } else {
        player.x = this.app.view.width - 150;
      }

    }
  },
  function(x, y) {
    audioContext.resume();

    //if win, cant place things
    if(this.currentScene !== 'game') return;

    //if player is on the left side of screen, increase score, decrement anim frame
    if(player.x <= 350 && !dead && !waitingForNextLevel) {
      if(player.currentFrame > 0) {
        player.gotoAndStop(player.currentFrame - 1);
        increaseScore(3 * level);
        coffeeStack[coffeesStacked].visible = true;
        coffeesStacked++;

        for(let i = 4; i > 0; i--) {
          if((coffeesStacked % 30) - i >= 4) {
            coffeeStack[coffeesStacked - i].y += i;
            coffeeStack[coffeesStacked - i].x += Math.random() * 2 - 1;
          }
        }

        //complete level
        if(coffeesStacked >= 10 * (level + 1)) {
          increaseScore(level * 25); //bonus for beating level
          if(level === 5) {
            increaseScore(lives * 250);
            this.setScene('win');
            upperText.text = 'GAME OVER!! SCORE: ' + score;
            upperText.visible = true;
            return;
          }
          counter = 0;
          waitingForNextLevel = true;
          truckState = TRUCK_LEAVING;
          upperText.text = 'TRUCK UNLOADED!!'
          upperText.visible = true;
          truckDriveAwaySFX.play();
        }
        stackSFX.play();
      } else {
        stackEmptySFX.play();
      }
    }
  },
  function(x, y) {},
  function(key) {
    if(key === 'Escape') {
      pause();
    }
  },
  function() {},
  function(width, height) {
    //move projectiles
    for(let projectile of projectiles) {
      if(projectile.currentFrame >= SMASHED_ANVIL) {
        projectile.y = height - 60;
      }
    }
    updateProjectileRespawnPoint();
    updateProjectileVelocity();
    //move player
    player.y = height - 102;

    //move all ui (x button, upper & lower texts, countdown text)
    upperText.x = width/2;
    upperText.y = height/3;
    lowerText.x = width/2;
    lowerText.y = height * 2 /3;
    countDownText.x = width/2;
    countDownText.y = height/3;

    playButton.sprite.x = width/2;
    playButton.sprite.y = height * 0.375;
    playButton.text.x = width/2;
    playButton.text.y = height * 0.375;

    pauseButton.sprite.x = width-40;
    pauseButton.text.x = width-40;

    keepPlayingButton.sprite.x = width/2 - 160;
    keepPlayingButton.sprite.y = height * 0.625;
    keepPlayingButton.text.x = width/2 - 160
    keepPlayingButton.text.y = height * 0.625;

    menuButton.sprite.x = width/2 + 160;
    menuButton.sprite.y = height * 0.625;
    menuButton.text.x = width/2 + 160;
    menuButton.text.y = height * 0.625;

    okayButton.sprite.x = width/2;
    okayButton.sprite.y = height * 0.625;
    okayButton.text.x = width/2;
    okayButton.text.y = height * 0.625;

    //checkboxes
    musicCheckBox.sprite1.x = width/2 + 10;
    musicCheckBox.sprite1.y = height * 0.25;
    musicCheckBox.sprite2.x = width/2 + 10 + Math.max(musicCheckBox.sprite1.width, musicCheckBox.sprite1.height)/2;
    musicCheckBox.sprite2.y = height * 0.25;
    musicCheckBox.text.x = width/2;
    musicCheckBox.text.y = height * 0.25;

    sfxCheckBox.sprite1.x = width/2 + 10;
    sfxCheckBox.sprite1.y = height * 0.375;
    sfxCheckBox.sprite2.x = width/2 + 10 + Math.max(sfxCheckBox.sprite1.width, sfxCheckBox.sprite1.height)/2;
    sfxCheckBox.sprite2.y = height * 0.375;
    sfxCheckBox.text.x = width/2;
    sfxCheckBox.text.y = height * 0.375;

    debugCheckBox.sprite1.x = width/2 + 10;
    debugCheckBox.sprite1.y = height * 0.5;
    debugCheckBox.sprite2.x = width/2 + 10 + Math.max(debugCheckBox.sprite1.width, debugCheckBox.sprite1.height)/2;
    debugCheckBox.sprite2.y = height * 0.5;
    debugCheckBox.text.x = width/2;
    debugCheckBox.text.y = height * 0.5;

    //move truck, platform, background elements
    truck.x = width - 246 + 5;
    truck.y = height - 418 - 20;

    //move stack
    for(let i = 0; i < coffeeStack.length; i++) {
      coffeeStack[i].y = this.app.view.height - 10 * (i%30) - 160 + 20 * Math.floor((i / 30)) - Math.random() * 5;
      if(i % 30 < 4)
        coffeeStack[i].y += 10;
    }
  }
);

function pause() {
  if(beanCounters.currentScene === 'game') {
    beanCounters.setScene('pause');
    filterNode.frequency.value = 1000;
  }
}

function resetCoffeeStack() {
  for(let i = 0; i < coffeeStack.length; i++) {
    coffeeStack[i].visible = false;
    coffeeStack[i].x = -Math.floor((i / 30) + 1)* 50 + 100 + Math.random() * 20;
    coffeeStack[i].y = beanCounters.app.view.height - 10 * (i%30) - 160 + 20 * Math.floor((i / 30)) - Math.random() * 5;
    if(i % 30 < 4)
      coffeeStack[i].y += 10;
  }
}

//resets game
function reset() {
  filterNode.frequency.value = 1000;
  player.gotoAndStop(CATCH_0);
  resetCoffeeStack();
  coffeesStacked = 0;
  score = 0;
  scoreText.text = 'SCORE: ' + score;
  lives = 3;
  livesText.text = 'LIVES: ' + lives;
  level = 1;
  levelText.text = 'LEVEL: ' + level;
  //reset projectiles
  for(let projectile of projectiles) {
    projectile.resetAll();
  }
  counters[0] = 0;
  counters[1] = 0;
  counters[2] = 0;
  counters[3] = 0;
}

function increaseScore(amount) {
  if(score+amount >= 0) {
    score += amount;
  }
  scoreText.text = 'SCORE: ' + score;
}

function loseLife() {
  dieSFX.play();
  if(lives === 0) {
    beanCounters.setScene('win');
    upperText.text = 'GAME OVER!! SCORE: ' + score;
    upperText.visible = true;
    return;
  }
  lives--;
  livesText.text = 'LIVES: ' + lives;
  dead = true;
  counter = 0;
  lowerText.text = 'TRY AGAIN..';
  lowerText.visible = true;
}

function updateProjectileRespawnPoint() {
  let h = 0;  //total height gained by projectile during flight
  for(let v = PROJ_VEL_Y; v < 0; v += Projectile.GRAVITY) {
    h += v;
  }
  projectileRespawnPoint.x = beanCounters.app.view.width - 100;
  projectileRespawnPoint.y = beanCounters.app.view.height - 500 - h;
}

function updateProjectileVelocity() {
  //using kinematics, find time it takes for projectile to fall, use that time to determine vi
  let d = (projectileRespawnPoint.y - beanCounters.app.view.height + 60); //vertical distance (-)
  let vf = -Math.sqrt(PROJ_VEL_Y * PROJ_VEL_Y + 2 * (-Projectile.GRAVITY) * d); //middle step since I dont want to use quadratic formula
  let t = 2 * d / (-PROJ_VEL_Y + vf);
  PROJ_VEL_X = (-beanCounters.app.view.width + 400 - 0.5 * Projectile.HORIZONTAL_GRAVITY * t * t) / t;  //solve for vi
}
