const SCALE = 1;    //scale of canvas in window

export class Game {
    //callbacks
    addTextures;
    loadTextures;
    update;
    mouseMove;
    mouseUp;
    mouseDown;
    keyUp;
    keyDown;
    resize;

    //PIXI things
    app;

    loader;
    ticker;

    //scene things
    currentScene = 'menu';
    menuScene = new PIXI.Container();
    gameScene = new PIXI.Container();
    pauseScene = new PIXI.Container();
    winScene = new PIXI.Container();

    //buttons
    static ButtonTextStyle = new PIXI.TextStyle({fill: 0xFFFFFF, stroke: 0x0, strokeThickness: 6, miterLimit: 4, fontSize: 36,fontFamily: 'Burbank Big Regular Bold'});
    static BigTextStyle = new PIXI.TextStyle({fill: 0xFFFFFF, stroke: 0x0, strokeThickness: 6, miterLimit: 4, fontSize: 128,fontFamily: 'Burbank Big Regular Bold'});

    constructor(addTextures, loadTextures, update, mouseMove, mouseDown, mouseUp, keyDown, keyUp, resize) {
        this.addTextures = addTextures;
        this.loadTextures = loadTextures;
        this.update = update;
        this.mouseMove = mouseMove;
        this.mouseUp = mouseUp;
        this.mouseDown = mouseDown;
        this.keyUp = keyUp;
        this.keyDown = keyDown;
        this.resize = resize;

        //PIXI setup
        this.app = new PIXI.Application(
          {
              width: window.innerWidth * SCALE,
              height: window.innerHeight * SCALE,
              backgroundColor: 0xAAAAAA,
              autoResize: true,
          }
        );
        //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        document.body.appendChild(this.app.view);

        this.loader = PIXI.Loader.shared;
        this.ticker = PIXI.Ticker.shared;
        //this.ticker.speed = 0;

        //call where user adds textures to loader
        this.addTextures();

        this.loader.load((loader, resources) => {
            //call user-defined loadTextures;
            this.loadTextures(resources);

            //window resize
            window.onresize = () => {
                this.app.renderer.resize(window.innerWidth * SCALE,  window.innerHeight * SCALE);
                this.resize(this.app.view.width,  this.app.view.height);
            }
            //input callbacks
            document.body.onmousemove = (e) => {this.mouseMove(e.x - this.app.view.offsetLeft, e.y - this.app.view.offsetTop)};
            document.body.onmousedown = (e) => {this.mouseDown(e.x - this.app.view.offsetLeft, e.y - this.app.view.offsetTop)};
            document.body.onmouseup = (e) => {this.mouseUp(e.x - this.app.view.offsetLeft, e.y - this.app.view.offsetTop)};
            document.body.onkeydown = (e) => {this.keyDown(e.key)};
            document.body.onkeyup = (e) => {this.keyUp(e.key)};
            //call user-defined update
            this.ticker.add((delta)=>{
                this.update(delta, this.ticker.deltaMS);
            });
        });
    }

    setScene(scene) {
        switch(this.currentScene) {
            case 'game': this.app.stage.removeChild(this.gameScene); break;
            case 'menu': this.app.stage.removeChild(this.menuScene); break;
            case 'pause': this.app.stage.removeChild(this.pauseScene); this.app.stage.removeChild(this.gameScene); break;
            case 'win': this.app.stage.removeChild(this.winScene); this.app.stage.removeChild(this.gameScene); break;
        }

        switch(scene) {
            case 'game': this.app.stage.addChild(this.gameScene); break;
            case 'menu': this.app.stage.addChild(this.menuScene); break;
            case 'pause': this.app.stage.addChild(this.gameScene); this.app.stage.addChild(this.pauseScene); break;
            case 'win': this.app.stage.addChild(this.gameScene); this.app.stage.addChild(this.winScene); break;
            default: console.log('scene "' + scene + '" is not a valid scene!'); return;
        }
        this.currentScene = scene;
    }

    createButton(x, y, width, height, text, texture, func, scene) {
        const b = new PIXI.Sprite(texture);
        b.anchor = new PIXI.Point(0.5, 0.5);
        b.x = x;
        b.y = y;
        b.width = width;
        b.height = height;
        b.interactive = true;
        b.buttonMode = true;

        const t = new PIXI.Text(text, Game.ButtonTextStyle);
        t.anchor = new PIXI.Point(0.5, 0.5);
        t.x = x;
        t.y = y;

        b.click = function() {
            b.tint = 0xffffff;
            func();
        }
        b.pointerdown = function() {
            this.tint = 0xbfbfbf;
        };
        b.pointerup = function() {
            this.tint = 0xffffff;
        };
        b.pointerover = function() {
            this.tint = 0xeeeeee;
        };
        b.pointerout = function() {
            this.tint = 0xffffff;
        };

        scene.addChild(b);
        scene.addChild(t);

        //return the button object
        return {'sprite': b, 'text': t};
    }

    createCheckBox(x, y, width, height, text, texture1, texture2, func, defaultState, scene) {
        const b = new PIXI.Sprite(texture1);
        b.anchor = new PIXI.Point(0, 0.5);
        b.x = x + 10;
        b.y = y;
        b.width = width;
        b.height = height;
        b.interactive = true;
        b.buttonMode = true;

        b.isChecked = defaultState;    //new member

        const check = new PIXI.Sprite(texture2);
        check.anchor = new PIXI.Point(0.5, 0.5);
        check.x = x + 10 + Math.max(width, height)/2;
        check.y = y;
        check.width = Math.min(width, height);
        check.height = Math.min(width, height);
        check.visible = b.isChecked;

        const t = new PIXI.Text(text, Game.ButtonTextStyle);
        t.anchor = new PIXI.Point(1, 0.5);
        t.x = x - 10;
        t.y = y;

        b.click = function() {
            b.tint = 0xffffff;
            this.isChecked = !this.isChecked;
            check.visible = this.isChecked;
            func(this.isChecked);
        }
        b.pointerdown = function() {
            this.tint = 0xbfbfbf;
        };
        b.pointerup = function() {
            this.tint = 0xffffff;
        };
        b.pointerover = function() {
            this.tint = 0xeeeeee;
        };
        b.pointerout = function() {
            this.tint = 0xffffff;
        };

        scene.addChild(b);
        scene.addChild(check);
        scene.addChild(t);

        //return the button object
        return {'sprite1': b, 'sprite2': check, 'text': t};
    }
}