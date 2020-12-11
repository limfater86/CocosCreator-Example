cc.Class({
    extends: cc.Component,

    properties: {

        objectGroupName: {
            default: 'players'
        },
        startFruitObjectName: {
            default:'FruitSpawn'
        },
        eatFruitAudio: {
            default: null,
            type: cc.AudioClip,
        },
        scoreDisplay: {
            default: null,
            type: cc.Label,
        },

        fruitScore: {
            default: 100,
        },

        fruitLiveTime: {
            default: 10,
        },

        spriteFrame1: {
            default: null,
            type: cc.SpriteFrame,
        },

        spriteFrame2: {
            default: null,
            type: cc.SpriteFrame,
        },

        spriteFrame3: {
            default: null,
            type: cc.SpriteFrame,
        },

        spriteFrame4: {
            default: null,
            type: cc.SpriteFrame,
        },
    },


    onLoad () { 
        this._setStartPos();
        this._setFrame();
        this.scheduleOnce(function(){
            this.node.getParent().getComponent('game').setFruitTimer();
            this.node.destroy();
        }, this.fruitLiveTime);
        this.isEated = false;
    },

    // start () {

    // },

    update (dt) {
        if (!this.isEated){
            if (this._getPlayerDistance() <= 0) this._onPicked();
        };
    },

    _setStartPos: function(){
        let tiledMap = this.node.getParent().getChildByName('map').getComponent('cc.TiledMap');
        let objectGroup = tiledMap.getObjectGroup(this.objectGroupName);
        let startObj = objectGroup.getObject(this.startFruitObjectName);
        this.node.setPosition(cc.v2(startObj.x, startObj.y));
    },

    _setFrame: function(){
        let sp = this.node.getComponent('cc.Sprite');
        let rnd = Math.trunc(Math.random()*10/3);
        this.isKey = false;
        switch (rnd){
            case 0:
                sp.spriteFrame = this.spriteFrame1;
                break;
            case 1:
                sp.spriteFrame = this.spriteFrame2;
                break;
            case 2:
                sp.spriteFrame = this.spriteFrame3;
                break;
            case 3:
                sp.spriteFrame = this.spriteFrame4;
                this.isKey = true;
                break;
        }
    },

    _getPlayerDistance: function(){
        let playerPos = this.player.getPosition();
        return this.node.position.sub(playerPos).mag();
    },

    _onPicked: function(){
        this.isEated = true;
        this.currentAudio = cc.audioEngine.play(this.eatFruitAudio, false, 0.2);
        let score = this.fruitScore*this.level;
        this.score.gain(score);
        this.node.getComponent('cc.Sprite').destroy();
        this.node.getParent().getComponent('game').setFruitTimer();
        this.scoreDisplay.string = score;
        if (this.isKey) this.player.getComponent('player').gotKey();
        this.scheduleOnce(function(){
        this.node.destroy();
        }, 2);
        
    },

});
