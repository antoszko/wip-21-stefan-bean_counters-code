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
  ax = 0;
  ay = 0;
  vx = 0;
  vy = 0;
  constructor(textures, x, y) {
    super(textures);
    this.x = x;
    this.y = y;
  }

  update(scale) {
    this.vx += this.ax * scale;
    this.vy += this.ay * scale;
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
const SHOW_COLLIDERS = false;
let projectileRespawnPoint = new Point(1200, 300);
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
let pauseButton;
let keepPlayingButton;
let menuButton;
let okayButton;

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

const gainOptions = {gain: 0.4};
const gainNode = new GainNode(audioContext, gainOptions);

themeSource.connect(gainNode);
coffeeCatchSource.connect(gainNode);
coffeeFallSource.connect(gainNode);
anvilFallSource.connect(gainNode);
fishFallSource.connect(gainNode);
vaseFallSource.connect(gainNode);
dieSource.connect(gainNode);
stackSource.connect(gainNode);
stackEmptySource.connect(gainNode);
truckBackUpSource.connect(gainNode);
truckDriveAwaySource.connect(gainNode);
gainNode.connect(filterNode);
filterNode.connect(audioContext.destination);

//God constructor
const beanCounters = new Game(
  ()=>{
    beanCounters.loader
      .add('sheet', 'images/sheet.png')
      .add('menu', 'images/Menu_08.jpg')
      .add('gui', 'images/gui.png')
      .add('truck', 'images/truck.png')
      .add('font', 'fonts/burbank_big_regular_bold.ttf');

  },
  (resources)=>{

    resources.sheet.texture.baseTexture.scaleMode = PIXI.NEAREST;

    for(let y = 0; y < 4; y++) {
      for(let x = 0; x < 5; x++) {
        textures.push(new PIXI.Texture(
          resources.sheet.texture,
          new PIXI.Rectangle(x * 185, y * 185, 185, 185)
        ));
      }
    }

    menuBGSprite = new PIXI.Sprite(resources.menu.texture);
    beanCounters.menuScene.addChild(menuBGSprite);

    beanCounters.createButton(180, 52, 300, 64, 'PLAY!',
      new PIXI.Texture(beanCounters.loader.resources.gui.texture, new PIXI.Rectangle(0, 761, 510, 169)),
      () => {
        beanCounters.setScene('game');
        reset();
        filterNode.frequency.value = 20000;
      }, beanCounters.menuScene);
    //save this one to
    pauseButton = beanCounters.createButton(beanCounters.app.view.width-40, 60, 61, 61, '',
      new PIXI.Texture(beanCounters.loader.resources.gui.texture, new PIXI.Rectangle(510, 761, 61, 61)), pause, beanCounters.gameScene);

    keepPlayingButton = beanCounters.createButton(beanCounters.app.view.width/2 - 160, beanCounters.app.view.height/2, 300, 64, 'KEEP PLAYING',
      new PIXI.Texture(beanCounters.loader.resources.gui.texture, new PIXI.Rectangle(0, 761, 510, 169)),
      () => {
        beanCounters.setScene('game');
        filterNode.frequency.value = 20000;
      }, beanCounters.pauseScene);

    menuButton = beanCounters.createButton(beanCounters.app.view.width/2 + 160, beanCounters.app.view.height/2, 300, 64, 'MENU',
      new PIXI.Texture(beanCounters.loader.resources.gui.texture, new PIXI.Rectangle(0, 761, 510, 169)),
      () => {
        beanCounters.setScene('menu');
        filterNode.frequency.value = 20000;
      }, beanCounters.pauseScene);

    okayButton = beanCounters.createButton(beanCounters.app.view.width/2, beanCounters.app.view.height/2, 300, 64, 'OKAY',
      new PIXI.Texture(beanCounters.loader.resources.gui.texture, new PIXI.Rectangle(0, 761, 510, 169)),
      () => {
        beanCounters.setScene('menu');
        upperText.visible = false;
      }, beanCounters.winScene);

    livesText = new PIXI.Text('LIVES: 3', Game.ButtonTextStyle);
    livesText.x = 20;
    livesText.y = 48;
    beanCounters.gameScene.addChild(livesText);

    levelText = new PIXI.Text('LEVEL: 1', Game.ButtonTextStyle);
    levelText.x = 220;
    levelText.y = 48;
    beanCounters.gameScene.addChild(levelText);

    scoreText = new PIXI.Text('SCORE: 0', Game.ButtonTextStyle);
    scoreText.x = 420;
    scoreText.y = 48;
    beanCounters.gameScene.addChild(scoreText);

    //initialize stack of coffee on side
    for(let i = 0; i < 60; i++) {
      let sack = new PIXI.Sprite(textures[PROJ_COFFEE]);
      sack.x = -Math.floor((i / 30) + 1)* 50 + 100 + Math.random() * 20;
      sack.y = beanCounters.app.view.height - 10 * (i%30) - 160 + 20 * Math.floor((i / 30)) - Math.random() * 5;
      if(i % 30 < 4)
        sack.y += 10;
      sack.visible = false;
      beanCounters.gameScene.addChild(sack);
      coffeeStack.push(sack);
    }

    //initialize projectiles
    for(let i = 0; i < MAX_PROJECTILES; i++) {
      const projectile = new Projectile(textures, 900, 300);
      projectile.anchor = new PIXI.Point(0.5, 0.5);
      //projectile.gotoAndStop(Math.floor(Math.random()*4 + 10));
      projectile.gotoAndStop(PROJ_COFFEE);
      projectiles.push(projectile);
      beanCounters.gameScene.addChild(projectile);
    }

    player = new PIXI.AnimatedSprite(textures);
    player.y = beanCounters.app.view.height - 102;
    player.anchor = new PIXI.Point(0.5, 0.5);
    beanCounters.gameScene.addChild(player);

    truck = new PIXI.Sprite(resources.truck.texture);
    beanCounters.gameScene.addChild(truck);
    truck.x = beanCounters.app.view.width - 246 + 5;
    truck.y = beanCounters.app.view.height - 418 - 20;

    upperText = new PIXI.Text('TRUCK UNLOADED!!', Game.ButtonTextStyle);
    upperText.anchor = new PIXI.Point(0.5, 0.5);
    upperText.x = beanCounters.app.view.width/2;
    upperText.y = beanCounters.app.view.height / 3;
    upperText.visible = false;
    beanCounters.gameScene.addChild(upperText);


    lowerText = new PIXI.Text('TRY AGAIN..', Game.ButtonTextStyle);
    lowerText.anchor = new PIXI.Point(0.5, 0.5);
    lowerText.x = beanCounters.app.view.width/2;
    lowerText.y = beanCounters.app.view.height * 2 / 3;
    lowerText.visible = false;
    beanCounters.gameScene.addChild(lowerText);

    countDownText = new PIXI.Text('3', Game.BigTextStyle);
    countDownText.anchor = new PIXI.Point(0.5, 0.5);
    countDownText.x = beanCounters.app.view.width/2;
    countDownText.y = beanCounters.app.view.height / 3;
    countDownText.tint = 0xeeff00;  //yellow
    countDownText.alpha = 0.5;
    countDownText.visible = false;
    beanCounters.gameScene.addChild(countDownText);

    projectileRespawnPoint.x = beanCounters.app.view.width;
    projectileRespawnPoint.y = beanCounters.app.view.height / 2;

    beanCounters.app.stage.addChild(beanCounters.menuScene);
  },
  (scale, delta)=>{

    if(beanCounters.currentScene !== 'game') return; //if not playing, return

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

      let dx = beanCounters.app.view.width - truck.x; //distance from left edge of truck to right edge of screen
      let truckSpeed = 8 - (dx / truck.width) * 7;
      if(truckState === TRUCK_LEAVING) {
        if(truck.x < beanCounters.app.view.width) {
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
        if(truck.x <= beanCounters.app.view.width - 246 + 5) {
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
          projectiles[nextProjectile].ay = Projectile.GRAVITY;
          projectiles[nextProjectile].vy = -(Math.random() * 15 + 5);
          projectiles[nextProjectile].vx = -(Math.random() * 10 + 5);
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
      projectile.update(scale);
    }

    //draw colliders
    if(SHOW_COLLIDERS) {
      graphics.clear();
      graphics.beginFill(0xff00, 0.3);
      for (const projectile of projectiles) {
        graphics.drawCircle(projectile.x, projectile.y, (projectile.currentFrame === PROJ_COFFEE) ? COFFEE_COLLIDER_RADIUS : PROJ_COLLIDER_RADIUS);
      }
      graphics.drawCircle(player.x, player.y, PLAYER_COLLIDER_RADIUS);
      graphics.endFill();
      beanCounters.app.stage.addChild(graphics);
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
              loseLife();
            }
            else {
              increaseScore(2 * level);
              projectile.resetAll();
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
  (x, y)=> {
    if (!dead && !waitingForNextLevel && beanCounters.currentScene === 'game') {
      if (x > 300) {
        player.x = x;
      } else {
        player.x = 300;
      }
    }
  },
  (x, y)=>{
    //TODO uncomment
    //audioContext.resume();
    //theme.play();

    //if win, cant place things
    if(beanCounters.currentScene !== 'game') return;

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
            beanCounters.setScene('win');
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
  (x, y)=>{},
  (key)=>{
    if(key === 'Escape') {
      pause();
    }
  },
  (key)=>{},
  (width, height)=>{
    console.log('resized!');
    //move projectiles
    for(let projectile of projectiles) {
      if(projectile.currentFrame >= SMASHED_ANVIL) {
        projectile.y = height - 60;
      }
    }
    //move projectile spawn point
    projectileRespawnPoint.x = width;
    projectileRespawnPoint.y = height / 2;

    //move player
    player.y = height - 102;

    //move all ui (x button, upper & lower texts, countdown text)
    upperText.x = width/2;
    upperText.y = height/3;
    lowerText.x = width/2;
    lowerText.y = height * 2 /3;
    countDownText.x = width/2;
    countDownText.y = height/3;

    pauseButton.sprite.x = width-40;
    pauseButton.text.x = width-40;

    keepPlayingButton.sprite.x = width/2 - 160;
    keepPlayingButton.sprite.y = height / 2;
    keepPlayingButton.text.x = width/2 - 160
    keepPlayingButton.text.y = height / 2;

    menuButton.sprite.x = width/2 + 160;
    menuButton.sprite.y = height / 2;
    menuButton.text.x = width/2 + 160;
    menuButton.text.y = height / 2;

    okayButton.sprite.x = width/2;
    okayButton.sprite.y = height / 2;
    okayButton.text.x = width/2;
    okayButton.text.y = height / 2;
    //move truck, platform, background elements
    truck.x = width - 246 + 5;
    truck.y = height - 418 - 20;

    //move stack
    for(let i = 0; i < coffeeStack.length; i++) {
      coffeeStack[i].y = beanCounters.app.view.height - 10 * (i%30) - 160 + 20 * Math.floor((i / 30)) - Math.random() * 5;
      if(i % 30 < 4)
        coffeeStack[i].y += 10;
    }
  }
);

beanCounters.start();

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