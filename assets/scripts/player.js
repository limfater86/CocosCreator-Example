let MoveVar = require('moveVar');

let Sound = cc.Enum({
    PLAY: 1,
    PAUSE: 2,
    STOP: -1,
});

cc.Class({
    extends: cc.Component,

    onPacDieAnimCompl: function(){
        this._game.reloadChars();
        this._lives.removeLife();
    },

    properties: {

        objectGroupName: {
            default: 'players'
        },

        startPlayerObjectName: {
            default:'SpawnPoint'
        },

        bigDotTileGID: {
            default: 3,
        },

        defualtSpriteFrame: {
            default: null,
            type: cc.SpriteFrame,
        },

        movePrefab: {
            default: null,
            type: cc.Prefab
        },
        
        eatAudio: {
            default: null,
            type: cc.AudioClip,
        },
        eatFruitAudio: {
            default: null,
            type: cc.AudioClip,
        },
        eatGhostAudio: {
            default: null,
            type: cc.AudioClip,
        },
        deathAudio: {
            default: null,
            type: cc.AudioClip,
        },

    },

    onLoad: function () {
        this.init();
    },

    onEnable: function(){
        this.setStartPos();
        this._playerResetVars();
        this._checkSprite(this.defualtSpriteFrame);
    },

    // start () {
        
    // },

    update: function (dt){
        this._checkPos();
        this._chekBorder();
        if (this._speed != 0) {
            this.move.tryMove();
            this._tryEat();
        }

    },

    _onKeyDown (event){
        switch(event.keyCode) {
            case cc.macro.KEY.up:
                this._nextDir = MoveVar.Dir.UP;
                break;
            case cc.macro.KEY.down:
                this._nextDir = MoveVar.Dir.DOWN;
                break;
            case cc.macro.KEY.left:
                this._nextDir = MoveVar.Dir.LEFT;
                break;
            case cc.macro.KEY.right:
                this._nextDir = MoveVar.Dir.RIGHT;
                break;
            default:
                return;
        }
        
        this._speed = MoveVar.Speed.NORMAL;

    },

    _thouchStart: function(event){
        this._touching = true;
        this._touchStartPos = event.touch.getLocation();
    },

    _touchEnd: function(event){
        if (!this._touching) return;
        let minMoveValue = 50;
        this._touching = false;
        let touchPos = event.touch.getLocation();
        let movedX = touchPos.x - this._touchStartPos.x;
        let movedY = touchPos.y - this._touchStartPos.y;
        let movedXValue = Math.abs(movedX);
        let movedYValue = Math.abs(movedY);
        if (movedXValue < minMoveValue && movedYValue < minMoveValue) {
            // touch moved not enough
            return;
        }

        let mapMoveDir = MoveVar.Dir.NONE;
        if (movedXValue >= movedYValue) {
            // move to right or left
            movedX > 0 ? mapMoveDir = MoveVar.Dir.RIGHT : mapMoveDir = MoveVar.Dir.LEFT;
        } else {
            // move to up or down
            movedY > 0 ? mapMoveDir = MoveVar.Dir.UP : mapMoveDir = MoveVar.Dir.DOWN;
        }
        this._nextDir = mapMoveDir;
        this._speed = MoveVar.Speed.NORMAL;
            
    },

    onDestroy (){
        this.inputOff();
        cc.audioEngine.stop(this.currentAudio);
    },

    onCollisionEnter: function (other, self) {
        let ghost = other.node.getComponent('ghost');
        if (ghost.getState() != MoveVar.State.DEAD){
            if (!ghost.isWeak()) this._pacDie();
            else this._eatGhost(ghost);
        }
    },

    init: function(){
        this._initMap();
        this._playerMoveAdd();
        this.playerInit();
    },

    playerInit: function(){
        this._reloadMap();
        this._playerResetVars();
        this._playerMoveInit();
    },

    _initMap: function(){
        this._tiledMap = this.node.getParent().getChildByName('map').getComponent('cc.TiledMap');
        this._game = this.node.getParent().getComponent('game');
        this.score = this.node.getParent().getChildByName('score').getComponent('score');
        this._lives = this.node.getParent().getChildByName('lives').getComponent('lives');
    },

    _reloadMap: function(){
        this._layerFloor = this._tiledMap.getLayer(this._game.floorLayerName);
        this._layerBarrier = this._tiledMap.getLayer(this._game.barrierLayerName);
    },

    _playerMoveAdd: function(){
        let charMove = cc.instantiate(this.movePrefab);
        this.node.addChild(charMove);
        this.move = charMove.getComponent('move');
        this.move._char = this.node;
        this.move._char.comp = this;
    },

    _playerResetVars(){
        this.inputOn();
        //this.gotKey();
        this.isSuperPower = false;
        this._speed = 0;
        this.isDead = false;
        this._currDir = this._nextDir = MoveVar.Dir.LEFT;
    },

    _playerMoveInit: function(){
        this.move._tiledMap = this._tiledMap;
        this.move._layerBarrier = this._layerBarrier;
    },

    _checkSprite: function(sprite){
        let sp = this.node.getComponent('cc.Sprite');
        sp.spriteFrame = sprite;
    },

    setStartPos: function(){
        let objectGroup = this._tiledMap.getObjectGroup(this.objectGroupName);
        let startObj = objectGroup.getObject(this.startPlayerObjectName);
        let startPos = cc.v2(startObj.x, startObj.y);
        let wintile = objectGroup.getObject('YellowGhost');
        this._winTile = this._getTilePos(wintile);
        this.node.setPosition(startPos);
    },

    _tryEat: function(){
        if (this._charAtTileCenter){
            let tileGID = false;
            if (this._isInsideBoards) tileGID = this._layerFloor.getTileGIDAt(this._currTile);
            if (tileGID){
                this._eat(tileGID);
                if (tileGID == this.bigDotTileGID) this._game.startPacPowerMode();
                else this._playEatAudio();
            } else this._pauseAudio();
        }
    },

    _eat: function(tileGID){
        this.score.gain(tileGID);
        this._layerFloor.setTileGIDAt(0, this._currTile.x, this._currTile.y, 0);
        this._game.decreaseTilesNum();
    },

    _playEatAudio: function(){
        let soundState = cc.audioEngine.getState(this.currentAudio);
        if (soundState == Sound.PAUSE) cc.audioEngine.resume(this.currentAudio);
        else if (soundState !== Sound.PLAY) this.currentAudio = this._playAudio(this.eatAudio);
    },

    _playAudio: function(audio){
        return cc.audioEngine.play(audio, false, 0.2);
    },

    _pauseAudio: function(){
        cc.audioEngine.pause(this.currentAudio);
    },

    _eatGhost: function(){
        this._playAudio(this.eatGhostAudio);
        this.inputOff();
        this.scheduleOnce(function(){
            this.inputOn();
        }, 1);
    },

    _pacDie: function(){
        this._game.ghostsPause();
        this.inputOff();
        this.isDead = true;
        this._playAudio(this.deathAudio);
        cc.audioEngine.stop(this._game.currAudio);
    },

    _checkPos: function(){
        let currPos = this.node.getPosition();
        this._currTile = this._getTilePos(currPos);
        let currTilePos = this._layerBarrier.getPositionAt(this._currTile);
        this._charAtTileCenter = (currPos.x - currTilePos.x == 0) && (currPos.y - currTilePos.y == 0);
        if (this._currTile.equals(this._winTile)) {
            this._game.gameOver('win'); 
        }
        
    },

    _getTilePos: function(posInPixel) {
        let mapSize = this._tiledMap.node.getContentSize();
        let tileSize = this._tiledMap.getTileSize();
        let x = Math.floor(posInPixel.x / tileSize.width);
        let y = Math.floor((mapSize.height - posInPixel.y - tileSize.height) / tileSize.height);
        
        return cc.v2(x, y);
    },

    _chekBorder(){
        let mapSize = this._tiledMap.getMapSize();
        this._isInsideBoards = this._currTile.x >= 0 && this._currTile.x < mapSize.width;
    },

    inputOff: function(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.TOUCH_START, this._thouchStart, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.TOUCH_END, this._touchEnd, this);
        this._speed = 0;
    },

    inputOn: function(){
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_START, this._thouchStart, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, this._touchEnd, this);
        this._speed = MoveVar.Speed.NORMAL;
    },

    gotKey: function(){
        this._key = true;
        this._game.playerGotKey();
    },

    getSpeed: function() {
        return this._speed;
    },
    setSpeed: function(speed) {
        return this._speed = speed;
    },

    getCurrDir: function() {
        return this._currDir;
    },

    getNextDir: function() {
        return this._nextDir;
    },

    setCurrtDir: function(dir){
        this._currDir = dir;
    },

    getTileCenter: function (){
        return this._charAtTileCenter;
    },

    getInBoards: function(){
        return this._isInsideBoards;
    },

    getCurrTile: function(){
        return this._currTile;
    },

    isPlayerHaveKey: function(){
        return this._key;
    },

});
