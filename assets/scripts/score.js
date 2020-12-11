cc.Class({
    extends: cc.Component,

    properties: {
        scoreDisplay: {
            default: null,
            type: cc.Label,
        },

    },

    onLoad () {
        this._score = 0;
        this._extraLifeCount = 0;
        this.lives = this.node.getParent().getChildByName('lives').getComponent('lives');
    },

    start () {

    },

    // update (dt) {},

    gain: function(gain){
        if (gain == 2) {
            this._score += 10;
            this._extraLifeCount += 10;
        } else if (gain == 3) {
            this._score += 50;
            this._extraLifeCount += 50;
        } else {
            this._score += gain;
            this._extraLifeCount += gain;
        }
        this.scoreDisplay.string = 'Score: ' + this._score;

        if (this._extraLifeCount >= this.lives.scoreToExtra)  {
            this.lives.addLife();
            this._extraLifeCount = 0;
        }
        
    },
});
