let MoveVar = require("moveVar");
let Ghost = require("ghost");

let weakState = cc.Enum({
    PHASE1: 1,
    PHASE2: 2,
    PHASE3: 3,
});

cc.Class({
    extends: cc.Component,

    properties: {
        charAnim: {
            default: null,
            type: cc.Animation
        },
        char: {
            default: null,
            type: Ghost
        },

        charName:{
            default: 'red'
        }

    },

    onLoad: function () {
        this.anim = this.charAnim;
        this._weakPhase = false;
        this._clip = '';
    },

    update: function (dt) {
        let state = this.char.getState();
        let weak = this.char.isWeak();
        if (weak) this._weakAnim(dt);
        else if (state == MoveVar.State.DEAD) this._normalAnim('die', state);
        else this._normalAnim(this.charName.toLowerCase(), state);
    },

    _normalAnim: function(name, state){
        let currDir = this.char.getCurrDir();
        if (this._weakPhase != false){
            this._weakPhase = false;
            this._selectClip(currDir, name);
            this.anim.play(this._clip);
        }
        if (this.char.getSpeed() != 0){
            if (this.prevDir != currDir || state == MoveVar.State.WAIT){
                this._selectClip(currDir, name);
                this.anim.play(this._clip);
                this.prevDir = currDir;
            } //else if (state == MoveVar.State.WAIT) this._selectClip(currDir, name);
            else this.anim.resume(this._clip);
            
            
        } else this.anim.pause(this._clip);
    },

    _weakAnim: function(dt){
        if (!this._weakPhase) {
            let lvl = this.node.getParent().getComponent('game').getLevel();
            let time = this.node.getParent().getComponent('game').pacmanSuperPowerTime;
            this._delayTime = time - lvl;
            if (this._delayTime <= 0) this._delayTime = 1;
            this._weakPhase = weakState.PHASE1;
            this.anim.play('weak-1');
        }
        else if (this._weakPhase == weakState.PHASE1) {
            this._delayTime -= dt;
            if (this._delayTime <= 0) this._weakPhase = weakState.PHASE2;
        }
        else if (this._weakPhase == weakState.PHASE2){
            this._weakPhase = weakState.PHASE3;
            this.anim.play('weak-2');
            this._delayTime = 4;
        }
        else if (this._weakPhase == weakState.PHASE3){
            this._delayTime -= dt;
            if (this._delayTime <= 0) {
                if (this.char.getState() != MoveVar.State.DEAD) this.char.ghostNormal();
            }
        }

    },

    _selectClip: function(dir, name){
        switch(dir) {
            case MoveVar.Dir.DOWN:
                this._clip = `${name}-down`;
                break;
            case MoveVar.Dir.UP:
                this._clip = `${name}-up`;
                break;
            case MoveVar.Dir.RIGHT:
                this._clip = `${name}-right`;
                break;
            case MoveVar.Dir.LEFT:
                this._clip = `${name}-left`;
                break;
            default:
                return;
        }
    },

    setWeak: function(st){
        this._weakPhase = st;
    },

    addTime: function(){
        if (this._weakPhase == weakState.PHASE1){
            let lvl = this.node.getParent().getComponent('game').getLevel();
            let time = this.node.getParent().getComponent('game').pacmanSuperPowerTime;
            time -= lvl;
            if (time <= 0) time = 1;
            this._delayTime = time;
        }
        else if (this._weakPhase == weakState.PHASE3){
            this._weakPhase = false;
        }
        
    },
});
