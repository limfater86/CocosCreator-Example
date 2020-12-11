const moveVar = require("./moveVar");


cc.Class({
    extends: cc.Component,

    properties: {

        startAudio: {
            default: null,
            type: cc.AudioClip,
        },

        pacmanSuperPowerTime: {
            default: 10,
        },

        PacSuperPowerAudio: {
            default: null,
            type: cc.AudioClip,
        },

        fruitPrefab: {
            default: null,
            type: cc.Prefab
        },

        player: {
            default: null,
            type: cc.Node,
        },

        ghost1: {
            default: null,
            type: cc.Node,
        },

        ghost2: {
            default: null,
            type: cc.Node,
        },

        ghost3: {
            default: null,
            type: cc.Node,
        },

        ghost4: {
            default: null,
            type: cc.Node,
        },

       _isMapLoaded : {
            default: false,
            serializable: false,
        },

        floorLayerName: {
            default: 'floor'
        },

        barrierLayerName: {
            default: 'barrier'
        },

    },

    onLoad: function () {
        this._resetVars();
        this.disableChars();
    },

    onDestroy (){
        cc.director.getCollisionManager().enabled = false;
    },

    start: function(err) {
        if (err) return;
        this._initMap();
        this.enableChars();
        this._prepare();
        this.setFruitTimer();
    },

    update: function (dt) {
        if (this.tilesNum == 0) this._levelUp();

    },

    _levelUp: function(){
        this._reloadMap();
        this._initMap();
        this.initChars();
        this.level++;
    },

    _resetVars: function(){
        cc.director.getCollisionManager().enabled = true;
        this.level = 1;
        this._combo = 0;
        this.score = 0;
    },

    gainScore: function (gain) {
        this.score += gain;
        this.scoreDisplay.string = 'Score: ' + this.score;
    },

    startPacPowerMode: function(){
        this.ghost1.getComponent('ghost').ghostWeak();
        this.ghost2.getComponent('ghost').ghostWeak();
        this.ghost3.getComponent('ghost').ghostWeak();
        this.ghost4.getComponent('ghost').ghostWeak();
        let audioState = cc.audioEngine.getState(this.currAudio);
        if (audioState != cc.audioEngine.AudioState.PLAYING ) {
            this.currAudio = cc.audioEngine.play(this.PacSuperPowerAudio, true, 0.2);
        }
        this.unschedule(this._stopSuperPower);
        this.scheduleOnce(this._stopSuperPower, this.pacmanSuperPowerTime - this.level + 4);

    },

    _stopSuperPower: function(){
        cc.audioEngine.stop(this.currAudio);
        this.setCombo(0);
    },

    _prepare: function(){
        let prepare = this.node.getChildByName('prepare');
        prepare.active = true;
        this.ghostsPause();
        this.playerPause();
        let start = cc.audioEngine.play(this.startAudio, false, 0.2);
        let duration = cc.audioEngine.getDuration(start);
        this.scheduleOnce(function(){
            prepare.active = false;
            this.ghostsUnPause();
            this.playerUnPause();
        }, duration+2);
    },

    gameOver: function (result){
        this.disableChars();
        this.unschedule(this._spawnNewFruit);
        this.node.getChildByName('map').active = false;
        this.node.getChildByName(result).active = true;
    },

    restartBtn: function(){
        cc.director.loadScene('game');
    },

    _initMap: function(){
        this._tiledMap = this.node.getChildByName('map').getComponent('cc.TiledMap');
        this._layerFloor = this._tiledMap.getLayer(this.floorLayerName);
        this._layerBarrier = this._tiledMap.getLayer(this.barrierLayerName);
        if (!this._layerFloor || !this._layerBarrier) return;
        
        this._isMapLoaded = true;
        this._countTiles();
    },

    _reloadMap: function(){
        let mapAsset = this._tiledMap.tmxAsset;
        this._tiledMap.tmxAsset = null;
        this._tiledMap.tmxAsset = mapAsset;
    },

    _countTiles: function(){
        this.tilesNum = 0;
        let tiles = this._layerFloor.getTiles();
        for (let i = 0; i < tiles.length; i++){
            if (tiles[i] != 0) this.tilesNum++;
        };
    },

    decreaseTilesNum: function(){
        this.tilesNum--;
    },

    initChars: function(){
        this.player.getComponent('player').playerInit();
        this.ghost1.getComponent('ghost').ghostInit();
        this.ghost2.getComponent('ghost').ghostInit();
        this.ghost3.getComponent('ghost').ghostInit();
        this.ghost4.getComponent('ghost').ghostInit();
        this.reloadChars();

    },

    reloadChars: function(){
        this.disableChars();
        this.enableChars();
    },

    enableChars: function(){
        this.playerEnable();
        this.ghostEnable();
    },

    disableChars: function(){
        this.playerDisable();
        this.ghostDisable();
    },

    playerDisable: function(){
        this.player.active = false;
    },

    playerEnable: function(){
        this.player.active = true;
    },

    ghostDisable: function(){
        this.ghost1.active = false;
        this.ghost2.active = false;
        this.ghost3.active = false;
        this.ghost4.active = false;
    },

    ghostEnable: function(){
        this.ghost1.active = true;
        this.ghost2.active = true;
        this.ghost3.active = true;
        this.ghost4.active = true;
    },

    ghostsPause: function (){
        this.ghost1.getComponent('ghost').ghostPause();
        this.ghost2.getComponent('ghost').ghostPause();
        this.ghost3.getComponent('ghost').ghostPause();
        this.ghost4.getComponent('ghost').ghostPause();
    },

    ghostsUnPause: function(){
        this.ghost1.getComponent('ghost').ghostUnPause();
        this.ghost2.getComponent('ghost').ghostUnPause();
        this.ghost3.getComponent('ghost').ghostUnPause();
        this.ghost4.getComponent('ghost').ghostUnPause();
    },

    playerPause: function(){
        this.player.getComponent('player').inputOff();
    },

    playerUnPause: function(){
        this.player.getComponent('player').inputOn();
    },

    _spawnNewFruit: function(){
        let newFruit = cc.instantiate(this.fruitPrefab);
        this.node.addChild(newFruit);
        let fruit = newFruit.getComponent('fruit');
        fruit.player = this.player;
        fruit.score = this.node.getChildByName('score').getComponent('score');
        fruit.level = this.level;
    },

    setFruitTimer: function(){
        let time = 10 + Math.random()*10;
        this.scheduleOnce(this._spawnNewFruit, time);
    },

    playerGotKey: function(){
        this.node.getChildByName('Key').active = true;
    },

    getLevel: function(){
        return this.level;
    },

    getCombo: function(){
        return this._combo;
    },

    setCombo: function(pts){
        this._combo = pts;
    },

});
