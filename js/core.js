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

    constructor(addTextures, loadTextures, update, mouseMove, mouseDown, mouseUp, keyDown, keyUp) {
        this.addTextures = addTextures;
        this.loadTextures = loadTextures;
        this.update = update;
        this.mouseMove = mouseMove;
        this.mouseUp = mouseUp;
        this.mouseDown = mouseDown;
        this.keyUp = keyUp;
        this.keyDown = keyDown;
    }

    start() {
        //PIXI setup
        this.app = new PIXI.Application(
            {
                width: window.innerWidth,
                height: window.innerHeight,
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
                this.app.renderer.resize(window.innerWidth,  window.innerHeight);
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
        b.x = x;
        b.y = y;
        b.width = width;
        b.height = height;
        b.interactive = true;
        b.buttonMode = true;

        const t = new PIXI.Text(text, Game.ButtonTextStyle);
        t.x = x + (width - 16 * text.length)/2;
        t.y = y + (height - 36)/2;

        b.click = () => {
            b.tint = 0xffffff;
            func();
        }
        b.pointerdown = () => {
            b.tint = 0xbfbfbf;
        };
        b.pointerup = () => {
            b.tint = 0xffffff;
        };
        b.pointerover = () => {
            b.tint = 0xeeeeee;
        };
        b.pointerout = () => {
            b.tint = 0xffffff;
        };

        scene.addChild(b);
        scene.addChild(t);
    }
}