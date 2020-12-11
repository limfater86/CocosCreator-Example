let MoveVar = require("moveVar");

let Target = cc.Enum({
    EXIT: 1,
    PLAYER: 2,
    AWAY: 3,
    RESP: 4,
});

cc.Class({
    extends: cc.Component,

    properties: {

        objectGroupName: {
            default: 'players'
        },

        startGhostObjectName: {
            default: 'RedGhost',
        },

        respTarget: {
            default: 'PinkGhost',
        },

        movePrefab: {
            default: null,
            type: cc.Prefab
        },
        
        color:{
            default: 'Red',
        },

        scoreDisplay: {
            default: null,
            type: cc.Label,
        },

        delayTime: {
            default: 10,
        },

        playerLocUpTime: {
            default: 0.5,
        },

        exitTarget: {
            default: 'RedGhost',
        },

        player: {
            default: null,
            type: cc.Node,
        },

        animCtrl: {
            default: null,
            type: cc.Node,
        },

        deathAudio: {
            default: null,
            type: cc.AudioClip,
        },
    },


    onLoad () {
        this.init();
    },

    onEnable (){
        this.setStartPos();
        this._ghostResetVars();
        this._wait();
    },

    onDisable (){
        cc.audioEngine.stop(this._currAudio);
    },

    // start () {
        
    // },

    update (dt) {
        if (this._state != MoveVar.State.WAIT){
            this._checkPos();
            this._chekBorder();
            this._tryMove();
        }
        
        // if (this._state == MoveVar.State.EXIT) this._exit();
        // else if (this._state == MoveVar.State.NORMAL) this._move();
        // else if (this._state == MoveVar.State.DEAD) this._respawn();
    },

    onCollisionEnter: function (other, self) {
        if (this._state != MoveVar.State.DEAD){
            if (this._isWeak) {
                this.startDie();
                this._game.ghostsPause();
                this.scheduleOnce(function(){
                    this._game.ghostsUnPause();
                }, 1);
            }
        }
    },

    init: function(){
        this._initMap();
        this._ghostMoveAdd();
        this.ghostInit();
    },

    ghostInit: function(){
        this._reloadMap();
        this._ghostResetVars();
        this._wait();
        this._ghostMoveInit();
    },

    _initMap: function(){
        this._tiledMap = this.node.getParent().getChildByName('map').getComponent('cc.TiledMap');
        this._game = this.node.getParent().getComponent('game');
        this.score = this.node.getParent().getChildByName('score').getComponent('score');
    },

    _reloadMap: function(){
        this._layerBarrier = this._tiledMap.getLayer(this._game.barrierLayerName);
    },

    _ghostMoveAdd: function(){
        let charMove = cc.instantiate(this.movePrefab);
        this.node.addChild(charMove);
        this.move = charMove.getComponent('move');
        this.move._char = this.node;
        this.move._char.comp = this;
    },

    _ghostMoveInit: function(){
        this.move._tiledMap = this._tiledMap;
        this.move._layerBarrier = this._layerBarrier;
    },

    _ghostResetVars: function(){
        cc.audioEngine.stop(this._currAudio);
        this._isWeak = false;
        this._prevState = this._state = MoveVar.State.NORMAL;
        this._speed = MoveVar.Speed.NORMAL;
        this._currDir = this._nextDir = MoveVar.Dir.DOWN;
    },

    setStartPos: function(){
        let objectGroup = this._tiledMap.getObjectGroup(this.objectGroupName);
        let startObj = objectGroup.getObject(this.startGhostObjectName);
        let startPos = cc.v2(startObj.x, startObj.y);
        this.node.setPosition(startPos);
    },

    _checkPos: function(){
        let currPos = this.node.getPosition();
        this._currTile = this._getTilePos(currPos);
        let currTilePos = this._layerBarrier.getPositionAt(this._currTile);
        this._charAtTileCenter = (currPos.x - currTilePos.x == 0) && (currPos.y - currTilePos.y == 0);
    },

    ghostPause: function(){
        if (this._state != MoveVar.State.WAIT && this._state != MoveVar.State.DEAD){
            this._prevState = this._state;
            this._state = MoveVar.State.WAIT;
        }
    },

    ghostUnPause: function(){
        this._state = this._prevState;
    },

    ghostWeak: function(){
        if (!this._isWeak){
            this._isWeak = true;
            if (this._state == MoveVar.State.NORMAL){
                this._changeTarget(Target.AWAY);
                this._speed = MoveVar.Speed.SLOW;
            } 
        } else this.animCtrl.getComponent('ghostAnimationCtrl').addTime();
        
    },

    ghostNormal: function(){
        this._isWeak = false;
        if (this._state == MoveVar.State.NORMAL) {
            this._speed = MoveVar.Speed.NORMAL;
            this._changeTarget(Target.PLAYER);
        }
        
    },

    startDie: function(){
        this._stopPlayerLoc();
        this._calcScore();
        
        this._speed = MoveVar.Speed.FAST;
        this._changeTarget(Target.RESP);
        this.scheduleOnce(function(){
            this._prevState = this._state = MoveVar.State.DEAD;
            this._currAudio = cc.audioEngine.play(this.deathAudio, true, 0.2);
            this._isWeak = false;
            this.scoreDisplay.string = '';
        }, 1);
    },

    _calcScore: function(){
        let scoreAdd = this._game.getCombo();
        scoreAdd == 0 ? scoreAdd = 200 : scoreAdd = scoreAdd*2
        this._game.setCombo(scoreAdd);
        this.score.gain(scoreAdd);
        this.scoreDisplay.string = scoreAdd;
    },

    _tryMove: function(){
        if (this._charAtTileCenter){
            if (this._currTile.equals(this._targetLoc)){
                if (this._state == MoveVar.State.EXIT){
                    this._finishExit();
                } else if (this._state == MoveVar.State.DEAD){
                    this._alive();
                }
            } 
            else if (this._state == MoveVar.State.EXIT) this._calcDir();
            else this._getDir();
        }

        this.move.tryMove();
    },

    _finishExit: function(){
        this._prevState = this._state = MoveVar.State.NORMAL;
        this._startPlayerLoc();
    },

    _alive: function(){
        this._ghostResetVars();
        this._goToExit();
    },

    // _exit: function(){
    //     if (this._charAtTileCenter){
    //         if (this._currTile.equals(this._targetLoc)) {
    //             this._prevState = this._state = MoveVar.State.NORMAL;
    //             this._startPlayerLoc();
    //         }
    //         this._calcDir();
    //     }
        
    //     this.move.tryMove();
    // },

    // _respawn: function(){
    //     if (this._charAtTileCenter){
    //         if (!this._currTile.equals(this._targetLoc)) this._getDir();
    //         else {
    //             this._ghostResetVars();
    //             this._goToExit();
    //         }
    //     }
    //     this.move.tryMove();
    // },

    // _move: function(){
    //     if (this._charAtTileCenter){
    //         this._getDir();
    //     }
    //     this.move.tryMove();
    // },

    _wait: function(){
        this._stopPlayerLoc();
        this._prevState = this._state = MoveVar.State.WAIT;
        this.unschedule(this._goToExit);
        this.scheduleOnce(this._goToExit, this.delayTime);
    },

    _goToExit: function(){
        this._prevState = this._state = MoveVar.State.EXIT;
        this._changeTarget(Target.EXIT);
        this._speed = MoveVar.Speed.NORMAL;
    },

    _getTargetLoc: function(){
        let loc;
        if (this._target === Target.EXIT){
            let objectGroup = this._tiledMap.getObjectGroup(this.objectGroupName);
            loc = objectGroup.getObject(this.exitTarget);
        }
        else if (this._target === Target.PLAYER){
            loc = this.player.getPosition();
        }
        else if (this._target === Target.AWAY){
            loc = this._awayPosCalc();
        }
        else if (this._target === Target.RESP){
            let objectGroup = this._tiledMap.getObjectGroup(this.objectGroupName);
            loc = objectGroup.getObject(this.respTarget);
        }
        this._targetLoc = this._getTilePos(loc);
    },

    _changeTarget: function(target){
        this._prevTarget = this._target;
        this._target = target;
        this._getTargetLoc();

    },

    _startPlayerLoc: function(){
        this._target = Target.PLAYER;
        this._getTargetLoc();
        this.schedule(this._getTargetLoc, this.playerLocUpTime);
    },

    _stopPlayerLoc: function(){
        this.unschedule(this._getTargetLoc);
    },

    _awayPosCalc: function(){
        let pos = this.player.getPosition();
        let mapSize = this._tiledMap.node.getContentSize();
        pos.x = mapSize.width - pos.x;
        pos.y = mapSize.height - pos.y;
        return pos;
    },

    _getDir: function(){
        let newTarget = this._target != this._prevTarget;
        if (newTarget) this._prevTarget = this._target;
        let equalXY = this._currTile.x == this._targetLoc.x || this._currTile.y == this._targetLoc.y;
        if (this._speed == 0 || equalXY || newTarget) {
            this._calcDir();
            if (this._isWeak) this._speed = MoveVar.Speed.SLOW;
            else if (this._state == MoveVar.State.NORMAL) this._speed = MoveVar.Speed.NORMAL;
            else if (this._state == MoveVar.State.DEAD) this._speed = MoveVar.Speed.FAST;
        };
        
    },

    _calcDir: function(){
        let dX = this._currTile.x - this._targetLoc.x;
        let dY = this._currTile.y - this._targetLoc.y;
        let dir = MoveVar.Dir.NONE;
        
        if (dY > 0) dir = MoveVar.Dir.UP;
        else if (dY < 0) dir = MoveVar.Dir.DOWN;
        else if (dX > 0) dir = MoveVar.Dir.LEFT;
        else if (dX < 0) dir = MoveVar.Dir.RIGHT;
        
        this._setDir(dir);
    },

    _setDir: function(dir){
        if (dir != MoveVar.Dir.NONE){
            if (this.move.checkNextTile(dir, this._currTile)){
                if (this.move.checkNextTile(this._currDir, this._currTile)) this._findDir(dir);
                else this._nextDir = dir;
            } else this._nextDir = dir;
        }
    },

    _findDir: function(dir){
        if (this._currDir != dir) this._invertDir();
        else this._changeDir();
        this._nextDir = dir;
    },

    _invertDir: function(){
        if (this._currDir % 2 == 0) this._currDir -= 1;
        else this._currDir += 1;
    },

    _changeDir: function(){
        this._currDir > 2 ? this._currDir -= 2 : this._currDir += 2;
        if (this.move.checkNextTile(this._currDir, this._currTile)) this._invertDir();
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

    getState: function(){
        return this._state;
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

    isWeak: function(){
        return this._isWeak;
    },
    
});
