cc.Class({
    extends: cc.Component,

    properties: {
        scoreToExtra: 1000,

    },

    onLoad () {
        this._livesNum = 3;
        this.lives = this.node.children;
    },

    start () {

    },

    // update (dt) {},

    addLife: function(){
        if (this._livesNum < 5){
            this.lives[this._livesNum].opacity = 255;
            this._livesNum++;
        }
        
    },

    removeLife: function(){
        if (this._livesNum > 0){
            this._livesNum--;
            this.lives[this._livesNum].opacity = 0;
            if (this._livesNum == 0) this._gameOver();
        } 
        
    },

    _gameOver: function(){
        this.node.getParent().getComponent('game').gameOver('gameOver');
    },
});
